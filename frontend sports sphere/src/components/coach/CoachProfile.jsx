import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import { getMyProfile, updateProfile } from "../../services/coachService"
import { publicFetchAllSports } from "../../services/sportService"
import { COACH_NAV } from "./coachShared"
import {
  createFormData,
  formatCurrency,
  formatDate,
  getCoachBadgeMeta,
  getMediaUrl,
  getStatusBadgeStyle,
  resolveList,
  resolveObject,
} from "../admin/adminShared"

export default function CoachProfile() {
  const [profile, setProfile] = useState(null)
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    organisationName: "",
    experienceYears: "",
    bio: "",
    sportsIds: [],
    document: null,
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = () => {
    setLoading(true)
    const safe = (p) => p.catch(() => ({ data: { data: [] } }))
    Promise.all([safe(getMyProfile()), safe(publicFetchAllSports())])
      .then(([profileRes, sportsRes]) => {
        const nextProfile = resolveObject(profileRes.data?.data?.profile || profileRes.data?.data)
        const nextSports = resolveList(sportsRes.data?.data, ["sports", "items", "rows"])
        setProfile(nextProfile)
        setSports(nextSports)
        setForm({
          organisationName: nextProfile.organisationName || "",
          experienceYears: nextProfile.experienceYears || "",
          bio: nextProfile.bio || "",
          sportsIds: nextProfile.sportsIds?.map((item) => item._id) || [],
          document: null,
        })
      })
      .finally(() => setLoading(false))
  }

  const toggleSport = (sportId) => {
    setForm((current) => ({
      ...current,
      sportsIds: current.sportsIds.includes(sportId)
        ? current.sportsIds.filter((item) => item !== sportId)
        : [...current.sportsIds, sportId],
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSaving(true)

    const payload = createFormData({
      organisationName: form.organisationName,
      experienceYears: form.experienceYears,
      bio: form.bio,
      sportsIds: form.sportsIds,
      document: form.document,
    })

    updateProfile(payload)
      .then((response) => {
        toast.success(response.data?.message || "Profile updated")
        loadProfile()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to update profile")
      })
      .finally(() => setSaving(false))
  }

  const badge = getCoachBadgeMeta(profile?.badge)
  const editable = ["pending", "rejected"].includes(String(profile?.status || "").toLowerCase())

  return (
    <DashboardLayout navItems={COACH_NAV} panelLabel="Coach Panel" panelColor="#f97316">
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>Coach Profile</h5>
          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>Keep your organisation details and approval documents current.</div>
        </div>
      </div>

      <div className="ss-content fade-in">
        {loading ? (
          <div className="match-card">Loading profile...</div>
        ) : (
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="match-card h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <div style={{ color: "var(--ss-heading)", fontFamily: "Oswald, sans-serif", fontSize: "1.15rem" }}>
                      {profile?.userId?.name || "Coach"}
                    </div>
                    <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem", marginTop: 4 }}>{profile?.organisationName || "Organisation pending"}</div>
                  </div>
                  <span
                    style={{
                      ...getStatusBadgeStyle(profile?.status),
                      borderRadius: 999,
                      padding: "3px 10px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                    }}
                  >
                    {profile?.status || "pending"}
                  </span>
                </div>

                <div
                  style={{
                    background: `${badge.color}15`,
                    color: badge.color,
                    border: `1px solid ${badge.color}35`,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 18,
                  }}
                >
                  <i className={`${badge.icon} me-2`} />
                  {badge.label} badge
                </div>

                <div className="row g-3">
                  {[
                    ["Experience", `${profile?.experienceYears || 0} years`],
                    ["Sports", profile?.sportsIds?.map((item) => item.sportName).join(", ") || "-"],
                    ["Matches", profile?.matchesPlayed || 0],
                    ["Wins", profile?.matchesWon || 0],
                    ["Points", profile?.points || 0],
                    ["Pending Earnings", formatCurrency(profile?.earnings?.pending)],
                  ].map(([label, value]) => (
                    <div className="col-12" key={label}>
                      <div style={{ color: "var(--ss-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                      <div style={{ color: "var(--ss-muted)", fontSize: "0.84rem", marginTop: 4 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {profile?.adminRemarks ? (
                  <div
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#f87171",
                      borderRadius: 12,
                      padding: 14,
                      marginTop: 18,
                      fontSize: "0.8rem",
                    }}
                  >
                    <strong>Admin Remarks:</strong> {profile.adminRemarks}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="col-lg-8">
              <div className="match-card ss-form">
                <div className="ss-section-title">Profile Details</div>

                {!editable ? (
                  <div
                    style={{
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.22)",
                      color: "#22c55e",
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 20,
                      fontSize: "0.82rem",
                    }}
                  >
                    Your profile is approved. Team creation and match applications are unlocked.
                  </div>
                ) : null}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Organisation Name</label>
                      <input
                        className="form-control"
                        value={form.organisationName}
                        onChange={(event) => setForm({ ...form, organisationName: event.target.value })}
                        disabled={!editable}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Experience Years</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.experienceYears}
                        onChange={(event) => setForm({ ...form, experienceYears: event.target.value })}
                        disabled={!editable}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Bio</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        value={form.bio}
                        onChange={(event) => setForm({ ...form, bio: event.target.value })}
                        disabled={!editable}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Sports</label>
                      <div className="row g-2">
                        {sports.map((sport) => (
                          <div className="col-md-4" key={sport._id}>
                            <label className="role-option w-100 d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                className="form-check-input mt-0"
                                checked={form.sportsIds.includes(sport._id)}
                                onChange={() => toggleSport(sport._id)}
                                disabled={!editable}
                              />
                              <span style={{ color: "var(--ss-heading)", fontSize: "0.82rem" }}>{sport.sportName}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-12">
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
                        <label className="form-label" style={{ margin: 0 }}>Approval Document</label>
                        {profile?.document ? (
                          <a
                            href={getMediaUrl(profile.document)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-ss-outline"
                            style={{ display: "inline-block", padding: "6px 12px", fontSize: "0.82rem" }}
                          >
                            View current document
                          </a>
                        ) : (
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.84rem" }}>No document uploaded</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {editable ? (
                    <div className="mt-4">
                      <button type="submit" className="btn-ss-primary" disabled={saving} style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                        {saving ? "Saving..." : profile?.status === "rejected" ? "Resubmit Profile" : "Update Profile"}
                      </button>
                    </div>
                  ) : null}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
