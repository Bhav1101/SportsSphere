const jwt       = require('jsonwebtoken')
const userModel = require('../apis/user/userModel')
const secretKey = process.env.JWT_SECRET

module.exports = async (req, res, next) => {
    const token = req.headers['authorization']

    if (token) {
        jwt.verify(token, secretKey, async (err, decoded) => {
            if (err) {
                return res.json({
                    status:  403,
                    success: false,
                    message: "Unauthorized - invalid token"
                })
            }

            // check if user/coach is blocked after token verification
            let user = await userModel.findOne({
                _id:      decoded._id,
                isDelete: false
            })

            if (!user) {
                return res.json({
                    status:  403,
                    success: false,
                    message: "Account not found"
                })
            }

            if (user.isBlock) {
                return res.json({
                    status:  403,
                    success: false,
                    message: "Your account has been blocked by admin"
                })
            }

            req.decoded = decoded
            next()
        })
    } else {
        res.json({
            status:  403,
            success: false,
            message: "Token is required"
        })
    }
}