# SportsSphere

A full-stack sports event management and ticket booking platform with role-based access control, secure payments, JWT authentication, and an AI-powered chatbot assistant.

**Live demo:** [sports-sphere-nine.vercel.app](https://sports-sphere-nine.vercel.app)

## Overview

SportsSphere connects players, coaches, and admins on a single platform to manage sports events, team applications, venue bookings, and match coordination — with real payment processing and live AI support built in.

## Features

- **Role-based panels** — separate, permission-controlled dashboards for Admin, Coach, and Player roles
- **Secure authentication** — JWT-based auth with role-checking middleware on protected routes
- **Payments** — Razorpay integration for event/match bookings, with signature verification on the backend
- **Media storage** — Cloudinary-backed image uploads for player profiles, teams, and venues (via Multer)
- **AI chatbot** — Google Gemini-powered assistant with live context from the platform's own MongoDB data
- **Match & team management** — APIs for matches, match applications, teams, players, coaches, venues, and sports categories
- **Notifications** — in-app notification system for bookings and match updates

## Tech Stack

**Frontend**
- React 19 + Vite
- React Router
- Axios
- React Toastify, SweetAlert2 (UI feedback)

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose
- JWT (jsonwebtoken) for authentication
- Bcrypt for password hashing
- Multer + Cloudinary for image uploads
- Razorpay for payments
- Google Gemini API (@google/genai) for the AI chatbot

## Project Structure

```
SportsSphere/
├── frontend sports sphere/   # React + Vite client
│   ├── src/
│   └── public/
└── sports sphere backend/    # Express API server
    ├── index.js               # Entry point
    └── server/
        ├── apis/               # Route handlers (admin, ai, booking, coach, match, etc.)
        ├── config/             # DB connection, Cloudinary config, schema base
        ├── middleware/         # Auth (tokenChecker) and role-based access (roleChecker)
        └── routes/             # Express route definitions
```

## API Modules

The backend is organized into the following resource modules under `server/apis/`:
`admin`, `ai`, `booking`, `coach`, `match`, `matchApplication`, `notification`, `players`, `sports`, `team`, `user`, `venue`

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (local or Atlas)
- Razorpay account (test keys for development)
- Cloudinary account
- Google Gemini API key

### Backend Setup

```bash
cd "sports sphere backend"
npm install
```

Create a `.env` file in the backend root with:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
```

Run the server:

```bash
npm start
```

### Frontend Setup

```bash
cd "frontend sports sphere"
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

## API Testing

A Postman collection (`Match-APIs.postman_collection.json`) is included in the backend folder for testing match-related endpoints.

## Author

**Bhavjot Singh**
Built during a MERN stack internship at O7 Services, Jalandhar (Jan–Apr 2026)

[GitHub](https://github.com/Bhav1101) · [LinkedIn](www.linkedin.com/in/bhavjot-singh-933849336)
