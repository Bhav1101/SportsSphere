const mongoose =require('mongoose');
const { baseFields } = require('../../config/baseSchema')


const sportsSchema = new mongoose.Schema({
    sportName:{type:String,default:""},
    decricption:{type:String,default:""},
    maxPlayersPerTeam:{type:Number,default:0},
    matchDuration:{type:Number,default:0},
    rules:{type:String,default:""},
    status:{type:String,default:"active"},

    ...baseFields
    
})


module.exports=mongoose.model('sport',sportsSchema)