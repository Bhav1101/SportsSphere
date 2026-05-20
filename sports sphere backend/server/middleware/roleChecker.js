const isAdmin = (req, res, next) => {
    if (req.decoded.userType !== 1)
        return res.json({ status: 403, success: false, message: "Admins only" })
    next()
}

const isCoach = (req, res, next) => {
    if (req.decoded.userType !== 2)
        return res.json({ status: 403, success: false, message: "Coaches only" })
    next()
}

const isUser = (req, res, next) => {
    if (req.decoded.userType !== 3)
        return res.json({ status: 403, success: false, message: "Users only" })
    next()
}

const isApprovedCoach = async (req, res, next) => {
    try {
        const coachProfileModel = require('../apis/coach/coachProfileModel')

        let profile = await coachProfileModel.findOne({
            userId:   req.decoded._id,
            isDelete: false
        })

        if (!profile) return res.json({ status: 403, success: false, message: "Please create your profile first" })

        if (profile.status === "pending")  return res.json({ status: 403, success: false, message: "Profile pending approval" })

        if (profile.status === "rejected") return res.json({ status: 403, success: false, message: `Profile rejected. Reason: ${profile.adminRemarks}` })

        req.coachProfile = profile
        next()

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

module.exports = { isAdmin, isCoach, isUser, isApprovedCoach }