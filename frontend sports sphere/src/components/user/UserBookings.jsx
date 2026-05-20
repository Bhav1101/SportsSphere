import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import { cancelBooking, fetchBookingHistory, fetchMyBookings } from "../../services/bookingService"
import { USER_NAV } from "./userShared"
import { confirmAction, formatCurrency, formatDateTime, getStatusBadgeStyle, resolveList } from "../../utils/appHelpers"

export default function UserBookings() {
  const [bookings, setBookings] = useState([])
  const [history, setHistory] = useState([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = () => {
    setLoading(true)
    const safe = (p) => p.catch(() => ({ data: { data: [] } }))
    Promise.all([safe(fetchMyBookings()), safe(fetchBookingHistory())])
      .then(([bookingsRes, historyRes]) => {
        setBookings(resolveList(bookingsRes.data?.data, ["bookings", "items", "rows"]))
        setHistory(resolveList(historyRes.data?.data, ["bookings", "items", "rows"]))
      })
      .finally(() => setLoading(false))
  }

  const allBookings = history.length ? history : bookings
  const filteredBookings =
    filter === "all"
      ? allBookings
      : allBookings.filter((item) => String(item.bookingStatus || "").toLowerCase() === filter)

  const handleCancel = async (_id) => {
    const confirmed = await confirmAction("Cancel booking?", "Your confirmed ticket will be cancelled.", "Cancel booking")
    if (!confirmed) return

    cancelBooking({ _id })
      .then((response) => {
        toast.success(response.data?.message || "Booking cancelled")
        loadBookings()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to cancel booking")
      })
  }

  const counters = {
    all: allBookings.length,
    confirmed: allBookings.filter((item) => String(item.bookingStatus || "").toLowerCase() === "confirmed").length,
    cancelled: allBookings.filter((item) => String(item.bookingStatus || "").toLowerCase() === "cancelled").length,
  }

  return (
    <DashboardLayout navItems={USER_NAV} panelLabel="User Panel" panelColor="#3b82f6" darkMode={true}>
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>Bookings</h5>
          <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>Manage confirmed tickets and review your cancelled history.</div>
        </div>
      </div>

      <div className="ss-content fade-in">
        <div className="d-flex flex-wrap gap-2 mb-4">
          {[
            ["all", "All"],
            ["confirmed", "Confirmed"],
            ["cancelled", "Cancelled"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={filter === value ? "btn-ss-primary" : "btn-ss-outline"}
              style={{ padding: "7px 14px", fontSize: "0.76rem" }}
            >
              {label} ({counters[value]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="match-card">
            <div style={{ color: "#e2e8f0", fontWeight: 600 }}>Loading bookings...</div>
          </div>
        ) : (
          <div className="ss-table">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Match</th>
                  <th>Schedule</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length ? (
                  filteredBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <div style={{ color: "#f8fafc", fontWeight: 600, fontSize: "0.82rem" }}>{booking.transactionId || booking._id}</div>
                        <div style={{ color: "#94a3b8", fontSize: "0.72rem" }}>{booking.razorpayPaymentId || booking.lockId || "-"}</div>
                      </td>
                      <td>
                        <div style={{ color: "#f8fafc", fontWeight: 600, fontSize: "0.82rem" }}>{booking.matchId?.matchName || "-"}</div>
                        <div style={{ color: "#94a3b8", fontSize: "0.72rem" }}>{booking.matchId?.city || "-"}</div>
                      </td>
                      <td style={{ color: "#cbd5e1", fontSize: "0.78rem" }}>
                        {formatDateTime(booking.matchId?.matchDate, booking.matchId?.matchTime)}
                      </td>
                      <td style={{ color: "#cbd5e1", fontSize: "0.82rem" }}>{booking.seatsCount || 0}</td>
                      <td style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.82rem" }}>{formatCurrency(booking.totalAmount)}</td>
                      <td>
                        <span
                          style={{
                            ...getStatusBadgeStyle(booking.paymentStatus),
                            borderRadius: 999,
                            padding: "3px 10px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                          }}
                        >
                          {booking.paymentStatus || "-"}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            ...getStatusBadgeStyle(booking.bookingStatus),
                            borderRadius: 999,
                            padding: "3px 10px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                          }}
                        >
                          {booking.bookingStatus || "-"}
                        </span>
                      </td>
                      <td>
                        {String(booking.bookingStatus || "").toLowerCase() === "confirmed" ? (
                          <button
                            type="button"
                            onClick={() => handleCancel(booking._id)}
                            className="btn-ss-outline"
                            style={{ padding: "6px 10px", fontSize: "0.72rem", color: "#ef4444", borderColor: "#ef4444" }}
                          >
                            Cancel
                          </button>
                        ) : (
                          <Link to={`/match/${booking.matchId?._id || ""}`} style={{ color: "#60a5fa", fontSize: "0.76rem" }}>
                            View Match →
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ color: "#94a3b8", textAlign: "center", padding: "30px 18px" }}>
                      No bookings found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
