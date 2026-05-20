const userModel = require('../../user/userModel')

const fetchAdminNotifications = async (req, res) => {
    try {
        const admin = await userModel.findOne({
            _id:      req.decoded._id,
            userType: 1,
            isDelete: false
        })

        if (!admin) {
            return res.json({
                status:  404,
                success: false,
                message: "Admin not found"
            })
        }

        const notifications = [...(admin.notifications || [])].sort((left, right) => {
            const leftTime = new Date(right.createdAt || 0).getTime()
            const rightTime = new Date(left.createdAt || 0).getTime()
            return leftTime - rightTime
        })

        res.json({
            status:  200,
            success: true,
            message: "Notifications fetched",
            total:   notifications.length,
            unread:  notifications.filter(notification => !notification.isRead).length,
            data:    notifications
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

const markAdminNotificationRead = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData.notificationId) {
            return res.json({
                status:  400,
                success: false,
                message: "notificationId is required"
            })
        }

        const admin = await userModel.findOne({
            _id:      req.decoded._id,
            userType: 1,
            isDelete: false
        })

        if (!admin) {
            return res.json({
                status:  404,
                success: false,
                message: "Admin not found"
            })
        }

        const notification = admin.notifications.id(incomingData.notificationId)

        if (!notification) {
            return res.json({
                status:  404,
                success: false,
                message: "Notification not found"
            })
        }

        notification.isRead = true
        admin.updatedBy = req.decoded._id
        admin.updatedAt = Date.now()
        await admin.save()

        res.json({
            status:  200,
            success: true,
            message: "Notification marked as read"
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// FETCH ALL USERS
const fetchAllUsers = async (req, res) => {
    try {
        let allUsers = await userModel.find({
            isDelete: false,
            userType: 3
        })
        let total = await userModel.countDocuments({
            isDelete: false,
            userType: 3
        })

        res.json({
            status:  200,
            success: true,
            message: "Users fetched successfully",
            total:   total,
            data:    allUsers
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// FETCH SINGLE USER
const fetchSingleUser = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) {
            return res.json({
                status:  400,
                success: false,
                message: "_id is required"
            })
        }

        let user = await userModel.findOne({
            _id:      incomingData._id,
            userType: 3,
            isDelete: false
        })

        if (!user) {
            return res.json({
                status:  404,
                success: false,
                message: "User not found"
            })
        }

        res.json({
            status:  200,
            success: true,
            message: "User fetched successfully",
            data:    user
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// BLOCK USER
const blockUser = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) {
            return res.json({
                status:  400,
                success: false,
                message: "_id is required"
            })
        }

        let user = await userModel.findOne({
            _id:      incomingData._id,
            userType: 3,
            isDelete: false
        })

        if (!user) {
            return res.json({
                status:  404,
                success: false,
                message: "User not found"
            })
        }

        if (user.isBlock) {
            return res.json({
                status:  400,
                success: false,
                message: "User is already blocked"
            })
        }

        user.isBlock   = true
        user.updatedBy = req.decoded._id
        user.updatedAt = Date.now()
        await user.save()

        res.json({
            status:  200,
            success: true,
            message: "User blocked successfully"
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// UNBLOCK USER
const unblockUser = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) {
            return res.json({
                status:  400,
                success: false,
                message: "_id is required"
            })
        }

        let user = await userModel.findOne({
            _id:      incomingData._id,
            userType: 3,
            isDelete: false
        })

        if (!user) {
            return res.json({
                status:  404,
                success: false,
                message: "User not found"
            })
        }

        if (!user.isBlock) {
            return res.json({
                status:  400,
                success: false,
                message: "User is not blocked"
            })
        }

        user.isBlock   = false
        user.updatedBy = req.decoded._id
        user.updatedAt = Date.now()
        await user.save()

        res.json({
            status:  200,
            success: true,
            message: "User unblocked successfully"
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// SOFT DELETE USER
const softDeleteUser = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) {
            return res.json({
                status:  400,
                success: false,
                message: "_id is required"
            })
        }

        let user = await userModel.findOne({
            _id:      incomingData._id,
            userType: 3,
            isDelete: false
        })

        if (!user) {
            return res.json({
                status:  404,
                success: false,
                message: "User not found"
            })
        }

        user.isDelete  = true
        user.updatedBy = req.decoded._id
        user.updatedAt = Date.now()
        await user.save()

        res.json({
            status:  200,
            success: true,
            message: "User deleted successfully"
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

module.exports = {
    fetchAllUsers,
    fetchSingleUser,
    blockUser,
    unblockUser,
    softDeleteUser,
    fetchAdminNotifications,
    markAdminNotificationRead
}