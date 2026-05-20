const sportModel = require('./sportModel')

// ═══════════════════════════════════════════════════════
// SPORT CONTROLLER — user + coach facing functions
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────
// FETCH ALL ACTIVE SPORTS — user + coach
// only shows active sports
// inactive sports are completely hidden from user + coach
// ─────────────────────────────────────────────────────
const fetchAllActive = async (req, res) => {
    try {
        let allSports = await sportModel.find({
            isDelete: false,
            status:   "active"   // only active sports shown
        })

        let total = await sportModel.countDocuments({
            isDelete: false,
            status:   "active"
        })

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

// ─────────────────────────────────────────────────────
// FETCH SINGLE SPORT — user + coach
// loophole 3 fix — status active check added
// even if someone has the _id of an inactive sport
// they cannot fetch it through this route
// ─────────────────────────────────────────────────────
const fetchSingle = async (req, res) => {
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
            isDelete: false,
            status:   "active"   // loophole 3 fix — inactive sports blocked
        })

        if (!sport) {
            return res.json({
                status:  404,
                success: false,
                message: "Sport not found or no longer available"
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

// ═══════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════
module.exports = {
    fetchAllActive,
    fetchSingle
}