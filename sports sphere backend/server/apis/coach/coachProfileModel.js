const mongoose = require('mongoose')
const { baseFields, blockableFields } = require('../../config/baseSchema')


const coachProfileSchema =new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    organisationName: { type: String, default: ""  },
    experienceYears:  { type: Number, default: 0   },
    bio:              { type: String, default: ""  },
    document:         { type: String, default: ""  },
    sportsIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:  'sport'
    }],


    //approval
    status:       { type: String, default: "pending" },
    // pending → approved → rejected
    adminRemarks: { type: String, default: "" },

    //rewards
    points:        { type: Number, default: 0          },
    badge:         { type: String, default: "newcomer" },
    // newcomer → bronze → silver → gold → platinum
    matchesPlayed: { type: Number, default: 0 },
    matchesWon:    { type: Number, default: 0 },
    matchesLost:   { type: Number, default: 0 },

    //earnings
    earnings: {
        total:   { type: Number, default: 0 },
        // total prize money earned
        pending: { type: Number, default: 0 },
        // won but not yet paid by admin
        paid:    { type: Number, default: 0 }
        // already transferred to coach
    },

    ...baseFields,
    ...blockableFields 

})

module.exports= mongoose.model('coach',coachProfileSchema)
