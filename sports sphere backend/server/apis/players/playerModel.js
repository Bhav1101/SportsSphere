const mongoose                             = require('mongoose')
const { baseFields, blockableFields }      = require('../../config/baseSchema')

const playerSchema = new mongoose.Schema({
    playerName:    { type: String,  default: "" },
    sportId:       { type: mongoose.Schema.Types.ObjectId, ref: 'sport' },
    teamId:        { type: mongoose.Schema.Types.ObjectId, ref: 'team'  },
    experience:    { type: Number,  default: 0  },
    bio:           { type: String,  default: "" },
    rating:        { type: Number,  default: 0  },
    matchesPlayed: { type: Number,  default: 0  },
    playerImg:     { type: String,  default: "" },

    ...baseFields,
    ...blockableFields
})

module.exports = mongoose.model('player', playerSchema)