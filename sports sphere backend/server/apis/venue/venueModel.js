const mongoose       = require('mongoose')
const { baseFields } = require('../../config/baseSchema')

const venueSchema = new mongoose.Schema({
    venueName:     { type: String, default: ""  },
    city:          { type: String, default: ""  },
    state:         { type: String, default: ""  },
    address:       { type: String, default: ""  },
    totalCapacity: { type: Number, default: 0   },
    image:         { type: String, default: ""  },

    sportIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:  'sport'
    }],
    // which sports are played at this venue

    ...baseFields
})

module.exports = mongoose.model('venue', venueSchema)