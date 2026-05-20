import { Link, NavLink, useNavigate } from "react-router-dom"
import { useApp } from "../../context/AppContext"

const sportsLinks = ["Cricket", "Football", "Kabaddi", "Hockey", "Badminton", "Tennis"]

export default function Header() {
  const { currentUser, role, logout } = useApp()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const getDashboardLink = () => {
    if (role === "admin") return "/admin/dashboard"
    if (role === "coach") return "/coach/dashboard"
    return "/user/dashboard"
  }

  return (
    <nav className="navbar navbar-expand-lg fixed-top topbar-nav">
      <div className="container container-compact">
        <Link to="/" className="navbar-brand topbar-brand">
          <span className="topbar-brand-mark">
            <i className="bi bi-ticket-perforated-fill" />
          </span>
          <span>
            SportsSphere
            <small>Tickets and Match Booking</small>
          </span>
        </Link>

        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#sportsSphereNavbar"
          aria-controls="sportsSphereNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="sportsSphereNavbar">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink to="/" end className="nav-link">
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/matches" className="nav-link">
                Matches
              </NavLink>
            </li>
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle btn btn-link text-decoration-none"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                type="button"
              >
                Sports
              </button>
              <ul className="dropdown-menu">
                {sportsLinks.map((sport) => (
                  <li key={sport}>
                    <Link className="dropdown-item" to={`/matches?sport=${encodeURIComponent(sport)}`}>
                      {sport}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            {currentUser ? (
              <li className="nav-item">
                <NavLink to={getDashboardLink()} className="nav-link">
                  Dashboard
                </NavLink>
              </li>
            ) : null}
          </ul>

          <div className="d-flex align-items-center gap-2 flex-column flex-lg-row">
            {currentUser ? (
              <>
                <div className="text-center text-lg-end me-lg-2">
                  <div className="fw-semibold">{currentUser.name?.split(" ")[0] || "Guest"}</div>
                  <small className="text-muted text-uppercase">{role || "user"}</small>
                </div>
                <button type="button" onClick={handleLogout} className="btn btn-ticket-outline">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ticket-outline">
                  Login
                </Link>
                <Link to="/register" className="btn btn-ticket-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
