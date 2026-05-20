const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://sportssphere-1.onrender.com"

export const BASE_URL = `${API_BASE_URL.replace(/\/$/, "")}/`

// Auth
export const USER_REGISTER = "api/user/register"
export const USER_LOGIN = "api/user/login"
export const USER_UPDATE = "api/user/update"
export const COACH_REGISTER = "api/coach/register"
export const COACH_LOGIN = "api/coach/login"

export const AI_CHAT = "api/user/ai/chat"

// Admin - User
export const ADMIN_USER_FETCHALL = "api/admin/user/fetchAll"
export const ADMIN_USER_FETCHSINGLE = "api/admin/user/fetchSingle"
export const ADMIN_USER_BLOCK = "api/admin/user/block"
export const ADMIN_USER_UNBLOCK = "api/admin/user/unblock"
export const ADMIN_USER_DELETE = "api/admin/user/delete"

// Admin - Coach
export const ADMIN_COACH_FETCHALL = "api/admin/coach/fetchAll"
export const ADMIN_COACH_FETCHSINGLE = "api/admin/coach/fetchSingle"
export const ADMIN_COACH_BLOCK = "api/admin/coach/block"
export const ADMIN_COACH_UNBLOCK = "api/admin/coach/unblock"
export const ADMIN_COACH_DELETE = "api/admin/coach/delete"
export const ADMIN_COACH_FETCHWITHTEAMS = "api/admin/coach/fetchWithTeams"

// Admin - Coach Profile
export const ADMIN_PROFILE_FETCHALL = "api/admin/coachProfile/fetchAll"
export const ADMIN_PROFILE_FETCHSINGLE = "api/admin/coachProfile/fetchSingle"
export const ADMIN_PROFILE_APPROVE = "api/admin/coachProfile/approve"
export const ADMIN_PROFILE_REJECT = "api/admin/coachProfile/reject"

// Admin - Sport
export const ADMIN_SPORT_ADD = "api/admin/sport/add"
export const ADMIN_SPORT_FETCHALL = "api/admin/sport/fetchAll"
export const ADMIN_SPORT_FETCHSINGLE = "api/admin/sport/fetchSingle"
export const ADMIN_SPORT_UPDATE = "api/admin/sport/update"
export const ADMIN_SPORT_DELETE = "api/admin/sport/delete"

// Admin - Venue
export const ADMIN_VENUE_ADD = "api/admin/venue/add"
export const ADMIN_VENUE_FETCHALL = "api/admin/venue/fetchAll"
export const ADMIN_VENUE_FETCHSINGLE = "api/admin/venue/fetchSingle"
export const ADMIN_VENUE_UPDATE = "api/admin/venue/update"
export const ADMIN_VENUE_DELETE = "api/admin/venue/delete"

// Admin - Match
export const ADMIN_MATCH_ADD = "api/admin/match/add"
export const ADMIN_MATCH_FETCHALL = "api/admin/match/fetchAll"
export const ADMIN_MATCH_FETCHSINGLE = "api/admin/match/fetchSingle"
export const ADMIN_MATCH_UPDATE = "api/admin/match/update"
export const ADMIN_MATCH_DELETE = "api/admin/match/delete"
export const ADMIN_MATCH_COMPLETE = "api/admin/match/complete"
export const ADMIN_MATCH_AVAILABILITY = "api/admin/match/availability"

// Admin - Applications
export const ADMIN_APP_FETCHALL = "api/admin/application/fetchAll"
export const ADMIN_APP_FETCHSINGLE = "api/admin/application/fetchSingle"
export const ADMIN_APP_APPROVE = "api/admin/application/approve"
export const ADMIN_APP_REJECT = "api/admin/application/reject"

// Admin - Reports
export const ADMIN_REPORT_BOOKINGS = "api/admin/report/bookings"
export const ADMIN_REPORT_REVENUE = "api/admin/report/revenue"
export const ADMIN_REPORT_MATCH = "api/admin/report/match"
export const ADMIN_REPORT_PAYCOACH = "api/admin/report/payCoach"

// Coach - Profile
export const COACH_PROFILE_GET = "api/coach/profile/get"
export const COACH_PROFILE_UPDATE = "api/coach/profile/update"

// Coach - Teams
export const COACH_TEAM_CREATE = "api/coach/team/create"
export const COACH_TEAM_FETCHMY = "api/coach/team/fetchMy"
export const COACH_TEAM_UPDATE = "api/coach/team/update"
export const COACH_TEAM_DELETE = "api/coach/team/delete"

// Coach - Players
export const COACH_PLAYER_ADD = "api/coach/player/add"
export const COACH_PLAYER_FETCHMY = "api/coach/player/fetchMy"
export const COACH_PLAYER_UPDATE = "api/coach/player/update"
export const COACH_PLAYER_DELETE = "api/coach/player/delete"
export const COACH_PLAYER_BLOCK = "api/coach/player/block"
export const COACH_PLAYER_UNBLOCK = "api/coach/player/unblock"

// Coach - Match Applications
export const COACH_MATCH_APPLY = "api/coach/match/apply"
export const COACH_MATCH_FETCHMY = "api/coach/match/myMatches"
export const COACH_APP_FETCHMY = "api/coach/match/myApplications"
export const COACH_APP_CANCEL = "api/coach/match/cancelApplication"

// Public
export const PUBLIC_SPORT_FETCHALL = "api/user/sport/fetchAll"
export const PUBLIC_SPORT_FETCHSINGLE = "api/user/sport/fetchSingle"
export const PUBLIC_MATCH_FETCHALL = "api/user/match/fetchAll"
export const PUBLIC_MATCH_FETCHSINGLE = "api/user/match/fetchSingle"

// User - Bookings
export const USER_BOOKING_LOCKSEATS = "api/user/booking/lockSeats"
export const USER_BOOKING_UNLOCKSEATS = "api/user/booking/unlockSeats"
export const USER_BOOKING_CREATEORDER = "api/user/booking/createOrder"
export const USER_BOOKING_VERIFYPAYMENT = "api/user/booking/verifyPayment"
export const USER_BOOKING_FETCHMY = "api/user/booking/fetchMyBookings"
export const USER_BOOKING_FETCHSINGLE = "api/user/booking/fetchSingle"
export const USER_BOOKING_CANCEL = "api/user/booking/cancel"
export const USER_BOOKING_HISTORY = "api/user/booking/history"
