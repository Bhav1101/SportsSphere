const matchApplicationModel = require('../../matchApplication/matchApplicationModel')
const matchModel            = require('../../match/matchModel')
const teamModel             = require('../../team/teamModel')
const coachProfileModel     = require('../../coach/coachProfileModel')
const { updateCoachBadge }  = require('../helpers/badgeHelper')

// ═══════════════════════════════════════════════════════
// FETCH ALL APPLICATIONS — sorted by badge priority
// ═══════════════════════════════════════════════════════
const fetchAllMatchApplications = async (req, res) => {
    try {
        const incomingData = req.body || {}

        // can filter by matchId
        let query = { isDelete: false }
        if (incomingData.matchId) query.matchId = incomingData.matchId

        const badgeOrder = {
            "platinum": 1,
            "gold":     2,
            "silver":   3,
            "bronze":   4,
            "newcomer": 5
        }

        let apps = await matchApplicationModel
            .find(query)
            .populate('matchId', 'matchName matchDate status')
            .populate('coachId', 'name email contact')
            .populate('teamId',  'teamName logo playersCount')
            .populate('sportId', 'sportName')
            .populate('squad',   'playerName playerImg')

        // sort by badge priority — platinum first
        apps.sort((a, b) => {
            return (badgeOrder[a.coachBadge] || 5) - (badgeOrder[b.coachBadge] || 5)
        })

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
// FETCH SINGLE APPLICATION
// ═══════════════════════════════════════════════════════
const fetchSingleMatchApplication = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) return res.json({
            status: 400, success: false, message: "_id is required"
        })

        let app = await matchApplicationModel
            .findOne({ _id: incomingData._id, isDelete: false })
            .populate('matchId', 'matchName matchDate status maxApplications')
            .populate('coachId', 'name email contact')
            .populate('teamId',  'teamName logo playersCount sportId')
            .populate('sportId', 'sportName')
            .populate('squad',   'playerName playerImg experience rating')

        if (!app) return res.json({
            status: 404, success: false, message: "Application not found"
        })

        res.json({
            status:  200,
            success: true,
            message: "Application fetched",
            data:    app
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
// APPROVE APPLICATION
// admin selects max 2 teams per match
// when 2nd team approved → match becomes "upcoming"
// ═══════════════════════════════════════════════════════
const approveMatchApplication = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) return res.json({
            status: 400, success: false, message: "_id is required"
        })

        let app = await matchApplicationModel.findOne({
            _id: incomingData._id, isDelete: false
        })

        if (!app) return res.json({
            status: 404, success: false, message: "Application not found"
        })

        if (app.status === "approved") return res.json({
            status: 400, success: false, message: "Already approved"
        })

        // get the match
        let match = await matchModel.findOne({
            _id: app.matchId, isDelete: false
        })

        if (!match) return res.json({
            status: 404, success: false, message: "Match not found"
        })

        // loophole 9 — max 2 teams per match
        let approvedCount = await matchApplicationModel.countDocuments({
            matchId:  app.matchId,
            status:   "approved",
            isDelete: false
        })

        if (approvedCount >= 2) return res.json({
            status:  400,
            success: false,
            message: "This match already has 2 approved teams"
        })

        // approve the application
        app.status       = "approved"
        app.adminRemarks = ""
        app.updatedBy    = req.decoded._id
        app.updatedAt    = Date.now()
        await app.save()

        // assign team to match (team1 or team2)
        if (!match.team1Id) {
            match.team1Id = app.teamId
        } else {
            match.team2Id = app.teamId
        }

        // if both teams now assigned → match becomes upcoming
        if (match.team1Id && match.team2Id) {
            match.status = "upcoming"
        } else {
            match.status = "teams_selected"
        }

        match.updatedBy = req.decoded._id
        match.updatedAt = Date.now()
        await match.save()

        // add points to coach
        await coachProfileModel.findOneAndUpdate(
            { userId: app.coachId },
            {
                $inc:      { points: 5 },
                updatedAt: Date.now()
            }
        )
        await updateCoachBadge(app.coachId)

        res.json({
            status:  200,
            success: true,
            message: match.status === "upcoming"
                ? "Application approved. Both teams selected. Match is now UPCOMING!"
                : "Application approved. Waiting for second team.",
            matchStatus: match.status
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
// REJECT APPLICATION
// ═══════════════════════════════════════════════════════
const rejectMatchApplication = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id)          return res.json({ status: 400, success: false, message: "_id is required" })
        if (!incomingData.adminRemarks) return res.json({ status: 400, success: false, message: "adminRemarks is required" })

        let app = await matchApplicationModel.findOne({
            _id: incomingData._id, isDelete: false
        })

        if (!app) return res.json({
            status: 404, success: false, message: "Application not found"
        })

        if (app.status === "rejected") return res.json({
            status: 400, success: false, message: "Already rejected"
        })

        app.status       = "rejected"
        app.adminRemarks = incomingData.adminRemarks
        app.updatedBy    = req.decoded._id
        app.updatedAt    = Date.now()
        await app.save()

        res.json({
            status:  200,
            success: true,
            message: "Application rejected"
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
    fetchAllMatchApplications,
    fetchSingleMatchApplication,
    approveMatchApplication,
    rejectMatchApplication
}