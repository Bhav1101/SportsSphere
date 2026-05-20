const coachProfileModel = require('../../coach/coachProfileModel')

const cleanRejectedProfiles = async () => {
    try {
        let sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

        await coachProfileModel.updateMany(
            {
                status:    "rejected",
                updatedAt: { $lt: sevenDaysAgo },
                isDelete:  false
            },
            {
                $set: {
                    isDelete:  true,
                    updatedAt: Date.now()
                }
            }
        )
    } catch (err) {
        console.log("Clean rejected profiles error: ", err.message)
    }
}

module.exports = { cleanRejectedProfiles }