const bookingModel = require('./bookingModel')
const matchModel   = require('../match/matchModel')
const userModel    = require('../user/userModel')
const Razorpay     = require('razorpay')
const crypto       = require('crypto')
const { v4: uuidv4 } = require('uuid')

const LOCK_DURATION = 4 * 60 * 1000  // 4 minutes

const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

// ─────────────────────────────────────────────
// HELPER — release expired locks
// runs before every fetch/lock to keep counts accurate
// ─────────────────────────────────────────────
const releaseExpiredLocks = async (matchId) => {
    try {
        const now = new Date()

        // find all pending bookings with expired locks for this match
        const expiredLocks = await bookingModel.find({
            matchId,
            bookingStatus: "pending",
            lockExpiry:    { $lt: now },
            isDelete:      false
        })

        if (expiredLocks.length === 0) return

        let totalExpiredSeats = 0
        for (let lock of expiredLocks) {
            totalExpiredSeats += lock.seatsCount

            // soft delete the expired lock
            lock.isDelete  = true
            lock.updatedAt = Date.now()
            await lock.save()
        }

        // add back locked seats to match
        await matchModel.findByIdAndUpdate(matchId, {
            $inc: {
                
                lockedSeats:    -totalExpiredSeats
            },
            updatedAt: Date.now()
        })

        console.log(`Released ${totalExpiredSeats} expired locked seats for match ${matchId}`)

    } catch (err) {
        console.log("Release expired locks error: ", err.message)
    }
}

// ═══════════════════════════════════════════════════════
// LOCK SEATS
// user selects number of seats → system locks them
// returns lockId + expiry time
// ═══════════════════════════════════════════════════════
const lockSeats = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const userId       = req.decoded._id

        if (!incomingData.matchId)    return res.json({ status: 400, success: false, message: "matchId is required" })
        if (!incomingData.seatsCount) return res.json({ status: 400, success: false, message: "seatsCount is required" })

        const seatsCount = Number(incomingData.seatsCount)

        if (seatsCount < 1 || seatsCount > 10) return res.json({
            status:  400,
            success: false,
            message: "You can book between 1 and 10 seats"
        })

        // release expired locks first
        await releaseExpiredLocks(incomingData.matchId)

        // get match
        let match = await matchModel.findOne({
            _id:      incomingData.matchId,
            status:   "upcoming",
            isDelete: false
        })

        if (!match) return res.json({
            status: 404, success: false,
            message: "Match not found or not available for booking"
        })

        // loophole 6 — user already has confirmed booking for this match
        let existingBooking = await bookingModel.findOne({
            matchId:       incomingData.matchId,
            userId,
            bookingStatus: "confirmed",
            isDelete:      false
        })

        if (!!existingBooking) return res.json({
            status: 400, success: false,
            message: "You already have a confirmed booking for this match"
        })

        // user already has a pending lock for this match
        let existingLock = await bookingModel.findOne({
            matchId:       incomingData.matchId,
            userId,
            bookingStatus: "pending",
            lockExpiry:    { $gt: new Date() },
            isDelete:      false
        })

        if (!!existingLock) return res.json({
            status: 400, success: false,
            message: "You already have seats locked for this match. Complete payment or wait for lock to expire.",
            lockId:    existingLock.lockId,
            lockExpiry: existingLock.lockExpiry
        })

        // loophole 9 — check enough seats available
        const effectiveAvailable = match.availableSeats - match.lockedSeats
        if (seatsCount > effectiveAvailable) return res.json({
            status: 400, success: false,
            message: `Only ${effectiveAvailable} seats available`
        })

        // create lock
        const lockId     = uuidv4()
        const lockedAt   = new Date()
        const lockExpiry = new Date(Date.now() + LOCK_DURATION)

        const newLock = new bookingModel({
            matchId:      incomingData.matchId,
            userId,
            seatsCount,
            totalAmount:  seatsCount * match.ticketPrice,
            lockId,
            lockedAt,
            lockExpiry,
            bookingStatus: "pending",
            paymentStatus: "pending",
            createdBy:     userId
        })

        await newLock.save()

        // increment lockedSeats in match
        await matchModel.findByIdAndUpdate(incomingData.matchId, {
            $inc:      { lockedSeats: seatsCount },
            updatedAt: Date.now()
        })

        res.json({
            status:  200,
            success: true,
            message: `${seatsCount} seat(s) locked. You have 4 minutes to complete payment.`,
            data: {
                lockId,
                seatsCount,
                totalAmount:  seatsCount * match.ticketPrice,
                lockedAt,
                lockExpiry,
                matchName:    match.matchName,
                ticketPrice:  match.ticketPrice
            }
        })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

// ═══════════════════════════════════════════════════════
// UNLOCK SEATS — user clicks cancel button
// ═══════════════════════════════════════════════════════
const unlockSeats = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const userId       = req.decoded._id

        const { lockId } = incomingData

        if (!incomingData.lockId) return res.json({
            status: 400, success: false, message: "lockId is required"
        })

        let lock = await bookingModel.findOne({
            lockId,
            userId,
            bookingStatus: "pending",
            isDelete:      false
        })

        if (!lock) return res.json({
            status: 404, success: false, message: "Lock not found"
        })

        // release lock
        await matchModel.findByIdAndUpdate(lock.matchId, {
            $inc:      { lockedSeats: -lock.seatsCount },
            updatedAt: Date.now()
        })

        lock.isDelete  = true
        lock.updatedAt = Date.now()
        await lock.save()

        res.json({
            status:  200,
            success: true,
            message: "Seats unlocked successfully"
        })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

// ═══════════════════════════════════════════════════════
// CREATE RAZORPAY ORDER
// step 1 of payment — frontend needs orderId for popup
// ═══════════════════════════════════════════════════════
const createOrder = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const userId       = req.decoded._id

        if (!incomingData.lockId) return res.json({
            status: 400, success: false, message: "lockId is required"
        })

        // find the lock
        let lock = await bookingModel.findOne({
            lockId:        incomingData.lockId,
            userId,
            bookingStatus: "pending",
            isDelete:      false
        })

        if (!lock) return res.json({
            status: 404, success: false, message: "Lock not found or expired"
        })

        // check lock not expired
        if (new Date() > lock.lockExpiry) return res.json({
            status: 400, success: false,
            message: "Lock has expired. Please select seats again."
        })

        // create Razorpay order
        const order = await razorpay.orders.create({
            amount:   lock.totalAmount * 100,
            currency: "INR",
            receipt:  `receipt_${Date.now()}`
        })

        // save orderId to booking
        lock.razorpayOrderId = order.id
        lock.updatedAt       = Date.now()
        await lock.save()

        res.json({
            status:  200,
            success: true,
            message: "Order created",
            data: {
                lockId:      lock.lockId,
                lockedAt:    lock.lockedAt,
                orderId:     order.id,
                amount:      lock.totalAmount,
                currency:    "INR",
                key:         process.env.RAZORPAY_KEY_ID,
                keyId:       process.env.RAZORPAY_KEY_ID,
                seatsCount:  lock.seatsCount,
                totalAmount: lock.totalAmount,
                lockExpiry:  lock.lockExpiry
                ,order: {
                    id:       order.id,
                    amount:   order.amount,
                    currency: order.currency
                }
            }
        })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

// ═══════════════════════════════════════════════════════
// VERIFY PAYMENT + CONFIRM BOOKING
// step 2 — after Razorpay success
// ═══════════════════════════════════════════════════════
const verifyPayment = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const userId       = req.decoded._id

        const {
            lockId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        } = incomingData

        if (!lockId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.json({
                status: 400, success: false,
                message: "All payment details required"
            })
        }

        let lock = await bookingModel.findOne({
            lockId,
            userId,
            bookingStatus: "pending",
            isDelete:      false
        })

        if (!lock) return res.json({
            status: 404, success: false, message: "Lock not found"
        })

        // check lock not expired
        if (new Date() > lock.lockExpiry) return res.json({
            status: 400, success: false,
            message: "Lock expired. Please start booking again."
        })

        // loophole 8 — verify Razorpay signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex')

        if (expectedSignature !== razorpaySignature) {
            // loophole 4 — release lock on payment fail
            await matchModel.findByIdAndUpdate(lock.matchId, {
                $inc: { lockedSeats: -lock.seatsCount },
                updatedAt: Date.now()
            })
            lock.isDelete  = true
            lock.updatedAt = Date.now()
            await lock.save()

            return res.json({
                status: 400, success: false,
                message: "Payment verification failed. Seats released."
            })
        }

        // payment verified — confirm booking
        lock.razorpayPaymentId = razorpayPaymentId
        lock.razorpaySignature = razorpaySignature
        lock.transactionId     = razorpayPaymentId
        lock.paymentStatus     = "paid"
        lock.bookingStatus     = "confirmed"
        lock.lockId            = ""
        // clear lockId — booking is now confirmed
        lock.updatedBy         = userId
        lock.updatedAt         = Date.now()
        await lock.save()

        // decrement availableSeats + lockedSeats in match
        await matchModel.findByIdAndUpdate(lock.matchId, {
            $inc: {
                availableSeats: -lock.seatsCount,
                lockedSeats:    -lock.seatsCount
            },
            updatedAt: Date.now()
        })

        res.json({
            status:  201,
            success: true,
            message: "Booking confirmed! Enjoy the match!",
            data:    lock
        })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

// ═══════════════════════════════════════════════════════
// FETCH MY BOOKINGS
// ═══════════════════════════════════════════════════════
const fetchMyBookings = async (req, res) => {
    try {
        const userId = req.decoded._id

        let bookings = await bookingModel
            .find({
                userId,
                bookingStatus: "confirmed",
                isDelete:      false
            })
            .populate('matchId', 'matchName matchDate matchTime status city')
            .sort({ createdAt: -1 })

        res.json({
            status:  200,
            success: true,
            message: "Bookings fetched",
            total:   bookings.length,
            data:    bookings
        })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

// ═══════════════════════════════════════════════════════
// FETCH SINGLE BOOKING
// ═══════════════════════════════════════════════════════
const fetchSingleBooking = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const userId       = req.decoded._id

        if (!incomingData._id) return res.json({
            status: 400, success: false, message: "_id is required"
        })

        let booking = await bookingModel
            .findOne({ _id: incomingData._id, isDelete: false })
            .populate('matchId', 'matchName matchDate matchTime city status')
            .populate('userId',  'name email contact')

        if (!booking) return res.json({
            status: 404, success: false, message: "Booking not found"
        })

        if (booking.userId._id.toString() !== userId.toString()) return res.json({
            status: 403, success: false, message: "Unauthorized"
        })

        res.json({
            status:  200,
            success: true,
            message: "Booking fetched",
            data:    booking
        })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

// ═══════════════════════════════════════════════════════
// CANCEL BOOKING + REFUND
// ═══════════════════════════════════════════════════════
const cancelBooking = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const userId       = req.decoded._id

        if (!incomingData._id) return res.json({
            status: 400, success: false, message: "_id is required"
        })

        let booking = await bookingModel.findOne({
            _id:      incomingData._id,
            isDelete: false
        })

        if (!booking) return res.json({
            status: 404, success: false, message: "Booking not found"
        })

        if (booking.userId.toString() !== userId.toString()) return res.json({
            status: 403, success: false, message: "Unauthorized"
        })

        if (booking.bookingStatus === "cancelled") return res.json({
            status: 400, success: false, message: "Already cancelled"
        })

        // loophole 5 — match must still be upcoming
        let match = await matchModel.findById(booking.matchId)
        if (match && match.status !== "upcoming") return res.json({
            status: 400, success: false,
            message: "Cannot cancel after match has started"
        })

        // simulate Razorpay refund
        try {
            await razorpay.payments.refund(booking.razorpayPaymentId, {
                amount: booking.totalAmount * 100
            })
        } catch (refundErr) {
            console.log("Refund error (test mode): ", refundErr.message)
        }

        booking.bookingStatus = "cancelled"
        booking.paymentStatus = "refunded"
        booking.cancelledAt   = new Date()
        booking.refundStatus  = "refunded"
        booking.refundAmount  = booking.totalAmount
        booking.updatedBy     = userId
        booking.updatedAt     = Date.now()
        await booking.save()

        // return seats to match
        await matchModel.findByIdAndUpdate(booking.matchId, {
            $inc:      { availableSeats: booking.seatsCount },
            updatedAt: Date.now()
        })

        try {
            await userModel.updateMany(
                { userType: 1, isDelete: false },
                {
                    $push: {
                        notifications: {
                            title:        "Refund initiated",
                            message:      `A refund of ₹${booking.totalAmount} was initiated for booking ${booking._id}.`,
                            type:         "refund",
                            relatedModel: "booking",
                            relatedId:    booking._id,
                            amount:       booking.totalAmount,
                            isRead:       false,
                            createdAt:    new Date()
                        }
                    },
                    $set: {
                        updatedAt: Date.now()
                    }
                }
            )
        } catch (notifyErr) {
            console.log("Admin refund notification error:", notifyErr.message)
        }

        res.json({
            status:  200,
            success: true,
            message: "Booking cancelled. Refund initiated.",
            refundAmount: booking.totalAmount
        })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

// ═══════════════════════════════════════════════════════
// BOOKING HISTORY — completed matches only
// ═══════════════════════════════════════════════════════
const bookingHistory = async (req, res) => {
    try {
        const userId = req.decoded._id

        let bookings = await bookingModel
            .find({ userId, bookingStatus: "confirmed", isDelete: false })
            .populate({
                path:   'matchId',
                match:  { status: "completed" },
                select: 'matchName matchDate city'
            })
            .sort({ createdAt: -1 })

        const history = bookings.filter(b => b.matchId !== null)

        res.json({
            status:  200,
            success: true,
            message: "History fetched",
            total:   history.length,
            data:    history
        })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

module.exports = {
    lockSeats,
    unlockSeats,
    createOrder,
    verifyPayment,
    fetchMyBookings,
    fetchSingleBooking,
    cancelBooking,
    bookingHistory
}