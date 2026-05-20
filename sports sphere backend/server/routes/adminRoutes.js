const router               = require('express').Router()
const tokenChecker         = require('../middleware/tokenChecker')
const { isAdmin }          = require('../middleware/roleChecker')
const upload               = require('../middleware/upload')

const adminUserController  = require('../apis/admin/controllers/adminuserController')
const adminCoachController = require('../apis/admin/controllers/admin.coachController')
const adminSportController = require('../apis/admin/controllers/admin.sportController')
const venueController      = require('../apis/venue/venueController')
// ALL admin routes need token + isAdmin
router.use(tokenChecker)
router.use(isAdmin)

// ── User Management ───────────────────────────────────
router.post('/user/fetchAll',    adminUserController.fetchAllUsers)
router.post('/user/fetchSingle', adminUserController.fetchSingleUser)
router.post('/user/block',       adminUserController.blockUser)
router.post('/user/unblock',     adminUserController.unblockUser)
router.post('/user/delete',      adminUserController.softDeleteUser)
router.post('/notification/fetchAll', adminUserController.fetchAdminNotifications)
router.post('/notification/markRead', adminUserController.markAdminNotificationRead)

// ── Coach Management ──────────────────────────────────
router.post('/coach/fetchAll',    adminCoachController.fetchAllCoaches)
router.post('/coach/fetchSingle', adminCoachController.fetchSingleCoach)
router.post('/coach/block',       adminCoachController.blockCoach)
router.post('/coach/unblock',     adminCoachController.unblockCoach)
router.post('/coach/delete',      adminCoachController.softDeleteCoach)
router.post('/coach/fetchWithTeams', adminCoachController.fetchCoachWithTeams)

// ── Coach Profile Management ──────────────────────────
router.post('/coachProfile/fetchAll',    adminCoachController.fetchAllCoachProfiles)
router.post('/coachProfile/fetchSingle', adminCoachController.fetchSingleCoachProfile)
router.post('/coachProfile/approve',     adminCoachController.approveCoachProfile)
router.post('/coachProfile/reject',      adminCoachController.rejectCoachProfile)

// ── Sport Management ──────────────────────────────────
router.post('/sport/add',         upload.single('rules'), adminSportController.addSport)
router.post('/sport/fetchAll',    adminSportController.fetchAllSports)
router.post('/sport/fetchSingle', adminSportController.fetchSingleSport)
router.post('/sport/update',      upload.single('rules'), adminSportController.updateSport)
router.post('/sport/delete',      adminSportController.softDeleteSport)

//── Match Application Management ─────────────────────
const adminMatchAppController = require('../apis/admin/controllers/admin.matchAppController')
router.post('/application/fetchAll',    adminMatchAppController.fetchAllMatchApplications)
router.post('/application/fetchSingle', adminMatchAppController.fetchSingleMatchApplication)
router.post('/application/approve',     adminMatchAppController.approveMatchApplication)
router.post('/application/reject',      adminMatchAppController.rejectMatchApplication)

// ── Match Management ──────────────────────────────────
const adminMatchController = require('../apis/admin/controllers/admin.matchController')
router.post('/match/add',          upload.single('banner'), adminMatchController.addMatch)
router.post('/match/fetchAll',     adminMatchController.fetchAllMatches)
router.post('/match/fetchSingle',  adminMatchController.fetchSingleMatch)
router.post('/match/update',       adminMatchController.updateMatch)
router.post('/match/delete',       adminMatchController.softDeleteMatch)
router.post('/match/complete',     adminMatchController.completeMatch)


//venue 
router.post('/venue/add',         upload.single('image'), venueController.addVenue)
router.post('/venue/fetchAll',    venueController.fetchAllVenues)
router.post('/venue/fetchSingle', venueController.fetchSingleVenue)
router.post('/venue/update',      upload.single('image'), venueController.updateVenue)
router.post('/venue/delete',      venueController.softDeleteVenue)


const adminReportController = require('../apis/admin/controllers/admin.reportController')
router.post('/report/bookings', adminReportController.fetchAllBookings)
router.post('/report/revenue',  adminReportController.viewRevenue)
router.post('/report/match',    adminReportController.viewMatchReport)
router.post('/report/payCoach', adminReportController.payCoach)

module.exports = router