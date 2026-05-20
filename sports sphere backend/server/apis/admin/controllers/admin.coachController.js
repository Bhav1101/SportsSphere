const userModel             = require('../../user/userModel')
const coachProfileModel     = require('../../coach/coachProfileModel')
const teamModel   = require('../../team/teamModel')
const playerModel = require('../../players/playerModel')
const { updateCoachBadge }  = require('../helpers/badgeHelper')
const { cleanRejectedProfiles } = require('../helpers/cleanupHelper')

// FETCH ALL COACHES
const fetchAllCoaches = async (req, res) => {
    try {
        let allCoaches = await userModel.find({
            isDelete: false,
            userType: 2
        })
        let total = await userModel.countDocuments({
            isDelete: false,
            userType: 2
        })

        res.json({
            status:  200,
            success: true,
            message: "Coaches fetched successfully",
            total:   total,
            data:    allCoaches
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// FETCH SINGLE COACH
const fetchSingleCoach = async (req, res) => {
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
            userType: 2,
            isDelete: false
        })

        if (!user) {
            return res.json({
                status:  404,
                success: false,
                message: "Coach not found"
            })
        }

        let profile = await coachProfileModel
            .findOne({
                userId:   incomingData._id,
                isDelete: false
            })
            .populate('sportsIds', 'sportName status')

        res.json({
            status:  200,
            success: true,
            message: "Coach fetched successfully",
            data: {
                user:    user,
                profile: profile || null
            }
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// BLOCK COACH
const blockCoach = async (req, res) => {
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
            userType: 2,
            isDelete: false
        })

        if (!user) {
            return res.json({
                status:  404,
                success: false,
                message: "Coach not found"
            })
        }

        if (user.isBlock) {
            return res.json({
                status:  400,
                success: false,
                message: "Coach is already blocked"
            })
        }

        user.isBlock   = true
        user.updatedBy = req.decoded._id
        user.updatedAt = Date.now()
        await user.save()

        let profile = await coachProfileModel.findOne({
            userId:   incomingData._id,
            isDelete: false
        })

        if (profile) {
            profile.isBlock   = true
            profile.updatedBy = req.decoded._id
            profile.updatedAt = Date.now()
            await profile.save()
        }

        res.json({
            status:  200,
            success: true,
            message: "Coach blocked successfully"
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// UNBLOCK COACH
const unblockCoach = async (req, res) => {
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
            userType: 2,
            isDelete: false
        })

        if (!user) {
            return res.json({
                status:  404,
                success: false,
                message: "Coach not found"
            })
        }

        if (!user.isBlock) {
            return res.json({
                status:  400,
                success: false,
                message: "Coach is not blocked"
            })
        }

        user.isBlock   = false
        user.updatedBy = req.decoded._id
        user.updatedAt = Date.now()
        await user.save()

        let profile = await coachProfileModel.findOne({
            userId:   incomingData._id,
            isDelete: false
        })

        if (profile) {
            profile.isBlock   = false
            profile.updatedBy = req.decoded._id
            profile.updatedAt = Date.now()
            await profile.save()
        }

        res.json({
            status:  200,
            success: true,
            message: "Coach unblocked successfully"
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// SOFT DELETE COACH
const softDeleteCoach = async (req, res) => {
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
            userType: 2,
            isDelete: false
        })

        if (!user) {
            return res.json({
                status:  404,
                success: false,
                message: "Coach not found"
            })
        }

        user.isDelete  = true
        user.updatedBy = req.decoded._id
        user.updatedAt = Date.now()
        await user.save()

        let profile = await coachProfileModel.findOne({
            userId:   incomingData._id,
            isDelete: false
        })

        if (profile) {
            profile.isDelete  = true
            profile.updatedBy = req.decoded._id
            profile.updatedAt = Date.now()
            await profile.save()
        }

        res.json({
            status:  200,
            success: true,
            message: "Coach deleted successfully"
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// FETCH ALL COACH PROFILES
const fetchAllCoachProfiles = async (req, res) => {
    try {
        await cleanRejectedProfiles()

        let allProfiles = await coachProfileModel
            .find({ isDelete: false })
            .populate('userId',    'name email contact profileImage')
            .populate('sportsIds', 'sportName status')

        let total = await coachProfileModel.countDocuments({
            isDelete: false
        })

        res.json({
            status:  200,
            success: true,
            message: "Coach profiles fetched successfully",
            total:   total,
            data:    allProfiles
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// FETCH SINGLE COACH PROFILE
const fetchSingleCoachProfile = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) {
            return res.json({
                status:  400,
                success: false,
                message: "_id is required"
            })
        }

        let profile = await coachProfileModel
            .findOne({
                _id:      incomingData._id,
                isDelete: false
            })
            .populate('userId',    'name email contact profileImage')
            .populate('sportsIds', 'sportName description status')

        if (!profile) {
            return res.json({
                status:  404,
                success: false,
                message: "Coach profile not found"
            })
        }

        res.json({
            status:  200,
            success: true,
            message: "Coach profile fetched successfully",
            data:    profile
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// APPROVE COACH PROFILE
const approveCoachProfile = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) {
            return res.json({
                status:  400,
                success: false,
                message: "_id is required"
            })
        }

        let profile = await coachProfileModel.findOne({
            _id:      incomingData._id,
            isDelete: false
        })

        if (!profile) {
            return res.json({
                status:  404,
                success: false,
                message: "Coach profile not found"
            })
        }

        if (profile.status === "approved") {
            return res.json({
                status:  400,
                success: false,
                message: "Coach profile is already approved"
            })
        }

        profile.status       = "approved"
        profile.adminRemarks = ""
        profile.updatedBy    = req.decoded._id
        profile.updatedAt    = Date.now()
        profile.points      += 5
        await profile.save()

        await updateCoachBadge(profile.userId)

        res.json({
            status:  200,
            success: true,
            message: "Coach profile approved successfully"
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// REJECT COACH PROFILE
const rejectCoachProfile = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) {
            return res.json({
                status:  400,
                success: false,
                message: "_id is required"
            })
        }

        if (!incomingData.adminRemarks) {
            return res.json({
                status:  400,
                success: false,
                message: "adminRemarks is required"
            })
        }

        let profile = await coachProfileModel.findOne({
            _id:      incomingData._id,
            isDelete: false
        })

        if (!profile) {
            return res.json({
                status:  404,
                success: false,
                message: "Coach profile not found"
            })
        }

        if (profile.status === "rejected") {
            return res.json({
                status:  400,
                success: false,
                message: "Coach profile is already rejected"
            })
        }

        profile.status       = "rejected"
        profile.adminRemarks = incomingData.adminRemarks
        profile.updatedBy    = req.decoded._id
        profile.updatedAt    = Date.now()
        await profile.save()

        res.json({
            status:  200,
            success: true,
            message: "Coach profile rejected"
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}


const fetchCoachWithTeams = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) return res.json({
            status:  400,
            success: false,
            message: "_id is required"
        })

        // get coach user details
        let user = await userModel.findOne({
            _id:      incomingData._id,
            userType: 2,
            isDelete: false
        })

        if (!user) return res.json({
            status:  404,
            success: false,
            message: "Coach not found"
        })

        // get coach profile
        let profile = await coachProfileModel
            .findOne({ userId: incomingData._id, isDelete: false })
            .populate('sportsIds', 'sportName maxPlayersPerTeam')

        // get all teams of this coach
        let teams = await teamModel
            .find({ coachId: incomingData._id, isDelete: false })
            .populate('sportId', 'sportName maxPlayersPerTeam')

        // get players for each team
        let teamsWithPlayers = await Promise.all(
            teams.map(async (team) => {
                let players = await playerModel
                    .find({ teamId: team._id, isDelete: false })
                    .select('playerName experience bio rating matchesPlayed playerImg isBlock')

                return {
                    ...team.toObject(),
                    players,
                    totalPlayers: players.length
                }
            })
        )

        res.json({
            status:  200,
            success: true,
            message: "Coach with teams fetched successfully",
            data: {
                user:    user,
                profile: profile || null,
                teams:   teamsWithPlayers,
                totalTeams: teamsWithPlayers.length
            }
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "ISE: " + err.message
        })
    }
}

module.exports = {
    fetchAllCoaches,
    fetchSingleCoach,
    blockCoach,
    unblockCoach,
    softDeleteCoach,
    fetchAllCoachProfiles,
    fetchSingleCoachProfile,
    approveCoachProfile,
    rejectCoachProfile,
    fetchCoachWithTeams
}