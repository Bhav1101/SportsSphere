import Swal from "sweetalert2"
import { BASE_URL } from "../endPoints"

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

export function getMediaUrl(path) {
  if (!path) return ""
  if (/^https?:\/\//i.test(path)) return path
  return `${BASE_URL}${String(path).replace(/^\/+/, "")}`
}

export function formatCurrency(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isNaN(amount) ? 0 : amount)
}

export function formatDate(value) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(dateValue, timeValue) {
  if (!dateValue && !timeValue) return "-"
  return [formatDate(dateValue), timeValue].filter(Boolean).join(" | ")
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

  if (["pending", "locked", "open_for_applications", "teams_selected"].includes(value)) {
    return {
      background: "rgba(249,115,22,0.14)",
      color: "#fb923c",
      border: "1px solid rgba(251,146,60,0.34)",
    }
  }

  if (["ongoing", "processing", "refunded"].includes(value)) {
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

export function getInitials(value = "") {
  return String(value)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("") || "SS"
}

export function getTicketSeed(value = "") {
  return Array.from({ length: 64 }, (_, index) => {
    const code = String(value)
      .split("")
      .reduce((total, char, position) => total + char.charCodeAt(0) * (position + 3), 0)
    return ((code + index * 17) % 7) < 3
  })
}

export function getCountdownParts(value) {
  const totalSeconds = Math.max(0, Math.floor(Number(value || 0)))
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0")
  const seconds = String(totalSeconds % 60).padStart(2, "0")
  return { minutes, seconds, totalSeconds }
}

export function extractOrderDetails(payload) {
  const root = resolveObject(payload)
  const order = resolveObject(root.order || root.razorpayOrder || root.orderData)
  return {
    key: root.key || root.razorpayKey || root.razorpay_key || order.key || "",
    orderId: root.orderId || root.razorpayOrderId || order.id || order.orderId || root.id || "",
    amount: root.amount || order.amount || 0,
    currency: root.currency || order.currency || "INR",
    name: root.name || "SportsSphere",
    description: root.description || "Sports ticket booking",
    bookingData: root.booking || root.ticket || null,
  }
}

export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true)
  const existing = document.querySelector('script[data-razorpay="true"]')
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(true), { once: true })
      existing.addEventListener("error", () => resolve(false), { once: true })
    })
  }

  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.dataset.razorpay = "true"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function confirmAction(title, text, confirmButtonText = "Continue") {
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
