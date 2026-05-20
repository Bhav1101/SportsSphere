const mongoose = require('mongoose');
const { baseFields, blockableFields } = require('../../config/baseSchema')
const notificationSchema = require('../notification/notificationSchema')

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/


const userSchema = new mongoose.Schema({
    name :{type: String ,default:""},
    email:{type: String , required:true, trim:true, lowercase:true, match:[emailRegex, 'Please enter a valid email']},
    contact:{type: Number , required:true},
    password:{type: String , default:""},
    userType:{type: Number , default:3},
    profileImage:{type: String , default:""},
    notifications: { type: [notificationSchema], default: [] },

    isVerified:{type:Boolean ,default:false},
    
    ...baseFields,
    ...blockableFields 
})

module.exports= mongoose.model('user',userSchema)