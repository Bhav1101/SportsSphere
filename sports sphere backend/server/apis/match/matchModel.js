const mongoose       = require('mongoose')
const { baseFields } = require('../../config/baseSchema')

const matchSchema = new mongoose.Schema({
    sportId:  { type: mongoose.Schema.Types.ObjectId, ref: 'sport'  },
    venueId:  { type: mongoose.Schema.Types.ObjectId, ref: 'venue'  },

    matchName:   { type: String, default: ""  },
    matchDate:   { type: Date                 },
    matchTime:   { type: String, default: ""  },
    city:        { type: String, default: ""  },
    description: { type: String, default: ""  },

    team1Id: { type: mongoose.Schema.Types.ObjectId, ref: 'team', default: null },
    team2Id: { type: mongoose.Schema.Types.ObjectId, ref: 'team', default: null },

    totalSeats:     { type: Number, default: 0 },
    availableSeats: { type: Number, default: 0 },
    lockedSeats:    { type: Number, default: 0 },
    // tracks how many seats are currently locked
    // availableSeats - lockedSeats = actually free seats

    ticketPrice:     { type: Number, default: 0  },
    maxApplications: { type: Number, default: 10 },

    status: { type: String, default: "open_for_applications" },

    prizePool: {
        winner:   { type: Number, default: 0 },
        runnerUp: { type: Number, default: 0 }
    },

    result: { type: String, default: "" },

    ...baseFields


})
    module.exports = mongoose.model('match', matchSchema)
