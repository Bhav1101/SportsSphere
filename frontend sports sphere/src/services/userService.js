import axios from "axios"
import {
  BASE_URL,
  USER_LOGIN, USER_REGISTER, USER_UPDATE,
  COACH_REGISTER, COACH_LOGIN
} from "../endPoints"

// ─────────────────────────────────────────────
// TOKEN HELPER — sir's pattern
// reads token from localStorage and puts it in headers
// ─────────────────────────────────────────────
function getToken() {
  let token = localStorage.getItem('token')
  return {
    headers: {
      authorization: token
    }
  }
}

// ── Normal User ───────────────────────────────
export function userRegister(data) {
  return axios.post(BASE_URL + USER_REGISTER, data)
}

export function userLogin(data) {
  return axios.post(BASE_URL + USER_LOGIN, data)
}

export function userUpdate(data) {
  // form-data for file upload (profileImage)
  return axios.post(BASE_URL + USER_UPDATE, data, getToken())
}

// ── Coach ─────────────────────────────────────
export function coachRegister(data) {
  // form-data for file upload (document)
  return axios.post(BASE_URL + COACH_REGISTER, data)
}

export function coachLogin(data) {
  return axios.post(BASE_URL + COACH_LOGIN, data)
}
