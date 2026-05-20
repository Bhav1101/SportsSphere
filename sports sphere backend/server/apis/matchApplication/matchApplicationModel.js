const mongoose       = require('mongoose')
const { baseFields } = require('../../config/baseSchema')

const matchApplicationSchema = new mongoose.Schema({
    matchId:  { type: mongoose.Schema.Types.ObjectId, ref: 'match' },
    coachId:  { type: mongoose.Schema.Types.ObjectId, ref: 'user'  },
    teamId:   { type: mongoose.Schema.Types.ObjectId, ref: 'team'  },
    sportId:  { type: mongoose.Schema.Types.ObjectId, ref: 'sport' },

    message:  { type: String, default: "" },
    // coach writes why their team should be selected

    squad: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:  'player'
    }],
    // players selected for this match — stored at application time

    status:       { type: String, default: "pending" },
    // pending → approved → rejected

    adminRemarks: { type: String, default: "" },

    coachBadge: { type: String, default: "newcomer" },
    // stored at time of application for priority sorting

    ...baseFields
})

module.exports = mongoose.model('matchApplication', matchApplicationSchema)