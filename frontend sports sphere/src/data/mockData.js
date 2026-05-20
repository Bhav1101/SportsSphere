export const sports = [
  { id: 1, name: "Cricket", icon: "bi-trophy", maxPlayers: 11, rules: "Standard ICC rules. 20-over T20 format.", color: "#00c851" },
  { id: 2, name: "Football", icon: "bi-dribbble", maxPlayers: 11, rules: "Standard FIFA rules. 90-minute match.", color: "#ff6b35" },
  { id: 3, name: "Basketball", icon: "bi-bullseye", maxPlayers: 5, rules: "Standard NBA rules. 4 quarters of 12 min.", color: "#ffc107" },
  { id: 4, name: "Kabaddi", icon: "bi-people-fill", maxPlayers: 7, rules: "Pro Kabaddi League rules. 40-minute match.", color: "#6f42c1" },
  { id: 5, name: "Hockey", icon: "bi-lightning-fill", maxPlayers: 11, rules: "Standard FIH rules. 60-minute match.", color: "#0dcaf0" },
];
export const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad"];
export const stadiums = [
  { id: 1, name: "Wankhede Stadium", city: "Mumbai", capacity: 33000 },
  { id: 2, name: "Eden Gardens", city: "Kolkata", capacity: 66000 },
  { id: 3, name: "M. Chinnaswamy Stadium", city: "Bangalore", capacity: 40000 },
  { id: 4, name: "Jawaharlal Nehru Stadium", city: "Delhi", capacity: 60000 },
  { id: 5, name: "DY Patil Stadium", city: "Pune", capacity: 55000 },
  { id: 6, name: "GMDC Ground", city: "Ahmedabad", capacity: 49000 },
];
export const teams = [
  { id: 1, name: "Mumbai Titans", sportId: 1, coachId: 1, city: "Mumbai", status: "active" },
  { id: 2, name: "Delhi Dragons", sportId: 1, coachId: 2, city: "Delhi", status: "active" },
  { id: 3, name: "Bangalore Bulls", sportId: 2, coachId: 3, city: "Bangalore", status: "active" },
  { id: 4, name: "Chennai Kings", sportId: 2, coachId: 4, city: "Chennai", status: "active" },
  { id: 5, name: "Kolkata Warriors", sportId: 3, coachId: 5, city: "Kolkata", status: "active" },
  { id: 6, name: "Hyderabad Hawks", sportId: 4, coachId: 1, city: "Hyderabad", status: "active" },
  { id: 7, name: "Pune Panthers", sportId: 5, coachId: 2, city: "Pune", status: "active" },
  { id: 8, name: "Ahmedabad Aces", sportId: 1, coachId: 3, city: "Ahmedabad", status: "active" },
];
export const players = [
  { id: 1, name: "Arjun Sharma", role: "Batsman", teamId: 1, fitness: 92, jersey: "7" },
  { id: 2, name: "Rahul Verma", role: "Bowler", teamId: 1, fitness: 88, jersey: "11" },
  { id: 3, name: "Kiran Patel", role: "All-rounder", teamId: 1, fitness: 95, jersey: "3" },
  { id: 4, name: "Suresh Nair", role: "Wicket-keeper", teamId: 2, fitness: 85, jersey: "1" },
  { id: 5, name: "Aakash Singh", role: "Batsman", teamId: 2, fitness: 90, jersey: "9" },
  { id: 6, name: "Ravi Kumar", role: "Forward", teamId: 3, fitness: 87, jersey: "10" },
  { id: 7, name: "Deepak Yadav", role: "Midfielder", teamId: 3, fitness: 82, jersey: "8" },
  { id: 8, name: "Manoj Gupta", role: "Defender", teamId: 4, fitness: 93, jersey: "5" },
  { id: 9, name: "Nikhil Joshi", role: "Point Guard", teamId: 5, fitness: 96, jersey: "23" },
  { id: 10, name: "Pradeep Bose", role: "Center", teamId: 5, fitness: 89, jersey: "34" },
  { id: 11, name: "Sanjay Das", role: "Raider", teamId: 6, fitness: 91, jersey: "6" },
  { id: 12, name: "Vikram Rao", role: "Defender", teamId: 6, fitness: 84, jersey: "4" },
];
export const matches = [
  { id: 1, sportId: 1, homeTeamId: 1, awayTeamId: 2, stadiumId: 1, date: "2026-04-05", time: "19:30", status: "upcoming", price: 500, totalSeats: 200, bookedSeats: 87, league: "IPL 2026", description: "Battle of the titans in this epic T20 clash!" },
  { id: 2, sportId: 2, homeTeamId: 3, awayTeamId: 4, stadiumId: 4, date: "2026-04-08", time: "17:00", status: "upcoming", price: 350, totalSeats: 150, bookedSeats: 42, league: "ISL 2026", description: "South India's biggest football derby!" },
  { id: 3, sportId: 3, homeTeamId: 5, awayTeamId: 8, stadiumId: 3, date: "2026-04-12", time: "20:00", status: "upcoming", price: 400, totalSeats: 120, bookedSeats: 109, league: "NBL India", description: "High-flying action as Kolkata hosts Ahmedabad!" },
  { id: 4, sportId: 4, homeTeamId: 6, awayTeamId: 7, stadiumId: 5, date: "2026-04-15", time: "18:00", status: "upcoming", price: 250, totalSeats: 180, bookedSeats: 55, league: "Pro Kabaddi 2026", description: "The ultimate Kabaddi showdown!" },
  { id: 5, sportId: 5, homeTeamId: 7, awayTeamId: 1, stadiumId: 6, date: "2026-04-20", time: "16:00", status: "upcoming", price: 300, totalSeats: 160, bookedSeats: 22, league: "Hockey India League", description: "Stick to the game!" },
  { id: 6, sportId: 1, homeTeamId: 8, awayTeamId: 3, stadiumId: 2, date: "2026-04-25", time: "19:00", status: "upcoming", price: 600, totalSeats: 250, bookedSeats: 198, league: "IPL 2026", description: "Eden Gardens lights up for this blockbuster!" },
  { id: 7, sportId: 1, homeTeamId: 2, awayTeamId: 1, stadiumId: 4, date: "2026-03-15", time: "19:30", status: "completed", price: 500, totalSeats: 200, bookedSeats: 200, league: "IPL 2026", description: "Mumbai won by 24 runs." },
  { id: 8, sportId: 2, homeTeamId: 4, awayTeamId: 3, stadiumId: 1, date: "2026-03-10", time: "17:00", status: "completed", price: 350, totalSeats: 150, bookedSeats: 145, league: "ISL 2026", description: "Chennai won 2-1." },
];
export const matchApplications = [
  { id: 1, matchId: 1, coachId: 1, teamId: 1, status: "approved", appliedOn: "2026-03-20" },
  { id: 2, matchId: 1, coachId: 2, teamId: 2, status: "approved", appliedOn: "2026-03-21" },
  { id: 3, matchId: 2, coachId: 3, teamId: 3, status: "approved", appliedOn: "2026-03-22" },
  { id: 4, matchId: 2, coachId: 4, teamId: 4, status: "pending", appliedOn: "2026-03-22" },
  { id: 5, matchId: 3, coachId: 5, teamId: 5, status: "pending", appliedOn: "2026-03-23" },
  { id: 6, matchId: 4, coachId: 1, teamId: 6, status: "rejected", appliedOn: "2026-03-18" },
];
export const coaches = [
  { id: 1, name: "Rajesh Mehta", email: "rajesh@sportssphere.com", password: "coach123", sports: [1, 4], experience: "12 years", bio: "Former national-level cricketer turned coach.", status: "approved", city: "Mumbai", phone: "9876543210" },
  { id: 2, name: "Sunita Iyer", email: "sunita@sportssphere.com", password: "coach123", sports: [1, 5], experience: "8 years", bio: "International hockey player with 3 World Cup appearances.", status: "approved", city: "Delhi", phone: "9876543211" },
  { id: 3, name: "Prakash Nair", email: "prakash@sportssphere.com", password: "coach123", sports: [2], experience: "15 years", bio: "UEFA B-licensed football coach. Managed 4 ISL teams.", status: "approved", city: "Bangalore", phone: "9876543212" },
  { id: 4, name: "Ananya Roy", email: "ananya@sportssphere.com", password: "coach123", sports: [2], experience: "6 years", bio: "Former ISL footballer with 200+ professional appearances.", status: "pending", city: "Chennai", phone: "9876543213" },
  { id: 5, name: "Vivek Sharma", email: "vivek@sportssphere.com", password: "coach123", sports: [3], experience: "10 years", bio: "National basketball champion. Coach of the year 2023.", status: "approved", city: "Kolkata", phone: "9876543214" },
];
export const users = [
  { id: 1, name: "Amit Kumar", email: "amit@gmail.com", password: "user123", role: "user", phone: "9811223344", city: "Mumbai", joinedOn: "2026-01-15" },
  { id: 2, name: "Priya Singh", email: "priya@gmail.com", password: "user123", role: "user", phone: "9811223345", city: "Delhi", joinedOn: "2026-02-10" },
  { id: 3, name: "Admin User", email: "admin@sportssphere.com", password: "admin123", role: "admin", phone: "9800000001", city: "Mumbai", joinedOn: "2025-01-01" },
];
export const bookings = [
  { id: "BK001", userId: 1, matchId: 1, seats: ["A1", "A2"], totalAmount: 1000, paymentMethod: "UPI", status: "confirmed", bookedOn: "2026-03-22" },
  { id: "BK002", userId: 1, matchId: 3, seats: ["C5"], totalAmount: 400, paymentMethod: "Card", status: "confirmed", bookedOn: "2026-03-20" },
  { id: "BK003", userId: 2, matchId: 2, seats: ["B3", "B4", "B5"], totalAmount: 1050, paymentMethod: "Cash", status: "confirmed", bookedOn: "2026-03-21" },
  { id: "BK004", userId: 1, matchId: 7, seats: ["D2"], totalAmount: 500, paymentMethod: "UPI", status: "cancelled", bookedOn: "2026-03-10" },
];
export const getSportById = (id) => sports.find(s => s.id === id);
export const getTeamById = (id) => teams.find(t => t.id === id);
export const getStadiumById = (id) => stadiums.find(s => s.id === id);
export const getCoachById = (id) => coaches.find(c => c.id === id);
export const getMatchById = (id) => matches.find(m => m.id === id);
export const getPlayersByTeam = (teamId) => players.filter(p => p.teamId === teamId);
export const getBookingsByUser = (userId) => bookings.filter(b => b.userId === userId);
export const getMatchApplicationsByCoach = (coachId) => matchApplications.filter(a => a.coachId === coachId);
export const generateSeats = (totalSeats, bookedCount) => {
  const rows = ["A","B","C","D","E","F","G","H"];
  const seatsPerRow = Math.ceil(totalSeats / rows.length);
  const allSeats = [];
  let booked = 0;
  for (let r = 0; r < rows.length; r++) {
    for (let s = 1; s <= seatsPerRow; s++) {
      if (allSeats.length >= totalSeats) break;
      const isBooked = booked < bookedCount && (r * seatsPerRow + s <= bookedCount);
      if (isBooked) booked++;
      allSeats.push({ id: `${rows[r]}${s}`, row: rows[r], num: s, status: isBooked ? "booked" : "available" });
    }
  }
  return allSeats;
};
