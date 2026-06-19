const userModel         = require('../user/userModel')
const coachProfileModel = require('./coachProfileModel')
const sportModel        = require('../sports/sportModel')
const bcrypt            = require('bcrypt')
const saltRounds        = 10
const emailRegex        = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ═══════════════════════════════════════════════════════
// REGISTER COACH
// creates user + coachProfile in one request
// userType hardcoded to 2 — server decides, frontend cannot change
// ═══════════════════════════════════════════════════════

const register = async (req, res) => {
    try {
        const incomingData = req.body || {}
        let validation = ""

        // basic user fields
        if (!incomingData.name)             validation += 'name is required | '
        if (!incomingData.email)            validation += 'email is required | '
        else if (!emailRegex.test(incomingData.email)) validation += 'valid email is required | '
        if (!incomingData.contact)          validation += 'contact is required | '
        if (!incomingData.password)         validation += 'password is required | '

        // profile fields
        if (!incomingData.organisationName) validation += 'organisationName is required | '
        if (!incomingData.experienceYears)  validation += 'experienceYears is required | '
        if (!incomingData.bio)              validation += 'bio is required | '
        if (!incomingData.sportsIds)        validation += 'sportsIds is required | '
        if (!req.file)                      validation += 'document is required | '

        if (!!validation) {
            return res.json({
                status:  400,
                success: false,
                message: validation
            })
        }

        // loophole 1 — check email already exists
        let existingUser = await userModel.findOne({
            email:    incomingData.email,
            isDelete: false
        })

        if (!!existingUser) {
            return res.json({
                status:  400,
                success: false,
                message: "Email already registered"
            })
        }

        // loophole 2 — validate sportsIds
        // parse sportsIds — comes as string from form-data
        // frontend sends: "sportId1,sportId2" or ["sportId1","sportId2"]
        let sportsIds = []

        if (typeof incomingData.sportsIds === 'string') {
            // if sent as comma separated string
            sportsIds = incomingData.sportsIds.split(',').map(id => id.trim())
        } else if (Array.isArray(incomingData.sportsIds)) {
            sportsIds = incomingData.sportsIds
        }

        if (sportsIds.length === 0) {
            return res.json({
                status:  400,
                success: false,
                message: "At least one sport is required"
            })
        }

        // loophole 3 — verify each sport exists and is active
        for (let sportId of sportsIds) {
            let sport = await sportModel.findOne({
                _id:      sportId,
                status:   "active",
                isDelete: false
            })

            if (!sport) {
                return res.json({
                    status:  400,
                    success: false,
                    message: `Sport not found or inactive: ${sportId}`
                })
            }
        }

        // create user first
        let newUser = new userModel({
            name:      incomingData.name,
            email:     incomingData.email,
            contact:   Number(incomingData.contact),
            password:  bcrypt.hashSync(incomingData.password, saltRounds),
            userType:  2,    // hardcoded — always coach
            createdBy: null  // self registered
        })

        let savedUser = await newUser.save()

        // create coach profile linked to user
        let newProfile = new coachProfileModel({
            userId:           savedUser._id,
            organisationName: incomingData.organisationName,
            experienceYears:  Number(incomingData.experienceYears),
            bio:              incomingData.bio,
            sportsIds:        sportsIds,
            document:         req.file.path,
            status:           "pending",
            // pending until admin approves
            createdBy:        savedUser._id
        })

        let savedProfile = await newProfile.save()

        res.json({
            status:  201,
            success: true,
            message: "Coach registered successfully. Wait for admin approval.",
            data: {
                user:    savedUser,
                profile: savedProfile
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

// ═══════════════════════════════════════════════════════
// GET MY PROFILE
// coach fetches their own profile
// userId comes from token — not from body
// ═══════════════════════════════════════════════════════

const getMyProfile = async (req, res) => {
    try {
        const coachId = req.decoded._id

        let profile = await coachProfileModel
            .findOne({
                userId:   coachId,
                isDelete: false
            })
            .populate('userId',    'name email contact profileImage')
            .populate('sportsIds', 'sportName description status')

        if (!profile) {
            return res.json({
                status:  404,
                success: false,
                message: "Profile not found. Please contact admin."
            })
        }

        // tell frontend exactly what status is so it can show correct screen
        let statusMessage = ""
        if (profile.status === "pending") {
            statusMessage = "Your profile is under review. Please wait for admin approval."
        } else if (profile.status === "approved") {
            statusMessage = "Your profile is approved. You can now create teams and apply for matches."
        } else if (profile.status === "rejected") {
            statusMessage = `Your profile was rejected. Reason: ${profile.adminRemarks}. Please update and resubmit.`
        }

        res.json({
            status:        200,
            success:       true,
            message:       "Profile fetched successfully",
            statusMessage: statusMessage,
            data:          profile
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// ═══════════════════════════════════════════════════════
// UPDATE PROFILE
// coach can only update if status is pending or rejected
// after update — status resets to pending automatically
// ═══════════════════════════════════════════════════════

const updateProfile = async (req, res) => {
    try {
        const coachId      = req.decoded._id
        const incomingData = req.body || {}

        let profile = await coachProfileModel.findOne({
            userId:   coachId,
            isDelete: false
        })

        if (!profile) {
            return res.json({
                status:  404,
                success: false,
                message: "Profile not found"
            })
        }

        // loophole — cannot update approved profile
        if (profile.status === "approved") {
            return res.json({
                status:  400,
                success: false,
                message: "Approved profile cannot be edited. Contact admin."
            })
        }

        // update only fields that are sent
        if (incomingData.organisationName)
            profile.organisationName = incomingData.organisationName
        if (incomingData.experienceYears)
            profile.experienceYears  = Number(incomingData.experienceYears)
        if (incomingData.bio)
            profile.bio              = incomingData.bio

        // update sportsIds if sent
        if (incomingData.sportsIds) {
            let sportsIds = []

            if (typeof incomingData.sportsIds === 'string') {
                sportsIds = incomingData.sportsIds.split(',').map(id => id.trim())
            } else if (Array.isArray(incomingData.sportsIds)) {
                sportsIds = incomingData.sportsIds
            }

            // validate each sport
            for (let sportId of sportsIds) {
                let sport = await sportModel.findOne({
                    _id:      sportId,
                    status:   "active",
                    isDelete: false
                })

                if (!sport) {
                    return res.json({
                        status:  400,
                        success: false,
                        message: `Sport not found or inactive: ${sportId}`
                    })
                }
            }

            profile.sportsIds = sportsIds
        }

        // update document if new file uploaded
        if (req.file) {
            profile.document = req.file.path
        }

        // reset status to pending after update
        // so admin reviews the updated profile again
        profile.status       = "pending"
        profile.adminRemarks = ""
        profile.updatedBy    = coachId
        profile.updatedAt    = Date.now()

        let savedProfile = await profile.save()

        res.json({
            status:  200,
            success: true,
            message: "Profile updated successfully. Waiting for admin approval again.",
            data:    savedProfile
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// ═══════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════
module.exports = {
    register,
    getMyProfile,
    updateProfile
}