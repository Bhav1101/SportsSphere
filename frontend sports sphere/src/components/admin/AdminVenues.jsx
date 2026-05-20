import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import {
  ADMIN_SPORT_FETCHALL,
  ADMIN_VENUE_ADD,
  ADMIN_VENUE_DELETE,
  ADMIN_VENUE_FETCHALL,
  ADMIN_VENUE_UPDATE,
  BASE_URL,
} from "../../endPoints"
import {
  ADMIN_NAV,
  ADMIN_PANEL_COLOR,
  confirmDanger,
  createFormData,
  formatDate,
  getAuthConfig,
  getMediaUrl,
  resolveList,
} from "./adminShared"

const defaultForm = {
  _id: "",
  venueName: "",
  city: "",
  state: "",
  address: "",
  totalCapacity: "",
  sportIds: [],
  image: null,
  existingImage: null,
}

export default function AdminVenues() {
  const [venues, setVenues] = useState([])
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const normalizeMediaPath = (value) => String(value || "").replace(/\\/g, "/")

  const getVenueImageSrc = (venue) => {
    const raw = venue?.imageUrl || venue?.image || venue?.imagePath || venue?.image?.url || ""
    if (!raw) return ""
    if (/^(blob:|data:|https?:\/\/)/i.test(String(raw))) return String(raw)
    return getMediaUrl(normalizeMediaPath(raw))
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      axios.post(BASE_URL + ADMIN_VENUE_FETCHALL, {}, getAuthConfig()),
      axios.post(BASE_URL + ADMIN_SPORT_FETCHALL, {}, getAuthConfig()),
    ])
      .then(([venuesRes, sportsRes]) => {
        const venuesData = resolveList(venuesRes.data?.data, ["venues", "items", "rows"])
        console.log("Venues loaded:", venuesData)
        setVenues(venuesData)
        setSports(resolveList(sportsRes.data?.data, ["sports", "items", "rows"]))
      })
      .catch((error) => {
        console.error("Error loading venues:", error)
        toast.error(error.response?.data?.message || "Unable to load venues")
      })
      .finally(() => setLoading(false))
  }

  const openCreateModal = () => {
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEditModal = (venue) => {
    setForm({
      _id: venue._id,
      venueName: venue.venueName || "",
      city: venue.city || "",
      state: venue.state || "",
      address: venue.address || "",
      totalCapacity: venue.totalCapacity || "",
      sportIds: venue.sportIds?.map((item) => item._id) || [],
      image: null,
      existingImage: venue.imageUrl || venue.image || null,
    })
    setShowModal(true)
  }

  const toggleSport = (sportId) => {
    setForm((current) => ({
      ...current,
      sportIds: current.sportIds.includes(sportId)
        ? current.sportIds.filter((item) => item !== sportId)
        : [...current.sportIds, sportId],
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSaving(true)

    const endpoint = form._id ? ADMIN_VENUE_UPDATE : ADMIN_VENUE_ADD
    const payload = createFormData({
      _id: form._id,
      venueName: form.venueName,
      city: form.city,
      state: form.state,
      address: form.address,
      totalCapacity: form.totalCapacity,
      sportIds: form._id ? undefined : form.sportIds,
      image: form.image || (form._id ? undefined : null),
    })

    axios
      .post(BASE_URL + endpoint, payload, getAuthConfig())
      .then((response) => {
          console.log("Venue saved:", response.data?.data)
        toast.success(response.data?.message || `Venue ${form._id ? "updated" : "created"} successfully`)
        setShowModal(false)
        setForm(defaultForm)
        loadData()
      })
      .catch((error) => {
          console.error("Venue save failed:", error.response?.data || error.message)
        toast.error(error.response?.data?.message || `Unable to ${form._id ? "update" : "create"} venue`)
      })
      .finally(() => setSaving(false))
  }

  const handleDelete = async (_id) => {
    const confirmed = await confirmDanger("Delete venue?", "This venue will be removed from the admin panel.", "Delete venue")
    if (!confirmed) return

    axios
      .post(BASE_URL + ADMIN_VENUE_DELETE, { _id }, getAuthConfig())
      .then((response) => {
        toast.success(response.data?.message || "Venue deleted")
        loadData()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to delete venue")
      })
  }

  return (
    <DashboardLayout navItems={ADMIN_NAV} panelLabel="Admin Panel" panelColor={ADMIN_PANEL_COLOR} darkMode={true}>
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>Venue Management</h5>
          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>{venues.length} venues configured</div>
        </div>
        <button className="btn-ss-primary" onClick={openCreateModal} style={{ fontSize: "0.82rem", padding: "8px 18px" }}>
          <i className="bi bi-plus-circle me-1" />
          Add Venue
        </button>
      </div>

      <div className="ss-content fade-in">
        {loading ? (
          <div className="match-card">
            <div style={{ color: "var(--ss-muted)", fontWeight: 600 }}>Loading venues...</div>
          </div>
        ) : (
          <div className="row g-4">
            {venues.length ? (
              venues.map((venue) => {
                const imageSrc = getVenueImageSrc(venue)
                return (
                <div className="col-lg-4 col-md-6" key={venue._id}>
                  <div className="match-card h-100 d-flex flex-column">
                    <div
                      style={{
                        height: 180,
                        borderRadius: 12,
                        marginBottom: 16,
                        background: "linear-gradient(135deg, #1e293b, #334155)",
                        border: "1px solid rgba(148,163,184,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {imageSrc ? (
                        <>
                          <img
                            src={imageSrc}
                            alt={venue.venueName}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: 12,
                            }}
                            onError={(event) => {
                              event.currentTarget.style.display = "none"
                              const fallback = event.currentTarget.parentElement?.querySelector(".venue-image-fallback")
                              if (fallback) fallback.style.display = "block"
                            }}
                          />
                          <div className="venue-image-fallback" style={{ display: "none", textAlign: "center", color: "rgba(148,163,184,0.72)" }}>
                            <i className="bi bi-image" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />
                            <small>Image unavailable</small>
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: "center", color: "rgba(148,163,184,0.6)" }}>
                          <i className="bi bi-image" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />
                          <small>No image</small>
                        </div>
                      )}
                    </div>
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <h6 style={{ fontFamily: "Oswald, sans-serif", margin: 0, color: "var(--ss-heading)" }}>{venue.venueName}</h6>
                        <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem", marginTop: 3 }}>
                          {venue.city}, {venue.state}
                        </div>
                      </div>
                      <span
                        style={{
                          background: "rgba(59,130,246,0.14)",
                          color: "#60a5fa",
                          border: "1px solid rgba(96,165,250,0.3)",
                          borderRadius: 999,
                          padding: "3px 10px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                        }}
                      >
                        {venue.totalCapacity || 0} seats
                      </span>
                    </div>

                    <p style={{ color: "var(--ss-muted)", fontSize: "0.82rem", marginBottom: 12 }}>{venue.address || "Address not available."}</p>

                    <div className="mb-3">
                      <div style={{ color: "var(--ss-muted)", fontSize: "0.72rem", marginBottom: 8 }}>Sports</div>
                      <div className="d-flex flex-wrap gap-2">
                        {venue.sportIds?.length ? (
                          venue.sportIds.map((sport) => (
                            <span
                              key={sport._id}
                              style={{
                                background: "rgba(0,200,81,0.14)",
                                color: "#4ade80",
                                border: "1px solid rgba(74,222,128,0.3)",
                                borderRadius: 999,
                                padding: "3px 10px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                              }}
                            >
                              {sport.sportName}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>No sports linked</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <span style={{ color: "var(--ss-muted)", fontSize: "0.72rem" }}>Created {formatDate(venue.createdAt)}</span>
                      <div className="d-flex gap-2">
                        <button className="btn-ss-outline" style={{ padding: "6px 10px", fontSize: "0.72rem" }} onClick={() => openEditModal(venue)}>
                          Edit
                        </button>
                        <button className="btn-ss-outline" style={{ padding: "6px 10px", fontSize: "0.72rem", color: "#ef4444", borderColor: "#ef4444" }} onClick={() => handleDelete(venue._id)}>
                          Delete
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
                  <div style={{ color: "var(--ss-muted)", fontSize: "0.84rem" }}>No venues available yet.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: "rgba(2, 6, 23, 0.8)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content ss-form">
              <div className="modal-header">
                <h5 className="modal-title">{form._id ? "Edit Venue" : "Add Venue"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Venue Name</label>
                      <input className="form-control" value={form.venueName} onChange={(event) => setForm({ ...form, venueName: event.target.value })} required />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">City</label>
                      <input className="form-control" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">State</label>
                      <input className="form-control" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Capacity</label>
                      <input type="number" className="form-control" value={form.totalCapacity} onChange={(event) => setForm({ ...form, totalCapacity: event.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Image</label>
                      <input 
                        type="file" 
                        className="form-control" 
                        accept="image/*" 
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null
                          if (file) {
                            console.log("Image file selected:", file.name, file.size)
                          }
                          setForm({ ...form, image: file })
                        }} 
                      />
                      {(form.image || form.existingImage) && (
                        <div style={{ marginTop: 12, textAlign: "center" }}>
                          <div style={{ fontSize: "0.78rem", color: "var(--ss-muted)", marginBottom: 6 }}>
                            {form.image ? "New image:" : "Current image:"}
                          </div>
                          <img
                            src={form.image ? URL.createObjectURL(form.image) : getVenueImageSrc({ imageUrl: form.existingImage })}
                            alt="Venue preview"
                            style={{ maxWidth: "100%", maxHeight: 150, borderRadius: 8 }}
                            onError={(e) => {
                              console.error("Failed to load image preview:", e.target.src)
                              e.target.parentElement.innerHTML = "<div style='padding: 20px; text-align: center; color: var(--ss-muted)'>Image preview failed</div>"
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label">Address</label>
                      <textarea className="form-control" rows="2" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required />
                    </div>
                    {!form._id && (
                      <div className="col-12">
                        <label className="form-label">Supported Sports</label>
                        <div className="row g-2">
                          {sports.map((sport) => (
                            <div className="col-md-4" key={sport._id}>
                              <label className="role-option selected-0 w-100 d-flex align-items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="form-check-input mt-0"
                                  checked={form.sportIds.includes(sport._id)}
                                  onChange={() => toggleSport(sport._id)}
                                />
                                <span style={{ color: "var(--ss-muted)", fontSize: "0.82rem" }}>{sport.sportName}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-ss-outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-ss-primary" disabled={saving}>
                    {saving ? "Saving..." : form._id ? "Update Venue" : "Create Venue"}
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
