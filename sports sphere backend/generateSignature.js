require('dotenv').config()
const crypto = require('crypto')

const orderId   = 'paste_order_id_here'
const paymentId = 'paste_payment_id_here'

const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

console.log("Signature:", signature)