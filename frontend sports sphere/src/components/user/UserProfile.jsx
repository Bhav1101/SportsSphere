import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import { useApp } from "../../context/AppContext"
import { fetchBookingHistory } from "../../services/bookingService"
import { userUpdate } from "../../services/userService"
import { USER_NAV } from "./userShared"
import { formatCurrency, getInitials, getMediaUrl, resolveList } from "../../utils/appHelpers"

export default function UserProfile() {
  const { currentUser, syncCurrentUser } = useApp()
  const [history, setHistory] = useState([])
  const [saving, setSaving] = useState(false)
  const [contactError, setContactError] = useState("")
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    contact: currentUser?.contact || "",
    profileImage: null,
  })
  const [preview, setPreview] = useState(currentUser?.profileImage ? getMediaUrl(currentUser.profileImage) : "")

  useEffect(() => {
    fetchBookingHistory()
      .then((response) => {
        setHistory(resolveList(response.data?.data, ["bookings", "items", "rows"]))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setForm({
      name: currentUser?.name || "",
      contact: currentUser?.contact || "",
      profileImage: null,
    })
    setPreview(currentUser?.profileImage ? getMediaUrl(currentUser.profileImage) : "")
    setContactError("")
  }, [currentUser])

  const confirmed = history.filter((item) => String(item.bookingStatus || "").toLowerCase() === "confirmed")
  const upcoming = confirmed.filter((item) => new Date(item.matchId?.matchDate || 0).getTime() >= Date.now())
  const summary = {
    bookings: history.length,
    upcoming: upcoming.length,
    spent: confirmed.reduce((total, item) => total + Number(item.totalAmount || 0), 0),
  }

  const handleImageChange = (file) => {
    setForm((current) => ({ ...current, profileImage: file }))
    if (!file) {
      setPreview(currentUser?.profileImage ? getMediaUrl(currentUser.profileImage) : "")
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSaving(true)
    const cleanRaw = (form.contact || "").replace(/\D/g, "")
    let clean = cleanRaw
    if (clean.length === 12 && clean.startsWith("91")) {
      clean = clean.slice(-10)
    }
    if (clean.length !== 10) {
      setContactError("Please enter a valid 10-digit Indian mobile number")
      setSaving(false)
      return
    }

    const payload = new FormData()
    payload.append("name", form.name)
    payload.append("contact", clean)
    if (form.profileImage) {
      payload.append("profileImage", form.profileImage)
    }

    userUpdate(payload)
      .then((response) => {
        toast.success(response.data?.message || "Profile updated")
        const updated = response.data?.data?.user || response.data?.data || {}
        syncCurrentUser({
          ...currentUser,
          ...updated,
          name: updated.name || form.name,
          contact: updated.contact || form.contact,
          profileImage: updated.profileImage || currentUser?.profileImage,
        })
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to update profile")
      })
      .finally(() => setSaving(false))
  }

  return (
    <DashboardLayout navItems={USER_NAV} panelLabel="User Panel" panelColor="#3b82f6" darkMode={true}>
      <div className="ss-topbar">
        <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>My Profile</h5>
      </div>

      <div className="ss-content fade-in">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="match-card text-center">
              {preview ? (
                <img
                  src={preview}
                  alt={form.name || "Profile"}
                  style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", margin: "0 auto 16px", display: "block", border: "2px solid rgba(59,130,246,0.35)" }}
                />
              ) : (
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    fontFamily: "Oswald, sans-serif",
                    fontWeight: 700,
                    fontSize: "2rem",
                    color: "#fff",
                  }}
                >
                  {getInitials(form.name)}
                </div>
              )}
              <h5 style={{ fontFamily: "Oswald, sans-serif", color: "#f8fafc" }}>{form.name || "SportsSphere User"}</h5>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>{currentUser?.email || "-"}</p>
              <div className="mt-3 d-flex justify-content-center gap-3">
                <div className="text-center">
                  <div style={{ fontFamily: "Oswald, sans-serif", color: "#3b82f6", fontSize: "1.4rem", fontWeight: 700 }}>{summary.bookings}</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.72rem" }}>Bookings</div>
                </div>
                <div style={{ width: 1, background: "rgba(59,130,246,0.12)" }} />
                <div className="text-center">
                  <div style={{ fontFamily: "Oswald, sans-serif", color: "#22c55e", fontSize: "1.4rem", fontWeight: 700 }}>{summary.upcoming}</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.72rem" }}>Upcoming</div>
                </div>
                <div style={{ width: 1, background: "rgba(59,130,246,0.12)" }} />
                <div className="text-center">
                  <div style={{ fontFamily: "Oswald, sans-serif", color: "#f97316", fontSize: "1.25rem", fontWeight: 700 }}>{formatCurrency(summary.spent)}</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.72rem" }}>Spent</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="match-card ss-form">
              <div className="ss-section-title">Edit Profile</div>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-control" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={currentUser?.email || ""} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Contact</label>
                    <input
                      type="tel"
                      className={`form-control ${contactError ? 'is-invalid' : ''}`}
                      value={form.contact}
                      onChange={(event) => { setForm({ ...form, contact: event.target.value }); setContactError("") }}
                      required
                    />
                    {contactError ? <div className="invalid-feedback">{contactError}</div> : null}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Profile Image</label>
                    <input type="file" className="form-control" accept="image/*" onChange={(event) => handleImageChange(event.target.files?.[0] || null)} />
                  </div>
                </div>
                <div className="mt-4 d-flex gap-3">
                  <button type="submit" className="btn-ss-primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
