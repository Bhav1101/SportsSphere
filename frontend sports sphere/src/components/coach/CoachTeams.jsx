import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import { createTeam, deleteTeam, fetchMyTeams, getMyProfile, updateTeam } from "../../services/coachService"
import { publicFetchAllSports } from "../../services/sportService"
import { COACH_NAV, canCoachManage } from "./coachShared"
import { confirmDanger, formatDate, getMediaUrl, getStatusBadgeStyle } from "../admin/adminShared"
import { createFormData, resolveList, resolveObject } from "../../utils/appHelpers"

const defaultForm = {
  _id: "",
  teamName: "",
  teamDesc: "",
  sportId: "",
  status: "active",
  logo: null,
}

export default function CoachTeams() {
  const [profile, setProfile] = useState(null)
  const [sports, setSports] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setLoading(true)
    Promise.all([getMyProfile(), fetchMyTeams(), publicFetchAllSports()])
      .then(([profileRes, teamsRes, sportsRes]) => {
        setProfile(resolveObject(profileRes.data?.data?.profile || profileRes.data?.data))
        setTeams(resolveList(teamsRes.data?.data, ["teams", "items", "rows"]))
        setSports(resolveList(sportsRes.data?.data, ["sports", "items", "rows"]))
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load teams")
      })
      .finally(() => setLoading(false))
  }

  const approved = canCoachManage(profile)

  const openCreate = () => {
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEdit = (team) => {
    setForm({
      _id: team._id,
      teamName: team.teamName || "",
      teamDesc: team.teamDesc || "",
      sportId: team.sportId?._id || "",
      status: team.status || "active",
      logo: null,
    })
    setShowModal(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSaving(true)

    const isEdit = Boolean(form._id)
    const payload = createFormData({
      _id: form._id,
      teamName: form.teamName,
      teamDesc: form.teamDesc,
      sportId: form.sportId,
      status: isEdit ? form.status : undefined,
      logo: form.logo,
    })

    const action = isEdit ? updateTeam(payload) : createTeam(payload)

    action
      .then((response) => {
        toast.success(response.data?.message || `Team ${isEdit ? "updated" : "created"} successfully`)
        setShowModal(false)
        setForm(defaultForm)
        loadData()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || `Unable to ${isEdit ? "update" : "create"} team`)
      })
      .finally(() => setSaving(false))
  }

  const handleDelete = async (_id) => {
    const confirmed = await confirmDanger("Delete team?", "This team and its setup will be removed.", "Delete team")
    if (!confirmed) return

    deleteTeam({ _id })
      .then((response) => {
        toast.success(response.data?.message || "Team deleted")
        loadData()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to delete team")
      })
  }

  return (
    <DashboardLayout navItems={COACH_NAV} panelLabel="Coach Panel" panelColor="#f97316">
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>My Teams</h5>
          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{teams.length} teams under your management</div>
        </div>
        <button
          className="btn-ss-primary"
          onClick={openCreate}
          disabled={!approved}
          style={{ fontSize: "0.82rem", padding: "8px 18px", background: "linear-gradient(135deg,#f97316,#ea580c)" }}
        >
          Create Team
        </button>
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
            Your coach profile must be approved by admin before you can create or manage teams.
          </div>
        ) : null}

        {loading ? (
          <div className="match-card">Loading teams...</div>
        ) : (
          <div className="row g-4">
            {teams.length ? (
              teams.map((team) => (
                <div className="col-lg-6" key={team._id}>
                  <div className="match-card h-100">
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                      <div className="d-flex align-items-center gap-3">
                        {team.logo ? (
                          <img src={getMediaUrl(team.logo)} alt={team.teamName} style={{ width: 62, height: 62, borderRadius: 16, objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: 62, height: 62, borderRadius: 16, background: "linear-gradient(135deg,#f97316,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#fff" }}>
                            {team.teamName?.slice(0, 2)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ color: "var(--ss-heading)", fontFamily: "Oswald, sans-serif", fontSize: "1rem" }}>{team.teamName}</div>
                          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem", marginTop: 3 }}>{team.sportId?.sportName || "-"}</div>
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

                    <p style={{ color: "var(--ss-muted)", fontSize: "0.82rem", marginBottom: 12 }}>{team.teamDesc || "No team description provided."}</p>

                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <div style={{ color: "var(--ss-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1 }}>Players</div>
                        <div style={{ color: "var(--ss-heading)", fontSize: "0.84rem", marginTop: 4 }}>{team.playersCount ?? team.totalPlayers ?? 0}</div>
                      </div>
                      <div className="col-6">
                        <div style={{ color: "var(--ss-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1 }}>Created</div>
                        <div style={{ color: "var(--ss-muted)", fontSize: "0.84rem", marginTop: 4 }}>{formatDate(team.createdAt)}</div>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-auto">
                      <button className="btn-ss-outline" style={{ flex: 1, fontSize: "0.75rem", padding: "6px" }} disabled={!approved} onClick={() => openEdit(team)}>
                        Edit
                      </button>
                      <button className="btn-ss-outline" style={{ flex: 1, fontSize: "0.75rem", padding: "6px", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }} disabled={!approved} onClick={() => handleDelete(team._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12">
                <div className="match-card">No teams created yet.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal ? (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content ss-form">
              <div className="modal-header">
                <h5 className="modal-title">{form._id ? "Edit Team" : "Create Team"}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Team Name</label>
                      <input className="form-control" value={form.teamName} onChange={(event) => setForm({ ...form, teamName: event.target.value })} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" rows="3" value={form.teamDesc} onChange={(event) => setForm({ ...form, teamDesc: event.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Sport</label>
                      <select className="form-select" value={form.sportId} onChange={(event) => setForm({ ...form, sportId: event.target.value })} required disabled={Boolean(form._id)}>
                        <option value="">Select sport</option>
                        {sports.map((sport) => (
                          <option key={sport._id} value={sport._id}>{sport.sportName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Logo</label>
                      <input type="file" className="form-control" accept="image/*" onChange={(event) => setForm({ ...form, logo: event.target.files?.[0] || null })} />
                    </div>
                    {form._id ? (
                      <div className="col-md-6">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-ss-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-ss-primary" disabled={saving} style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                    {saving ? "Saving..." : form._id ? "Update Team" : "Create Team"}
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
