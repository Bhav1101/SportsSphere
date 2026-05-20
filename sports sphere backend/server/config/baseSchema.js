const mongoose = require('mongoose')

// ─────────────────────────────────────────────
// COMMON FIELDS — included in every model
// ─────────────────────────────────────────────
const baseFields = {
    createdAt: { type: Date,    default: Date.now },
    updatedAt: { type: Date,    default: null     },

    createdBy: {
        type:    mongoose.Schema.Types.ObjectId,
        ref:     'user',
        default: null
    },
    updatedBy: {
        type:    mongoose.Schema.Types.ObjectId,
        ref:     'user',
        default: null
    },

    isDelete: { type: Boolean, default: false }
}

// ─────────────────────────────────────────────
// BLOCKABLE FIELDS — only where blocking needed
// user  → blocked by admin
// coach → blocked by admin
// player → blocked by coach
// ─────────────────────────────────────────────
const blockableFields = {
    isBlock: { type: Boolean, default: false }
}

module.exports = { baseFields, blockableFields }