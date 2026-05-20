export const COACH_NAV = [
  { divider: true, label: "Main" },
  { to: "/coach/dashboard", icon: "bi-grid-1x2", label: "Dashboard" },
  { to: "/coach/profile", icon: "bi-person-badge", label: "Profile" },
  { divider: true, label: "Team Management" },
  { to: "/coach/teams", icon: "bi-people", label: "Teams" },
  { to: "/coach/players", icon: "bi-person-lines-fill", label: "Players" },
  { divider: true, label: "Matches" },
  { to: "/coach/matches", icon: "bi-calendar3", label: "Apply" },
  { to: "/coach/applications", icon: "bi-send", label: "Applications" },
]

export function canCoachManage(profile) {
  return String(profile?.status || "").toLowerCase() === "approved"
}
