const router = require ('express').Router()
const userController= require('../apis/user/userController')
const sportController=require('../apis/sports/sportController')
const matchController = require('../apis/match/matchController')
const tokenChecker =require('../middleware/tokenChecker')
const bookingController = require('../apis/booking/bookingController')    
const aiController      = require('../apis/ai/aiController')    
const {isUser} = require('../middleware/roleChecker')
const upload = require('../middleware/upload')

router.get('/',(req,res)=>{
    res.send("Sports Management API is running")
})



//public
router.post('/register',userController.register)
router.post('/login',userController.login)

//sport-user view active sports only

router.post('/sport/fetchAll',sportController.fetchAllActive)
router.post('/sport/fetchSingle',sportController.fetchSingle)
//matches
router.post('/match/fetchAll',    matchController.fetchAllUpcoming)
router.post('/match/fetchSingle', matchController.fetchSingleMatch)

// AI chatbot route
router.post('/ai/chat', aiController.chat)

//private
router.use(tokenChecker)
//user management
router.post('/update',isUser,upload.single('profileImage'),userController.update)
router.post('/booking/lockSeats',  isUser, bookingController.lockSeats)
router.post('/booking/unlockSeats',isUser, bookingController.unlockSeats)

// payment
router.post('/booking/createOrder',    isUser, bookingController.createOrder)
router.post('/booking/verifyPayment',  isUser, bookingController.verifyPayment)

// booking management
router.post('/booking/fetchMyBookings',isUser, bookingController.fetchMyBookings)
router.post('/booking/fetchSingle',    isUser, bookingController.fetchSingleBooking)
router.post('/booking/cancel',         isUser, bookingController.cancelBooking)
router.post('/booking/history',        isUser, bookingController.bookingHistory)












router.all(/(.*)/, (req, res) => {
    res.json({
        status:  404,
        success: false,
        message: "Invalid address"
    })
})

module.exports = router;