import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import { publicFetchAllMatches } from "../../services/matchService"
import { publicFetchAllSports } from "../../services/sportService"
import { formatCurrency, formatDate, getInitials, getMediaUrl, resolveList } from "../../utils/appHelpers"

export default function Matches() {
  const [searchParams] = useSearchParams()
  const [sports, setSports] = useState([])
  const [matches, setMatches] = useState([])
  const [filterSport, setFilterSport] = useState(searchParams.get("sport") || "")
  const [filterCity, setFilterCity] = useState(searchParams.get("city") || "")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const safe = (p) => p.catch(() => ({ data: { data: [] } }))
    Promise.all([safe(publicFetchAllSports()), safe(publicFetchAllMatches())])
      .then(([sportsRes, matchesRes]) => {
        setSports(resolveList(sportsRes.data?.data, ["sports", "items", "rows"]))
        setMatches(resolveList(matchesRes.data?.data, ["matches", "items", "rows"]))
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
    <main className="public-page">
      <div className="container container-compact">
        <section className="surface-card mb-4">
          <div className="row g-4 align-items-end">
            <div className="col-lg-6">
              <span className="section-label">Browse Matches</span>
              <h1 className="section-heading mb-2">Find upcoming sports events with cleaner filters and clearer pricing.</h1>
              <p className="section-copy mb-0">This screen now behaves more like a ticketing catalogue: obvious filters first, event cards second.</p>
            </div>

            <div className="col-lg-6">
              <div className="row g-2">
                <div className="col-md-5">
                  <label className="form-label">Sport</label>
                  <select className="form-select" value={filterSport} onChange={(event) => setFilterSport(event.target.value)}>
                    <option value="">All sports</option>
                    {sports.map((sport) => (
                      <option key={sport._id} value={sport.sportName}>
                        {sport.sportName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-5">
                  <label className="form-label">City</label>
                  <select className="form-select" value={filterCity} onChange={(event) => setFilterCity(event.target.value)}>
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
        </section>

        <section className="mb-4">
          <div className="row g-3">
            {[
              { label: "Upcoming events", value: upcomingMatches.length },
              { label: "Filtered results", value: filteredMatches.length },
              { label: "Cities", value: cityOptions.length },
            ].map((item) => (
              <div className="col-sm-4" key={item.label}>
                <div className="surface-card">
                  <div className="text-muted small text-uppercase fw-bold mb-2">{item.label}</div>
                  <div className="h3 mb-0 fw-bold text-dark">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          {loading ? (
            <div className="surface-card ticket-empty">
              <h3>Loading matches</h3>
              <p>Pulling the latest list of upcoming fixtures.</p>
            </div>
          ) : filteredMatches.length ? (
            <div className="row g-4">
              {filteredMatches.map((match) => (
                <div className="col-lg-6" key={match._id}>
                  <div className="event-card">
                    <div className="event-card-top">
                      <div className="d-flex flex-wrap gap-2">
                        <span className="event-badge">{match.sportId?.sportName || "Sport"}</span>
                        <span className="chip-badge">{match.availableSeats || 0} seats left</span>
                      </div>
                      <span className="price-text">{formatCurrency(match.ticketPrice)}</span>
                    </div>

                    <div className="teams-row justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        {match.team1Id?.logo ? (
                          <img src={getMediaUrl(match.team1Id.logo)} alt={match.team1Id.teamName} className="team-avatar" />
                        ) : (
                          <span className="team-avatar-fallback">{getInitials(match.team1Id?.teamName)}</span>
                        )}
                        <div>
                          <div className="fw-bold text-dark">{match.team1Id?.teamName || "Team 1"}</div>
                          <small className="text-muted">{match.city || match.venueId?.city || "-"}</small>
                        </div>
                      </div>

                      <span className="teams-vs">VS</span>

                      <div className="d-flex align-items-center gap-2 text-end">
                        <div>
                          <div className="fw-bold text-dark">{match.team2Id?.teamName || "Team 2"}</div>
                          <small className="text-muted">{match.venueId?.venueName || "-"}</small>
                        </div>
                        {match.team2Id?.logo ? (
                          <img src={getMediaUrl(match.team2Id.logo)} alt={match.team2Id.teamName} className="team-avatar" />
                        ) : (
                          <span className="team-avatar-fallback">{getInitials(match.team2Id?.teamName)}</span>
                        )}
                      </div>
                    </div>

                    <h2 className="h5 text-dark mb-2">{match.matchName}</h2>
                    <div className="meta-row mb-3">
                      <span>
                        <i className="bi bi-calendar-event me-1" />
                        {formatDate(match.matchDate)}
                      </span>
                      <span>
                        <i className="bi bi-clock me-1" />
                        {match.matchTime || "-"}
                      </span>
                      <span>
                        <i className="bi bi-geo-alt me-1" />
                        {match.venueId?.venueName || "-"}, {match.venueId?.city || match.city || "-"}
                      </span>
                    </div>
                    <p className="section-copy mb-4">{match.description || "Secure booking flow with up-to-date availability and venue information."}</p>

                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="text-muted small">
                        Starting from <strong className="text-dark">{formatCurrency(match.ticketPrice)}</strong>
                      </div>
                      <Link to={`/match/${match._id}`} className="btn btn-ticket-primary">
                        View details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface-card ticket-empty">
              <h3>No matches fit the current filters</h3>
              <p>Try another city or reset the sport filter to widen the list.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
