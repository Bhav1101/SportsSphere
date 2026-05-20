import { Link } from "react-router-dom"

const sports = ["Cricket", "Football", "Kabaddi", "Hockey", "Badminton"]
const links = [
  ["Home", "/"],
  ["Matches", "/matches"],
  ["Login", "/login"],
  ["Register", "/register"],
]

export default function Footer() {
  return (
    <footer className="footer-wrap">
      <div className="container container-compact">
        <div className="footer-shell">
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="topbar-brand mb-3">
                <span className="topbar-brand-mark">
                  <i className="bi bi-ticket-perforated-fill" />
                </span>
                <span>
                  SportsSphere
                  <small>Match Discovery and Booking</small>
                </span>
              </div>
              <p className="footer-copy mb-3">
                A clean ticketing experience for live sports. Browse fixtures, compare venues, and reserve seats in a flow that feels simple and familiar.
              </p>
              <div className="d-flex gap-2">
                {["instagram", "twitter-x", "youtube", "facebook"].map((item) => (
                  <a key={item} href="#" className="footer-social" aria-label={item}>
                    <i className={`bi bi-${item}`} />
                  </a>
                ))}
              </div>
            </div>

            <div className="col-sm-6 col-lg-2">
              <h6 className="footer-title">Explore</h6>
              <div className="d-flex flex-column">
                {links.map(([label, to]) => (
                  <Link key={label} to={to} className="footer-link">
                    <i className="bi bi-chevron-right" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="col-sm-6 col-lg-2">
              <h6 className="footer-title">Sports</h6>
              <div className="d-flex flex-column">
                {sports.map((sport) => (
                  <Link key={sport} to={`/matches?sport=${encodeURIComponent(sport)}`} className="footer-link">
                    <i className="bi bi-chevron-right" />
                    {sport}
                  </Link>
                ))}
              </div>
            </div>

            <div className="col-lg-4">
              <h6 className="footer-title">Support</h6>
              <div className="footer-meta d-flex flex-column gap-2">
                <span>
                  <i className="bi bi-geo-alt me-2" />
                  Mumbai, India
                </span>
                <span>
                  <i className="bi bi-telephone me-2" />
                  +91 98000 00000
                </span>
                <span>
                  <i className="bi bi-envelope me-2" />
                  support@sportssphere.com
                </span>
              </div>
              <div className="mt-3">
                <div className="input-group">
                  <input className="form-control" type="email" placeholder="Enter your email" />
                  <button className="btn btn-ticket-primary" type="button">
                    Notify Me
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 mt-4 pt-4 border-top">
            <span className="footer-meta">Copyright 2026 SportsSphere. All rights reserved.</span>
            <span className="footer-meta">Built for fast event browsing, reliable bookings, and cleaner match discovery.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
