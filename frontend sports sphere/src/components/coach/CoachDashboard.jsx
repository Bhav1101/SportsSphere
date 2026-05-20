import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import { fetchMyApplications, fetchMyMatches, fetchMyTeams, getMyProfile } from "../../services/coachService"
import { COACH_NAV, canCoachManage } from "./coachShared"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getCoachBadgeMeta,
  getStatusBadgeStyle,
  resolveList,
  resolveObject,
} from "../admin/adminShared"

export default function CoachDashboard() {
  const [profile, setProfile] = useState(null)
  const [teams, setTeams] = useState([])
  const [applications, setApplications] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const safe = (p) => p.catch(() => ({ data: { data: [] } }))
    Promise.all([safe(getMyProfile()), safe(fetchMyTeams()), safe(fetchMyApplications()), safe(fetchMyMatches())])
      .then(([profileRes, teamsRes, appsRes, matchesRes]) => {
        setProfile(resolveObject(profileRes.data?.data?.profile || profileRes.data?.data))
        setTeams(resolveList(teamsRes.data?.data, ["teams", "items", "rows"]))
        setApplications(resolveList(appsRes.data?.data, ["applications", "items", "rows"]))
        setMatches(resolveList(matchesRes.data?.data, ["matches", "items", "rows"]))
      })
      .finally(() => setLoading(false))
  }, [])

  const approved = canCoachManage(profile)
  const badge = getCoachBadgeMeta(profile?.badge)
  const pendingApps = applications.filter((item) => String(item.status || "").toLowerCase() === "pending").length

  const stats = [
    { label: "Profile Status", value: profile?.status || "pending", icon: "bi-shield-check", color: "#f97316" },
    { label: "Teams", value: teams.length, icon: "bi-people", color: "#3b82f6" },
    { label: "Applications", value: applications.length, icon: "bi-send", color: "#22c55e" },
    { label: "My Matches", value: matches.length, icon: "bi-calendar3", color: "#8b5cf6" },
  ]

  return (
    <DashboardLayout navItems={COACH_NAV} panelLabel="Coach Panel" panelColor="#f97316">
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>Coach Dashboard</h5>
          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>Track approval, squads, and match applications from one place.</div>
        </div>
        <div className="d-flex gap-2">
          <Link to="/coach/profile" className="btn-ss-outline" style={{ padding: "8px 16px", fontSize: "0.8rem" }}>
            Profile
          </Link>
          <Link to="/coach/teams" className="btn-ss-primary" style={{ fontSize: "0.82rem", padding: "8px 18px", background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
            Manage Teams
          </Link>
        </div>
      </div>

      <div className="ss-content fade-in">
        {loading ? (
          <div className="match-card">Loading coach dashboard...</div>
        ) : (
          <>
            <div className="row g-3 mb-4">
              {stats.map((stat) => (
                <div className="col-6 col-lg-3" key={stat.label}>
                  <div className="stat-card">
                    <div className="stat-icon mb-2" style={{ background: `${stat.color}18` }}><i className={stat.icon} style={{ color: stat.color }} /></div>
                    <div className="stat-value" style={{ fontSize: stat.label === "Profile Status" ? "1.2rem" : "1.9rem", textTransform: stat.label === "Profile Status" ? "capitalize" : "none" }}>{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: approved ? "rgba(34,197,94,0.08)" : "rgba(249,115,22,0.08)",
                border: `1px solid ${approved ? "rgba(34,197,94,0.24)" : "rgba(249,115,22,0.24)"}`,
                borderRadius: 14,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                <div>
                  <div style={{ color: approved ? "#22c55e" : "#f97316", fontWeight: 700, fontSize: "0.9rem" }}>
                    <i className={`${badge.icon} me-2`} />
                    {approved ? "Profile approved. Team creation and match applications are unlocked." : "Profile approval is still required."}
                  </div>
                  <div style={{ color: "var(--ss-muted)", fontSize: "0.8rem", marginTop: 6 }}>
                    Badge: {badge.label} • Pending applications: {pendingApps} • Pending earnings: {formatCurrency(profile?.earnings?.pending)}
                  </div>
                </div>
                {!approved ? (
                  <Link to="/coach/profile" className="btn-ss-primary" style={{ fontSize: "0.78rem", padding: "8px 14px", background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                    Update Profile
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="row g-4">
              <div className="col-lg-6">
                <div className="ss-section-title">My Teams</div>
                <div className="d-flex flex-column gap-3">
                  {teams.length ? (
                    teams.slice(0, 4).map((team) => (
                      <div key={team._id} className="match-card" style={{ padding: 16 }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div style={{ color: "var(--ss-heading)", fontFamily: "Oswald, sans-serif", fontSize: "1rem" }}>{team.teamName}</div>
                            <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem", marginTop: 3 }}>
                              {team.sportId?.sportName || "-"} • {team.playersCount ?? team.totalPlayers ?? 0} players
                            </div>
                          </div>
                          <span
                            style={{
                              ...getStatusBadgeStyle(team.status || "active"),
                              borderRadius: 999,
                              padding: "3px 10px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                            }}
                          >
                            {team.status || "active"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="match-card">No teams created yet.</div>
                  )}
                </div>
              </div>

              <div className="col-lg-6">
                <div className="ss-section-title">My Matches</div>
                <div className="d-flex flex-column gap-3">
                  {matches.length ? (
                    matches.slice(0, 4).map((match) => (
                      <div key={match._id} className="match-card" style={{ padding: 16 }}>
                        <div style={{ color: "var(--ss-heading)", fontFamily: "Oswald, sans-serif", fontSize: "0.96rem" }}>{match.matchName}</div>
                        <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem", marginTop: 4 }}>{formatDateTime(match.matchDate, match.matchTime)}</div>
                        <div style={{ color: "var(--ss-muted)", fontSize: "0.76rem", marginTop: 4 }}>{match.venueId?.venueName || "-"} • {match.venueId?.city || match.city || "-"}</div>
                      </div>
                    ))
                  ) : (
                    <div className="match-card">Approved matches will appear here once your team is selected.</div>
                  )}
                </div>
              </div>

              <div className="col-12">
                <div className="ss-section-title">Recent Applications</div>
                <div className="ss-table">
                  <table className="table mb-0">
                    <thead>
                      <tr>
                        <th>Match</th>
                        <th>Team</th>
                        <th>Applied On</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.length ? (
                        applications.map((app) => (
                          <tr key={app._id}>
                            <td>
                              <div style={{ color: "var(--ss-heading)", fontWeight: 600, fontSize: "0.84rem" }}>{app.matchId?.matchName || "-"}</div>
                              <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>{formatDate(app.matchId?.matchDate)}</div>
                            </td>
                            <td style={{ color: "var(--ss-heading)", fontSize: "0.82rem" }}>{app.teamId?.teamName || "-"}</td>
                            <td style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{formatDate(app.createdAt)}</td>
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
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ color: "var(--ss-muted)", textAlign: "center", padding: 28 }}>No applications submitted yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
