import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { coachRegister, userRegister } from "../../services/userService"
import { publicFetchAllSports } from "../../services/sportService"
import { createFormData, resolveList } from "../../utils/appHelpers"

const defaultForm = {
  name: "",
  email: "",
  contact: "",
  password: "",
  confirmPassword: "",
  organisationName: "",
  experienceYears: "",
  bio: "",
  sportsIds: [],
  document: null,
}

export default function Register() {
  const navigate = useNavigate()
  const [mode, setMode] = useState("user")
  const [sports, setSports] = useState([])
  const [loadingSports, setLoadingSports] = useState(true)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [emailError, setEmailError] = useState("")
  const [contactError, setContactError] = useState("")

  useEffect(() => {
    publicFetchAllSports()
      .then((response) => {
        setSports(resolveList(response.data?.data, ["sports", "items", "rows"]))
      })
      .catch(() => {
        setSports([])
      })
      .finally(() => setLoadingSports(false))
  }, [])

  const toggleSport = (sportId) => {
    setForm((current) => ({
      ...current,
      sportsIds: current.sportsIds.includes(sportId)
        ? current.sportsIds.filter((item) => item !== sportId)
        : [...current.sportsIds, sportId],
    }))
  }

  const resetForMode = (nextMode) => {
    setMode(nextMode)
    setForm((current) => ({
      ...defaultForm,
      name: current.name,
      email: current.email,
      contact: current.contact,
      password: current.password,
      confirmPassword: current.confirmPassword,
    }))
    setEmailError("")
    setContactError("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    // validate email
    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email)
    if (!isValidEmail(form.email)) {
      setEmailError("Please enter a valid email address")
      return
    }

    // validate contact as Indian 10-digit (allow +91 or leading 91)
    const cleanRaw = (form.contact || "").replace(/\D/g, "")
    let cleanContact = cleanRaw
    if (cleanContact.length === 12 && cleanContact.startsWith("91")) cleanContact = cleanContact.slice(-10)
    if (cleanContact.length !== 10) {
      setContactError("Please enter a valid 10-digit Indian mobile number")
      return
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      if (mode === "coach") {
        if (!form.document) {
          throw new Error("Coach registration requires a document upload")
        }

        const payload = createFormData({
          name: form.name,
          email: form.email,
          contact: cleanContact,
          password: form.password,
          organisationName: form.organisationName,
          experienceYears: form.experienceYears,
          bio: form.bio,
          sportsIds: form.sportsIds,
          document: form.document,
        })

        const response = await coachRegister(payload)
        if (response.data?.success === false) {
          throw new Error(response.data?.message || "Coach registration failed")
        }

        toast.success(response.data?.message || "Coach registration submitted for approval")
        navigate("/login")
        return
      }

      const response = await userRegister({
        name: form.name,
        email: form.email,
        contact: cleanContact,
        password: form.password,
      })

      if (response.data?.success === false) {
        throw new Error(response.data?.message || "User registration failed")
      }

      toast.success(response.data?.message || "Account created successfully")
      navigate("/login")
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to complete registration")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page-shell">
      <div className="container container-compact">
        <div className="auth-card-shell">
          <div className="row g-0">
            <div className="col-lg-5">
              <div className="auth-side">
                <span className="hero-tag mb-3">
                  <i className="bi bi-ticket-detailed-fill" />
                  Join SportsSphere
                </span>
                <h1 className="hero-title mb-3">Create an account that feels closer to a real booking platform.</h1>
                <p className="mb-4">
                  Sign up as a fan to book seats, or register as a coach to manage teams and apply for matches.
                </p>
                <div className="form-dark-summary">
                  <div className="d-flex justify-content-between mb-2">
                    <span>User bookings</span>
                    <strong>Instant</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Coach onboarding</span>
                    <strong>Reviewed</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Role-based access</span>
                    <strong>Included</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="auth-form-wrap">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                  <div>
                    <h2 className="auth-title mb-2">Create account</h2>
                    <p className="section-copy mb-0">Bootstrap forms only, clearer typography, and a much calmer registration layout.</p>
                  </div>
                  <Link to="/login" className="btn btn-ticket-outline">
                    Sign in
                  </Link>
                </div>

                <div className="btn-group mode-toggle w-100 mb-4" role="group" aria-label="Registration mode">
                  <button type="button" className={`btn btn-outline-secondary ${mode === "user" ? "active" : ""}`} onClick={() => resetForMode("user")}>
                    User
                  </button>
                  <button type="button" className={`btn btn-outline-secondary ${mode === "coach" ? "active" : ""}`} onClick={() => resetForMode("coach")}>
                    Coach
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input className="form-control" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className={`form-control ${emailError ? 'is-invalid' : ''}`}
                        value={form.email}
                        onChange={(event) => { setForm({ ...form, email: event.target.value }); setEmailError("") }}
                        required
                      />
                      {emailError ? <div className="invalid-feedback">{emailError}</div> : null}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contact Number</label>
                      <input
                        className={`form-control ${contactError ? 'is-invalid' : ''}`}
                        value={form.contact}
                        onChange={(event) => { setForm({ ...form, contact: event.target.value }); setContactError("") }}
                        required
                      />
                      {contactError ? <div className="invalid-feedback">{contactError}</div> : null}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Password</label>
                      <input type="password" className="form-control" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Confirm Password</label>
                      <input type="password" className="form-control" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required />
                    </div>

                    {mode === "coach" ? (
                      <>
                        <div className="col-md-6">
                          <label className="form-label">Organisation Name</label>
                          <input className="form-control" value={form.organisationName} onChange={(event) => setForm({ ...form, organisationName: event.target.value })} required />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Experience Years</label>
                          <input type="number" className="form-control" value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: event.target.value })} required />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Coach Bio</label>
                          <textarea className="form-control" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} required />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Select Sports</label>
                          <div className="row g-2">
                            {loadingSports ? (
                              <div className="col-12 text-muted small">Loading sports...</div>
                            ) : (
                              sports.map((sport) => (
                                <div className="col-md-6" key={sport._id}>
                                  <label className="sport-choice w-100">
                                    <input
                                      type="checkbox"
                                      className="form-check-input mt-0"
                                      checked={form.sportsIds.includes(sport._id)}
                                      onChange={() => toggleSport(sport._id)}
                                    />
                                    <span>{sport.sportName}</span>
                                  </label>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="col-12">
                          <label className="form-label">Verification Document</label>
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*,.pdf"
                            onChange={(event) => setForm({ ...form, document: event.target.files?.[0] || null })}
                            required
                          />
                        </div>
                        <div className="col-12">
                          <div className="hint-box">Coach registrations stay pending until an admin reviews and approves the profile.</div>
                        </div>
                      </>
                    ) : null}
                  </div>

                  <button type="submit" className="btn btn-ticket-primary w-100 mt-4" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Creating account...
                      </>
                    ) : (
                      `Create ${mode === "coach" ? "Coach" : "User"} Account`
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <span className="text-muted">Already have an account? </span>
                  <Link to="/login" className="text-danger fw-bold">
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
