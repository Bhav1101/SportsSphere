import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import {
  ADMIN_APP_FETCHALL,
  ADMIN_COACH_FETCHALL,
  ADMIN_MATCH_FETCHALL,
  ADMIN_PROFILE_FETCHALL,
  ADMIN_REPORT_BOOKINGS,
  ADMIN_REPORT_REVENUE,
  ADMIN_SPORT_FETCHALL,
  ADMIN_USER_FETCHALL,
  BASE_URL,
} from "../../endPoints"
import {
  ADMIN_NAV,
  ADMIN_PANEL_COLOR,
  formatCurrency,
  formatDate,
  getAuthConfig,
  getStatusBadgeStyle,
  resolveList,
  resolveObject,
} from "./adminShared"

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [coaches, setCoaches] = useState([])
  const [sports, setSports] = useState([])
  const [matches, setMatches] = useState([])
  const [applications, setApplications] = useState([])
  const [bookings, setBookings] = useState([])
  const [revenueRows, setRevenueRows] = useState([])
  const [revenueSummary, setRevenueSummary] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = () => {
    setLoading(true)
    const safe = (p) => p.catch(() => ({ data: { data: [] } }))

    Promise.all([
      safe(axios.post(BASE_URL + ADMIN_USER_FETCHALL, {}, getAuthConfig())),
      safe(axios.post(BASE_URL + ADMIN_COACH_FETCHALL, {}, getAuthConfig())),
      safe(axios.post(BASE_URL + ADMIN_SPORT_FETCHALL, {}, getAuthConfig())),
      safe(axios.post(BASE_URL + ADMIN_MATCH_FETCHALL, {}, getAuthConfig())),
      safe(axios.post(BASE_URL + ADMIN_PROFILE_FETCHALL, {}, getAuthConfig())),
      safe(axios.post(BASE_URL + ADMIN_APP_FETCHALL, {}, getAuthConfig())),
      safe(axios.post(BASE_URL + ADMIN_REPORT_BOOKINGS, {}, getAuthConfig())),
      safe(axios.post(BASE_URL + ADMIN_REPORT_REVENUE, {}, getAuthConfig())),
    ])
      .then(
        ([
          usersRes,
          coachesRes,
          sportsRes,
          matchesRes,
          profilesRes,
          applicationsRes,
          bookingsRes,
          revenueRes,
        ]) => {
          setUsers(resolveList(usersRes.data?.data, ["users", "items", "rows"]))
          setCoaches(resolveList(coachesRes.data?.data, ["coaches", "items", "rows"]))
          setSports(resolveList(sportsRes.data?.data, ["sports", "items", "rows"]))
          setMatches(resolveList(matchesRes.data?.data, ["matches", "items", "rows"]))

          const profileRows = resolveList(profilesRes.data?.data, ["profiles", "coachProfiles", "items", "rows"])
          setApplications(resolveList(applicationsRes.data?.data, ["applications", "items", "rows"]))

          const bookingPayload = bookingsRes.data?.data
          const revenuePayload = revenueRes.data?.data

          setBookings(resolveList(bookingPayload, ["recentBookings", "bookings", "items", "rows"]))
          setRevenueRows(resolveList(revenuePayload, ["sportRevenue", "revenueBySport", "sports", "rows"]))
          setRevenueSummary(resolveObject(revenuePayload))

          if (!resolveList(profilesRes.data?.data).length && profileRows.length) {
            setApplications((current) => current)
          }

          setCoaches((currentCoaches) => {
            if (currentCoaches.length) return currentCoaches
            return profileRows.map((item) => item.userId).filter(Boolean)
          })
        },
      )
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const pendingApprovals = applications.filter((item) => String(item.status || "").toLowerCase() === "pending").length
  const upcomingMatches = matches.filter((item) => String(item.status || "").toLowerCase() === "upcoming").length
  const totalRevenue =
    Number(revenueSummary.totalRevenue || revenueSummary.revenue || 0) ||
    bookings
      .filter((item) => String(item.paymentStatus || "").toLowerCase() === "paid")
      .reduce((total, item) => total + Number(item.totalAmount || 0), 0)

  const recentBookings = [...bookings]
    .sort((first, second) => new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime())
    .slice(0, 6)

  const stats = [
    { label: "Users", value: users.length, sub: "registered accounts", icon: "bi-people", color: "#3b82f6" },
    { label: "Coaches", value: coaches.length, sub: "coach accounts", icon: "bi-person-badge", color: "#f97316" },
    { label: "Sports", value: sports.length, sub: "managed sports", icon: "bi-trophy", color: "#22c55e" },
    { label: "Matches", value: matches.length, sub: `${upcomingMatches} upcoming`, icon: "bi-calendar3", color: "#8b5cf6" },
    { label: "Applications", value: applications.length, sub: `${pendingApprovals} pending`, icon: "bi-send", color: "#f59e0b" },
    { label: "Revenue", value: formatCurrency(totalRevenue), sub: "ticket revenue", icon: "bi-cash-stack", color: "#00c851" },
  ]

  return (
    <DashboardLayout navItems={ADMIN_NAV} panelLabel="Admin Panel" panelColor={ADMIN_PANEL_COLOR} darkMode={true}>
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>Admin Dashboard</h5>
          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>Live operations summary for SportsSphere</div>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/matches" className="btn-ss-primary" style={{ fontSize: "0.82rem", padding: "8px 18px" }}>
            <i className="bi bi-plus-circle me-1" />
            Create Match
          </Link>
        </div>
      </div>

      <div className="ss-content fade-in">
        {loading ? (
          <div className="match-card">
            <div style={{ color: "var(--ss-muted)", fontSize: "0.95rem", fontWeight: 600 }}>Loading dashboard...</div>
          </div>
        ) : (
          <>
            <div className="row g-3 mb-4">
              {stats.map((item) => (
                <div className="col-6 col-lg-4 col-xl-2" key={item.label}>
                  <div className="stat-card">
                    <div className="stat-icon mb-2" style={{ background: `${item.color}1f` }}>
                      <i className={item.icon} style={{ color: item.color }} />
                    </div>
                    <div className="stat-value" style={{ fontSize: item.label === "Revenue" ? "1.45rem" : "1.8rem" }}>
                      {item.value}
                    </div>
                    <div className="stat-label">{item.label}</div>
                    <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem", marginTop: 4 }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {pendingApprovals > 0 && (
              <div
                className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4 p-3"
                style={{
                  background: "rgba(249,115,22,0.12)",
                  border: "1px solid rgba(251,146,60,0.28)",
                  borderRadius: 14,
                }}
              >
                <div>
                  <div style={{ color: "#fdba74", fontWeight: 700, fontSize: "0.9rem" }}>
                    <i className="bi bi-exclamation-circle me-2" />
                    {pendingApprovals} applications need review
                  </div>
                  <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem", marginTop: 4 }}>
                    Match approvals are waiting on admin action before the tournament flow can move forward.
                  </div>
                </div>
                <Link to="/admin/applications" className="btn-ss-primary" style={{ whiteSpace: "nowrap" }}>
                  Review Applications
                </Link>
              </div>
            )}

            <div className="row g-4">
              <div className="col-lg-8">
                <div className="ss-section-title">Recent Bookings</div>
                <div className="ss-table">
                  <table className="table mb-0">
                    <thead>
                      <tr>
                        <th>Match</th>
                        <th>User</th>
                        <th>Seats</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Booked On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.length ? (
                        recentBookings.map((booking) => {
                          const paymentStyle = getStatusBadgeStyle(booking.paymentStatus || booking.bookingStatus)
                          return (
                            <tr key={booking._id}>
                              <td>
                                <div style={{ color: "var(--ss-heading)", fontWeight: 600, fontSize: "0.84rem" }}>
                                  {booking.matchId?.matchName || "Match"}
                                </div>
                                <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>
                                  {booking.matchId?.city || "-"}
                                </div>
                              </td>
                              <td>
                                <div style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{booking.userId?.name || "-"}</div>
                                <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{booking.userId?.email || "-"}</div>
                              </td>
                              <td style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{booking.seatsCount || 0}</td>
                              <td style={{ color: "#4ade80", fontWeight: 700 }}>{formatCurrency(booking.totalAmount)}</td>
                              <td>
                                <span
                                  style={{
                                    ...paymentStyle,
                                    borderRadius: 999,
                                    padding: "3px 10px",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {booking.paymentStatus || booking.bookingStatus || "-"}
                                </span>
                              </td>
                              <td style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{formatDate(booking.createdAt)}</td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ color: "var(--ss-muted)", textAlign: "center", padding: "32px 18px" }}>
                            No booking data available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="ss-section-title">Revenue by Sport</div>
                <div className="match-card">
                  {revenueRows.length ? (
                    revenueRows.map((item, index) => {
                      const amount = Number(item.revenue || item.totalRevenue || item.amount || 0)
                      const label = item.sportName || item.name || item.sport?.sportName || `Sport ${index + 1}`
                      const width = totalRevenue > 0 ? Math.max(10, (amount / totalRevenue) * 100) : 0

                      return (
                        <div key={`${label}-${index}`} className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{label}</span>
                            <span style={{ color: "var(--ss-heading)", fontWeight: 700, fontSize: "0.82rem" }}>
                              {formatCurrency(amount)}
                            </span>
                          </div>
                          <div style={{ height: 8, background: "rgba(148,163,184,0.18)", borderRadius: 999, overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${width}%`,
                                background: ["#00c851", "#3b82f6", "#f97316", "#8b5cf6", "#22c55e"][index % 5],
                                borderRadius: 999,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>Revenue data will appear here when bookings start flowing.</div>
                  )}
                </div>

                <div className="ss-section-title mt-4">Match Health</div>
                <div className="match-card">
                  {["open_for_applications", "teams_selected", "upcoming", "ongoing", "completed", "cancelled"].map((status) => {
                    const count = matches.filter((item) => String(item.status || "").toLowerCase() === status).length
                    const style = getStatusBadgeStyle(status)
                    return (
                      <div key={status} className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{ color: "var(--ss-muted)", fontSize: "0.82rem", textTransform: "capitalize" }}>
                          {status.replace(/_/g, " ")}
                        </span>
                        <span
                          style={{
                            ...style,
                            borderRadius: 999,
                            padding: "3px 10px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
