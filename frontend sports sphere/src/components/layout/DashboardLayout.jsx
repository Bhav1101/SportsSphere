import { Link, useLocation, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { useApp } from "../../context/AppContext"

export default function DashboardLayout({
  children,
  navItems,
  panelLabel,
  panelColor = "#4f46e5",
  darkMode = false,
}) {
  const { currentUser, logout } = useApp()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove("dashboard-mode")
      return
    }

    document.body.classList.add("dashboard-mode")
    return () => document.body.classList.remove("dashboard-mode")
  }, [darkMode])

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const sidebarBg = "linear-gradient(180deg, #2f7d57 0%, #22533c 100%)"
  const sidebarBorder = darkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.08)"
  const logoBg = "transparent"
  const navDividerColor = darkMode ? "#b9d7d6" : "#cfe7e6"
  const navLinkColor = darkMode ? "#d5eceb" : "#ecf8f7"
  const navLinkHoverBg = "rgba(255,255,255,0.08)"
  const navLinkHoverCol = "#ffffff"
  const userNameColor = "#ffffff"
  const userEmailColor = darkMode ? "#bcd8d7" : "#d6eceb"
  const userSectionBg = "rgba(0,0,0,0.14)"
  const userSectionBord = "rgba(255,255,255,0.08)"
  const logoutBg = darkMode ? "rgba(217,83,79,0.14)" : "rgba(255,255,255,0.08)"
  const logoutBorder = darkMode ? "rgba(217,83,79,0.26)" : "rgba(255,255,255,0.14)"
  const wrapperBg = "#ffffff"
  const mainBg = "linear-gradient(180deg, #ffffff 0%, #fbfdfb 100%)"

  return (
    <div className={darkMode ? "ss-dark" : ""} style={{ display: "block", minHeight: "100vh", background: wrapperBg }}>
      <aside className="ss-sidebar" style={{ background: sidebarBg, borderRightColor: sidebarBorder }}>
        <div className="sidebar-logo" style={{ background: logoBg, borderBottomColor: sidebarBorder }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <h2 style={{ color: darkMode ? "#f8fafc" : "#0f172a" }}>SportsSphere</h2>
          </Link>
          <small
            style={{
              color: panelColor,
              background: `${panelColor}18`,
              border: `1px solid ${panelColor}30`,
              borderRadius: 20,
              padding: "2px 10px",
              display: "inline-block",
              marginTop: 6,
            }}
          >
            {panelLabel}
          </small>
        </div>

        <nav style={{ flex: 1, paddingTop: 12 }}>
          {navItems.map((item) =>
            item.divider ? (
              <div
                key={item.label}
                style={{
                  padding: "14px 22px 6px",
                  color: navDividerColor,
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  fontWeight: 700,
                }}
              >
                {item.label}
              </div>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className={location.pathname === item.to ? "active" : ""}
                style={{ color: navLinkColor }}
                onMouseEnter={(event) => {
                  if (location.pathname !== item.to) {
                    event.currentTarget.style.background = navLinkHoverBg
                    event.currentTarget.style.color = navLinkHoverCol
                  }
                }}
                onMouseLeave={(event) => {
                  if (location.pathname !== item.to) {
                    event.currentTarget.style.background = "transparent"
                    event.currentTarget.style.color = navLinkColor
                  }
                }}
              >
                <i className={item.icon} />
                {item.label}
                {item.badge && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: 20,
                      padding: "1px 8px",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ),
          )}
        </nav>

        <div className="sidebar-user" style={{ background: userSectionBg, borderTopColor: userSectionBord }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${panelColor}, #0f172a)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
                color: "#fff",
                fontSize: "0.9rem",
                flexShrink: 0,
              }}
            >
              {currentUser?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  color: userNameColor,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentUser?.name || "SportsSphere"}
              </div>
              <div style={{ color: userEmailColor, fontSize: "0.72rem" }}>
                {currentUser?.email || "admin@sportssphere.com"}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              background: logoutBg,
              border: `1px solid ${logoutBorder}`,
              color: darkMode ? "#ffd6d4" : "#ffffff",
              borderRadius: 999,
              padding: "9px 8px",
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.2s",
              fontWeight: 600,
            }}
          >
            <i className="bi bi-box-arrow-right me-2" />
            Logout
          </button>
        </div>
      </aside>

      <div className="ss-main" style={{ background: mainBg }}>
        {children}
      </div>
    </div>
  )
}
