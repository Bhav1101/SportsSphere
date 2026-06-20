import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import { publicFetchSingleMatch } from "../../services/matchService"
import { createOrder, lockSeats, unlockSeats, verifyPayment, fetchMyBookings } from "../../services/bookingService"
import { BASE_URL, USER_BOOKING_UNLOCKSEATS } from "../../endPoints"
import { useApp } from "../../context/AppContext"
import {
  extractOrderDetails,
  formatCurrency,
  formatDate,
  formatDateTime,
  getCountdownParts,
  getInitials,
  getMediaUrl,
  getStatusBadgeStyle,
  loadRazorpayScript,
  resolveObject,
} from "../../utils/appHelpers"

export default function MatchDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useApp()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [seatCount, setSeatCount] = useState(1)
  const [locking, setLocking] = useState(false)
  const [paying, setPaying] = useState(false)
  const [lockData, setLockData] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [userExistingBooking, setUserExistingBooking] = useState(null)
  const lockRef = useRef(null)
  const paymentDoneRef = useRef(false)
  const unlockTriggeredRef = useRef(false)

  useEffect(() => {
    loadMatch()
  }, [id])

  useEffect(() => {
    if (currentUser?._id) {
      loadUserBookings()
    }
  }, [currentUser])

  useEffect(() => {
    lockRef.current = lockData
  }, [lockData])

  useEffect(() => {
    paymentDoneRef.current = Boolean(confirmedBooking)
  }, [confirmedBooking])

  useEffect(() => {
    if (!lockData?.lockId || !lockData?.lockExpiry) return undefined

    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(lockData.lockExpiry).getTime() - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0 && !unlockTriggeredRef.current) {
        unlockTriggeredRef.current = true
        handleUnlock(true)
      }
    }

    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [lockData])

  useEffect(() => {
    return () => {
      const activeLock = lockRef.current
      if (!activeLock?.lockId || paymentDoneRef.current) return

      fetch(BASE_URL + USER_BOOKING_UNLOCKSEATS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: localStorage.getItem("token") || "",
        },
        body: JSON.stringify({ lockId: activeLock.lockId }),
        keepalive: true,
      }).catch(() => {})
    }
  }, [])

  const loadMatch = () => {
    setLoading(true)
    publicFetchSingleMatch({ _id: id })
      .then((response) => {
        setMatch(resolveObject(response.data?.data?.match || response.data?.data))
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load this match")
      })
      .finally(() => setLoading(false))
  }

  const loadUserBookings = () => {
    fetchMyBookings()
      .then((response) => {
        const bookings = resolveObject(response.data?.data?.bookings || response.data?.data)
        const bookingList = Array.isArray(bookings) ? bookings : []
        const existingBooking = bookingList.find(
          (booking) => booking.matchId?._id === id && String(booking.bookingStatus || "").toLowerCase() === "confirmed"
        )
        setUserExistingBooking(existingBooking || null)
      })
      .catch(() => {
        setUserExistingBooking(null)
      })
  }

  const handleLockSeats = () => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    setLocking(true)
    lockSeats({ matchId: id, seatsCount: seatCount })
      .then((response) => {
        const payload = resolveObject(response.data?.data)
        const nextLock = {
          lockId: payload.lockId || payload._id || payload.lock?._id,
          lockExpiry: payload.lockExpiry || payload.expiresAt || payload.expiry || new Date(Date.now() + 4 * 60 * 1000).toISOString(),
          seatsCount: payload.seatsCount || seatCount,
        }

        if (!nextLock.lockId) {
          console.error("lockSeats response missing lock information", response?.data)
          toast.error(response.data?.message || response.data?.data?.message || "Unable to lock seats")
          return
        }

        unlockTriggeredRef.current = false
        setLockData(nextLock)
        toast.success(response.data?.message || "Seats locked for 4 minutes")
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || error.message || "Unable to lock seats")
      })
      .finally(() => setLocking(false))
  }

  const handleUnlock = (expired = false) => {
    const activeLockId = lockRef.current?.lockId
    if (!activeLockId) return

    unlockSeats({ lockId: activeLockId })
      .then(() => {
        if (expired) {
          toast.info("Your seat lock expired. Pick seats again to continue.")
        } else {
          toast.success("Seat lock released")
        }
      })
      .catch(() => {
        if (expired) {
          toast.info("Your seat lock expired. Pick seats again to continue.")
        }
      })
      .finally(() => {
        setLockData(null)
        setTimeLeft(0)
        loadMatch()
      })
  }

  const handlePayment = async () => {
    if (!lockData?.lockId) {
      toast.error("Lock seats before starting payment")
      return
    }

    // Ensure contact is present and coerced to string to avoid calling replace on non-strings
    const rawContact = currentUser?.contact
    const contactStr = rawContact == null ? "" : String(rawContact)
    const cleanContact = contactStr.replace(/\D/g, "")
    if (!cleanContact || cleanContact.length < 10) {
      toast.error("Please update your contact number in your profile (10 digit Indian number)")
      return
    }

    setPaying(true)
    const razorpayReady = await loadRazorpayScript()
    if (!razorpayReady) {
      toast.error("Unable to load Razorpay checkout")
      setPaying(false)
      return
    }

    createOrder({ lockId: lockData.lockId, contact: cleanContact })
      .then((response) => {
        const order = extractOrderDetails(response.data?.data)
        if (!order.key || !order.orderId) {
          console.error('CreateOrder response', response?.data)
          toast.error('Payment setup failed: incomplete order details (check server logs)')
          setPaying(false)
          return
        }

        const razorpay = new window.Razorpay({
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: order.name || "SportsSphere",
          description: order.description || "Sports ticket booking",
          order_id: order.orderId,
          theme: { color: "#2c7a7b" },
          handler: (paymentResponse) => {
            verifyPayment({
              lockId: lockData.lockId,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            })
              .then((verifyRes) => {
                paymentDoneRef.current = true
                const booking = resolveObject(verifyRes.data?.data?.booking || verifyRes.data?.data)
                setConfirmedBooking(booking)
                setLockData(null)
                setTimeLeft(0)
                toast.success(verifyRes.data?.message || "Booking confirmed")
                loadMatch()
              })
              .catch((error) => {
                toast.error(error.response?.data?.message || "Payment verification failed")
              })
              .finally(() => setPaying(false))
          },
          modal: {
            ondismiss: () => {
              setPaying(false)
              toast.info("Payment window closed. Your lock is still active until the timer ends.")
            },
          },
          prefill: {
            name: currentUser?.name || "",
            email: currentUser?.email || "",
            contact: cleanContact || "",
          },
        })

        razorpay.open()
      })
      .catch((error) => {
        console.error('createOrder error', error)
        toast.error(error.response?.data?.message || error.message || "Unable to create payment order (see console)")
        setPaying(false)
      })
  }

  if (loading) {
    return (
      <main className="public-page">
        <div className="container container-compact">
          <div className="surface-card ticket-empty">
            <h3>Loading match details</h3>
            <p>We are preparing the event summary for you.</p>
          </div>
        </div>
      </main>
    )
  }

  if (!match?._id) {
    return (
      <main className="public-page">
        <div className="container container-compact">
          <div className="surface-card ticket-empty">
            <h3>Match not found</h3>
            <p className="mb-3">The event you requested is not available right now.</p>
            <Link to="/matches" className="btn btn-ticket-primary">
              Back to Matches
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { minutes, seconds } = getCountdownParts(timeLeft)
  const canBook = String(match.status || "").toLowerCase() === "upcoming" && Number(match.availableSeats || 0) > 0 && !confirmedBooking && !userExistingBooking
  const maxSeats = Math.min(10, Math.max(1, Number(match.availableSeats || 1)))

  return (
    <main className="public-page">
      <div className="container container-compact">
        <section className="surface-card mb-4">
          <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
            <Link to="/matches" className="text-decoration-none fw-semibold">
              <i className="bi bi-arrow-left me-1" />
              All Matches
            </Link>
            <span className="text-muted">/</span>
            <span className="chip-badge">{match.sportId?.sportName || "Sport"}</span>
            <span
              style={{
                ...getStatusBadgeStyle(match.status),
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: "0.74rem",
                fontWeight: 700,
              }}
            >
              {match.status}
            </span>
          </div>

          <div className="row g-4 align-items-center">
            <div className="col-lg-8">
              <span className="section-label">Event Overview</span>
              <h1 className="section-heading mb-3">{match.matchName}</h1>
              <p className="section-copy mb-4">
                {match.description || "Secure booking flow with venue, date, and seat details presented in a cleaner event layout."}
              </p>

              <div className="d-flex flex-wrap align-items-center gap-4">
                {[match.team1Id, match.team2Id].map((team, index) => (
                  <div className="d-flex align-items-center gap-3" key={`${team?._id || team?.teamName || index}-${index}`}>
                    {team?.logo ? (
                      <img
                        src={getMediaUrl(team.logo)}
                        alt={team.teamName}
                        className="team-avatar"
                        style={{ width: 72, height: 72, borderRadius: 20 }}
                      />
                    ) : (
                      <div className="team-avatar-fallback" style={{ width: 72, height: 72, borderRadius: 20 }}>
                        {getInitials(team?.teamName)}
                      </div>
                    )}
                    <div>
                      <div className="fw-bold text-dark">{team?.teamName || `Team ${index + 1}`}</div>
                      <div className="text-muted small">{index === 0 ? "Home side" : "Away side"}</div>
                    </div>
                    {index === 0 ? <div className="teams-vs">VS</div> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-4">
              <div
                className="event-card"
                style={{
                  padding: 14,
                  position: "sticky",
                  top: 120,
                  maxHeight: "calc(100vh - 150px)",
                  overflowY: "auto",
                }}
              >
                {match.venueId?.image ? (
                  <img
                    src={getMediaUrl(match.venueId.image)}
                    alt={match.venueId.venueName}
                    style={{
                      width: "100%",
                      height: 180,
                      objectFit: "cover",
                      borderRadius: 12,
                      marginBottom: 12,
                      display: "block",
                    }}
                  />
                ) : null}
                <span className="section-label">Venue</span>
                <h3 className="h5 text-dark mb-2" style={{ fontSize: "1.05rem" }}>{match.venueId?.venueName || "-"}</h3>
                <div className="meta-row mb-2" style={{ fontSize: "0.78rem" }}>
                  <span>
                    <i className="bi bi-geo-alt me-1" />
                    {match.venueId?.city || match.city || "-"}
                  </span>
                </div>
                <div className="meta-row mb-3" style={{ fontSize: "0.78rem" }}>
                  <span>
                    <i className="bi bi-calendar-event me-1" />
                    {formatDate(match.matchDate)}
                  </span>
                  <span>
                    <i className="bi bi-clock me-1" />
                    {match.matchTime || "-"}
                  </span>
                </div>
                <div className="d-flex justify-content-between gap-3 align-items-center flex-wrap">
                  <div>
                    <div className="text-muted small text-uppercase fw-bold" style={{ fontSize: "0.7rem" }}>Total seats</div>
                    <div className="fw-bold text-dark" style={{ fontSize: "1rem" }}>{match.totalSeats || 0}</div>
                  </div>
                  <div className="text-end">
                    <div className="text-muted small text-uppercase fw-bold" style={{ fontSize: "0.7rem" }}>Available seats</div>
                    <div className="fw-bold text-dark" style={{ fontSize: "1rem" }}>{match.availableSeats || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="surface-card">
                <span className="section-label">Match Information</span>
                <h2 className="h4 text-dark mb-3">Everything you need before booking</h2>
                <div className="row g-3">
                  {[
                    ["Event date", formatDate(match.matchDate)],
                    ["Date and time", formatDateTime(match.matchDate, match.matchTime)],
                    ["Total seats", match.totalSeats || 0],
                  ].map(([label, value]) => (
                    <div className="col-md-6" key={label}>
                      <div className="info-card">
                        <div className="text-muted small text-uppercase fw-bold mb-2">{label}</div>
                        <div className="fw-bold text-dark">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div
                className="surface-card"
                style={{
                  position: "sticky",
                  top: 120,
                  height: "auto",
                  alignSelf: "flex-start",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {confirmedBooking ? (
                  <>
                    <span className="section-label">Booking Confirmed</span>
                    <h2 className="h4 text-dark mb-2">{confirmedBooking.transactionId || confirmedBooking._id || "Ticket secured"}</h2>
                    <p className="section-copy mb-4">
                      {confirmedBooking.seatsCount || seatCount} tickets confirmed for {match.matchName}. Your entry pass is now available in the tickets panel.
                    </p>
                    <div className="d-flex gap-2 flex-wrap">
                      <Link to="/user/tickets" className="btn btn-ticket-primary">
                        View Tickets
                      </Link>
                      <Link to="/matches" className="btn btn-ticket-outline">
                        Browse More
                      </Link>
                    </div>
                  </>
                ) : canBook ? (
                  <>
                    <span className="section-label">Ticket Booking</span>
                    <h2 className="h4 text-dark mb-2">Reserve seats for this event</h2>

                    <label className="form-label mb-2">Choose seats</label>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {Array.from({ length: maxSeats }, (_, index) => index + 1).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSeatCount(value)}
                          className={seatCount === value ? "btn-ss-primary" : "btn-ss-outline"}
                          style={{ minWidth: 46 }}
                          disabled={Boolean(lockData?.lockId)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>

                    <div className="info-card mb-2" style={{ overflow: "hidden", padding: "0.9rem", marginBottom: 0 }}>
                      <div className="d-flex justify-content-between mb-2 gap-2 flex-wrap">
                        <span className="text-muted" style={{ fontSize: "0.82rem" }}>{seatCount} seat(s)</span>
                        <span className="fw-semibold text-dark" style={{ whiteSpace: "nowrap", fontSize: "0.9rem" }}>{formatCurrency(Number(match.ticketPrice || 0) * seatCount)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                        <span className="fw-bold text-dark" style={{ fontSize: "0.92rem" }}>Total</span>
                        <span className="price-text" style={{ fontSize: "1rem", whiteSpace: "nowrap", lineHeight: 1 }}>
                          {formatCurrency(Number(match.ticketPrice || 0) * seatCount)}
                        </span>
                      </div>
                    </div>

                    {lockData?.lockId ? (
                      <div className="info-card mb-2" style={{ background: "rgba(212, 139, 41, 0.08)", borderColor: "rgba(212, 139, 41, 0.18)", padding: "0.9rem", marginBottom: 0 }}>
                        <div className="fw-bold mb-1" style={{ color: "#8c6424" }}>
                          Seats locked for {seatCount} fan{seatCount > 1 ? "s" : ""}
                        </div>
                        <div className="h2 text-dark mb-1">
                          {minutes}:{seconds}
                        </div>
                        <div className="text-muted small">Complete payment before the timer ends.</div>
                      </div>
                    ) : null}

                    <div style={{ marginTop: "auto" }}>
                      {!lockData?.lockId ? (
                        <button type="button" onClick={handleLockSeats} className="btn btn-ticket-primary w-100" disabled={locking}>
                          {locking ? "Booking seats..." : "Book Your Seats"}
                        </button>
                      ) : (
                        <div className="d-flex gap-2 flex-wrap">
                          <button type="button" onClick={() => handleUnlock(false)} className="btn btn-ticket-outline flex-grow-1">
                            Release Lock
                          </button>
                          <button type="button" onClick={handlePayment} className="btn btn-ticket-primary flex-grow-1" disabled={paying}>
                            {paying ? "Opening Razorpay..." : "Pay With Razorpay"}
                          </button>
                        </div>
                      )}

                      {!currentUser ? (
                        <div className="text-muted small mt-3">Login is required before seat locking and payment.</div>
                      ) : null}
                    </div>
                  </>
                ) : userExistingBooking ? (
                  <>
                    <span className="section-label">Booking Status</span>
                    <h2 className="h4 text-dark mb-2">Already Booked</h2>
                    <p className="section-copy mb-4">
                      You have already booked {userExistingBooking.seatsCount || 1} seat(s) for this match. View your ticket in the tickets panel.
                    </p>
                    <div className="d-flex gap-2 flex-wrap">
                      <Link to="/user/tickets" className="btn btn-ticket-primary">
                        View My Tickets
                      </Link>
                      <Link to="/matches" className="btn btn-ticket-outline">
                        Browse More
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="section-label">Booking Unavailable</span>
                    <h2 className="h4 text-dark mb-2">Tickets cannot be booked right now</h2>
                    <p className="section-copy mb-0">Tickets are available only while the match is upcoming and seats remain in inventory.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
