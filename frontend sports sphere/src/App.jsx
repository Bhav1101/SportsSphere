import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import "./App.css"
import "./sports.css"
import { ToastContainer } from "react-toastify"
import { AppProvider, useApp } from "./context/AppContext"
import MasterLayout from "./components/layout/Masterlayout"
import AIAssistant from "./components/ai/AIAssistant"   // ← NEW

import Home from "./components/pages/Home"
import Matches from "./components/pages/Matches"
import MatchDetails from "./components/pages/MatchDetails"
import Login from "./components/pages/Login"
import Register from "./components/pages/Register"

import UserDashboard from "./components/user/UserDashboard"
import UserTickets from "./components/user/UserTickets"
import UserBookings from "./components/user/UserBookings"
import UserProfile from "./components/user/UserProfile"
import UserMatches from "./components/user/UserMatches"

import CoachDashboard from "./components/coach/CoachDashboard"
import CoachProfile from "./components/coach/CoachProfile"
import CoachTeams from "./components/coach/CoachTeams"
import CoachPlayers from "./components/coach/CoachPlayers"
import CoachMatchApply from "./components/coach/CoachMatchApply"

import AdminDashboard from "./components/admin/AdminDashboard"
import AdminCoaches from "./components/admin/AdminCoaches"
import AdminMatches from "./components/admin/AdminMatches"
import AdminVenues from "./components/admin/AdminVenues"
import { AdminApplications, AdminBookings, AdminReports, AdminSports, AdminUsers } from "./components/admin/AdminPages"

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, role } = useApp()
  if (!currentUser) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MasterLayout />}>
        <Route index element={<Home />} />
        <Route path="matches" element={<Matches />} />
        <Route path="match/:id" element={<MatchDetails />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/user/dashboard"  element={<ProtectedRoute allowedRoles={["user"]}><UserDashboard /></ProtectedRoute>} />
      <Route path="/user/matches"    element={<ProtectedRoute allowedRoles={["user"]}><UserMatches /></ProtectedRoute>} />
      <Route path="/user/tickets"    element={<ProtectedRoute allowedRoles={["user"]}><UserTickets /></ProtectedRoute>} />
      <Route path="/user/bookings"   element={<ProtectedRoute allowedRoles={["user"]}><UserBookings /></ProtectedRoute>} />
      <Route path="/user/profile"    element={<ProtectedRoute allowedRoles={["user"]}><UserProfile /></ProtectedRoute>} />

      <Route path="/coach/dashboard"    element={<ProtectedRoute allowedRoles={["coach"]}><CoachDashboard /></ProtectedRoute>} />
      <Route path="/coach/teams"        element={<ProtectedRoute allowedRoles={["coach"]}><CoachTeams /></ProtectedRoute>} />
      <Route path="/coach/players"      element={<ProtectedRoute allowedRoles={["coach"]}><CoachPlayers /></ProtectedRoute>} />
      <Route path="/coach/matches"      element={<ProtectedRoute allowedRoles={["coach"]}><CoachMatchApply /></ProtectedRoute>} />
      <Route path="/coach/applications" element={<ProtectedRoute allowedRoles={["coach"]}><CoachMatchApply /></ProtectedRoute>} />
      <Route path="/coach/profile"      element={<ProtectedRoute allowedRoles={["coach"]}><CoachProfile /></ProtectedRoute>} />

      <Route path="/admin/dashboard"    element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/matches"      element={<ProtectedRoute allowedRoles={["admin"]}><AdminMatches /></ProtectedRoute>} />
      <Route path="/admin/venues"       element={<ProtectedRoute allowedRoles={["admin"]}><AdminVenues /></ProtectedRoute>} />
      <Route path="/admin/coaches"      element={<ProtectedRoute allowedRoles={["admin"]}><AdminCoaches /></ProtectedRoute>} />
      <Route path="/admin/users"        element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/sports"       element={<ProtectedRoute allowedRoles={["admin"]}><AdminSports /></ProtectedRoute>} />
      <Route path="/admin/bookings"     element={<ProtectedRoute allowedRoles={["admin"]}><AdminBookings /></ProtectedRoute>} />
      <Route path="/admin/applications" element={<ProtectedRoute allowedRoles={["admin"]}><AdminApplications /></ProtectedRoute>} />
      <Route path="/admin/reports"      element={<ProtectedRoute allowedRoles={["admin"]}><AdminReports /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <AIAssistant />   {/* ← NEW: floating AI widget on every page */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </AppProvider>
  )
}

export default App