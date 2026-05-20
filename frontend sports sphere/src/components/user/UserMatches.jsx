import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import { publicFetchAllMatches } from "../../services/matchService"
import { publicFetchAllSports } from "../../services/sportService"
import { formatCurrency, formatDate, getInitials, getMediaUrl, resolveList } from "../../utils/appHelpers"
import { USER_NAV } from "./userShared"

export default function UserMatches() {
  const [searchParams] = useSearchParams()
  const [sports, setSports] = useState([])
  const [matches, setMatches] = useState([])
  const [filterSport, setFilterSport] = useState(searchParams.get("sport") || "")
  const [filterCity, setFilterCity] = useState(searchParams.get("city") || "")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const safe = (promise) => promise.catch(() => ({ data: { data: [] } }))
    Promise.all([safe(publicFetchAllSports()), safe(publicFetchAllMatches())])
      .then(([sportsRes, matchesRes]) => {
        setSports(resolveList(sportsRes.data?.data, ["sports", "items", "rows"]))
        setMatches(resolveList(matchesRes.data?.data, ["matches", "items", "rows"]))
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load matches")
      })
      .finally(() => setLoading(false))
  }, [])

  const upcomingMatches = useMemo(
    () => matches.filter((item) => String(item.status || "").toLowerCase() === "upcoming"),
    [matches],
  )

  const cityOptions = [...new Set(upcomingMatches.map((item) => item.city || item.venueId?.city).filter(Boolean))]

  const filteredMatches = upcomingMatches.filter((match) => {
    const sportName = match.sportId?.sportName || ""
    const city = match.city || match.venueId?.city || ""

    if (filterSport && sportName !== filterSport) return false
    if (filterCity && city !== filterCity) return false

    return true
  })

  return (
    <DashboardLayout navItems={USER_NAV} panelLabel="User Panel" panelColor="#3b82f6" darkMode={true}>
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>Browse Matches</h5>
          <div style={{ color: "var(--ss-muted)", fontSize: "0.78rem" }}>Browse upcoming fixtures without leaving your dashboard.</div>
        </div>
      </div>

      <div className="ss-content fade-in user-matches-page">
        <div className="match-card mb-4" style={{ padding: 12 }}>
          <div className="row g-3 align-items-end">
            <div className="col-lg-6">
              <span className="section-label">Browse Matches</span>
              <h1 className="section-heading mb-2" style={{ fontSize: "1.7rem", lineHeight: 1.08, maxWidth: 520 }}>
                Find upcoming sports events with cleaner filters and clearer pricing.
              </h1>
              <p className="section-copy mb-0" style={{ fontSize: "0.8rem", maxWidth: 520 }}>
                Use the filters to narrow fixtures while staying inside the user dashboard.
              </p>
            </div>

            <div className="col-lg-6">
              <div className="row g-2">
                <div className="col-md-5">
                  <label className="form-label" style={{ fontSize: "0.72rem" }}>Sport</label>
                  <select className="form-select" style={{ minHeight: 38, fontSize: "0.84rem" }} value={filterSport} onChange={(event) => setFilterSport(event.target.value)}>
                    <option value="">All sports</option>
                    {sports.map((sport) => (
                      <option key={sport._id} value={sport.sportName}>
                        {sport.sportName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-5">
                  <label className="form-label" style={{ fontSize: "0.72rem" }}>City</label>
                  <select className="form-select" style={{ minHeight: 38, fontSize: "0.84rem" }} value={filterCity} onChange={(event) => setFilterCity(event.target.value)}>
                    <option value="">All cities</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-ticket-outline w-100"
                    style={{ minHeight: 38, fontSize: "0.78rem" }}
                    onClick={() => {
                      setFilterSport("")
                      setFilterCity("")
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mb-4">
            <div className="row g-2">
            {[
              { label: "Upcoming events", value: upcomingMatches.length },
              { label: "Filtered results", value: filteredMatches.length },
              { label: "Cities", value: cityOptions.length },
            ].map((item) => (
              <div className="col-sm-4" key={item.label}>
                <div className="match-card" style={{ padding: 12 }}>
                  <div className="text-muted small text-uppercase fw-bold mb-1" style={{ fontSize: "0.68rem" }}>{item.label}</div>
                  <div className="mb-0 fw-bold text-dark" style={{ fontSize: "1.45rem", lineHeight: 1 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          {loading ? (
            <div className="match-card ticket-empty">
              <h3>Loading matches</h3>
              <p>Pulling the latest list of upcoming fixtures.</p>
            </div>
          ) : filteredMatches.length ? (
            <div className="row g-3">
              {filteredMatches.map((match) => (
                <div className="col-lg-6" key={match._id}>
                  <div className="event-card" style={{ padding: 14 }}>
                    <div className="event-card-top" style={{ marginBottom: 10 }}>
                      <div className="d-flex flex-wrap gap-2">
                        <span className="event-badge" style={{ fontSize: "0.66rem", padding: "0.25rem 0.6rem" }}>{match.sportId?.sportName || "Sport"}</span>
                        <span className="chip-badge" style={{ fontSize: "0.66rem", padding: "0.25rem 0.6rem" }}>{match.availableSeats || 0} seats left</span>
                      </div>
                      <span className="price-text" style={{ fontSize: "0.95rem" }}>{formatCurrency(match.ticketPrice)}</span>
                    </div>

                    <div className="teams-row justify-content-between" style={{ gap: 10 }}>
                      <div className="d-flex align-items-center gap-2">
                        {match.team1Id?.logo ? (
                          <img src={getMediaUrl(match.team1Id.logo)} alt={match.team1Id.teamName} className="team-avatar" style={{ width: 46, height: 46 }} />
                        ) : (
                          <span className="team-avatar-fallback" style={{ width: 46, height: 46, fontSize: "0.88rem" }}>{getInitials(match.team1Id?.teamName)}</span>
                        )}
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: "1rem" }}>{match.team1Id?.teamName || "Team 1"}</div>
                        </div>
                      </div>

                      <span className="teams-vs" style={{ width: 34, height: 34, fontSize: "0.82rem", fontWeight: 700 }}>VS</span>

                      <div className="d-flex align-items-center gap-2 text-end">
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: "1rem" }}>{match.team2Id?.teamName || "Team 2"}</div>
                        </div>
                        {match.team2Id?.logo ? (
                          <img src={getMediaUrl(match.team2Id.logo)} alt={match.team2Id.teamName} className="team-avatar" style={{ width: 46, height: 46 }} />
                        ) : (
                          <span className="team-avatar-fallback" style={{ width: 46, height: 46, fontSize: "0.88rem" }}>{getInitials(match.team2Id?.teamName)}</span>
                        )}
                      </div>
                    </div>

                    <h2 className="text-dark mb-2" style={{ fontSize: "1.12rem", lineHeight: 1.2 }}>{match.matchName}</h2>
                    <div className="meta-row mb-2" style={{ fontSize: "0.78rem", gap: 10 }}>
                      <span style={{ color: "var(--ss-heading)", fontWeight: 600 }}>
                        <i className="bi bi-calendar-event me-1" />
                        {formatDate(match.matchDate)}
                      </span>
                      <span style={{ color: "var(--ss-heading)", fontWeight: 600 }}>
                        <i className="bi bi-clock me-1" />
                        {match.matchTime || "-"}
                      </span>
                      <span style={{ color: "var(--ss-heading)", fontWeight: 600 }}>
                        <i className="bi bi-geo-alt me-1" />
                        {match.venueId?.venueName || "-"}, {match.venueId?.city || match.city || "-"}
                      </span>
                    </div>
                    <p className="section-copy mb-3" style={{ fontSize: "0.84rem" }}>{match.description || "Secure booking flow with up-to-date availability and venue information."}</p>

                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="text-muted small">
                        Starting from <strong className="text-dark">{formatCurrency(match.ticketPrice)}</strong>
                      </div>
                        <Link to={`/match/${match._id}`} className="btn btn-ticket-primary" style={{ padding: "0.6rem 1rem", fontSize: "0.82rem" }}>
                        View details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="match-card ticket-empty">
              <h3>No matches fit the current filters</h3>
              <p>Try another city or reset the sport filter to widen the list.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
