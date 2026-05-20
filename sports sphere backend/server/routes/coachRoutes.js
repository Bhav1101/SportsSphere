const router          = require('express').Router()
const coachProfileController = require('../apis/coach/coachProfileController')
const userController         = require('../apis/user/userController')
const sportController = require('../apis/sports/sportController')
const teamController =require('../apis/team/teamController')
const playerController =require('../apis/players/playerController')
const matchAppController = require('../apis/matchApplication/matchApplicationController')
const tokenChecker    = require('../middleware/tokenChecker')
const { isCoach,  isApprovedCoach }    = require('../middleware/roleChecker')
const upload                 = require('../middleware/upload')


router.post('/register', upload.single('document'), coachProfileController.register)
router.post('/login',    userController.login)


// ── PRIVATE ─────────────────────────────────────
router.use(tokenChecker)
router.use(isCoach)




//get their profiles 

router.post('/profile/get',    coachProfileController.getMyProfile)
router.post('/profile/update', upload.single('document'),coachProfileController.updateProfile)

// Sport — coach views active sports to select which to coach
router.post('/sport/fetchAll',    isCoach, sportController.fetchAllActive)
router.post('/sport/fetchSingle', isCoach, sportController.fetchSingle)

//team
router.post('/team/create',  isApprovedCoach, upload.single('logo'), teamController.createTeam)
router.post('/team/fetchMy', isApprovedCoach, teamController.getMyTeams)
router.post('/team/update',  isApprovedCoach, upload.single('logo'), teamController.updateTeam)
router.post('/team/delete',  isApprovedCoach, teamController.deleteTeam)


// player
router.post('/player/add',     isApprovedCoach, upload.single('playerImg'), playerController.addPlayer)
router.post('/player/fetchMy', isApprovedCoach, playerController.getMyPlayers)
router.post('/player/update',  isApprovedCoach, upload.single('playerImg'), playerController.updatePlayer)
router.post('/player/delete',  isApprovedCoach, playerController.deletePlayer)
router.post('/player/block',   isApprovedCoach, playerController.blockPlayer)
router.post('/player/unblock', isApprovedCoach, playerController.unblockPlayer)


// ── Match Applications ────────────────────────
router.post('/match/apply',            isApprovedCoach, matchAppController.applyForMatch)
router.post('/match/myApplications',   isApprovedCoach, matchAppController.getMyApplications)
router.post('/match/myMatches',        isApprovedCoach, matchAppController.getMyMatches)
router.post('/match/cancelApplication',isApprovedCoach, matchAppController.cancelApplication)


module.exports = router