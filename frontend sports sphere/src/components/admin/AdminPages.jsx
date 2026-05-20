import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import {
  ADMIN_APP_APPROVE,
  ADMIN_APP_FETCHALL,
  ADMIN_APP_REJECT,
  ADMIN_MATCH_FETCHALL,
  ADMIN_PROFILE_FETCHALL,
  ADMIN_REPORT_BOOKINGS,
  ADMIN_REPORT_PAYCOACH,
  ADMIN_REPORT_REVENUE,
  ADMIN_SPORT_ADD,
  ADMIN_SPORT_DELETE,
  ADMIN_SPORT_FETCHALL,
  ADMIN_SPORT_UPDATE,
  ADMIN_USER_BLOCK,
  ADMIN_USER_DELETE,
  ADMIN_USER_FETCHALL,
  ADMIN_USER_UNBLOCK,
  BASE_URL,
} from "../../endPoints"
import {
  ADMIN_NAV,
  ADMIN_PANEL_COLOR,
  confirmDanger,
  createFormData,
  formatCurrency,
  formatDate,
  getAuthConfig,
  getCoachBadgeMeta,
  getMediaUrl,
  getStatusBadgeStyle,
  promptAmount,
  promptRemarks,
  resolveList,
  resolveObject,
  sortApplicationsByBadge,
} from "./adminShared"

const defaultSportForm = {
  _id: "",
  sportName: "",
  description: "",
  maxPlayersPerTeam: "",
  matchDuration: "",
  status: "active",
  rules: null,
}

export function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    setLoading(true)
    axios
      .post(BASE_URL + ADMIN_USER_FETCHALL, {}, getAuthConfig())
      .then((response) => {
        setUsers(resolveList(response.data?.data, ["users", "items", "rows"]))
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load users")
      })
      .finally(() => setLoading(false))
  }

  const handleBlockToggle = (user) => {
    const endpoint = user.isBlock ? ADMIN_USER_UNBLOCK : ADMIN_USER_BLOCK
    axios
      .post(BASE_URL + endpoint, { _id: user._id }, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || `User ${user.isBlock ? "unblocked" : "blocked"} successfully`)
        loadUsers()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to update user status")
      })
  }

  const handleDelete = async (_id) => {
    const confirmed = await confirmDanger("Delete user?", "This user will be removed from admin management.", "Delete user")
    if (!confirmed) return

    axios
      .post(BASE_URL + ADMIN_USER_DELETE, { _id }, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || "User deleted")
        loadUsers()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to delete user")
      })
  }

  return (
    <DashboardLayout navItems={ADMIN_NAV} panelLabel="Admin Panel" panelColor={ADMIN_PANEL_COLOR} darkMode={true}>
      <div className="ss-topbar">
        <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>User Management</h5>
      </div>
      <div className="ss-content fade-in">
        {loading ? (
          <div className="match-card">
            <div style={{ color: "var(--ss-muted)", fontWeight: 600 }}>Loading users...</div>
          </div>
        ) : (
          <div className="ss-table">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length ? (
                  users.map((user) => {
                    const status = user.isDelete ? "deleted" : user.isBlock ? "blocked" : "active"
                    return (
                      <tr key={user._id}>
                        <td>
                          <div style={{ color: "var(--ss-heading)", fontWeight: 600, fontSize: "0.84rem" }}>{user.name}</div>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{user.email}</div>
                        </td>
                        <td style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{user.contact || "-"}</td>
                        <td style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>
                          {user.userType === 1 ? "Admin" : user.userType === 2 ? "Coach" : "User"}
                        </td>
                        <td style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{formatDate(user.createdAt)}</td>
                        <td>
                          <span
                            style={{
                              ...getStatusBadgeStyle(status),
                              borderRadius: 999,
                              padding: "3px 10px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                            }}
                          >
                            {status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleBlockToggle(user)}
                              className="btn-ss-outline"
                              style={{ padding: "6px 10px", fontSize: "0.72rem", color: user.isBlock ? "#22c55e" : "#f97316", borderColor: user.isBlock ? "#22c55e" : "#f97316" }}
                            >
                              {user.isBlock ? "Unblock" : "Block"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(user._id)}
                              className="btn-ss-outline"
                              style={{ padding: "6px 10px", fontSize: "0.72rem", color: "#ef4444", borderColor: "#ef4444" }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ color: "#94a3b8", textAlign: "center", padding: "30px 18px" }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export function AdminSports() {
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultSportForm)

  useEffect(() => {
    loadSports()
  }, [])

  const loadSports = () => {
    setLoading(true)
    axios
      .post(BASE_URL + ADMIN_SPORT_FETCHALL, {}, getAuthConfig())
      .then((response) => {
        setSports(resolveList(response.data?.data, ["sports", "items", "rows"]))
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load sports")
      })
      .finally(() => setLoading(false))
  }

  const openCreateModal = () => {
    setForm(defaultSportForm)
    setShowModal(true)
  }

  const openEditModal = (sport) => {
    setForm({
      _id: sport._id,
      sportName: sport.sportName || "",
      description: sport.description || "",
      maxPlayersPerTeam: sport.maxPlayersPerTeam || "",
      matchDuration: sport.matchDuration || "",
      status: sport.status || "active",
      rules: null,
    })
    setShowModal(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSaving(true)

    const endpoint = form._id ? ADMIN_SPORT_UPDATE : ADMIN_SPORT_ADD
    const payload = createFormData({
      _id: form._id,
      sportName: form.sportName,
      description: form.description,
      maxPlayersPerTeam: form.maxPlayersPerTeam,
      matchDuration: form.matchDuration,
      status: form._id ? form.status : undefined,
      rules: form.rules,
    })

    axios
      .post(BASE_URL + endpoint, payload, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || `Sport ${form._id ? "updated" : "created"} successfully`)
        setShowModal(false)
        setForm(defaultSportForm)
        loadSports()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || `Unable to ${form._id ? "update" : "create"} sport`)
      })
      .finally(() => setSaving(false))
  }

  const handleDelete = async (_id) => {
    const confirmed = await confirmDanger("Delete sport?", "This sport will be removed from the admin catalog.", "Delete sport")
    if (!confirmed) return

    axios
      .post(BASE_URL + ADMIN_SPORT_DELETE, { _id }, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || "Sport deleted")
        loadSports()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to delete sport")
      })
  }

  return (
    <DashboardLayout navItems={ADMIN_NAV} panelLabel="Admin Panel" panelColor={ADMIN_PANEL_COLOR} darkMode={true}>
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>Sports Management</h5>
          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{sports.length} sports managed</div>
        </div>
        <button className="btn-ss-primary" onClick={openCreateModal} style={{ fontSize: "0.82rem", padding: "8px 18px" }}>
          <i className="bi bi-plus-circle me-1" />
          Add Sport
        </button>
      </div>
      <div className="ss-content fade-in">
        {loading ? (
          <div className="match-card">
            <div style={{ color: "var(--ss-muted)", fontWeight: 600 }}>Loading sports...</div>
          </div>
        ) : (
          <div className="row g-4">
            {sports.length ? (
              sports.map((sport) => (
                <div className="col-lg-4 col-md-6" key={sport._id}>
                    <div className="match-card h-100 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                      <div>
                        <h6 className="sport-card-heading">{sport.sportName}</h6>
                        <div className="sport-card-subheading">{sport.maxPlayersPerTeam || 0} players per team</div>
                      </div>
                      <span
                        style={{
                          ...getStatusBadgeStyle(sport.status),
                          borderRadius: 999,
                          padding: "3px 10px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                        }}
                      >
                        {sport.status || "active"}
                      </span>
                    </div>

                    <p className="sport-card-desc">{sport.description || "No description provided."}</p>

                    <div className="mb-3">
                      <div className="sport-card-meta-label">Match Duration</div>
                      <div className="sport-card-meta-value">{sport.matchDuration || "-"} minutes</div>
                    </div>
                    <div className="mb-3">
                      <div className="sport-card-meta-label">Teams using this sport</div>
                      <div className="sport-card-meta-value">{sport.totalTeams || 0}</div>
                    </div>

                    <div className="mt-auto d-flex justify-content-between align-items-center flex-wrap gap-2">
                      {sport.rules ? (
                        <a href={getMediaUrl(sport.rules)} target="_blank" rel="noreferrer" style={{ color: "#60a5fa", fontSize: "0.78rem" }}>
                          <i className="bi bi-file-earmark-pdf me-1" />
                          View Rules
                        </a>
                        ) : (
                        <span className="sport-card-subheading">No rules file</span>
                      )}
                      <div className="d-flex gap-2">
                        <button className="btn-ss-outline" style={{ padding: "6px 10px", fontSize: "0.72rem" }} onClick={() => openEditModal(sport)}>
                          Edit
                        </button>
                        <button className="btn-ss-outline" style={{ padding: "6px 10px", fontSize: "0.72rem", color: "#ef4444", borderColor: "#ef4444" }} onClick={() => handleDelete(sport._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
                ) : (
              <div className="col-12">
                  <div className="match-card">
                  <div className="sport-empty">No sports available yet.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: "rgba(2, 6, 23, 0.8)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content ss-form">
              <div className="modal-header">
                <h5 className="modal-title">{form._id ? "Edit Sport" : "Add Sport"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Sport Name</label>
                      <input className="form-control" value={form.sportName} onChange={(event) => setForm({ ...form, sportName: event.target.value })} required />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Max Players</label>
                      <input type="number" className="form-control" value={form.maxPlayersPerTeam} onChange={(event) => setForm({ ...form, maxPlayersPerTeam: event.target.value })} required />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Match Duration</label>
                      <input type="number" className="form-control" value={form.matchDuration} onChange={(event) => setForm({ ...form, matchDuration: event.target.value })} required />
                    </div>
                    {form._id && (
                      <div className="col-md-4">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    )}
                    <div className="col-md-8">
                      <label className="form-label">Rules PDF</label>
                      <input type="file" className="form-control" accept=".pdf" onChange={(event) => setForm({ ...form, rules: event.target.files?.[0] || null })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-ss-outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-ss-primary" disabled={saving}>
                    {saving ? "Saving..." : form._id ? "Update Sport" : "Create Sport"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = () => {
    setLoading(true)
    axios
      .post(BASE_URL + ADMIN_REPORT_BOOKINGS, {}, getAuthConfig())
      .then((response) => {
        setBookings(resolveList(response.data?.data, ["bookings", "items", "rows"]))
        setSummary(resolveObject(response.data?.data))
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load bookings")
      })
      .finally(() => setLoading(false))
  }

  const confirmedRevenue =
    Number(summary.totalRevenue || 0) ||
    bookings
      .filter((item) => String(item.paymentStatus || "").toLowerCase() === "paid")
      .reduce((total, item) => total + Number(item.totalAmount || 0), 0)

  const confirmedCount = bookings.filter((item) => String(item.bookingStatus || "").toLowerCase() === "confirmed").length
  const cancelledCount = bookings.filter((item) => String(item.bookingStatus || "").toLowerCase() === "cancelled").length

  return (
    <DashboardLayout navItems={ADMIN_NAV} panelLabel="Admin Panel" panelColor={ADMIN_PANEL_COLOR} darkMode={true}>
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>Bookings</h5>
          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>Revenue summary and booking audit trail</div>
        </div>
      </div>
      <div className="ss-content fade-in">
        {loading ? (
          <div className="match-card">
            <div style={{ color: "var(--ss-muted)", fontWeight: 600 }}>Loading bookings...</div>
          </div>
        ) : (
          <>
            <div className="row g-3 mb-4">
              {[
                { label: "Total Bookings", value: bookings.length, color: "#3b82f6", icon: "bi-ticket-perforated" },
                { label: "Confirmed", value: confirmedCount, color: "#22c55e", icon: "bi-check-circle" },
                { label: "Cancelled", value: cancelledCount, color: "#ef4444", icon: "bi-x-circle" },
                { label: "Revenue", value: formatCurrency(confirmedRevenue), color: "#00c851", icon: "bi-cash-stack" },
              ].map((item) => (
                <div className="col-6 col-lg-3" key={item.label}>
                  <div className="stat-card">
                    <div className="stat-icon mb-2" style={{ background: `${item.color}20` }}>
                      <i className={item.icon} style={{ color: item.color }} />
                    </div>
                    <div className="stat-value" style={{ fontSize: item.label === "Revenue" ? "1.5rem" : "1.9rem" }}>{item.value}</div>
                    <div className="stat-label">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ss-table">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>User</th>
                    <th>Match</th>
                    <th>Seats</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Booked On</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length ? (
                    bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td>
                          <div style={{ color: "var(--ss-heading)", fontWeight: 600, fontSize: "0.82rem" }}>{booking.transactionId || booking._id}</div>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{booking.razorpayOrderId || booking.lockId || "-"}</div>
                        </td>
                        <td>
                          <div style={{ color: "var(--ss-heading)", fontSize: "0.82rem" }}>{booking.userId?.name || "-"}</div>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{booking.userId?.email || "-"}</div>
                        </td>
                        <td>
                          <div style={{ color: "var(--ss-heading)", fontSize: "0.82rem" }}>{booking.matchId?.matchName || "-"}</div>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{booking.matchId?.city || "-"}</div>
                        </td>
                        <td style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{booking.seatsCount || 0}</td>
                        <td style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.82rem" }}>{formatCurrency(booking.totalAmount)}</td>
                        <td>
                          <span
                            style={{
                              ...getStatusBadgeStyle(booking.paymentStatus),
                              borderRadius: 999,
                              padding: "3px 10px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                            }}
                          >
                            {booking.paymentStatus || "-"}
                          </span>
                        </td>
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
                        <td style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{formatDate(booking.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ color: "var(--ss-muted)", textAlign: "center", padding: "30px 18px" }}>
                        No bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export function AdminApplications() {
  const [applications, setApplications] = useState([])
  const [matches, setMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplications("")
    loadMatches()
  }, [])

  const loadMatches = () => {
    axios
      .post(BASE_URL + ADMIN_MATCH_FETCHALL, {}, getAuthConfig())
      .then((response) => {
        setMatches(resolveList(response.data?.data, ["matches", "items", "rows"]))
      })
      .catch(() => {})
  }

  const loadApplications = (matchId = "") => {
    setLoading(true)
    axios
      .post(BASE_URL + ADMIN_APP_FETCHALL, matchId ? { matchId } : {}, getAuthConfig())
      .then((response) => {
        const rows = resolveList(response.data?.data, ["applications", "items", "rows"])
        setApplications(sortApplicationsByBadge(rows))
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load applications")
      })
      .finally(() => setLoading(false))
  }

  const handleApprove = (_id) => {
    axios
      .post(BASE_URL + ADMIN_APP_APPROVE, { _id }, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || "Application approved")
        loadApplications(selectedMatchId)
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to approve application")
      })
  }

  const handleReject = async (_id) => {
    const adminRemarks = await promptRemarks("Reject Match Application", "Reject")
    if (!adminRemarks) return

    axios
      .post(BASE_URL + ADMIN_APP_REJECT, { _id, adminRemarks }, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || "Application rejected")
        loadApplications(selectedMatchId)
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to reject application")
      })
  }

  return (
    <DashboardLayout navItems={ADMIN_NAV} panelLabel="Admin Panel" panelColor={ADMIN_PANEL_COLOR} darkMode={true}>
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>Match Applications</h5>
          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>Sorted by coach badge strength</div>
        </div>
        <div style={{ minWidth: 260 }}>
          <select
            className="form-select"
            value={selectedMatchId}
            onChange={(event) => {
              setSelectedMatchId(event.target.value)
              loadApplications(event.target.value)
            }}
          >
            <option value="">All matches</option>
            {matches.map((match) => (
              <option key={match._id} value={match._id}>
                {match.matchName}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="ss-content fade-in">
        {loading ? (
          <div className="match-card">
            <div style={{ color: "var(--ss-muted)", fontWeight: 600 }}>Loading applications...</div>
          </div>
        ) : (
          <div className="ss-table">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Coach</th>
                  <th>Team</th>
                  <th>Match</th>
                  <th>Squad</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.length ? (
                  applications.map((application) => {
                    const badge = getCoachBadgeMeta(application.coachBadge)
                    return (
                      <tr key={application._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span style={{ color: "var(--ss-heading)", fontWeight: 600, fontSize: "0.82rem" }}>{application.coachId?.name || "-"}</span>
                            <span
                              style={{
                                background: `${badge.color}20`,
                                color: badge.color,
                                border: `1px solid ${badge.color}40`,
                                borderRadius: 999,
                                padding: "2px 9px",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                              }}
                            >
                              <i className={`${badge.icon} me-1`} />
                              {badge.label}
                            </span>
                          </div>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{application.coachId?.email || "-"}</div>
                        </td>
                        <td>
                          <div style={{ color: "var(--ss-heading)", fontSize: "0.82rem" }}>{application.teamId?.teamName || "-"}</div>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{application.sportId?.sportName || "-"}</div>
                        </td>
                        <td>
                          <div style={{ color: "var(--ss-heading)", fontSize: "0.82rem" }}>{application.matchId?.matchName || "-"}</div>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{formatDate(application.matchId?.matchDate)}</div>
                        </td>
                        <td style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{application.squad?.length || 0} players</td>
                        <td>
                          <span
                            style={{
                              ...getStatusBadgeStyle(application.status),
                              borderRadius: 999,
                              padding: "3px 10px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                            }}
                          >
                            {application.status}
                          </span>
                        </td>
                        <td style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{formatDate(application.createdAt)}</td>
                        <td>
                          {String(application.status || "").toLowerCase() === "pending" ? (
                            <div className="d-flex gap-2 flex-wrap">
                              <button className="btn-ss-outline" style={{ padding: "6px 10px", fontSize: "0.72rem", color: "#f97316", borderColor: "#f97316" }} onClick={() => handleReject(application._id)}>
                                Reject
                              </button>
                              <button className="btn-ss-primary" style={{ padding: "6px 10px", fontSize: "0.72rem" }} onClick={() => handleApprove(application._id)}>
                                Approve
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "var(--ss-muted)", fontSize: "0.76rem" }}>{application.adminRemarks || "Processed"}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ color: "var(--ss-muted)", textAlign: "center", padding: "30px 18px" }}>
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export function AdminReports() {
  const [revenueRows, setRevenueRows] = useState([])
  const [paymentRows, setPaymentRows] = useState([])
  const [bookings, setBookings] = useState([])
  const [profiles, setProfiles] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = () => {
    setLoading(true)
    const safe = (p) => p.catch(() => ({ data: { data: [] } }))
    Promise.all([
      safe(axios.post(BASE_URL + ADMIN_REPORT_REVENUE, {}, getAuthConfig())),
      safe(axios.post(BASE_URL + ADMIN_REPORT_BOOKINGS, {}, getAuthConfig())),
      safe(axios.post(BASE_URL + ADMIN_PROFILE_FETCHALL, {}, getAuthConfig())),
    ])
      .then(([revenueRes, bookingsRes, profilesRes]) => {
        const revenuePayload = revenueRes.data?.data
        const bookingPayload = bookingsRes.data?.data

        setRevenueRows(resolveList(revenuePayload, ["sportRevenue", "revenueBySport", "sports", "rows"]))
        setPaymentRows(resolveList(revenuePayload, ["paymentBreakdown", "paymentMethods", "paymentModes", "paymentModeBreakdown"]))
        setBookings(resolveList(bookingPayload, ["bookings", "items", "rows"]))
        setProfiles(resolveList(profilesRes.data?.data, ["profiles", "coachProfiles", "items", "rows"]))
        setSummary({ ...resolveObject(revenuePayload), ...resolveObject(bookingPayload) })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const totalRevenue =
    Number(summary.totalRevenue || summary.revenue || 0) ||
    bookings
      .filter((item) => String(item.paymentStatus || "").toLowerCase() === "paid")
      .reduce((total, item) => total + Number(item.totalAmount || 0), 0)

  const confirmedBookings = bookings.filter((item) => String(item.bookingStatus || "").toLowerCase() === "confirmed").length
  const refundedAmount = bookings.reduce((total, item) => total + Number(item.refundAmount || 0), 0)

  const computedPaymentRows = paymentRows.length
    ? paymentRows
    : Object.entries(
        bookings.reduce((accumulator, item) => {
          const key = item.paymentMethod || item.paymentStatus || "pending"
          accumulator[key] = {
            label: key,
            count: (accumulator[key]?.count || 0) + 1,
            amount: (accumulator[key]?.amount || 0) + Number(item.totalAmount || 0),
          }
          return accumulator
        }, {}),
      ).map(([, value]) => value)

  const handlePayCoach = async (profile) => {
    const amount = await promptAmount(profile.earnings?.pending || 0)
    if (!amount) return

    axios
      .post(BASE_URL + ADMIN_REPORT_PAYCOACH, { _id: profile._id, amount }, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || "Coach payment recorded")
        loadReports()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to record coach payment")
      })
  }

  return (
    <DashboardLayout navItems={ADMIN_NAV} panelLabel="Admin Panel" panelColor={ADMIN_PANEL_COLOR} darkMode={true}>
      <div className="ss-topbar">
        <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>Reports</h5>
      </div>
      <div className="ss-content fade-in">
        {loading ? (
          <div className="match-card">
            <div style={{ color: "var(--ss-muted)", fontWeight: 600 }}>Loading reports...</div>
          </div>
        ) : (
          <>
            <div className="row g-3 mb-4">
              {[
                { label: "Total Revenue", value: formatCurrency(totalRevenue), color: "#00c851", icon: "bi-cash-stack" },
                { label: "Confirmed Bookings", value: confirmedBookings, color: "#3b82f6", icon: "bi-ticket-perforated" },
                { label: "Refunded", value: formatCurrency(refundedAmount), color: "#ef4444", icon: "bi-arrow-counterclockwise" },
                { label: "Coach Profiles", value: profiles.length, color: "#f97316", icon: "bi-person-badge" },
              ].map((item) => (
                <div className="col-6 col-lg-3" key={item.label}>
                  <div className="stat-card">
                    <div className="stat-icon mb-2" style={{ background: `${item.color}20` }}>
                      <i className={item.icon} style={{ color: item.color }} />
                    </div>
                    <div className="stat-value" style={{ fontSize: item.label === "Total Revenue" ? "1.45rem" : "1.9rem" }}>{item.value}</div>
                    <div className="stat-label">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row g-4">
              <div className="col-lg-6">
                <div className="ss-section-title" style={{ color: "var(--ss-heading)" }}>Revenue by Sport</div>
                <div className="match-card">
                  {revenueRows.length ? (
                    revenueRows.map((item, index) => {
                      const amount = Number(item.revenue || item.totalRevenue || item.amount || 0)
                      const label = item.sportName || item.name || item.sport?.sportName || `Sport ${index + 1}`
                      const width = totalRevenue > 0 ? Math.max(8, (amount / totalRevenue) * 100) : 0
                      return (
                        <div key={`${label}-${index}`} className="mb-4">
                          <div className="d-flex justify-content-between mb-1">
                            <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.82rem" }}>{label}</span>
                            <span style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.82rem" }}>{formatCurrency(amount)}</span>
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
                    <div style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>No revenue split returned by the backend yet.</div>
                  )}
                </div>
              </div>

              <div className="col-lg-6">
                <div className="ss-section-title" style={{ color: "var(--ss-heading)" }}>Payment Breakdown</div>
                <div className="match-card">
                  {computedPaymentRows.length ? (
                    computedPaymentRows.map((item, index) => (
                      <div key={`${item.label || item.method || index}`} className="d-flex justify-content-between align-items-center mb-3 pb-3" style={{ borderBottom: "1px solid rgba(148,163,184,0.14)" }}>
                        <div>
                          <div style={{ color: "var(--ss-heading)", fontWeight: 600, fontSize: "0.82rem" }}>{item.label || item.method || item.name || "-"}</div>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{item.count || item.totalCount || 0} transactions</div>
                        </div>
                        <div style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.82rem" }}>{formatCurrency(item.amount || item.totalAmount || item.revenue)}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>Payment mode data is not available yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="ss-section-title mt-4" style={{ color: "var(--ss-heading)" }}>Coach Earnings</div>
            <div className="ss-table">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Coach</th>
                    <th>Performance</th>
                    <th>Total Earnings</th>
                    <th>Pending</th>
                    <th>Paid</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.length ? (
                    profiles.map((profile) => {
                      const badge = getCoachBadgeMeta(profile.badge)
                      return (
                        <tr key={profile._id}>
                          <td>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span style={{ color: "var(--ss-heading)", fontWeight: 600, fontSize: "0.82rem" }}>{profile.userId?.name || "-"}</span>
                              <span
                                style={{
                                  background: `${badge.color}20`,
                                  color: badge.color,
                                  border: `1px solid ${badge.color}40`,
                                  borderRadius: 999,
                                  padding: "2px 9px",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                }}
                              >
                                <i className={`${badge.icon} me-1`} />
                                {badge.label}
                              </span>
                            </div>
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{profile.organisationName || "-"}</div>
                          </td>
                          <td style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>
                            {profile.matchesWon || 0} wins / {profile.matchesPlayed || 0} played
                          </td>
                          <td style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.82rem" }}>{formatCurrency(profile.earnings?.total)}</td>
                          <td style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.82rem" }}>{formatCurrency(profile.earnings?.pending)}</td>
                          <td style={{ color: "#60a5fa", fontWeight: 700, fontSize: "0.82rem" }}>{formatCurrency(profile.earnings?.paid)}</td>
                          <td>
                            <button
                              className="btn-ss-primary"
                              style={{ padding: "6px 10px", fontSize: "0.72rem" }}
                              onClick={() => handlePayCoach(profile)}
                              disabled={!Number(profile.earnings?.pending || 0)}
                            >
                              Pay
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ color: "var(--ss-muted)", textAlign: "center", padding: "30px 18px" }}>
                        No coach earnings data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
