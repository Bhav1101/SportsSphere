import Swal from "sweetalert2"
import { BASE_URL } from "../../endPoints"

export const ADMIN_PANEL_COLOR = "#00c851"

export const ADMIN_NAV = [
  { divider: true, label: "Overview" },
  { to: "/admin/dashboard", icon: "bi-grid-1x2", label: "Dashboard" },
  { divider: true, label: "Management" },
  { to: "/admin/sports", icon: "bi-trophy", label: "Sports" },
  { to: "/admin/venues", icon: "bi-geo-alt", label: "Venues" },
  { to: "/admin/matches", icon: "bi-calendar3", label: "Matches" },
  { to: "/admin/coaches", icon: "bi-people", label: "Coaches" },
  { to: "/admin/users", icon: "bi-person-lines-fill", label: "Users" },
  { divider: true, label: "Operations" },
  { to: "/admin/applications", icon: "bi-send", label: "Applications" },
  { to: "/admin/bookings", icon: "bi-receipt", label: "Bookings" },
  { to: "/admin/reports", icon: "bi-bar-chart", label: "Reports" },
]

export function getAuthConfig() {
  return {
    headers: {
      authorization: localStorage.getItem("token") || "",
    },
  }
}

export function resolveList(data, keys = []) {
  if (Array.isArray(data)) return data
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  if (data && typeof data === "object") {
    for (const value of Object.values(data)) {
      if (Array.isArray(value)) return value
    }
  }
  return []
}

export function resolveObject(data) {
  return data && typeof data === "object" && !Array.isArray(data) ? data : {}
}

export function createFormData(values) {
  const formData = new FormData()
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (typeof value === "string" && value.trim() === "") return
    if (Array.isArray(value)) {
      formData.append(key, value.join(","))
      return
    }
    formData.append(key, value)
  })
  return formData
}

export function getMediaUrl(filePath) {
  if (!filePath) return ""
  if (/^https?:\/\//i.test(filePath)) return filePath
  return `${BASE_URL}${String(filePath).replace(/^\/+/, "")}`
}

export function formatDate(value) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(dateValue, timeValue) {
  if (!dateValue && !timeValue) return "-"
  return [formatDate(dateValue), timeValue].filter(Boolean).join(" • ")
}

export function formatCurrency(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isNaN(amount) ? 0 : amount)
}

export function getStatusBadgeStyle(status) {
  const value = String(status || "").toLowerCase()

  if (["active", "approved", "upcoming", "confirmed", "paid", "completed"].includes(value)) {
    return {
      background: "rgba(34,197,94,0.15)",
      color: "#4ade80",
      border: "1px solid rgba(74,222,128,0.35)",
    }
  }

  if (["pending", "open_for_applications", "teams_selected", "pending_payment"].includes(value)) {
    return {
      background: "rgba(249,115,22,0.14)",
      color: "#fb923c",
      border: "1px solid rgba(251,146,60,0.34)",
    }
  }

  if (["ongoing", "locked"].includes(value)) {
    return {
      background: "rgba(59,130,246,0.14)",
      color: "#60a5fa",
      border: "1px solid rgba(96,165,250,0.34)",
    }
  }

  return {
    background: "rgba(239,68,68,0.14)",
    color: "#f87171",
    border: "1px solid rgba(248,113,113,0.34)",
  }
}

export function getCoachBadgeMeta(badge) {
  const tone = String(badge || "newcomer").toLowerCase()
  const map = {
    newcomer: { label: "Newcomer", color: "var(--ss-muted)", icon: "bi-star" },
    bronze: { label: "Bronze", color: "#b45309", icon: "bi-award" },
    silver: { label: "Silver", color: "var(--ss-muted)", icon: "bi-award-fill" },
    gold: { label: "Gold", color: "#facc15", icon: "bi-patch-check-fill" },
    platinum: { label: "Platinum", color: "#38bdf8", icon: "bi-gem" },
  }
  return map[tone] || map.newcomer
}

export function sortApplicationsByBadge(list) {
  const badgeWeight = {
    platinum: 5,
    gold: 4,
    silver: 3,
    bronze: 2,
    newcomer: 1,
  }

  return [...list].sort((a, b) => {
    const first = badgeWeight[String(a?.coachBadge || "").toLowerCase()] || 0
    const second = badgeWeight[String(b?.coachBadge || "").toLowerCase()] || 0
    if (first !== second) return second - first
    return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
  })
}

export async function confirmDanger(title, text, confirmButtonText = "Yes, continue") {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    background: "#111827",
    color: "#e5e7eb",
    confirmButtonColor: "#ef4444",
  })

  return result.isConfirmed
}

export async function promptRemarks(title, confirmButtonText = "Submit") {
  const result = await Swal.fire({
    title,
    input: "textarea",
    inputLabel: "Remarks",
    inputPlaceholder: "Enter remarks...",
    inputAttributes: {
      "aria-label": "Enter remarks",
    },
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    background: "#111827",
    color: "#e5e7eb",
    confirmButtonColor: "#f97316",
    preConfirm: (value) => {
      if (!value || !value.trim()) {
        Swal.showValidationMessage("Remarks are required")
      }
      return value
    },
  })

  return result.isConfirmed ? result.value.trim() : null
}

export async function promptAmount(maxAmount = 0) {
  const result = await Swal.fire({
    title: "Pay Coach",
    input: "number",
    inputLabel: "Amount",
    inputValue: maxAmount || "",
    inputAttributes: {
      min: 1,
      step: 1,
    },
    showCancelButton: true,
    confirmButtonText: "Pay now",
    cancelButtonText: "Cancel",
    background: "#111827",
    color: "#e5e7eb",
    confirmButtonColor: "#00c851",
    preConfirm: (value) => {
      const amount = Number(value)
      if (!amount || amount <= 0) {
        Swal.showValidationMessage("Enter a valid amount")
      }
      return amount
    },
  })

  return result.isConfirmed ? Number(result.value) : null
}

export function getFirstArray(data) {
  return resolveList(data)
}
