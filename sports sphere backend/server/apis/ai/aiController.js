const { GoogleGenAI } = require("@google/genai")
const matchModel = require("../match/matchModel")
const bookingModel = require("../booking/bookingModel")
const sportModel = require("../sports/sportModel")

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })


// ═══════════════════════════════════════════════════════
// HELPER — build a rich system prompt with live DB data
// ═══════════════════════════════════════════════════════
const buildContext = async (decoded) => {

    // fetch upcoming matches from DB
    const matches = await matchModel
        .find({ status: { $in: ["upcoming", "open_for_applications"] }, isDelete: false })
        .populate("sportId", "sportName")
        .populate("venueId", "venueName city")
        .limit(10)
        .lean()

    // fetch sports list
    const sports = await sportModel
        .find({ isActive: true, isDelete: false })
        .select("sportName")
        .lean()

    // if logged-in user, fetch their bookings
    let userBookings = []
    if (decoded && decoded._id) {
        userBookings = await bookingModel
            .find({ userId: decoded._id, bookingStatus: "confirmed", isDelete: false })
            .populate("matchId", "matchName matchDate status")
            .limit(5)
            .lean()
    }

    const matchList = matches.map(m =>
        `- "${m.matchName}" | Sport: ${m.sportId?.sportName || "N/A"} | City: ${m.venueId?.city || "N/A"} | Date: ${new Date(m.matchDate).toDateString()} | Available Seats: ${m.availableSeats} | Price: Rs.${m.ticketPrice} | ID: ${m._id}`
    ).join("\n") || "No upcoming matches right now."

    const bookingList = userBookings.map(b =>
        `- Match: ${b.matchId?.matchName || "N/A"} | Date: ${new Date(b.matchId?.matchDate).toDateString()} | Seats: ${b.seatsCount} | Status: ${b.bookingStatus}`
    ).join("\n") || "No confirmed bookings."

    const sportList = sports.map(s => s.sportName).join(", ") || "Various sports"

    const userInfo = decoded
        ? `Name: ${decoded.name}, Email: ${decoded.email}, Role: ${decoded.userType === 1 ? "Admin" : decoded.userType === 2 ? "Coach" : "User"}`
        : "Guest (not logged in)"

    return `
You are SportsSphere AI Assistant — a helpful, friendly assistant for a sports event booking platform called SportsSphere.

CURRENT USER:
${userInfo}

AVAILABLE SPORTS ON PLATFORM:
${sportList}

UPCOMING MATCHES (live data):
${matchList}

USER'S CONFIRMED BOOKINGS:
${bookingList}

YOUR JOB:
1. Help users find matches by sport, city, date, or price
2. Guide users through booking seats step by step
3. Help users understand how to cancel bookings and get refunds
4. For coaches: explain how to create profile, apply for matches, manage teams and players
5. For admins: explain how to manage matches, venues, sports, users
6. Answer any general question about the platform

BOOKING FLOW (explain this when asked):
Step 1 - Go to Matches page, click on a match
Step 2 - Choose number of seats (1-10), click Lock Seats For 4 Minutes
Step 3 - You have 4 minutes to pay via Razorpay
Step 4 - After payment your booking is confirmed and ticket appears in My Tickets

IMPORTANT RULES:
- Always reply in a helpful, concise, friendly tone
- Use Rs. for prices (Indian Rupees)
- If user is not logged in and wants to book, tell them to login first
- Never make up match data — only refer to the matches listed above
- Keep responses short and easy to read
    `.trim()
}


// ═══════════════════════════════════════════════════════
// MAIN — chat with context
// decoded is attached by tokenChecker if user is logged in
// route is PUBLIC so decoded may be undefined for guests
// ═══════════════════════════════════════════════════════
const chat = async (req, res) => {
    try {
        const incomingData = req.body || {}

        if (!incomingData.prompt) {
            return res.json({
                status: 400,
                success: false,
                message: "Prompt is required"
            })
        }

        // build context with live DB data
        const systemContext = await buildContext(req.decoded || null)

        // combine system context + user prompt exactly like sir's pattern
        const fullPrompt = `${systemContext}\n\nUSER ASKS: ${incomingData.prompt}`

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt
        })

        if (!response) {
            return res.json({
                status: 400,
                success: false,
                message: "AI Error"
            })
        }

        return res.json({
            status: 200,
            success: true,
            message: "Response generated",
            data: response.text
        })

    } catch (error) {
        res.json({
            status: 500,
            success: false,
            message: "Internal Error " + error.message
        })
    }
}

module.exports = { chat }