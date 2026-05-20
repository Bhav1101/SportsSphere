const mongoose = require('mongoose')
const connectDb = async ()=> {
    try{
        await mongoose.connect(process.env.DB_KEY)
        console.log("DB connected")
    }catch(err){
        console.log("Error Connecting DB ",err);
    }
}

module.exports = connectDb