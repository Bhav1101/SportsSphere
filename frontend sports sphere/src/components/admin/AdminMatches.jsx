import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import {
  ADMIN_MATCH_ADD,
  ADMIN_MATCH_COMPLETE,
  ADMIN_MATCH_DELETE,
  ADMIN_MATCH_FETCHALL,
  ADMIN_MATCH_UPDATE,
  ADMIN_SPORT_FETCHALL,
  ADMIN_VENUE_FETCHALL,
  BASE_URL,
} from "../../endPoints"
import {
  ADMIN_NAV,
  ADMIN_PANEL_COLOR,
  confirmDanger,
  formatCurrency,
  formatDateTime,
  getAuthConfig,
  getStatusBadgeStyle,
  resolveList,
} from "./adminShared"

const MATCH_FILTERS = [
  "all",
  "open_for_applications",
  "teams_selected",
  "upcoming",
  "ongoing",
  "completed",
  "cancelled",
]

const defaultForm = {
  _id: "",
  sportId: "",
  venueId: "",
  matchName: "",
  matchDate: "",
  matchTime: "",
  ticketPrice: "",
  totalSeats: "",
  maxApplications: "",
  description: "",
  prizeWinner: "",
  prizeRunnerUp: "",
}

export default function AdminMatches() {
  const [matches, setMatches] = useState([])
  const [sports, setSports] = useState([])
  const [venues, setVenues] = useState([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      axios.post(BASE_URL + ADMIN_MATCH_FETCHALL, {}, getAuthConfig()),
      axios.post(BASE_URL + ADMIN_SPORT_FETCHALL, {}, getAuthConfig()),
      axios.post(BASE_URL + ADMIN_VENUE_FETCHALL, {}, getAuthConfig()),
    ])
      .then(([matchesRes, sportsRes, venuesRes]) => {
        setMatches(resolveList(matchesRes.data?.data, ["matches", "items", "rows"]))
        setSports(resolveList(sportsRes.data?.data, ["sports", "items", "rows"]))
        setVenues(resolveList(venuesRes.data?.data, ["venues", "items", "rows"]))
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load matches")
      })
      .finally(() => setLoading(false))
  }

  const openCreateModal = () => {
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEditModal = (match) => {
    setForm({
      _id: match._id,
      sportId: match.sportId?._id || "",
      venueId: match.venueId?._id || "",
      matchName: match.matchName || "",
      matchDate: match.matchDate ? new Date(match.matchDate).toISOString().slice(0, 10) : "",
      matchTime: match.matchTime || "",
      ticketPrice: match.ticketPrice || "",
      totalSeats: match.totalSeats || "",
      maxApplications: match.maxApplications || "",
      description: match.description || "",
      prizeWinner: match.prizePool?.winner || match.prizeWinner || "",
      prizeRunnerUp: match.prizePool?.runnerUp || match.prizeRunnerUp || "",
    })
    setShowModal(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSaving(true)

    const isEdit = Boolean(form._id)
    const endpoint = isEdit ? ADMIN_MATCH_UPDATE : ADMIN_MATCH_ADD
    const payload = isEdit
      ? {
          _id: form._id,
          matchName: form.matchName,
          matchDate: form.matchDate,
          matchTime: form.matchTime,
          ticketPrice: Number(form.ticketPrice),
          totalSeats: Number(form.totalSeats),
          description: form.description,
          maxApplications: Number(form.maxApplications),
        }
      : {
          sportId: form.sportId,
          venueId: form.venueId,
          matchName: form.matchName,
          matchDate: form.matchDate,
          matchTime: form.matchTime,
          ticketPrice: Number(form.ticketPrice),
          totalSeats: Number(form.totalSeats),
          maxApplications: Number(form.maxApplications),
          description: form.description,
          prizeWinner: Number(form.prizeWinner),
          prizeRunnerUp: Number(form.prizeRunnerUp),
        }

    axios
      .post(BASE_URL + endpoint, payload, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || `Match ${isEdit ? "updated" : "created"} successfully`)
        setShowModal(false)
        setForm(defaultForm)
        loadData()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || `Unable to ${isEdit ? "update" : "create"} match`)
      })
      .finally(() => setSaving(false))
  }

  const handleDelete = async (_id) => {
    const confirmed = await confirmDanger("Delete match?", "This removes the match from the schedule.", "Delete match")
    if (!confirmed) return

    axios
      .post(BASE_URL + ADMIN_MATCH_DELETE, { _id }, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || "Match deleted")
        loadData()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to delete match")
      })
  }

  const handleComplete = async (match) => {
    const result = window.prompt(`Enter winner for ${match.matchName}\nType "team1" or "team2"`, "team1")
    if (!result || !["team1", "team2"].includes(result.trim())) return

    axios
      .post(BASE_URL + ADMIN_MATCH_COMPLETE, { _id: match._id, result: result.trim() }, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || "Match marked as completed")
        loadData()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to complete match")
      })
  }

  const filteredMatches =
    filter === "all"
      ? matches
      : matches.filter((item) => String(item.status || "").toLowerCase() === filter)

  return (
    <DashboardLayout navItems={ADMIN_NAV} panelLabel="Admin Panel" panelColor={ADMIN_PANEL_COLOR} darkMode={true}>
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>Match Management</h5>
          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{matches.length} matches in the system</div>
        </div>
        <button className="btn-ss-primary" onClick={openCreateModal} style={{ fontSize: "0.82rem", padding: "8px 18px" }}>
          <i className="bi bi-plus-circle me-1" />
          Create Match
        </button>
      </div>

      <div className="ss-content fade-in">
        <div className="d-flex flex-wrap gap-2 mb-4">
          {MATCH_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={filter === item ? "btn-ss-primary" : "btn-ss-outline"}
              style={{ padding: "7px 14px", fontSize: "0.75rem", textTransform: "capitalize" }}
            >
              {item.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="match-card">
            <div style={{ color: "var(--ss-muted)", fontWeight: 600 }}>Loading matches...</div>
          </div>
        ) : (
          <div className="ss-table">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Sport</th>
                  <th>Venue</th>
                  <th>Schedule</th>
                  <th>Seats</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.length ? (
                  filteredMatches.map((match) => {
                    const statusStyle = getStatusBadgeStyle(match.status)
                    return (
                      <tr key={match._id}>
                        <td>
                          <div style={{ color: "var(--ss-heading)", fontWeight: 600, fontSize: "0.84rem" }}>{match.matchName}</div>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>
                            {match.team1Id?.teamName || "TBD"} vs {match.team2Id?.teamName || "TBD"}
                          </div>
                        </td>
                        <td style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{match.sportId?.sportName || "-"}</td>
                        <td>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{match.venueId?.venueName || "-"}</div>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{match.venueId?.city || "-"}</div>
                        </td>
                        <td style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{formatDateTime(match.matchDate, match.matchTime)}</td>
                        <td>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{match.availableSeats ?? match.totalSeats ?? 0} available</div>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>
                            Locked: {match.lockedSeats || 0} / Total: {match.totalSeats || 0}
                          </div>
                        </td>
                        <td style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.82rem" }}>{formatCurrency(match.ticketPrice)}</td>
                        <td>
                          <span
                            style={{
                              ...statusStyle,
                              borderRadius: 999,
                              padding: "3px 10px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                            }}
                          >
                            {match.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <button type="button" onClick={() => openEditModal(match)} className="btn-ss-outline" style={{ padding: "6px 10px", fontSize: "0.72rem" }}>
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleComplete(match)}
                              className="btn-ss-outline"
                              style={{ padding: "6px 10px", fontSize: "0.72rem", color: "#22c55e", borderColor: "#22c55e" }}
                              disabled={!match.team1Id || !match.team2Id}
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(match._id)}
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
                    <td colSpan="8" style={{ color: "#94a3b8", textAlign: "center", padding: "32px 18px" }}>
                      No matches found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: "rgba(2, 6, 23, 0.8)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content ss-form">
              <div className="modal-header">
                <h5 className="modal-title">{form._id ? "Edit Match" : "Create Match"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    {!form._id && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label">Sport</label>
                          <select className="form-select" value={form.sportId} onChange={(event) => setForm({ ...form, sportId: event.target.value })} required>
                            <option value="">Select sport</option>
                            {sports.map((sport) => (
                              <option key={sport._id} value={sport._id}>
                                {sport.sportName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Venue</label>
                          <select className="form-select" value={form.venueId} onChange={(event) => setForm({ ...form, venueId: event.target.value })} required>
                            <option value="">Select venue</option>
                            {venues.map((venue) => (
                              <option key={venue._id} value={venue._id}>
                                {venue.venueName} - {venue.city}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    <div className="col-md-6">
                      <label className="form-label">Match Name</label>
                      <input className="form-control" value={form.matchName} onChange={(event) => setForm({ ...form, matchName: event.target.value })} required />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Date</label>
                      <input type="date" className="form-control" value={form.matchDate} onChange={(event) => setForm({ ...form, matchDate: event.target.value })} required />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Time</label>
                      <input type="time" className="form-control" value={form.matchTime} onChange={(event) => setForm({ ...form, matchTime: event.target.value })} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Ticket Price</label>
                      <input type="number" className="form-control" value={form.ticketPrice} onChange={(event) => setForm({ ...form, ticketPrice: event.target.value })} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Total Seats</label>
                      <input type="number" className="form-control" value={form.totalSeats} onChange={(event) => setForm({ ...form, totalSeats: event.target.value })} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Max Applications</label>
                      <input type="number" className="form-control" value={form.maxApplications} onChange={(event) => setForm({ ...form, maxApplications: event.target.value })} required />
                    </div>
                    {!form._id && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label">Winner Prize</label>
                          <input type="number" className="form-control" value={form.prizeWinner} onChange={(event) => setForm({ ...form, prizeWinner: event.target.value })} required />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Runner-up Prize</label>
                          <input type="number" className="form-control" value={form.prizeRunnerUp} onChange={(event) => setForm({ ...form, prizeRunnerUp: event.target.value })} required />
                        </div>
                      </>
                    )}
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="1"
                        style={{ minHeight: "42px" }}
                        value={form.description}
                        onChange={(event) => setForm({ ...form, description: event.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-ss-outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-ss-primary" disabled={saving}>
                    {saving ? "Saving..." : form._id ? "Update Match" : "Create Match"}
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
