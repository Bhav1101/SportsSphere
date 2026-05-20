import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { useApp } from "../../context/AppContext"
import { coachLogin, userLogin } from "../../services/userService"
import { resolveObject } from "../../utils/appHelpers"

function getRoleFromUserType(userType) {
  if (Number(userType) === 1) return "admin"
  if (Number(userType) === 2) return "coach"
  if (Number(userType) === 3) return "user"

  const value = String(userType || "").toLowerCase()
  if (value === "admin") return "admin"
  if (value === "coach") return "coach"
  return "user"
}

function extractLoginData(response) {
  const payload = resolveObject(response?.data)
  const data = resolveObject(payload.data || payload.user || payload.result)
  const user = resolveObject(data.user || data.coach || data.account || data)
  const token = payload.token || payload.accessToken || data.token || data.accessToken || user.token || null
  return { payload, user, token }
}

export default function Login() {
  const [mode, setMode] = useState("user")
  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const { login } = useApp()
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email)
    if (!isValidEmail(form.email)) {
      setEmailError("Please enter a valid email address")
      setLoading(false)
      return
    }

    try {
      const response = mode === "coach" ? await coachLogin(form) : await userLogin(form)
      const { payload, user, token } = extractLoginData(response)

      if (payload.success === false) {
        throw new Error(payload.message || "Login failed")
      }

      const role = getRoleFromUserType(user.userType || user.role)
      login(user, role, token)
      toast.success(payload.message || "Login successful")

      if (role === "admin") navigate("/admin/dashboard")
      else if (role === "coach") navigate("/coach/dashboard")
      else navigate("/user/dashboard")
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to login")
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
                  <i className="bi bi-person-check-fill" />
                  Welcome back
                </span>
                <h1 className="hero-title mb-3">Sign in and pick up your bookings where you left them.</h1>
                <p className="mb-4">
                  Access tickets, team applications, coach tools, and admin controls from one cleaner entry point.
                </p>
                <div className="form-dark-summary">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Fast ticket lookup</span>
                    <strong>Live</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Coach access</span>
                    <strong>Enabled</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Dashboard routing</span>
                    <strong>Automatic</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="auth-form-wrap">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                  <div>
                    <h2 className="auth-title mb-2">Sign in</h2>
                    <p className="section-copy mb-0">Readable forms, cleaner spacing, and the same backend logic underneath.</p>
                  </div>
                  <Link to="/" className="btn btn-ticket-outline">
                    Back Home
                  </Link>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className={`form-control ${emailError ? 'is-invalid' : ''}`}
                      placeholder={mode === "coach" ? "coach@email.com" : "you@example.com"}
                      value={form.email}
                      onChange={(event) => { setForm({ ...form, email: event.target.value }); setEmailError("") }}
                      required
                    />
                    {emailError ? <div className="invalid-feedback">{emailError}</div> : null}
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-ticket-primary w-100" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Signing in...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <span className="text-muted">New to SportsSphere? </span>
                  <Link to="/register" className="text-danger fw-bold">
                    Create account
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
