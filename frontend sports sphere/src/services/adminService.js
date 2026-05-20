import axios from "axios"
import {
  BASE_URL,
  ADMIN_USER_FETCHALL, ADMIN_USER_FETCHSINGLE, ADMIN_USER_BLOCK,
  ADMIN_USER_UNBLOCK, ADMIN_USER_DELETE,
  ADMIN_COACH_FETCHALL, ADMIN_COACH_FETCHSINGLE, ADMIN_COACH_BLOCK,
  ADMIN_COACH_UNBLOCK, ADMIN_COACH_DELETE,
  ADMIN_PROFILE_FETCHALL, ADMIN_PROFILE_FETCHSINGLE,
  ADMIN_PROFILE_APPROVE, ADMIN_PROFILE_REJECT,
  ADMIN_APP_FETCHALL, ADMIN_APP_FETCHSINGLE,
  ADMIN_APP_APPROVE, ADMIN_APP_REJECT,
  ADMIN_REPORT_BOOKINGS, ADMIN_REPORT_REVENUE,
  ADMIN_REPORT_MATCH, ADMIN_REPORT_PAYCOACH
} from "../endPoints"

function getToken() {
  let token = localStorage.getItem('token')
  return { headers: { authorization: token } }
}

// ── User Management ───────────────────────────
export function fetchAllUsers()        { return axios.post(BASE_URL + ADMIN_USER_FETCHALL,    {}, getToken()) }
export function fetchSingleUser(data)  { return axios.post(BASE_URL + ADMIN_USER_FETCHSINGLE, data, getToken()) }
export function blockUser(data)        { return axios.post(BASE_URL + ADMIN_USER_BLOCK,        data, getToken()) }
export function unblockUser(data)      { return axios.post(BASE_URL + ADMIN_USER_UNBLOCK,      data, getToken()) }
export function deleteUser(data)       { return axios.post(BASE_URL + ADMIN_USER_DELETE,       data, getToken()) }

// ── Coach Management ──────────────────────────
export function fetchAllCoaches()       { return axios.post(BASE_URL + ADMIN_COACH_FETCHALL,    {}, getToken()) }
export function fetchSingleCoach(data)  { return axios.post(BASE_URL + ADMIN_COACH_FETCHSINGLE, data, getToken()) }
export function blockCoach(data)        { return axios.post(BASE_URL + ADMIN_COACH_BLOCK,        data, getToken()) }
export function unblockCoach(data)      { return axios.post(BASE_URL + ADMIN_COACH_UNBLOCK,      data, getToken()) }
export function deleteCoach(data)       { return axios.post(BASE_URL + ADMIN_COACH_DELETE,       data, getToken()) }

// ── Coach Profile Management ──────────────────
export function fetchAllProfiles()        { return axios.post(BASE_URL + ADMIN_PROFILE_FETCHALL,    {}, getToken()) }
export function fetchSingleProfile(data)  { return axios.post(BASE_URL + ADMIN_PROFILE_FETCHSINGLE, data, getToken()) }
export function approveProfile(data)      { return axios.post(BASE_URL + ADMIN_PROFILE_APPROVE,     data, getToken()) }
export function rejectProfile(data)       { return axios.post(BASE_URL + ADMIN_PROFILE_REJECT,      data, getToken()) }

// ── Match Application Management ─────────────
export function fetchAllApplications()       { return axios.post(BASE_URL + ADMIN_APP_FETCHALL,    {}, getToken()) }
export function fetchSingleApplication(data) { return axios.post(BASE_URL + ADMIN_APP_FETCHSINGLE, data, getToken()) }
export function approveApplication(data)     { return axios.post(BASE_URL + ADMIN_APP_APPROVE,     data, getToken()) }
export function rejectApplication(data)      { return axios.post(BASE_URL + ADMIN_APP_REJECT,      data, getToken()) }

// ── Reports ───────────────────────────────────
export function fetchAllBookingsReport()  { return axios.post(BASE_URL + ADMIN_REPORT_BOOKINGS, {}, getToken()) }
export function fetchRevenueReport()      { return axios.post(BASE_URL + ADMIN_REPORT_REVENUE,  {}, getToken()) }
export function fetchMatchReport(data)    { return axios.post(BASE_URL + ADMIN_REPORT_MATCH,    data, getToken()) }
export function payCoach(data)            { return axios.post(BASE_URL + ADMIN_REPORT_PAYCOACH, data, getToken()) }
