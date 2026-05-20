import axios from "axios"
import {
  BASE_URL,
  USER_BOOKING_LOCKSEATS,
  USER_BOOKING_UNLOCKSEATS,
  USER_BOOKING_CREATEORDER,
  USER_BOOKING_VERIFYPAYMENT,
  USER_BOOKING_FETCHMY,
  USER_BOOKING_FETCHSINGLE,
  USER_BOOKING_CANCEL,
  USER_BOOKING_HISTORY,
} from "../endPoints"

function getToken() {
  const token = localStorage.getItem("token")
  return { headers: { authorization: token } }
}

export function lockSeats(data) {
  return axios.post(BASE_URL + USER_BOOKING_LOCKSEATS, data, getToken())
}

export function unlockSeats(data) {
  return axios.post(BASE_URL + USER_BOOKING_UNLOCKSEATS, data, getToken())
}

export function createOrder(data) {
  return axios.post(BASE_URL + USER_BOOKING_CREATEORDER, data, getToken())
}

export function verifyPayment(data) {
  return axios.post(BASE_URL + USER_BOOKING_VERIFYPAYMENT, data, getToken())
}

export function fetchMyBookings() {
  return axios.post(BASE_URL + USER_BOOKING_FETCHMY, {}, getToken())
}

export function fetchSingleBooking(data) {
  return axios.post(BASE_URL + USER_BOOKING_FETCHSINGLE, data, getToken())
}

export function cancelBooking(data) {
  return axios.post(BASE_URL + USER_BOOKING_CANCEL, data, getToken())
}

export function fetchBookingHistory() {
  return axios.post(BASE_URL + USER_BOOKING_HISTORY, {}, getToken())
}
