import axios from "axios"
import { BASE_URL, AI_CHAT } from "../endPoints"

function getToken() {
    const token = localStorage.getItem("token")
    return {
        headers: {
            authorization: token
        }
    }
}

// send a message to the AI assistant
// works for both guests (no token) and logged-in users
export function sendAIMessage(prompt) {
    const token = localStorage.getItem("token")

    if (token) {
        // logged-in user — send token so AI knows who they are
        return axios.post(BASE_URL + AI_CHAT, { prompt }, getToken())
    } else {
        // guest — no token, AI will respond as guest
        return axios.post(BASE_URL + AI_CHAT, { prompt })
    }
}