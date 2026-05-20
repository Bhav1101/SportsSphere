const matchModel = require('./matchModel')

// ═══════════════════════════════════════════════════════
// PUBLIC — fetch upcoming matches for users
// auto marks expired matches as completed before fetching
// ═══════════════════════════════════════════════════════
const fetchAllUpcoming = async (req, res) => {
    try {
        // auto expire matches whose date has passed
        await matchModel.updateMany(
            {
                matchDate: { $lt: new Date() },
                status:    "upcoming",
                isDelete:  false
            },
            {
                $set: {
                    status:    "completed",
                    updatedAt: Date.now()
                }
            }
        )

        let matches = await matchModel
            .find({
                status:   { $in: ["upcoming", "open_for_applications"] },
                isDelete: false
            })
            .populate('sportId', 'sportName')
            .populate('venueId', 'venueName city')
            .populate('team1Id', 'teamName logo')
            .populate('team2Id', 'teamName logo')
            .sort({ matchDate: 1 })

        res.json({
            status:  200,
            success: true,
            message: "Upcoming matches fetched",
            total:   matches.length,
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
// PUBLIC — fetch single match
// ═══════════════════════════════════════════════════════
const fetchSingleMatch = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData._id) return res.json({
            status: 400, success: false, message: "_id is required"
        })

        let match = await matchModel
            .findOne({
                _id:      incomingData._id,
                status:   { $in: ["upcoming", "open_for_applications"] },
                isDelete: false
            })
            .populate('sportId', 'sportName matchDuration maxPlayersPerTeam')
            .populate('venueId', 'venueName city address totalCapacity')
            .populate('team1Id', 'teamName logo playersCount')
            .populate('team2Id', 'teamName logo playersCount')

        if (!match) return res.json({
            status: 404, success: false,
            message: "Match not found or no longer available"
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

module.exports = { fetchAllUpcoming, fetchSingleMatch }