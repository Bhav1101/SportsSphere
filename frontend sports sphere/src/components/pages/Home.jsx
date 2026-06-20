import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { publicFetchAllMatches } from "../../services/matchService"
import { publicFetchAllSports } from "../../services/sportService"
import { formatCurrency, formatDate, getInitials, getMediaUrl, resolveList } from "../../utils/appHelpers"

const iconBySport = {
  cricket: "bi-trophy",
  football: "bi-dribbble",
  kabaddi: "bi-lightning-charge",
  hockey: "bi-bullseye",
  badminton: "bi-record-circle",
  tennis: "bi-circle-square",
}

export default function Home() {
  const navigate = useNavigate()
  const [sports, setSports] = useState([])
  const [matches, setMatches] = useState([])
  const [selectedCity, setSelectedCity] = useState("")
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
    () =>
      matches
        .filter((item) => String(item.status || "").toLowerCase() === "upcoming")
        .sort((first, second) => new Date(first.matchDate || 0).getTime() - new Date(second.matchDate || 0).getTime())
        .slice(0, 6),
    [matches],
  )

  const cityOptions = [...new Set(matches.map((item) => item.city || item.venueId?.city).filter(Boolean))]

  const handleSearch = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (selectedCity) params.set("city", selectedCity)
    navigate(`/matches${params.toString() ? `?${params.toString()}` : ""}`)
  }

  const heroStats = [
    { label: "Live sports", value: sports.length || 0 },
    { label: "Upcoming events", value: upcomingMatches.length || 0 },
    { label: "Cities covered", value: cityOptions.length || 0 },
  ]

  const visibleSports = useMemo(() => sports.slice(0, 6), [sports])
  const featuredSport = visibleSports[0]
  const supportingSports = visibleSports.slice(1)

  return (
    <main className="public-page">
      <div className="container container-compact">
        <section className="hero-panel mb-5">
          <div className="row g-4 align-items-center position-relative">
            <div className="col-lg-7">
              <span className="hero-tag">
                <i className="bi bi-stars" />
                Find your next match fast
              </span>
              <h1 className="hero-title mt-3 mb-3">
                Your game day,
                <br />
                all in one place
              </h1>
              <p className="hero-copy mb-4">
                Browse upcoming matches, check seats and prices, and lock in your spot without the usual back-and-forth.
              </p>

              <div className="search-card mb-4">
                <form onSubmit={handleSearch}>
                  <div className="row g-2 align-items-center">
                    <div className="col-md-8">
                      <label className="form-label mb-2">Search by city</label>
                      <select className="form-select" value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)}>
                        <option value="">All cities</option>
                        {cityOptions.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label mb-2 d-block opacity-0">Search</label>
                      <button type="submit" className="btn btn-ticket-primary w-100">
                        Find Matches
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="d-flex flex-wrap gap-3">
                {heroStats.map((item) => (
                  <div key={item.label} className="hero-stat">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-5">
              <div className="hero-visual-wrap">
                <img src="/assets/img/sport img.png" alt="Featured athlete" className="hero-visual-photo" />
                <div className="hero-visual-overlay">
                  <span className="hero-tag mb-2">Featured Team</span>
                  <h3>Built for fans</h3>
                  <p>See what is coming up, compare matches quickly, and book with confidence.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
            <div>
              <span className="section-label">Now Booking</span>
              <h2 className="section-heading">Upcoming matches worth planning for</h2>
              <p className="section-copy mb-0">Everything you need about the venue, timing, and seats in one place.</p>
            </div>
            <Link to="/matches" className="btn btn-ticket-primary">
              Explore schedule
            </Link>
          </div>

          {upcomingMatches.length ? (
            <div className="row g-4">
              {upcomingMatches.map((match) => (
                <div className="col-md-6 col-xl-4" key={match._id}>
                  <div className="event-card">
                    <div className="event-card-top">
                      <span className="event-badge">{match.sportId?.sportName || "Sport"}</span>
                      <span className="chip-badge">{match.availableSeats || 0} left</span>
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

                    <h3 className="h5 text-dark mb-2">{match.matchName}</h3>
                    <div className="meta-row mb-3">
                      <span>
                        <i className="bi bi-calendar-event me-1" />
                        {formatDate(match.matchDate)}
                      </span>
                      <span>
                        <i className="bi bi-clock me-1" />
                        {match.matchTime || "-"}
                      </span>
                    </div>
                    <p className="section-copy mb-4">{match.description || "Quick booking, live seat updates, and clear match details before you commit."}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="price-text">{formatCurrency(match.ticketPrice)}</span>
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
              <h3>{loading ? "Loading upcoming matches" : "No upcoming matches found"}</h3>
              <p>{loading ? "Please wait a moment while fixtures load." : "Once events are created, they will show up in this booking section."}</p>
            </div>
          )}
        </section>

        <section className="mb-5">
          <div className="row g-4">
            <div className="col-lg-4">
              <span className="section-label">Browse Sports</span>
              <h2 className="section-heading">Jump straight to the sport you care about</h2>
              <p className="section-copy">All your favorite sports in one place, ready to browse and book.</p>
              <Link to="/matches" className="btn btn-ticket-primary mt-2">
                Explore all sports
              </Link>
            </div>
            <div className="col-lg-8">
              {visibleSports.length ? (
                <div className="sport-bento-grid">
                  {featuredSport ? (
                    <Link
                      to={`/matches?sport=${encodeURIComponent(featuredSport.sportName)}`}
                      className="surface-card sport-bento-card sport-bento-card--feature"
                    >
                      <div className="sport-bento-copy">
                        <span className="sport-icon sport-icon--large">
                          <i className={`bi ${iconBySport[String(featuredSport.sportName || "").toLowerCase()] || "bi-trophy"}`} />
                        </span>
                        <div>
                          <span className="sport-bento-label">Featured sport</span>
                          <h3 className="sport-bento-title">{featuredSport.sportName}</h3>
                          <p className="section-copy sport-bento-description mb-0">{featuredSport.description || "See fixtures, venues, and upcoming tickets for this sport at a glance."}</p>
                        </div>
                      </div>
                      <div className="sport-bento-meta">
                        <span>{featuredSport.totalTeams || 0} teams</span>
                        <span>{featuredSport.matchDuration || 0} mins</span>
                      </div>
                    </Link>
                  ) : null}

                  {supportingSports.map((sport, index) => {
                      const icon = iconBySport[String(sport.sportName || "").toLowerCase()] || "bi-trophy"
                      return (
                        <Link
                          key={sport._id}
                          to={`/matches?sport=${encodeURIComponent(sport.sportName)}`}
                          className={`surface-card sport-bento-card sport-bento-card--compact sport-bento-card--pos-${index + 1}`}
                        >
                          <span className="sport-icon">
                            <i className={`bi ${icon}`} />
                          </span>
                          <div className="sport-bento-card-body">
                            <h3 className="h5 text-dark mb-2">{sport.sportName}</h3>
                            <p className="section-copy sport-bento-description sport-bento-description--compact mb-3">{sport.description || "Open the latest fixtures, venue details, and ticket drops for this sport."}</p>
                            <div className="meta-row">
                              <span>{sport.totalTeams || 0} teams</span>
                              <span>{sport.matchDuration || 0} mins</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                </div>
              ) : (
                <div className="surface-card ticket-empty">
                  <h3>{loading ? "Loading sports" : "No sports available"}</h3>
                  <p>{loading ? "A few more seconds while categories are fetched." : "Sports categories will appear here once they are available from the API."}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="row g-4">
            {[
              {
                title: "Find details quickly",
                copy: "Venue, date, seat count, and starting price are easy to spot before you book.",
                icon: "bi-layout-text-window-reverse",
              },
              {
                title: "Compare options faster",
                copy: "Scan nearby matches side by side and choose the one that fits your schedule.",
                icon: "bi-grid-1x2",
              },
              {
                title: "Book with confidence",
                copy: "Clear layouts and consistent controls make the booking flow feel simple and reliable.",
                icon: "bi-shield-check",
              },
            ].map((item) => (
              <div className="col-md-4" key={item.title}>
                <div className="insight-card">
                  <div className="sport-icon mb-3">
                    <i className={`bi ${item.icon}`} />
                  </div>
                  <h3 className="h5 text-dark">{item.title}</h3>
                  <p className="section-copy mb-0">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
