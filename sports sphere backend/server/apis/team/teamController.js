const teamModel         = require('./teamModel')
const playerModel       = require('../players/playerModel')
const sportModel        = require('../sports/sportModel')
const coachProfileModel = require('../coach/coachProfileModel')
const fs                = require('fs')

const createTeam = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const coachId      = req.decoded._id
        let validation     = ""

        if (!incomingData.teamName) validation += 'teamName is required | '
        if (!incomingData.sportId)  validation += 'sportId is required | '

        if (!!validation) return res.json({ status: 400, success: false, message: validation })

        // sport must be in coach sportsIds
        let profile     = await coachProfileModel.findOne({ userId: coachId, isDelete: false })
        let sportExists = profile.sportsIds.map(id => id.toString()).includes(incomingData.sportId)
        if (!sportExists) return res.json({ status: 400, success: false, message: "Sport not in your approved profile" })

        // one team per sport per coach
        let existingTeam = await teamModel.findOne({ coachId, sportId: incomingData.sportId, isDelete: false })
        if (!!existingTeam) return res.json({ status: 400, success: false, message: "You already have a team for this sport" })

        let newTeam = new teamModel({
            teamName:  incomingData.teamName,
            teamDesc:  incomingData.teamDesc || "",
            sportId:   incomingData.sportId,
            coachId:   coachId,
            logo:     req.file ? req.file.path : "",
            createdBy: coachId
        })
        let savedTeam = await newTeam.save()

        await sportModel.findByIdAndUpdate(incomingData.sportId, {
            $inc: { totalTeams: 1 }, updatedAt: Date.now()
        })

        res.json({ status: 201, success: true, message: "Team created", data: savedTeam })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

const getMyTeams = async (req, res) => {
    try {
        const coachId = req.decoded._id

        let teams = await teamModel
            .find({ coachId, isDelete: false })
            .populate('sportId', 'sportName maxPlayersPerTeam')

        let teamsWithPlayers = await Promise.all(
            teams.map(async (team) => {
                let players = await playerModel.find({ teamId: team._id, isDelete: false })
                return { ...team.toObject(), players }
            })
        )

        res.json({ status: 200, success: true, message: "Teams fetched", total: teams.length, data: teamsWithPlayers })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

const updateTeam = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const coachId      = req.decoded._id

        if (!incomingData._id) return res.json({ status: 400, success: false, message: "_id is required" })

        let team = await teamModel.findOne({ _id: incomingData._id, coachId, isDelete: false })
        if (!team) return res.json({ status: 404, success: false, message: "Team not found" })

        if (incomingData.teamName) team.teamName = incomingData.teamName
        if (incomingData.teamDesc) team.teamDesc = incomingData.teamDesc
        if (incomingData.status)   team.status   = incomingData.status

        if (req.file) {
            if (team.logo) fs.unlink('server/public/' + team.logo, (err) => { if (err) console.log(err) })
            team.logo = req.file.path
        }

        team.updatedBy = coachId
        team.updatedAt = Date.now()
        let savedTeam  = await team.save()

        res.json({ status: 200, success: true, message: "Team updated", data: savedTeam })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

const deleteTeam = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const coachId      = req.decoded._id

        if (!incomingData._id) return res.json({ status: 400, success: false, message: "_id is required" })

        let team = await teamModel.findOne({ _id: incomingData._id, coachId, isDelete: false })
        if (!team) return res.json({ status: 404, success: false, message: "Team not found" })

        team.isDelete  = true
        team.updatedBy = coachId
        team.updatedAt = Date.now()
        await team.save()

        // soft delete all players in team
        await playerModel.updateMany(
            { teamId: incomingData._id },
            { $set: { isDelete: true, updatedAt: Date.now() } }
        )

        await sportModel.findByIdAndUpdate(team.sportId, {
            $inc: { totalTeams: -1 }, updatedAt: Date.now()
        })

        res.json({ status: 200, success: true, message: "Team deleted" })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

module.exports = { createTeam, getMyTeams, updateTeam, deleteTeam }