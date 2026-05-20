import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import { useApp } from "../../context/AppContext"
import { publicFetchAllMatches } from "../../services/matchService"
import { fetchBookingHistory, fetchMyBookings } from "../../services/bookingService"
import { USER_NAV } from "./userShared"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusBadgeStyle,
  resolveList,
} from "../../utils/appHelpers"

export default function UserDashboard() {
  const { currentUser } = useApp()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [history, setHistory] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const safe = (p) => p.catch(() => ({ data: { data: [] } }))
    Promise.all([safe(fetchMyBookings()), safe(fetchBookingHistory()), safe(publicFetchAllMatches())])
      .then(([bookingsRes, historyRes, matchesRes]) => {
        setBookings(resolveList(bookingsRes.data?.data, ["bookings", "items", "rows"]))
        setHistory(resolveList(historyRes.data?.data, ["bookings", "items", "rows"]))
        setMatches(resolveList(matchesRes.data?.data, ["matches", "items", "rows"]))
      })
      .finally(() => setLoading(false))
  }, [])

  const allBookings = history.length ? history : bookings
  const confirmedBookings = allBookings.filter((item) => String(item.bookingStatus || "").toLowerCase() === "confirmed")
  const upcomingBookings = confirmedBookings.filter((item) => new Date(item.matchId?.matchDate || item.createdAt || 0).getTime() >= Date.now())
  const totalSpent = confirmedBookings.reduce((total, item) => total + Number(item.totalAmount || 0), 0)
  const recentBookings = [...allBookings]
    .sort((first, second) => new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime())
    .slice(0, 5)
  const suggestedMatches = matches
    .filter((item) => String(item.status || "").toLowerCase() === "upcoming")
    .slice(0, 3)

  const stats = [
    { label: "Upcoming Bookings", value: upcomingBookings.length, icon: "bi-calendar-check", color: "#3b82f6" },
    { label: "History Count", value: allBookings.length, icon: "bi-clock-history", color: "#f97316" },
    { label: "Confirmed Tickets", value: confirmedBookings.length, icon: "bi-ticket-perforated", color: "#22c55e" },
    { label: "Total Spent", value: formatCurrency(totalSpent), icon: "bi-cash-stack", color: "#8b5cf6" },
  ]

  return (
    <DashboardLayout navItems={USER_NAV} panelLabel="User Panel" panelColor="#3b82f6" darkMode={true}>
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>
            Welcome back, {currentUser?.name?.split(" ")?.[0] || "Fan"}
          </h5>
          <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>Track your live bookings, history, and next match day.</div>
        </div>
        <button type="button" onClick={() => navigate("/user/matches")} className="btn-ss-primary" style={{ fontSize: "0.82rem", padding: "8px 18px" }}>
          <i className="bi bi-search me-1" />
          Browse Matches
        </button>
      </div>

      <div className="ss-content fade-in">
        {loading ? (
          <div className="match-card">
            <div style={{ color: "#e2e8f0", fontWeight: 600 }}>Loading your dashboard...</div>
          </div>
        ) : (
          <>
            <div className="row g-3 mb-4">
              {stats.map((stat) => (
                <div className="col-6 col-lg-3" key={stat.label}>
                  <div className="stat-card">
                    <div className="stat-icon mb-2" style={{ background: `${stat.color}22` }}>
                      <i className={stat.icon} style={{ color: stat.color }} />
                    </div>
                    <div className="stat-value" style={{ fontSize: stat.label === "Total Spent" ? "1.45rem" : "1.9rem" }}>{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row g-4">
              <div className="col-lg-8">
                <div className="ss-section-title">Latest Bookings</div>
                <div className="ss-table">
                  <table className="table mb-0">
                    <thead>
                      <tr>
                        <th>Match</th>
                        <th>Schedule</th>
                        <th>Seats</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.length ? (
                        recentBookings.map((booking) => (
                          <tr key={booking._id}>
                            <td>
                              <div style={{ color: "#f8fafc", fontWeight: 600, fontSize: "0.84rem" }}>{booking.matchId?.matchName || "-"}</div>
                              <div style={{ color: "#94a3b8", fontSize: "0.72rem" }}>{booking.matchId?.city || "-"}</div>
                            </td>
                            <td style={{ color: "#cbd5e1", fontSize: "0.78rem" }}>
                              {formatDateTime(booking.matchId?.matchDate, booking.matchId?.matchTime)}
                            </td>
                            <td style={{ color: "#cbd5e1", fontSize: "0.82rem" }}>{booking.seatsCount || 0}</td>
                            <td style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.82rem" }}>{formatCurrency(booking.totalAmount)}</td>
                            <td>
                              <span
                                style={{
                                  ...getStatusBadgeStyle(booking.bookingStatus),
                                  borderRadius: 999,
                                  padding: "3px 10px",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                }}
                              >
                                {booking.bookingStatus || "-"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ color: "#94a3b8", textAlign: "center", padding: "30px 18px" }}>
                            No bookings yet. Your next ticket is waiting.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="ss-section-title">Upcoming Matches</div>
                <div className="d-flex flex-column gap-3">
                  {suggestedMatches.length ? (
                    suggestedMatches.map((match) => (
                      <div key={match._id} className="match-card" style={{ padding: 18 }}>
                        <div className="d-flex justify-content-between align-items-start gap-3">
                          <div>
                            <div style={{ color: "var(--ss-heading)", fontFamily: "Oswald, sans-serif", fontSize: "1.02rem", lineHeight: 1.15 }}>{match.matchName}</div>
                            <div style={{ color: "#111827", fontSize: "0.82rem", marginTop: 5 }}>
                              {match.team1Id?.teamName || "TBD"} vs {match.team2Id?.teamName || "TBD"}
                            </div>
                            <div style={{ color: "#111827", fontSize: "0.78rem", marginTop: 6 }}>
                              {formatDate(match.matchDate)} • {match.venueId?.city || "-"}
                            </div>
                          </div>
                          <div className="text-end">
                            <div style={{ color: "#16a34a", fontWeight: 700, fontSize: "0.92rem" }}>{formatCurrency(match.ticketPrice)}</div>
                            <Link to={`/match/${match._id}`} style={{ color: "#2563eb", fontSize: "0.8rem", fontWeight: 600 }}>View →</Link>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="match-card">
                      <div style={{ color: "#111827", fontSize: "0.84rem" }}>No upcoming matches available right now.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
