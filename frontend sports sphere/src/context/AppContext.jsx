import { createContext, useContext, useState } from "react";
import {
  bookings as initialBookings,
  coaches as initialCoaches,
  matches as initialMatches,
  users as initialUsers,
} from "../data/mockData";

const AppContext = createContext();

export function AppProvider({ children }) {

  // AUTH STATE — sir's localStorage pattern
  const [currentUser, setCurrentUser] = useState(() => {
    try { const s = localStorage.getItem("user"); return s ? JSON.parse(s) : null } catch { return null }
  })
  const [role, setRole] = useState(() => {
    const t = localStorage.getItem("userType")
    if (t == 1) return "admin"
    if (t == 2) return "coach"
    if (t == 3) return "user"
    return null
  })
  const [token, setToken] = useState(() => localStorage.getItem("token") || null)

  // Mock data — used until backend is integrated
  const [bookings, setBookings] = useState(initialBookings)
  const [matches,  setMatches]  = useState(initialMatches)
  const [coaches,  setCoaches]  = useState(initialCoaches)
  const [users]                 = useState(initialUsers)

  // LOGIN — works for both mock and real backend
  const login = (userData, userRole, authToken) => {
    setCurrentUser(userData)
    setRole(userRole)
    localStorage.setItem("user",       JSON.stringify(userData))
    localStorage.setItem("email",      userData.email)
    localStorage.setItem("isLoggedIn", true)
    const map = { admin: 1, coach: 2, user: 3 }
    localStorage.setItem("userType", map[userRole] || 3)
    if (authToken) {
      setToken(authToken)
      localStorage.setItem("token", authToken)
    } else {
      setToken(null)
      localStorage.removeItem("token")
    }
  }

  const syncCurrentUser = (userData) => {
    setCurrentUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
    if (userData?.email) {
      localStorage.setItem("email", userData.email)
    }
  }

  // LOGOUT — sir's pattern
  const logout = () => {
    setCurrentUser(null); setRole(null); setToken(null)
    localStorage.clear()
  }

  const getAuthHeader = () => ({ headers: { authorization: localStorage.getItem("token") } })

  // Booking helpers
  const addBooking      = (b)   => setBookings(prev => [...prev, b])
  const cancelBooking   = (id)  => setBookings(prev => prev.map(b => b.id === id ? {...b, status:"Cancelled"} : b))
  const getUserBookings = (uid) => bookings.filter(b => b.userId === uid)
  const getTotalRevenue = ()    => bookings.filter(b=>b.status==="Confirmed").reduce((s,b)=>s+b.amount,0)

  // Coach helpers
  const approveCoach = (id) => setCoaches(prev => prev.map(c => c.id===id ? {...c,status:"Approved"} : c))
  const rejectCoach  = (id) => setCoaches(prev => prev.map(c => c.id===id ? {...c,status:"Rejected"} : c))

  // Match helpers
  const addMatch          = (m)        => setMatches(prev => [...prev, {...m, id: prev.length+1}])
  const updateMatchStatus = (id, stat) => setMatches(prev => prev.map(m => m.id===id ? {...m,status:stat} : m))

  return (
    <AppContext.Provider value={{
      currentUser, role, token, login, logout, syncCurrentUser, getAuthHeader,
      bookings, addBooking, cancelBooking, getUserBookings, getTotalRevenue,
      matches, addMatch, updateMatchStatus,
      coaches, approveCoach, rejectCoach,
      users,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
