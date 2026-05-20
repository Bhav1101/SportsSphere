const userModel = require('../apis/user/userModel')
const bcrypt = require('bcrypt');
const saltRounds=10;

const seed = async ()=> {
    try{
        let existingAdmin = await userModel.findOne({email:"admin@sports.com"})

        if(!!existingAdmin){
            console.log("Admin Already Exists ");
            return;
        }else{
            let newAdmin = new userModel({
                name :"Super Admin ",
                email:"admin@sports.com",
                contact: 1234567890,
                password:bcrypt.hashSync('admin123',saltRounds),
                userType:1,
                isVerified:true
            })
            
            await newAdmin.save();
            console.log("Admin Created Successfully");
            console.log("Email:admin@sports.com");
            console.log("Password:admin123");
        }
    }catch(err){
        console.log("Seeder Error:",err)
    }
}

module.exports =seed;