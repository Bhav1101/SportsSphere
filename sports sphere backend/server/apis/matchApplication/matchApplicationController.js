const matchApplicationModel = require('./matchApplicationModel')
const matchModel            = require('../match/matchModel')
const teamModel             = require('../team/teamModel')
const playerModel           = require('../players/playerModel')
const coachProfileModel     = require('../coach/coachProfileModel')
const sportModel            = require('../sports/sportModel')

// ═══════════════════════════════════════════════════════
// APPLY FOR MATCH — coach only
// ═══════════════════════════════════════════════════════
const applyForMatch = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const coachId      = req.decoded._id
        let validation     = ""

        if (!incomingData.matchId)  validation += 'matchId is required | '
        if (!incomingData.teamId)   validation += 'teamId is required | '
        if (!incomingData.squad || incomingData.squad.length === 0)
            validation += 'squad is required | '

        if (!!validation) return res.json({
            status: 400, success: false, message: validation
        })

        // get coach profile for badge info
        let coachProfile = await coachProfileModel.findOne({
            userId:   coachId,
            isDelete: false
        })

        if (!coachProfile) return res.json({
            status: 404, success: false,
            message: "Coach profile not found"
        })

        // get match
        let match = await matchModel.findOne({
            _id:      incomingData.matchId,
            isDelete: false
        })

        if (!match) return res.json({
            status: 404, success: false, message: "Match not found"
        })

        // loophole 6 — match must be open for applications
        if (match.status !== "open_for_applications" && match.status !== "teams_selected") return res.json({
            status:  400,
            success: false,
            message: "This match is no longer accepting applications"
        })

        // get team
        let team = await teamModel.findOne({
            _id:      incomingData.teamId,
            coachId:  coachId,
            isDelete: false
        })

        if (!team) return res.json({
            status: 404, success: false,
            message: "Team not found or does not belong to you"
        })

        // loophole 2 — team sport must match match sport
        if (team.sportId.toString() !== match.sportId.toString()) {
            return res.json({
                status:  400,
                success: false,
                message: "Your team's sport does not match this match's sport"
            })
        }

        // loophole 3 — coach already applied for this match
        let existingApp = await matchApplicationModel.findOne({
            matchId:  incomingData.matchId,
            coachId:  coachId,
            isDelete: false
        })

        if (!!existingApp) return res.json({
            status:  400,
            success: false,
            message: "You have already applied for this match"
        })

        // loophole 4 — coach has another active pending application
        let activeApp = await matchApplicationModel.findOne({
            coachId:  coachId,
            status:   "pending",
            isDelete: false
        })

        if (!!activeApp) return res.json({
            status:  400,
            success: false,
            message: "You already have a pending application. Wait for admin decision before applying again."
        })

        // loophole 5 — max applications reached
        let currentApps = await matchApplicationModel.countDocuments({
            matchId:  incomingData.matchId,
            isDelete: false
        })

        if (currentApps >= match.maxApplications) return res.json({
            status:  400,
            success: false,
            message: `Maximum applications (${match.maxApplications}) reached for this match`
        })

        // validate squad
        let squadIds = incomingData.squad

        // get sport to check maxPlayersPerTeam
        let sport = await sportModel.findOne({
            _id:      match.sportId,
            isDelete: false
        })

        // loophole 7 — squad exceeds max players
        if (sport && squadIds.length > sport.maxPlayersPerTeam) {
            return res.json({
                status:  400,
                success: false,
                message: `Squad cannot exceed ${sport.maxPlayersPerTeam} players for ${sport.sportName}`
            })
        }

        // loophole 8 — check no blocked player in squad
        for (let playerId of squadIds) {
            let player = await playerModel.findOne({
                _id:      playerId,
                teamId:   incomingData.teamId,
                isDelete: false
            })

            if (!player) return res.json({
                status:  400,
                success: false,
                message: `Player ${playerId} not found in your team`
            })

            if (player.isBlock) return res.json({
                status:  400,
                success: false,
                message: `Player ${player.playerName} is blocked and cannot be in squad`
            })
        }

        // all checks passed — create application
        let newApp = new matchApplicationModel({
            matchId:     incomingData.matchId,
            coachId:     coachId,
            teamId:      incomingData.teamId,
            sportId:     match.sportId,
            message:     incomingData.message || "",
            squad:       squadIds,
            status:      "pending",
            coachBadge:  coachProfile.badge,
            createdBy:   coachId
        })

        let savedApp = await newApp.save()

        res.json({
            status:  201,
            success: true,
            message: "Application submitted successfully",
            data:    savedApp
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "ISE: " + err.message
        })
    }
}

// ═══════════════════════════════════════════════════════
// GET MY APPLICATIONS — coach sees their own
// ═══════════════════════════════════════════════════════
const getMyApplications = async (req, res) => {
    try {
        const coachId = req.decoded._id

        let apps = await matchApplicationModel
            .find({ coachId, isDelete: false })
            .populate('matchId',  'matchName matchDate matchTime city status')
            .populate('teamId',   'teamName logo')
            .populate('sportId',  'sportName')
            .populate('squad',    'playerName playerImg')
            .sort({ createdAt: -1 })

        res.json({
            status:  200,
            success: true,
            message: "Applications fetched",
            total:   apps.length,
            data:    apps
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "ISE: " + err.message
        })
    }
}

// ═══════════════════════════════════════════════════════
// CANCEL APPLICATION — coach cancels pending application
// ═══════════════════════════════════════════════════════
const cancelApplication = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const coachId      = req.decoded._id

        if (!incomingData._id) return res.json({
            status: 400, success: false, message: "_id is required"
        })

        let app = await matchApplicationModel.findOne({
            _id:      incomingData._id,
            coachId:  coachId,
            isDelete: false
        })

        if (!app) return res.json({
            status: 404, success: false, message: "Application not found"
        })

        if (app.status !== "pending") return res.json({
            status:  400,
            success: false,
            message: "Only pending applications can be cancelled"
        })

        app.isDelete  = true
        app.updatedBy = coachId
        app.updatedAt = Date.now()
        await app.save()

        res.json({
            status:  200,
            success: true,
            message: "Application cancelled"
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "ISE: " + err.message
        })
    }
}

// ═══════════════════════════════════════════════════════
// GET MY MATCHES — coach sees approved matches
// ═══════════════════════════════════════════════════════
const getMyMatches = async (req, res) => {
    try {
        const coachId = req.decoded._id

        let apps = await matchApplicationModel
            .find({
                coachId:  coachId,
                status:   "approved",
                isDelete: false
            })
            .populate({
                path:  'matchId',
                match: {
                    status:   { $in: ["teams_selected", "upcoming", "ongoing"] },
                    isDelete: false
                },
                populate: [
                    { path: 'sportId', select: 'sportName' },
                    { path: 'venueId', select: 'venueName city' }
                ]
            })
            .populate('teamId', 'teamName logo')

        // filter out null matchId (completed/cancelled matches)
        const activeMatches = apps.filter(a => a.matchId !== null)

        res.json({
            status:  200,
            success: true,
            message: "My matches fetched",
            total:   activeMatches.length,
            data:    activeMatches
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
    applyForMatch,
    getMyApplications,
    cancelApplication,
    getMyMatches
}