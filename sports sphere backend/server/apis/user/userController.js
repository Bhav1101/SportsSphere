const userModel = require ('./userModel')
const bcrypt =require ('bcrypt')
const jwt =require ('jsonwebtoken')
const saltRounds=10;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const register = async (req,res)=>{
    try{
        const incomingData=req.body ||{};
        let validation =""

        if (!incomingData.name)     validation += 'name is required | '
        if (!incomingData.email)    validation += 'email is required | '
        else if (!emailRegex.test(incomingData.email)) validation += 'valid email is required | '
        if (!incomingData.contact)  validation += 'contact is required | '
        if (!incomingData.password) validation += 'password is required | '

        if(!!validation){
            return res.json({
                status:400,
                success:false,
                message:validation
            })
        }

        let existingUser = await userModel.findOne({
            email:incomingData.email,
            isDelete:false
        })

        if(!!existingUser){
            return res.json({
            status:400,
            success:false,
            message:"Email already registered"        
            })
        }

        let newUser =new userModel({
            name: incomingData.name,
            email:incomingData.email,
            contact:incomingData.contact,
            password:bcrypt.hashSync(incomingData.password,saltRounds),
            userType:3
        })

        let savedUser= await newUser.save();

        res.json({
            status:201,
            success:true,
            message:"Registered Successfully",
            data:savedUser
        })
    }catch(err){
        res.json({
            status:500,
            success:false,
            message:"Internal Server Error" + err.message
        })
    }
}

const login =async (req,res)=>{
    try{
        const incomingData=req.body ||{};
        let validation=""

        if (!incomingData.email)    validation += 'email is required | '
        if (!incomingData.password) validation += 'password is required | '

        if(!!validation){
            return res.json({
                status:400,
                success:false,
                message:validation
            })
        }

        let user = await userModel.findOne({
            email: incomingData.email,
            isDelete:false
        })
        if (!user){
            return res.json({
                status:404,
                success:false,
                message:"User not found"
            })
    }

    if(user.isBlock){
        return res.json({
            status: 403,
            success:false,
            message:"Your account has been blocked.Contact admin"
        })
    }

    let isMatch =bcrypt.compareSync(incomingData.password,user.password)

    if(isMatch){
        let payload ={
            _id: user._id,
            email : user.email,
            name : user.name,
            contact : user.contact,
            userType : user.userType
        }

        const token =jwt.sign(payload,process.env.JWT_SECRET)
        
        res.json({
            status:200,
            success:true,
            message:"Login Success",
            token:token,
            data:user
        })
    }else{
        res.json({
            status:400,
            success:false,
            message:"Wrong Password"
        })
    }
}catch(err){
    res.json({
        status:500,
        success:false,
        message:"Internal Server Error :"+err.message
        })
    }
}


const update = async (req, res) => {
    try{
        const incomingData = req.body ||{}

        const userId = req.decoded._id
        
        let user = await userModel.findOne({
            _id: userId,
            isDelete:false
        })

        if(!user){
            return res.json({
                status:404,
                sucess:false,
                message:"User not found"
            })
        }

        if(incomingData.name) user.name =incomingData.name
        if(incomingData.contact) user.contact =incomingData.contact

        if(req.file){
            user.profileImage=req.file.path
        }
        user.updatedAt =Date.now()
        let savedUser = await user.save()

        res.json({
            status:200,
            success:true,
            message:"Profile updated Successfully",
            data:savedUser
        })
    }catch (err){
        res.json({
            status:500,
            success:false,
            message:"Internal Server Error "+err.message
        })
    }
}

module.exports={register,login,update}