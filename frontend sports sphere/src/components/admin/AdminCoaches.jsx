import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import {
  ADMIN_COACH_BLOCK,
  ADMIN_COACH_DELETE,
  ADMIN_COACH_FETCHALL,
  ADMIN_COACH_UNBLOCK,
  ADMIN_PROFILE_APPROVE,
  ADMIN_PROFILE_FETCHALL,
  ADMIN_PROFILE_REJECT,
  BASE_URL,
} from "../../endPoints"
import {
  ADMIN_NAV,
  ADMIN_PANEL_COLOR,
  confirmDanger,
  formatCurrency,
  formatDate,
  getAuthConfig,
  getCoachBadgeMeta,
  getMediaUrl,
  getStatusBadgeStyle,
  promptRemarks,
  resolveList,
} from "./adminShared"

export default function AdminCoaches() {
  const [coaches, setCoaches] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCoaches()
  }, [])

  const loadCoaches = () => {
    setLoading(true)
    Promise.all([
      axios.post(BASE_URL + ADMIN_COACH_FETCHALL, {}, getAuthConfig()),
      axios.post(BASE_URL + ADMIN_PROFILE_FETCHALL, {}, getAuthConfig()),
    ])
      .then(([coachesRes, profilesRes]) => {
        setCoaches(resolveList(coachesRes.data?.data, ["coaches", "items", "rows"]))
        setProfiles(resolveList(profilesRes.data?.data, ["profiles", "coachProfiles", "items", "rows"]))
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load coaches")
      })
      .finally(() => setLoading(false))
  }

  const handleApprove = (_id) => {
    axios
      .post(BASE_URL + ADMIN_PROFILE_APPROVE, { _id }, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || "Coach approved")
        loadCoaches()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to approve coach")
      })
  }

  const handleReject = async (_id) => {
    const adminRemarks = await promptRemarks("Reject Coach Profile", "Reject")
    if (!adminRemarks) return

    axios
      .post(BASE_URL + ADMIN_PROFILE_REJECT, { _id, adminRemarks }, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || "Coach rejected")
        loadCoaches()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to reject coach")
      })
  }

  const handleBlockToggle = (coach) => {
    const endpoint = coach.isBlock ? ADMIN_COACH_UNBLOCK : ADMIN_COACH_BLOCK
    const label = coach.isBlock ? "unblock" : "block"

    axios
      .post(BASE_URL + endpoint, { _id: coach._id }, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || `Coach ${label}ed successfully`)
        loadCoaches()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || `Unable to ${label} coach`)
      })
  }

  const handleDelete = async (_id) => {
    const confirmed = await confirmDanger("Delete coach account?", "This will remove the coach account from admin records.", "Delete coach")
    if (!confirmed) return

    axios
      .post(BASE_URL + ADMIN_COACH_DELETE, { _id }, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || "Coach deleted")
        loadCoaches()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to delete coach")
      })
  }

  const pendingProfiles = profiles.filter((item) => String(item.status || "").toLowerCase() === "pending")

  return (
    <DashboardLayout navItems={ADMIN_NAV} panelLabel="Admin Panel" panelColor={ADMIN_PANEL_COLOR} darkMode={true}>
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>Coach Management</h5>
          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{pendingProfiles.length} pending profiles</div>
        </div>
      </div>

      <div className="ss-content fade-in">
        {loading ? (
          <div className="match-card">
            <div style={{ color: "var(--ss-muted)", fontWeight: 600 }}>Loading coaches...</div>
          </div>
        ) : (
          <>
            <div className="ss-section-title" style={{ color: "var(--ss-heading)" }}>Pending Coach Profiles</div>
            <div className="row g-3 mb-4">
              {pendingProfiles.length ? (
                pendingProfiles.map((profile) => {
                  const badge = getCoachBadgeMeta(profile.badge)
                  return (
                    <div className="col-lg-6" key={profile._id}>
                      <div className="match-card h-100">
                        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                          <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <h6 style={{ fontFamily: "Oswald, sans-serif", margin: 0, color: "var(--ss-heading)" }}>
                                {profile.userId?.name || "Coach"}
                              </h6>
                              <span
                                style={{
                                  background: `${badge.color}20`,
                                  color: badge.color,
                                  border: `1px solid ${badge.color}40`,
                                  borderRadius: 999,
                                  padding: "2px 10px",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                }}
                              >
                                <i className={`${badge.icon} me-1`} />
                                {badge.label}
                              </span>
                            </div>
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem", marginTop: 4 }}>
                              {profile.organisationName || "Organisation not provided"}
                            </div>
                          </div>
                          <span
                            style={{
                              ...getStatusBadgeStyle(profile.status),
                              borderRadius: 999,
                              padding: "3px 10px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                            }}
                          >
                            {profile.status}
                          </span>
                        </div>

                        <div className="row g-3 mb-3">
                          <div className="col-sm-6">
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>Email</div>
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{profile.userId?.email || "-"}</div>
                          </div>
                          <div className="col-sm-6">
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>Experience</div>
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{profile.experienceYears || 0} years</div>
                          </div>
                          <div className="col-sm-6">
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>Sports</div>
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>
                              {profile.sportsIds?.map((item) => item.sportName).join(", ") || "-"}
                            </div>
                          </div>
                          <div className="col-sm-6">
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>Submitted</div>
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{formatDate(profile.createdAt)}</div>
                          </div>
                        </div>

                        <p style={{ color: "var(--ss-muted)", fontSize: "0.82rem", marginBottom: 12 }}>
                          {profile.bio || "No bio provided."}
                        </p>

                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <a
                            href={getMediaUrl(profile.document)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-ss-outline"
                            style={{ padding: "7px 14px", fontSize: "0.78rem" }}
                          >
                            <i className="bi bi-file-earmark-text me-1" />
                            View Document
                          </a>
                          <div className="d-flex gap-2">
                            <button className="btn-ss-outline" style={{ padding: "7px 14px", fontSize: "0.78rem", color: "#f97316", borderColor: "#f97316" }} onClick={() => handleReject(profile._id)}>
                              Reject
                            </button>
                            <button className="btn-ss-primary" style={{ padding: "7px 14px", fontSize: "0.78rem" }} onClick={() => handleApprove(profile._id)}>
                              Approve
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-12">
                  <div className="match-card">
                    <div style={{ color: "var(--ss-muted)", fontSize: "0.84rem" }}>No coach profiles are waiting for approval.</div>
                  </div>
                </div>
              )}
            </div>

            <div className="ss-section-title" style={{ color: "var(--ss-heading)" }}>All Coaches</div>
            <div className="ss-table">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Coach</th>
                    <th>Contact</th>
                    <th>Account</th>
                    <th>Performance</th>
                    <th>Earnings</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coaches.length ? (
                    coaches.map((coach) => {
                      const linkedProfile = profiles.find((item) => item.userId?._id === coach._id)
                      const badge = getCoachBadgeMeta(linkedProfile?.badge)
                      return (
                        <tr key={coach._id}>
                          <td>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span style={{ color: "var(--ss-heading)", fontWeight: 600, fontSize: "0.84rem" }}>{coach.name}</span>
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
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{coach.email}</div>
                          </td>
                          <td>
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{coach.contact || "-"}</div>
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{linkedProfile?.organisationName || "No organisation"}</div>
                          </td>
                          <td>
                            <div style={{ color: "var(--ss-heading)", fontSize: "0.82rem" }}>
                              {linkedProfile?.sportsIds?.map((item) => item.sportName).join(", ") || "No sports linked"}
                            </div>
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>
                              Profile: {linkedProfile?.status || "not found"}
                            </div>
                          </td>
                          <td>
                            <div style={{ color: "var(--ss-heading)", fontSize: "0.82rem" }}>
                              {linkedProfile?.matchesPlayed || 0} played / {linkedProfile?.matchesWon || 0} won
                            </div>
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{linkedProfile?.points || 0} points</div>
                          </td>
                          <td>
                            <div style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.82rem" }}>
                              {formatCurrency(linkedProfile?.earnings?.total)}
                            </div>
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>
                              Pending: {formatCurrency(linkedProfile?.earnings?.pending)}
                            </div>
                          </td>
                          <td style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{formatDate(coach.createdAt)}</td>
                          <td>
                            <div className="d-flex gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleBlockToggle(coach)}
                                className="btn-ss-outline"
                                style={{ padding: "6px 10px", fontSize: "0.72rem", color: coach.isBlock ? "#22c55e" : "#f97316", borderColor: coach.isBlock ? "#22c55e" : "#f97316" }}
                              >
                                {coach.isBlock ? "Unblock" : "Block"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(coach._id)}
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
                      <td colSpan="7" style={{ color: "var(--ss-muted)", textAlign: "center", padding: "30px 18px" }}>
                        No coaches found.
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
