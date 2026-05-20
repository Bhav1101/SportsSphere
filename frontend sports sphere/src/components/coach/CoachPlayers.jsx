import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import {
  addPlayer,
  blockPlayer,
  deletePlayer,
  fetchMyPlayers,
  fetchMyTeams,
  getMyProfile,
  unblockPlayer,
  updatePlayer,
} from "../../services/coachService"
import { publicFetchAllSports } from "../../services/sportService"
import { COACH_NAV, canCoachManage } from "./coachShared"
import { confirmDanger, getStatusBadgeStyle } from "../admin/adminShared"
import { createFormData, resolveList, resolveObject } from "../../utils/appHelpers"

const defaultForm = {
  _id: "",
  playerName: "",
  teamId: "",
  sportId: "",
  experience: "",
  bio: "",
  playerImg: null,
}

export default function CoachPlayers() {
  const [profile, setProfile] = useState(null)
  const [teams, setTeams] = useState([])
  const [sports, setSports] = useState([])
  const [players, setPlayers] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    loadBaseData()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      loadPlayers(selectedTeamId)
    } else {
      setPlayers([])
    }
  }, [selectedTeamId])

  const loadBaseData = () => {
    setLoading(true)
    Promise.all([getMyProfile(), fetchMyTeams(), publicFetchAllSports()])
      .then(([profileRes, teamsRes, sportsRes]) => {
        const nextTeams = resolveList(teamsRes.data?.data, ["teams", "items", "rows"])
        setProfile(resolveObject(profileRes.data?.data?.profile || profileRes.data?.data))
        setTeams(nextTeams)
        setSports(resolveList(sportsRes.data?.data, ["sports", "items", "rows"]))
        setSelectedTeamId(nextTeams[0]?._id || "")
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load player management")
      })
      .finally(() => setLoading(false))
  }

  const loadPlayers = (teamId) => {
    fetchMyPlayers({ teamId })
      .then((response) => {
        setPlayers(resolveList(response.data?.data, ["players", "items", "rows"]))
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load players")
      })
  }

  const approved = canCoachManage(profile)

  const openCreate = () => {
    const team = teams.find((item) => item._id === selectedTeamId)
    setForm({
      ...defaultForm,
      teamId: selectedTeamId,
      sportId: team?.sportId?._id || "",
    })
    setShowModal(true)
  }

  const openEdit = (player) => {
    setForm({
      _id: player._id,
      playerName: player.playerName || "",
      teamId: player.teamId?._id || selectedTeamId,
      sportId: player.sportId?._id || "",
      experience: player.experience || "",
      bio: player.bio || "",
      playerImg: null,
    })
    setShowModal(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSaving(true)

    const payload = createFormData({
      _id: form._id,
      playerName: form.playerName,
      teamId: form._id ? undefined : form.teamId,
      sportId: form.sportId,
      experience: form.experience,
      bio: form.bio,
      playerImg: form.playerImg,
    })

    const request = form._id ? updatePlayer(payload) : addPlayer(payload)

    request
      .then((response) => {
        toast.success(response.data?.message || `Player ${form._id ? "updated" : "added"} successfully`)
        setShowModal(false)
        setForm(defaultForm)
        if (selectedTeamId) loadPlayers(selectedTeamId)
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || `Unable to ${form._id ? "update" : "add"} player`)
      })
      .finally(() => setSaving(false))
  }

  const handleDelete = async (_id) => {
    const confirmed = await confirmDanger("Delete player?", "This player will be removed from your squad.", "Delete player")
    if (!confirmed) return

    deletePlayer({ _id })
      .then((response) => {
        toast.success(response.data?.message || "Player deleted")
        if (selectedTeamId) loadPlayers(selectedTeamId)
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to delete player")
      })
  }

  const handleBlockToggle = (player) => {
    const request = player.isBlock ? unblockPlayer({ _id: player._id }) : blockPlayer({ _id: player._id })
    request
      .then((response) => {
        toast.success(response.data?.message || `Player ${player.isBlock ? "unblocked" : "blocked"} successfully`)
        if (selectedTeamId) loadPlayers(selectedTeamId)
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to update player status")
      })
  }

  return (
    <DashboardLayout navItems={COACH_NAV} panelLabel="Coach Panel" panelColor="#f97316">
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>Players</h5>
          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>Manage players squad by squad.</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <select className="form-select" style={{ minWidth: 220, fontSize: "0.82rem" }} value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>
            {teams.map((team) => (
              <option key={team._id} value={team._id}>{team.teamName}</option>
            ))}
          </select>
          <button className="btn-ss-primary" onClick={openCreate} disabled={!approved || !selectedTeamId} style={{ fontSize: "0.82rem", padding: "8px 18px", background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
            Add Player
          </button>
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
            Player management unlocks after your coach profile is approved.
          </div>
        ) : null}

        {loading ? (
          <div className="match-card">Loading players...</div>
        ) : players.length ? (
          <div className="row g-3">
            {players.map((player) => (
              <div className="col-lg-4 col-md-6" key={player._id}>
                <div className="match-card h-100">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div style={{ width: 50, height: 50, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#fff", flexShrink: 0 }}>
                      {player.playerName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily: "Oswald, sans-serif", color: "var(--ss-heading)", fontWeight: 600 }}>{player.playerName}</div>
                      <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{player.sportId?.sportName || "-"}</div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <span style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", color: "#f97316", borderRadius: 20, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 600 }}>
                      {player.teamId?.teamName || "Team"}
                    </span>
                  </div>
                  <p style={{ color: "var(--ss-muted)", fontSize: "0.8rem", marginBottom: 10 }}>{player.bio || "No player bio provided."}</p>
                  <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem", marginBottom: 12 }}>Experience: {player.experience || 0} years • Matches: {player.matchesPlayed || 0}</div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{ color: "var(--ss-muted)", fontSize: "0.74rem" }}>Rating</span>
                    <span style={{ color: "#22c55e", fontWeight: 700 }}>{player.rating || 0}</span>
                  </div>
                  <div className="d-flex gap-2 mt-auto flex-wrap">
                    <button className="btn-ss-outline" style={{ flex: 1, fontSize: "0.75rem", padding: "6px" }} disabled={!approved} onClick={() => openEdit(player)}>
                      Edit
                    </button>
                    <button className="btn-ss-outline" style={{ flex: 1, fontSize: "0.75rem", padding: "6px", color: player.isBlock ? "#22c55e" : "#f97316", borderColor: player.isBlock ? "rgba(34,197,94,0.3)" : "rgba(249,115,22,0.3)" }} disabled={!approved} onClick={() => handleBlockToggle(player)}>
                      {player.isBlock ? "Unblock" : "Block"}
                    </button>
                    <button className="btn-ss-outline" style={{ flex: 1, fontSize: "0.75rem", padding: "6px", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }} disabled={!approved} onClick={() => handleDelete(player._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="match-card">No players found for the selected team.</div>
        )}
      </div>

      {showModal ? (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content ss-form">
              <div className="modal-header">
                <h5 className="modal-title">{form._id ? "Edit Player" : "Add Player"}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Player Name</label>
                      <input className="form-control" value={form.playerName} onChange={(event) => setForm({ ...form, playerName: event.target.value })} required />
                    </div>
                    {!form._id ? (
                      <div className="col-md-6">
                        <label className="form-label">Team</label>
                        <select className="form-select" value={form.teamId} onChange={(event) => {
                          const team = teams.find((item) => item._id === event.target.value)
                          setForm({ ...form, teamId: event.target.value, sportId: team?.sportId?._id || "" })
                        }} required>
                          {teams.map((team) => (
                            <option key={team._id} value={team._id}>{team.teamName}</option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <div className="col-md-6">
                      <label className="form-label">Sport</label>
                      <select className="form-select" value={form.sportId} onChange={(event) => setForm({ ...form, sportId: event.target.value })} required>
                        <option value="">Select sport</option>
                        {sports.map((sport) => (
                          <option key={sport._id} value={sport._id}>{sport.sportName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Experience</label>
                      <input type="number" className="form-control" value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Player Image</label>
                      <input type="file" className="form-control" accept="image/*" onChange={(event) => setForm({ ...form, playerImg: event.target.files?.[0] || null })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Bio</label>
                      <textarea className="form-control" rows="3" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-ss-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-ss-primary" disabled={saving} style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                    {saving ? "Saving..." : form._id ? "Update Player" : "Add Player"}
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
