const coachProfileModel = require('../../coach/coachProfileModel')

const updateCoachBadge = async (coachId) => {
    try {
        let profile = await coachProfileModel.findOne({
            userId:   coachId,
            isDelete: false
        })

        if (!profile) return

        let badge = "newcomer"
        if (profile.points >= 20)  badge = "bronze"
        if (profile.points >= 50)  badge = "silver"
        if (profile.points >= 100) badge = "gold"
        if (profile.points >= 200) badge = "platinum"

        profile.badge     = badge
        profile.updatedAt = Date.now()
        await profile.save()

    } catch (err) {
        console.log("Badge update error: ", err.message)
    }
}

module.exports = { updateCoachBadge }