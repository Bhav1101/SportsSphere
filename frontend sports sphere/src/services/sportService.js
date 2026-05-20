import axios from "axios"
import {
  BASE_URL,
  ADMIN_SPORT_ADD, ADMIN_SPORT_FETCHALL, ADMIN_SPORT_FETCHSINGLE,
  ADMIN_SPORT_UPDATE, ADMIN_SPORT_DELETE,
  PUBLIC_SPORT_FETCHALL, PUBLIC_SPORT_FETCHSINGLE
} from "../endPoints"

function getToken() {
  let token = localStorage.getItem('token')
  return { headers: { authorization: token } }
}

// ── Admin Sport Functions ─────────────────────
export function addSport(data) {
  // form-data for file upload (rules PDF)
  return axios.post(BASE_URL + ADMIN_SPORT_ADD, data, getToken())
}

export function fetchAllSports() {
  return axios.post(BASE_URL + ADMIN_SPORT_FETCHALL, {}, getToken())
}

export function fetchSingleSport(data) {
  return axios.post(BASE_URL + ADMIN_SPORT_FETCHSINGLE, data, getToken())
}

export function updateSport(data) {
  return axios.post(BASE_URL + ADMIN_SPORT_UPDATE, data, getToken())
}

export function deleteSport(data) {
  return axios.post(BASE_URL + ADMIN_SPORT_DELETE, data, getToken())
}

// ── Public Sport Functions ────────────────────
export function publicFetchAllSports() {
  return axios.post(BASE_URL + PUBLIC_SPORT_FETCHALL, {})
}

export function publicFetchSingleSport(data) {
  return axios.post(BASE_URL + PUBLIC_SPORT_FETCHSINGLE, data)
}
