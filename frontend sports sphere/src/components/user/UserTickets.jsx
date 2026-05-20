import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import DashboardLayout from "../layout/DashboardLayout"
import { cancelBooking, fetchMyBookings } from "../../services/bookingService"
import { USER_NAV } from "./userShared"
import {
  confirmAction,
  formatCurrency,
  formatDateTime,
  getStatusBadgeStyle,
  getTicketSeed,
  resolveList,
} from "../../utils/appHelpers"

export default function UserTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = () => {
    setLoading(true)
    fetchMyBookings()
      .then((response) => {
        const rows = resolveList(response.data?.data, ["bookings", "items", "rows"])
        const active = rows.filter((item) => {
          const bookingStatus = String(item.bookingStatus || "").toLowerCase()
          const matchStatus = String(item.matchId?.status || "").toLowerCase()
          return bookingStatus === "confirmed" && matchStatus !== "completed" && matchStatus !== "cancelled"
        })
        setTickets(active)
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load your tickets")
      })
      .finally(() => setLoading(false))
  }

  const handleCancel = async (_id) => {
    const confirmed = await confirmAction("Cancel active ticket?", "This action will cancel your confirmed booking.", "Cancel ticket")
    if (!confirmed) return

    cancelBooking({ _id })
      .then((response) => {
        toast.success(response.data?.message || "Ticket cancelled")
        loadTickets()
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to cancel ticket")
      })
  }

  return (
    <DashboardLayout navItems={USER_NAV} panelLabel="User Panel" panelColor="#3b82f6" darkMode={true}>
      <div className="ss-topbar">
        <div>
          <h5 style={{ fontFamily: "Oswald, sans-serif", margin: 0, fontSize: "1.1rem" }}>My Tickets</h5>
          <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{tickets.length} active tickets ready to scan.</div>
        </div>
        <button type="button" onClick={() => navigate("/matches")} className="btn-ss-primary" style={{ fontSize: "0.82rem", padding: "8px 18px" }}>
          <i className="bi bi-plus-circle me-1" />
          Book More
        </button>
      </div>

      <div className="ss-content fade-in">
        {loading ? (
          <div className="match-card">
            <div style={{ color: "#e2e8f0", fontWeight: 600 }}>Loading tickets...</div>
          </div>
        ) : tickets.length ? (
          <div className="row g-4">
            {tickets.map((ticket) => {
              const qrBlocks = getTicketSeed(ticket.transactionId || ticket._id)
              return (
                <div className="col-lg-6 col-xl-4" key={ticket._id}>
                  <div className="ticket-card">
                    <div className="ticket-header">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="ticket-match-status">{ticket.matchId?.status || "upcoming"}</span>
                        <span
                          style={{
                            ...getStatusBadgeStyle(ticket.paymentStatus),
                            borderRadius: 999,
                            padding: "3px 10px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                          }}
                        >
                          {ticket.paymentStatus || "paid"}
                        </span>
                      </div>
                      <h6 className="ticket-match-name">{ticket.matchId?.matchName || "Match Ticket"}</h6>
                      <div className="ticket-match-meta">{ticket.matchId?.city || "-"} • {formatDateTime(ticket.matchId?.matchDate, ticket.matchId?.matchTime)}</div>
                    </div>
                    <div className="ticket-body">
                      <div className="d-flex justify-content-between gap-3">
                        <div style={{ flex: 1 }}>
                          <div className="row g-2 mb-3">
                            {[
                              ["Seats", ticket.seatsCount || 0],
                              ["Amount", formatCurrency(ticket.totalAmount)],
                              ["Booking", ticket.bookingStatus || "-"],
                              ["Txn", ticket.transactionId || ticket._id],
                            ].map(([label, value]) => (
                              <div className="col-6" key={label}>
                                <div style={{ color: "#64748b", fontSize: "0.67rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
                                <div style={{ color: "#1e293b", fontWeight: 600, fontSize: "0.82rem", wordBreak: "break-word" }}>{value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="qr-placeholder ms-2" aria-label="ticket qr code">
                          <div className="qr-grid">
                            {qrBlocks.map((filled, index) => (
                              <div key={index} className={filled ? "qr-cell qr-cell-filled" : "qr-cell"} />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ borderTop: "1px dashed rgba(59,130,246,0.15)", paddingTop: 10, marginTop: 8, display: "flex", gap: 8 }}>
                        <Link to={`/match/${ticket.matchId?._id || ""}`} className="btn-ss-outline" style={{ flex: 1, fontSize: "0.75rem", padding: "6px", textAlign: "center" }}>
                          <i className="bi bi-eye me-1" />
                          View Match
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCancel(ticket._id)}
                          style={{
                            flex: 1,
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            color: "#ef4444",
                            borderRadius: 8,
                            padding: "6px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                          }}
                        >
                          <i className="bi bi-x-circle me-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="match-card text-center py-5">
            <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>Tickets</div>
            <h5 style={{ color: "#f8fafc", fontFamily: "Oswald, sans-serif" }}>No Active Tickets</h5>
            <p style={{ color: "#94a3b8", marginBottom: 20 }}>Book an upcoming match to see your QR-ready passes here.</p>
            <Link to="/matches" className="btn-ss-primary" style={{ display: "inline-block" }}>Browse Matches</Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
