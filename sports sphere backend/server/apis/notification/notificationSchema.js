const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    title:        { type: String, default: "" },
    message:      { type: String, default: "" },
    type:         { type: String, default: "" },
    relatedModel: { type: String, default: "" },
    relatedId:    { type: mongoose.Schema.Types.ObjectId, default: null },
    amount:       { type: Number, default: 0 },
    isRead:       { type: Boolean, default: false },
    createdAt:    { type: Date, default: Date.now }
}, { _id: true })

module.exports = notificationSchema
