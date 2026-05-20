const bookingModel      = require('../../booking/bookingModel')
const matchModel        = require('../../match/matchModel')
const coachProfileModel = require('../../coach/coachProfileModel')
const userModel         = require('../../user/userModel')
const sportModel        = require('../../sports/sportModel')

const getPlatformFunds = async () => {
    const [revenueAgg, refundedAgg, coachPaidAgg] = await Promise.all([
        bookingModel.aggregate([
            { $match: { bookingStatus: "confirmed", isDelete: false } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]),
        bookingModel.aggregate([
            { $match: { bookingStatus: "cancelled", refundStatus: "refunded", isDelete: false } },
            { $group: { _id: null, total: { $sum: "$refundAmount" } } }
        ]),
        coachProfileModel.aggregate([
            { $match: { isDelete: false } },
            { $group: { _id: null, total: { $sum: "$earnings.paid" } } }
        ])
    ])

    const grossRevenue        = revenueAgg[0]?.total || 0
    const totalRefunded       = refundedAgg[0]?.total || 0
    const amountPaidToCoaches = coachPaidAgg[0]?.total || 0
    const netRevenue          = grossRevenue - totalRefunded
    const availableFunds      = netRevenue - amountPaidToCoaches

    return { grossRevenue, totalRefunded, amountPaidToCoaches, netRevenue, availableFunds }
}

// ═══════════════════════════════════════════════════════
// FETCH ALL BOOKINGS — admin sees everything
// ═══════════════════════════════════════════════════════
const fetchAllBookings = async (req, res) => {
    try {
        let bookings = await bookingModel
            .find({
                bookingStatus: "confirmed",
                isDelete:      false
            })
            .populate('matchId', 'matchName matchDate matchTime city status')
            .populate('userId',  'name email contact')
            .sort({ createdAt: -1 })

        let total      = bookings.length
        let totalSeats = bookings.reduce((sum, b) => sum + (b.seatsCount || 0), 0)
        let totalRev   = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)

        // recent 10 bookings
        let recentBookings = bookings.slice(0, 10)

        res.json({
            status:  200,
            success: true,
            message: "Bookings fetched",
            total,
            totalSeats,
            totalRevenue: totalRev,
            recentBookings,
            data:    bookings
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "ISE: " + err.message
        })
    }
}

// ═══════════════════════════════════════════════════════
// VIEW REVENUE — revenue breakdown by sport + overall
// ═══════════════════════════════════════════════════════
const viewRevenue = async (req, res) => {
    try {
        const financialSummary = await getPlatformFunds()

        // total revenue from confirmed bookings
        const allBookings = await bookingModel.find({
            bookingStatus: "confirmed",
            isDelete:      false
        }).populate({
            path:   'matchId',
            select: 'matchName sportId ticketPrice',
            populate: {
                path:   'sportId',
                select: 'sportName'
            }
        })

        const totalRevenue   = financialSummary.grossRevenue
        const totalRefunded  = financialSummary.totalRefunded
        const netRevenue     = financialSummary.netRevenue
        const amountPaidToCoaches = financialSummary.amountPaidToCoaches
        const availableFunds = financialSummary.availableFunds
        const totalBookings  = allBookings.length
        const totalSeats     = allBookings.reduce((sum, b) => sum + (b.seatsCount || 0), 0)

        // revenue grouped by sport
        const sportMap = {}
        for (let booking of allBookings) {
            const sportName = booking.matchId?.sportId?.sportName || "Unknown"
            if (!sportMap[sportName]) {
                sportMap[sportName] = { sportName, revenue: 0, bookings: 0, seats: 0 }
            }
            sportMap[sportName].revenue  += booking.totalAmount || 0
            sportMap[sportName].bookings += 1
            sportMap[sportName].seats    += booking.seatsCount  || 0
        }

        const sportRevenue = Object.values(sportMap).sort((a, b) => b.revenue - a.revenue)

        // revenue grouped by month (last 6 months)
        const monthMap = {}
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const key = d.toLocaleString("en-IN", { month: "short", year: "numeric" })
            monthMap[key] = { month: key, revenue: 0, bookings: 0 }
        }

        for (let booking of allBookings) {
            const d   = new Date(booking.createdAt)
            const key = d.toLocaleString("en-IN", { month: "short", year: "numeric" })
            if (monthMap[key]) {
                monthMap[key].revenue  += booking.totalAmount || 0
                monthMap[key].bookings += 1
            }
        }

        const monthlyRevenue = Object.values(monthMap)

        res.json({
            status:  200,
            success: true,
            message: "Revenue report fetched",
            data: {
                totalRevenue,
                grossRevenue: financialSummary.grossRevenue,
                totalRefunded,
                netRevenue,
                amountPaidToCoaches,
                availableFunds,
                totalBookings,
                totalSeats,
                sportRevenue,
                monthlyRevenue
            }
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "ISE: " + err.message
        })
    }
}

// ═══════════════════════════════════════════════════════
// VIEW MATCH REPORT — detailed report for one match
// ═══════════════════════════════════════════════════════
const viewMatchReport = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) return res.json({
            status:  400,
            success: false,
            message: "_id is required"
        })

        // get match details
        let match = await matchModel
            .findOne({ _id: incomingData._id, isDelete: false })
            .populate('sportId', 'sportName')
            .populate('venueId', 'venueName city totalCapacity')
            .populate('team1Id', 'teamName logo')
            .populate('team2Id', 'teamName logo')

        if (!match) return res.json({
            status:  404,
            success: false,
            message: "Match not found"
        })

        // get all bookings for this match
        let bookings = await bookingModel
            .find({
                matchId:       match._id,
                bookingStatus: "confirmed",
                isDelete:      false
            })
            .populate('userId', 'name email contact')

        let cancelledBookings = await bookingModel.find({
            matchId:       match._id,
            bookingStatus: "cancelled",
            isDelete:      false
        })

        const totalRevenue     = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
        const totalSeatsBooked = bookings.reduce((sum, b) => sum + (b.seatsCount  || 0), 0)
        const totalRefunded    = cancelledBookings.reduce((sum, b) => sum + (b.refundAmount || 0), 0)
        const fillPercentage   = match.totalSeats
            ? Math.round((totalSeatsBooked / match.totalSeats) * 100)
            : 0

        res.json({
            status:  200,
            success: true,
            message: "Match report fetched",
            data: {
                match,
                totalBookings:     bookings.length,
                cancelledBookings: cancelledBookings.length,
                totalSeatsBooked,
                availableSeats:    match.availableSeats,
                totalSeats:        match.totalSeats,
                fillPercentage,
                totalRevenue,
                totalRefunded,
                netRevenue:        totalRevenue - totalRefunded,
                recentBookings:    bookings.slice(0, 10)
            }
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "ISE: " + err.message
        })
    }
}

// ═══════════════════════════════════════════════════════
// PAY COACH — admin marks prize money as paid
// ═══════════════════════════════════════════════════════
const payCoach = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id)     return res.json({ status: 400, success: false, message: "_id (coachProfile _id) is required" })
        if (!incomingData.amount)  return res.json({ status: 400, success: false, message: "amount is required" })

        let profile = await coachProfileModel.findOne({
            _id:      incomingData._id,
            isDelete: false
        })

        if (!profile) return res.json({
            status:  404,
            success: false,
            message: "Coach profile not found"
        })

        const amount = Number(incomingData.amount)
        const financialSummary = await getPlatformFunds()

        if (!Number.isFinite(amount)) return res.json({
            status:  400,
            success: false,
            message: "amount must be a valid number"
        })

        // loophole — cannot pay more than pending amount
        if (amount > profile.earnings.pending) return res.json({
            status:  400,
            success: false,
            message: `Amount exceeds pending earnings. Pending: ₹${profile.earnings.pending}`
        })

        if (amount > financialSummary.availableFunds) return res.json({
            status:  400,
            success: false,
            message: `Insufficient admin funds. Available: ₹${financialSummary.availableFunds}`
        })

        if (amount <= 0) return res.json({
            status:  400,
            success: false,
            message: "Amount must be greater than 0"
        })

        profile.earnings.pending  -= amount
        profile.earnings.paid     += amount
        profile.updatedBy          = req.decoded._id
        profile.updatedAt          = Date.now()
        await profile.save()

        res.json({
            status:  200,
            success: true,
            message: `₹${amount} paid to coach successfully`,
            data: {
                paid:    profile.earnings.paid,
                pending: profile.earnings.pending,
                total:   profile.earnings.total
            }
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "ISE: " + err.message
        })
    }
}

// ═══════════════════════════════════════════════════════
// PLATFORM OVERVIEW — dashboard summary stats
// called by admin dashboard
// ═══════════════════════════════════════════════════════
const platformOverview = async (req, res) => {
    try {
        const financialSummary = await getPlatformFunds()

        const [
            totalUsers,
            totalCoaches,
            totalSports,
            totalMatches,
            upcomingMatches,
            totalBookings,
            pendingCoaches
        ] = await Promise.all([
            userModel.countDocuments({         isDelete: false, userType: 3 }),
            userModel.countDocuments({         isDelete: false, userType: 2 }),
            sportModel.countDocuments({        isDelete: false, status: "active" }),
            matchModel.countDocuments({        isDelete: false }),
            matchModel.countDocuments({        isDelete: false, status: "upcoming" }),
            bookingModel.countDocuments({      isDelete: false, bookingStatus: "confirmed" }),
            coachProfileModel.countDocuments({ isDelete: false, status: "pending" })
        ])

        const totalRevenue = financialSummary.grossRevenue

        res.json({
            status:  200,
            success: true,
            message: "Platform overview fetched",
            data: {
                totalUsers,
                totalCoaches,
                totalSports,
                totalMatches,
                upcomingMatches,
                totalBookings,
                pendingCoaches,
                totalRevenue,
                grossRevenue: financialSummary.grossRevenue,
                totalRefunded: financialSummary.totalRefunded,
                amountPaidToCoaches: financialSummary.amountPaidToCoaches,
                availableFunds: financialSummary.availableFunds
            }
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "ISE: " + err.message
        })
    }
}

// ═══════════════════════════════════════════════════════
// COACH EARNINGS LIST — all coaches with pending earnings
// admin sees who needs to be paid
// ═══════════════════════════════════════════════════════
const coachEarningsList = async (req, res) => {
    try {
        let profiles = await coachProfileModel
            .find({
                isDelete:         false,
                'earnings.total': { $gt: 0 }
            })
            .populate('userId', 'name email contact profileImage')
            .sort({ 'earnings.pending': -1 })

        res.json({
            status:  200,
            success: true,
            message: "Coach earnings fetched",
            total:   profiles.length,
            data:    profiles
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "ISE: " + err.message
        })
    }
}

module.exports = {
    fetchAllBookings,
    viewRevenue,
    viewMatchReport,
    payCoach,
    platformOverview,
    coachEarningsList
}