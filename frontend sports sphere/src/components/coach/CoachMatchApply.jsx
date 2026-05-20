import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import {
  applyForMatch,
  cancelApplication,
  fetchMyApplications,
  fetchMyPlayers,
  fetchMyTeams,
  getMyProfile,
} from "../../services/coachService"
import { publicFetchAllMatches } from "../../services/matchService"
import { COACH_NAV, canCoachManage } from "./coachShared"
import { confirmDanger, formatDate, formatDateTime, getCoachBadgeMeta, getStatusBadgeStyle } from "../admin/adminShared"
import { resolveList, resolveObject } from "../../utils/appHelpers"

const defaultForm = {
  matchId: "",
  teamId: "",
  squad: [],
  message: "",
}

export default function CoachMatchApply() {
  const location = useLocation()
  const applicationsMode = location.pathname === "/coach/applications"
  const [profile, setProfile] = useState(null)
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [applications, setApplications] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [selectedMatch, setSelectedMatch] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (form.teamId) {
      fetchMyPlayers({ teamId: form.teamId })
        .then((response) => {
          setPlayers(resolveList(response.data?.data, ["players", "items", "rows"]))
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || "Unable to load squad players")
        })
    } else {
      setPlayers([])
    }
  }, [form.teamId])

  const loadData = () => {
    setLoading(true)
    Promise.all([getMyProfile(), fetchMyTeams(), publicFetchAllMatches(), fetchMyApplications()])
      .then(([profileRes, teamsRes, matchesRes, appsRes]) => {
        setProfile(resolveObject(profileRes.data?.data?.profile || profileRes.data?.data))
        setTeams(resolveList(teamsRes.data?.data, ["teams", "items", "rows"]))
        setMatches(resolveList(matchesRes.data?.data, ["matches", "items", "rows"]))
        setApplications(resolveList(appsRes.data?.data, ["applications", "items", "rows"]))
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load coach match workspace")
      })
      .finally(() => setLoading(false))
  }

  const approved = canCoachManage(profile)
  const badge = getCoachBadgeMeta(profile?.badge)
  const openMatches = matches.filter((item) => String(item.status || "").toLowerCase() === "open_for_applications")

  const openApplyModal = (match) => {
    const firstTeam = teams[0]
    setSelectedMatch(match)
    setForm({
      matchId: match._id,
      teamId: firstTeam?._id || "",
      squad: [],
      message: "",
    })
    setShowModal(true)
  }

  const togglePlayer = (playerId) => {
    setForm((current) => ({
      ...current,
      squad: current.squad.includes(playerId)
        ? current.squad.filter((item) => item !== playerId)
        : [...current.squad, playerId],
    }))
  }

  const handleApply = (event) => {
    event.preventDefault()
    setSaving(true)
    applyForMatch({
      matchId: form.matchId,
      teamId: form.teamId,
      squad: form.squad,
      message: form.message,
    })
      .then((response) => {
        toast.success(response.data?.message || "Application submitted")
        setShowModal(false)
        setForm(defaultForm)
        setSelectedMatch(null)
        loadData()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to apply for match")
      })
      .finally(() => setSaving(false))
  }

  const handleCancelApplication = async (_id) => {
    const confirmed = await confirmDanger("Cancel application?", "This pending match application will be withdrawn.", "Cancel application")
    if (!confirmed) return

    cancelApplication({ _id })
      .then((response) => {
        toast.success(response.data?.message || "Application cancelled")
        loadData()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to cancel application")
      })
  }

  const alreadyAppliedMatchIds = applications.map((item) => item.matchId?._id || item.matchId)

  return (
    <DashboardLayout navItems={COACH_NAV} panelLabel="Coach Panel" panelColor="#f97316">
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>{applicationsMode ? "My Applications" : "Apply For Matches"}</h5>
          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>
            {applicationsMode ? "Review submitted applications and cancel pending ones." : "Browse open fixtures and submit your squad."}
          </div>
        </div>
      </div>

      <div className="ss-content fade-in">
        {!approved ? (
          <div
            style={{
              background: "rgba(249,115,22,0.08)",
              border: "1px solid rgba(249,115,22,0.22)",
              borderRadius: 14,
              padding: 16,
              marginBottom: 24,
              color: "#f97316",
              fontSize: "0.84rem",
            }}
          >
            <i className={`${badge.icon} me-2`} />
            Your profile is {profile?.status || "pending"}. Match applications unlock only after admin approval.
          </div>
        ) : null}

        {loading ? (
          <div className="match-card">Loading match applications...</div>
        ) : applicationsMode ? (
          <div className="ss-table">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Team</th>
                  <th>Squad</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.length ? (
                  applications.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <div style={{ color: "var(--ss-heading)", fontWeight: 600, fontSize: "0.84rem" }}>{app.matchId?.matchName || "-"}</div>
                        <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{formatDateTime(app.matchId?.matchDate, app.matchId?.matchTime)}</div>
                      </td>
                      <td style={{ color: "var(--ss-heading)", fontSize: "0.82rem" }}>{app.teamId?.teamName || "-"}</td>
                      <td style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{app.squad?.length || 0} players</td>
                      <td>
                        <span
                          style={{
                            ...getStatusBadgeStyle(app.status),
                            borderRadius: 999,
                            padding: "3px 10px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                          }}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{formatDate(app.createdAt)}</td>
                      <td>
                        {String(app.status || "").toLowerCase() === "pending" ? (
                          <button className="btn-ss-outline" style={{ padding: "6px 10px", fontSize: "0.74rem", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }} onClick={() => handleCancelApplication(app._id)}>
                            Cancel
                          </button>
                        ) : (
                          <span style={{ color: "var(--ss-muted)", fontSize: "0.76rem" }}>{app.adminRemarks || "Processed"}</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ color: "var(--ss-muted)", textAlign: "center", padding: 28 }}>No applications submitted yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="row g-4">
            {openMatches.length ? (
              openMatches.map((match) => {
                const alreadyApplied = alreadyAppliedMatchIds.includes(match._id)
                return (
                  <div className="col-lg-6" key={match._id}>
                    <div className="match-card h-100">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <span style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 20, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 600 }}>
                          {match.sportId?.sportName || "Sport"}
                        </span>
                        <span style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{match.maxApplications || 0} slots</span>
                      </div>
                      <div style={{ color: "var(--ss-heading)", fontFamily: "Oswald, sans-serif", fontSize: "1.05rem" }}>{match.matchName}</div>
                      <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem", marginTop: 6 }}>{formatDateTime(match.matchDate, match.matchTime)}</div>
                      <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem", marginTop: 4 }}>{match.venueId?.venueName || "-"} • {match.venueId?.city || match.city || "-"}</div>
                      <p style={{ color: "var(--ss-muted)", fontSize: "0.8rem", margin: "14px 0" }}>{match.description || "Compete for selection in this fixture."}</p>
                      <div className="d-flex justify-content-between align-items-center">
                            <span style={{ color: "#22c55e", fontWeight: 700 }}>{match.prizePool?.winner || match.prizeWinner ? `Winner ${match.prizePool?.winner || match.prizeWinner}` : "Prize listed by admin"}</span>
                        <button
                          className="btn-ss-primary"
                          disabled={!approved || !teams.length || alreadyApplied}
                          onClick={() => openApplyModal(match)}
                          style={{ fontSize: "0.78rem", padding: "8px 14px", background: alreadyApplied ? "rgba(34,197,94,0.18)" : "linear-gradient(135deg,#f97316,#ea580c)", color: alreadyApplied ? "#22c55e" : "#fff" }}
                        >
                          {alreadyApplied ? "Applied" : "Apply"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-12">
                <div className="match-card">No matches are currently open for applications.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal ? (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content ss-form">
              <div className="modal-header">
                <h5 className="modal-title">Apply For {selectedMatch?.matchName}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleApply}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Team</label>
                      <select className="form-select" value={form.teamId} onChange={(event) => setForm({ ...form, teamId: event.target.value, squad: [] })} required>
                        {teams.map((team) => (
                          <option key={team._id} value={team._id}>{team.teamName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Message</label>
                      <input className="form-control" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Tell admin why your squad is ready" required />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Select Squad</label>
                      <div className="row g-2">
                        {players.length ? (
                          players.map((player) => (
                            <div className="col-md-4" key={player._id}>
                              <label className="role-option w-100 d-flex align-items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="form-check-input mt-0"
                                  checked={form.squad.includes(player._id)}
                                  onChange={() => togglePlayer(player._id)}
                                />
                                  <span style={{ color: "var(--ss-heading)", fontSize: "0.82rem" }}>{player.playerName}</span>
                              </label>
                            </div>
                          ))
                        ) : (
                          <div className="col-12">
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.8rem" }}>No players available in this team yet.</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-ss-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-ss-primary" disabled={saving || !form.squad.length} style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                    {saving ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  )
}
