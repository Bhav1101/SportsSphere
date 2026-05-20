const mongoose       = require('mongoose')
const { baseFields } = require('../../config/baseSchema')

const bookingSchema = new mongoose.Schema({
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'match' },
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'user'  },

    seatsCount:   { type: Number, default: 0 },
    // how many seats user booked — no individual seat IDs
    totalAmount:  { type: Number, default: 0 },

    // ── Seat Lock ─────────────────────────────
    // lock is created BEFORE payment
    // lock expires after 4 minutes if payment not done
    lockId:     { type: String, default: "" },
    // unique ID for this lock session
    lockedAt:   { type: Date,   default: null },
    lockExpiry: { type: Date,   default: null },
    // lockExpiry = lockedAt + 4 minutes

    // ── Razorpay ──────────────────────────────
    razorpayOrderId:   { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    transactionId:     { type: String, default: "" },
    paymentMode:       { type: String, default: "online" },

    paymentStatus: { type: String, default: "pending" },
    // pending → paid → failed → refunded

    bookingStatus: { type: String, default: "pending" },
    // pending → confirmed → cancelled

    // ── Cancellation ──────────────────────────
    cancelledAt:  { type: Date,   default: null },
    refundStatus: { type: String, default: ""   },
    refundAmount: { type: Number, default: 0    },

    ...baseFields
})

module.exports = mongoose.model('booking', bookingSchema)