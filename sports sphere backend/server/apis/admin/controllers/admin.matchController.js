const matchModel            = require('../../match/matchModel')
const venueModel            = require('../../venue/venueModel')
const coachProfileModel     = require('../../coach/coachProfileModel')
const { updateCoachBadge }  = require('../helpers/badgeHelper')

// ═══════════════════════════════════════════════════════
// ADD MATCH — admin only
// ═══════════════════════════════════════════════════════
const addMatch = async (req, res) => {
    try {
        const incomingData = req.body || {}
        let validation     = ""

        if (!incomingData.sportId)      validation += 'sportId is required | '
        if (!incomingData.venueId)      validation += 'venueId is required | '
        if (!incomingData.matchName)    validation += 'matchName is required | '
        if (!incomingData.matchDate)    validation += 'matchDate is required | '
        if (!incomingData.matchTime)    validation += 'matchTime is required | '
        if (!incomingData.ticketPrice)  validation += 'ticketPrice is required | '
        if (!incomingData.totalSeats)   validation += 'totalSeats is required | '

        if (!!validation) return res.json({
            status: 400, success: false, message: validation
        })

        // verify venue exists
        let venue = await venueModel.findOne({
            _id:      incomingData.venueId,
            isDelete: false
        })

        if (!venue) return res.json({
            status: 404, success: false, message: "Venue not found"
        })

        let newMatch = new matchModel({
            sportId:         incomingData.sportId,
            venueId:         incomingData.venueId,
            matchName:       incomingData.matchName,
            matchDate:       new Date(incomingData.matchDate),
            matchTime:       incomingData.matchTime,
            city:            venue.city,
            description:     incomingData.description     || "",
            totalSeats:      Number(incomingData.totalSeats),
            availableSeats:  Number(incomingData.totalSeats),
            ticketPrice:     Number(incomingData.ticketPrice),
            maxApplications: Number(incomingData.maxApplications) || 10,
            prizePool: {
                winner:   Number(incomingData.prizeWinner)  || 0,
                runnerUp: Number(incomingData.prizeRunnerUp)|| 0
            },
            status:    "open_for_applications",
            createdBy: req.decoded._id
        })

        let savedMatch = await newMatch.save()

        res.json({
            status:  201,
            success: true,
            message: "Match created successfully",
            data:    savedMatch
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
// FETCH ALL MATCHES — admin sees everything
// ═══════════════════════════════════════════════════════
const fetchAllMatches = async (req, res) => {
    try {
        let matches = await matchModel
            .find({ isDelete: false })
            .populate('sportId', 'sportName')
            .populate('venueId', 'venueName city')
            .populate('team1Id', 'teamName')
            .populate('team2Id', 'teamName')
            .sort({ matchDate: -1 })

        let total = await matchModel.countDocuments({ isDelete: false })

        res.json({
            status:  200,
            success: true,
            message: "Matches fetched",
            total,
            data:    matches
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
// FETCH SINGLE MATCH — admin full details
// ═══════════════════════════════════════════════════════
const fetchSingleMatch = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) return res.json({
            status: 400, success: false, message: "_id is required"
        })

        let match = await matchModel
            .findOne({ _id: incomingData._id, isDelete: false })
            .populate('sportId', 'sportName maxPlayersPerTeam matchDuration')
            .populate('venueId', 'venueName city address totalCapacity')
            .populate('team1Id', 'teamName logo playersCount coachId')
            .populate('team2Id', 'teamName logo playersCount coachId')

        if (!match) return res.json({
            status: 404, success: false, message: "Match not found"
        })

        res.json({
            status:  200,
            success: true,
            message: "Match fetched",
            data:    match
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
// UPDATE MATCH — admin only
// ═══════════════════════════════════════════════════════
const updateMatch = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) return res.json({
            status: 400, success: false, message: "_id is required"
        })

        let match = await matchModel.findOne({
            _id: incomingData._id, isDelete: false
        })

        if (!match) return res.json({
            status: 404, success: false, message: "Match not found"
        })

        if (incomingData.matchName)       match.matchName       = incomingData.matchName
        if (incomingData.matchDate)       match.matchDate       = new Date(incomingData.matchDate)
        if (incomingData.matchTime)       match.matchTime       = incomingData.matchTime
        if (incomingData.ticketPrice)     match.ticketPrice     = Number(incomingData.ticketPrice)
        if (incomingData.totalSeats)      match.totalSeats      = Number(incomingData.totalSeats)
        if (incomingData.description)     match.description     = incomingData.description
        if (incomingData.maxApplications) match.maxApplications = Number(incomingData.maxApplications)

        match.updatedBy = req.decoded._id
        match.updatedAt = Date.now()
        let savedMatch  = await match.save()

        res.json({
            status:  200,
            success: true,
            message: "Match updated",
            data:    savedMatch
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
// SOFT DELETE MATCH
// ═══════════════════════════════════════════════════════
const softDeleteMatch = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) return res.json({
            status: 400, success: false, message: "_id is required"
        })

        let match = await matchModel.findOne({
            _id: incomingData._id, isDelete: false
        })

        if (!match) return res.json({
            status: 404, success: false, message: "Match not found"
        })

        // cannot delete if upcoming with bookings — phase 7 check
        // uncomment in phase 7:
        // const bookingModel = require('../../booking/bookingModel')
        // let bookings = await bookingModel.find({ matchId: incomingData._id, isDelete: false })
        // if (bookings.length > 0) return res.json({
        //     status: 400, success: false,
        //     message: "Cannot delete match with existing bookings"
        // })

        match.isDelete  = true
        match.updatedBy = req.decoded._id
        match.updatedAt = Date.now()
        await match.save()

        res.json({
            status:  200,
            success: true,
            message: "Match deleted"
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
// COMPLETE MATCH — declare winner, distribute prize money
// ═══════════════════════════════════════════════════════
const completeMatch = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id)     return res.json({ status: 400, success: false, message: "_id is required" })
        if (!incomingData.result)  return res.json({ status: 400, success: false, message: "result is required (team1 or team2)" })

        let match = await matchModel.findOne({
            _id: incomingData._id, isDelete: false
        })

        if (!match) return res.json({
            status: 404, success: false, message: "Match not found"
        })

        if (match.status === "completed") return res.json({
            status: 400, success: false, message: "Match already completed"
        })

        // find winner and runner up teams
        const winnerTeamId  = incomingData.result === "team1" ? match.team1Id : match.team2Id
        const loserTeamId   = incomingData.result === "team1" ? match.team2Id : match.team1Id

        const teamModel = require('../../team/teamModel')
        const winnerTeam = await teamModel.findById(winnerTeamId)
        const loserTeam  = await teamModel.findById(loserTeamId)

        // update winner coach profile
        if (winnerTeam) {
            await coachProfileModel.findOneAndUpdate(
                { userId: winnerTeam.coachId },
                {
                    $inc: {
                        'earnings.total':   match.prizePool.winner,
                        'earnings.pending': match.prizePool.winner,
                        matchesPlayed:      1,
                        matchesWon:         1,
                        points:             25
                    },
                    updatedAt: Date.now()
                }
            )
            await updateCoachBadge(winnerTeam.coachId)
        }

        // update runner up coach profile
        if (loserTeam) {
            await coachProfileModel.findOneAndUpdate(
                { userId: loserTeam.coachId },
                {
                    $inc: {
                        'earnings.total':   match.prizePool.runnerUp,
                        'earnings.pending': match.prizePool.runnerUp,
                        matchesPlayed:      1,
                        matchesLost:        1,
                        points:             10
                    },
                    updatedAt: Date.now()
                }
            )
            await updateCoachBadge(loserTeam.coachId)
        }

        // update player ratings — phase 4 loophole fix
        // auto update after match
        const matchApplicationModel = require('../../matchApplication/matchApplicationModel')
        const winnerApp = await matchApplicationModel.findOne({
            matchId:  match._id,
            teamId:   winnerTeamId,
            isDelete: false
        })

        if (winnerApp && winnerApp.squad.length > 0) {
            await require('../../players/playerModel').updateMany(
                { _id: { $in: winnerApp.squad } },
                {
                    $inc:      { matchesPlayed: 1 },
                    updatedAt: Date.now()
                }
            )
        }

        const loserApp = await matchApplicationModel.findOne({
            matchId:  match._id,
            teamId:   loserTeamId,
            isDelete: false
        })

        if (loserApp && loserApp.squad.length > 0) {
            await require('../../players/playerModel').updateMany(
                { _id: { $in: loserApp.squad } },
                {
                    $inc:      { matchesPlayed: 1 },
                    updatedAt: Date.now()
                }
            )
        }

        // mark match completed
        match.status    = "completed"
        match.result    = incomingData.result
        match.updatedBy = req.decoded._id
        match.updatedAt = Date.now()
        await match.save()

        res.json({
            status:  200,
            success: true,
            message: "Match completed. Prize money distributed."
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
    addMatch,
    fetchAllMatches,
    fetchSingleMatch,
    updateMatch,
    softDeleteMatch,
    completeMatch
}