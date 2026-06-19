const sportModel = require('../../sports/sportModel')
const fs         = require('fs')

// ADD SPORT
const addSport = async (req, res) => {
    try {
        const incomingData = req.body || {}
        let validation = ""

        if (!incomingData.sportName)
            validation += 'sportName is required | '
        if (!incomingData.maxPlayersPerTeam)
            validation += 'maxPlayersPerTeam is required | '
        if (!incomingData.matchDuration)
            validation += 'matchDuration is required | '

        if (!!validation) {
            return res.json({
                status:  400,
                success: false,
                message: validation
            })
        }

        let existingSport = await sportModel.findOne({
            sportName: {
                $regex:   new RegExp('^' + incomingData.sportName + '$', 'i')
            },
            isDelete: false
        })

        if (!!existingSport) {
            return res.json({
                status:  400,
                success: false,
                message: "Sport already exists"
            })
        }

        let newSport = new sportModel({
            sportName:         incomingData.sportName,
            description:       incomingData.description || "",
            maxPlayersPerTeam: Number(incomingData.maxPlayersPerTeam),
            matchDuration:     Number(incomingData.matchDuration),
            rules:             req.file ? req.file.path : "",
            createdBy:         req.decoded._id
        })

        let savedSport = await newSport.save()

        res.json({
            status:  201,
            success: true,
            message: "Sport added successfully",
            data:    savedSport
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// FETCH ALL SPORTS
const fetchAllSports = async (req, res) => {
    try {
        let allSports = await sportModel.find({ isDelete: false })
        let total     = await sportModel.countDocuments({ isDelete: false })

        res.json({
            status:  200,
            success: true,
            message: "Sports fetched successfully",
            total:   total,
            data:    allSports
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// FETCH SINGLE SPORT
const fetchSingleSport = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) {
            return res.json({
                status:  400,
                success: false,
                message: "_id is required"
            })
        }

        let sport = await sportModel.findOne({
            _id:      incomingData._id,
            isDelete: false
        })

        if (!sport) {
            return res.json({
                status:  404,
                success: false,
                message: "Sport not found"
            })
        }

        res.json({
            status:  200,
            success: true,
            message: "Sport fetched successfully",
            data:    sport
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// UPDATE SPORT
const updateSport = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) {
            return res.json({
                status:  400,
                success: false,
                message: "_id is required"
            })
        }

        let sport = await sportModel.findOne({
            _id:      incomingData._id,
            isDelete: false
        })

        if (!sport) {
            return res.json({
                status:  404,
                success: false,
                message: "Sport not found"
            })
        }

        if (incomingData.sportName)
            sport.sportName         = incomingData.sportName
        if (incomingData.description)
            sport.description       = incomingData.description
        if (incomingData.maxPlayersPerTeam)
            sport.maxPlayersPerTeam = Number(incomingData.maxPlayersPerTeam)
        if (incomingData.matchDuration)
            sport.matchDuration     = Number(incomingData.matchDuration)
        if (incomingData.status)
            sport.status            = incomingData.status

        if (req.file) {
            if (sport.rules) {
                fs.unlink('server/public/' + sport.rules, (err) => {
                    if (err) console.log("Old file delete failed: ", err)
                })
            }
            sport.rules =  req.file.path
        }

        sport.updatedBy = req.decoded._id
        sport.updatedAt = Date.now()
        let savedSport  = await sport.save()

        res.json({
            status:  200,
            success: true,
            message: "Sport updated successfully",
            data:    savedSport
        })

    } catch (err) {
        res.json({
            status:  500,
            success: false,
            message: "Internal Server Error: " + err.message
        })
    }
}

// SOFT DELETE SPORT
const softDeleteSport = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) {
            return res.json({
                status:  400,
                success: false,
                message: "_id is required"
            })
        }

        let sport = await sportModel.findOne({
            _id:      incomingData._id,
            isDelete: false
        })

        if (!sport) {
            return res.json({
                status:  404,
                success: false,
                message: "Sport not found"
            })
        }

        sport.isDelete  = true
        sport.updatedBy = req.decoded._id
        sport.updatedAt = Date.now()
        await sport.save()

        res.json({
            status:  200,
            success: true,
            message: "Sport deleted successfully"
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
    addSport,
    fetchAllSports,
    fetchSingleSport,
    updateSport,
    softDeleteSport
}