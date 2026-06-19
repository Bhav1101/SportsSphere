const playerModel = require('./playerModel')
const teamModel   = require('../team/teamModel')
const fs          = require('fs')

const addPlayer = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const coachId      = req.decoded._id
        let validation     = ""

        if (!incomingData.playerName) validation += 'playerName is required | '
        if (!incomingData.teamId)     validation += 'teamId is required | '
        if (!incomingData.sportId)    validation += 'sportId is required | '

        if (!!validation) return res.json({ status: 400, success: false, message: validation })

        let team = await teamModel.findOne({ _id: incomingData.teamId, coachId, isDelete: false })
        if (!team) return res.json({ status: 404, success: false, message: "Team not found" })

        let existingPlayer = await playerModel.findOne({
            playerName: incomingData.playerName,
            teamId:     incomingData.teamId,
            isDelete:   false
        })
        if (!!existingPlayer) return res.json({ status: 400, success: false, message: "Player already exists in this team" })

        let newPlayer = new playerModel({
            playerName: incomingData.playerName,
            sportId:    incomingData.sportId,
            teamId:     incomingData.teamId,
            experience: Number(incomingData.experience) || 0,
            bio:        incomingData.bio                || "",
            playerImg:  req.file ? req.file.path : "",
            createdBy:  coachId
        })
        let savedPlayer = await newPlayer.save()

        await teamModel.findByIdAndUpdate(incomingData.teamId, {
            $inc: { totalPlayers: 1, playersCount: 1 }, updatedAt: Date.now()
        })

        res.json({ status: 201, success: true, message: "Player added", data: savedPlayer })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

const getMyPlayers = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const coachId      = req.decoded._id

        if (!incomingData.teamId) return res.json({ status: 400, success: false, message: "teamId is required" })

        let team = await teamModel.findOne({ _id: incomingData.teamId, coachId, isDelete: false })
        if (!team) return res.json({ status: 404, success: false, message: "Team not found" })

        let players = await playerModel
            .find({ teamId: incomingData.teamId, isDelete: false })
            .populate('sportId', 'sportName')

        res.json({ status: 200, success: true, message: "Players fetched", total: players.length, data: players })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

const updatePlayer = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const coachId      = req.decoded._id

        if (!incomingData._id) return res.json({ status: 400, success: false, message: "_id is required" })

        let player = await playerModel.findOne({ _id: incomingData._id, isDelete: false })
        if (!player) return res.json({ status: 404, success: false, message: "Player not found" })

        let team = await teamModel.findOne({ _id: player.teamId, coachId, isDelete: false })
        if (!team) return res.json({ status: 403, success: false, message: "Unauthorized" })

        if (incomingData.playerName) player.playerName = incomingData.playerName
        if (incomingData.experience) player.experience = Number(incomingData.experience)
        if (incomingData.bio)        player.bio        = incomingData.bio
        if (incomingData.sportId)    player.sportId    = incomingData.sportId

        if (req.file) {
            if (player.playerImg) fs.unlink('server/public/' + player.playerImg, (err) => { if (err) console.log(err) })
            player.playerImg =  req.file.path
        }

        player.updatedBy = coachId
        player.updatedAt = Date.now()
        let savedPlayer  = await player.save()

        res.json({ status: 200, success: true, message: "Player updated", data: savedPlayer })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

const deletePlayer = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const coachId      = req.decoded._id

        if (!incomingData._id) return res.json({ status: 400, success: false, message: "_id is required" })

        let player = await playerModel.findOne({ _id: incomingData._id, isDelete: false })
        if (!player) return res.json({ status: 404, success: false, message: "Player not found" })

        let team = await teamModel.findOne({ _id: player.teamId, coachId, isDelete: false })
        if (!team) return res.json({ status: 403, success: false, message: "Unauthorized" })

        player.isDelete  = true
        player.updatedBy = coachId
        player.updatedAt = Date.now()
        await player.save()

        await teamModel.findByIdAndUpdate(player.teamId, {
            $inc: { totalPlayers: -1, playersCount: -1 }, updatedAt: Date.now()
        })

        res.json({ status: 200, success: true, message: "Player deleted" })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

const blockPlayer = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const coachId      = req.decoded._id

        if (!incomingData._id) return res.json({ status: 400, success: false, message: "_id is required" })

        let player = await playerModel.findOne({ _id: incomingData._id, isDelete: false })
        if (!player) return res.json({ status: 404, success: false, message: "Player not found" })

        let team = await teamModel.findOne({ _id: player.teamId, coachId, isDelete: false })
        if (!team) return res.json({ status: 403, success: false, message: "Unauthorized" })

        if (player.isBlock) return res.json({ status: 400, success: false, message: "Already blocked" })

        player.isBlock   = true
        player.updatedBy = coachId
        player.updatedAt = Date.now()
        await player.save()

        res.json({ status: 200, success: true, message: "Player blocked" })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

const unblockPlayer = async (req, res) => {
    try {
        const incomingData = req.body || {}
        const coachId      = req.decoded._id

        if (!incomingData._id) return res.json({ status: 400, success: false, message: "_id is required" })

        let player = await playerModel.findOne({ _id: incomingData._id, isDelete: false })
        if (!player) return res.json({ status: 404, success: false, message: "Player not found" })

        let team = await teamModel.findOne({ _id: player.teamId, coachId, isDelete: false })
        if (!team) return res.json({ status: 403, success: false, message: "Unauthorized" })

        if (!player.isBlock) return res.json({ status: 400, success: false, message: "Not blocked" })

        player.isBlock   = false
        player.updatedBy = coachId
        player.updatedAt = Date.now()
        await player.save()

        res.json({ status: 200, success: true, message: "Player unblocked" })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

module.exports = {
    addPlayer,
    getMyPlayers,
    updatePlayer,
    deletePlayer,
    blockPlayer,
    unblockPlayer
}