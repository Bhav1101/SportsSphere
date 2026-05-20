import axios from "axios"
import {
  BASE_URL,
  ADMIN_MATCH_ADD, ADMIN_MATCH_FETCHALL, ADMIN_MATCH_FETCHSINGLE,
  ADMIN_MATCH_UPDATE, ADMIN_MATCH_DELETE, ADMIN_MATCH_COMPLETE,
  ADMIN_MATCH_AVAILABILITY,
  PUBLIC_MATCH_FETCHALL, PUBLIC_MATCH_FETCHSINGLE
} from "../endPoints"

function getToken() {
  let token = localStorage.getItem('token')
  return { headers: { authorization: token } }
}

// ── Admin Match Functions ─────────────────────
export function addMatch(data) {
  return axios.post(BASE_URL + ADMIN_MATCH_ADD, data, getToken())
}

export function fetchAllMatches() {
  return axios.post(BASE_URL + ADMIN_MATCH_FETCHALL, {}, getToken())
}

export function fetchSingleMatch(data) {
  return axios.post(BASE_URL + ADMIN_MATCH_FETCHSINGLE, data, getToken())
}

export function updateMatch(data) {
  return axios.post(BASE_URL + ADMIN_MATCH_UPDATE, data, getToken())
}

export function deleteMatch(data) {
  return axios.post(BASE_URL + ADMIN_MATCH_DELETE, data, getToken())
}

export function completeMatch(data) {
  return axios.post(BASE_URL + ADMIN_MATCH_COMPLETE, data, getToken())
}

export function manageAvailability(data) {
  return axios.post(BASE_URL + ADMIN_MATCH_AVAILABILITY, data, getToken())
}

// ── Public Match Functions ────────────────────
export function publicFetchAllMatches() {
  return axios.post(BASE_URL + PUBLIC_MATCH_FETCHALL, {})
}

export function publicFetchSingleMatch(data) {
  return axios.post(BASE_URL + PUBLIC_MATCH_FETCHSINGLE, data)
}
