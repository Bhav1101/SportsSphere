import axios from "axios"
import {
  BASE_URL,
  COACH_PROFILE_GET, COACH_PROFILE_UPDATE,
  COACH_TEAM_CREATE, COACH_TEAM_FETCHMY, COACH_TEAM_UPDATE, COACH_TEAM_DELETE,
  COACH_PLAYER_ADD, COACH_PLAYER_FETCHMY, COACH_PLAYER_UPDATE,
  COACH_PLAYER_DELETE, COACH_PLAYER_BLOCK, COACH_PLAYER_UNBLOCK,
  COACH_MATCH_APPLY, COACH_MATCH_FETCHMY,
  COACH_APP_FETCHMY, COACH_APP_CANCEL
} from "../endPoints"

function getToken() {
  let token = localStorage.getItem('token')
  return { headers: { authorization: token } }
}

// ── Profile ───────────────────────────────────
export function getMyProfile()        { return axios.post(BASE_URL + COACH_PROFILE_GET,    {}, getToken()) }
export function updateProfile(data)   { return axios.post(BASE_URL + COACH_PROFILE_UPDATE, data, getToken()) }

// ── Team ──────────────────────────────────────
export function createTeam(data)      { return axios.post(BASE_URL + COACH_TEAM_CREATE,  data, getToken()) }
export function fetchMyTeams()        { return axios.post(BASE_URL + COACH_TEAM_FETCHMY, {}, getToken()) }
export function updateTeam(data)      { return axios.post(BASE_URL + COACH_TEAM_UPDATE,  data, getToken()) }
export function deleteTeam(data)      { return axios.post(BASE_URL + COACH_TEAM_DELETE,  data, getToken()) }

// ── Player ────────────────────────────────────
export function addPlayer(data)       { return axios.post(BASE_URL + COACH_PLAYER_ADD,     data, getToken()) }
export function fetchMyPlayers(data)  { return axios.post(BASE_URL + COACH_PLAYER_FETCHMY, data, getToken()) }
export function updatePlayer(data)    { return axios.post(BASE_URL + COACH_PLAYER_UPDATE,  data, getToken()) }
export function deletePlayer(data)    { return axios.post(BASE_URL + COACH_PLAYER_DELETE,  data, getToken()) }
export function blockPlayer(data)     { return axios.post(BASE_URL + COACH_PLAYER_BLOCK,   data, getToken()) }
export function unblockPlayer(data)   { return axios.post(BASE_URL + COACH_PLAYER_UNBLOCK, data, getToken()) }

// ── Match Applications ────────────────────────
export function applyForMatch(data)    { return axios.post(BASE_URL + COACH_MATCH_APPLY,   data, getToken()) }
export function fetchMyMatches()       { return axios.post(BASE_URL + COACH_MATCH_FETCHMY, {}, getToken()) }
export function fetchMyApplications()  { return axios.post(BASE_URL + COACH_APP_FETCHMY,   {}, getToken()) }
export function cancelApplication(data){ return axios.post(BASE_URL + COACH_APP_CANCEL,    data, getToken()) }
