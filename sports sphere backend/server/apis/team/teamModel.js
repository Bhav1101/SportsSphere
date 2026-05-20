const mongoose                        = require('mongoose')
const { baseFields }                  = require('../../config/baseSchema')

const teamSchema = new mongoose.Schema({
    teamName:     { type: String,  default: ""       },
    teamDesc:     { type: String,  default: ""       },
    sportId:      { type: mongoose.Schema.Types.ObjectId, ref: 'sport' },
    coachId:      { type: mongoose.Schema.Types.ObjectId, ref: 'user'  },
    playersCount: { type: Number,  default: 0        },
    totalPlayers: { type: Number,  default: 0        },
    logo:         { type: String,  default: ""       },
    status:       { type: String,  default: "active" },

    ...baseFields
})

module.exports = mongoose.model('team', teamSchema)