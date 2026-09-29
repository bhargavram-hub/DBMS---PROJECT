# Vehicle Booking Management System — Frontend

React + Vite + Tailwind CSS single-page app for the Smart Vehicle Booking &
Management System.

## Tech Stack
- **React 18** + **React Router 6**
- **Vite** for dev server / build
- **Tailwind CSS** for styling (custom navy / steel / amber theme)
- **Axios** for API calls
- **Recharts** for the dashboard charts
- **lucide-react** for icons

## 1. Setup

```bash
cd frontend
npm install
cp .env.example .env
```

`.env` should point to your backend URL (defaults to `http://localhost:8000`):

```env
VITE_API_URL=http://localhost:8000
```

## 2. Run the dev server

```bash
npm run dev
```

App runs at `http://localhost:5173`. Make sure the backend is running first
(see `../backend/README.md`) — the login page has one-click buttons to fill
in the demo admin/driver/employee credentials.

## 3. Build for production

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.js        # Axios instance + auth token interceptor
│   │   └── endpoints.js     # Grouped API calls per module
│   ├── context/
│   │   ├── AuthContext.jsx  # Login/register/logout, current user
│   │   └── ToastContext.jsx # Toast notifications
│   ├── components/           # Sidebar, Topbar, Modal, Badge, StatCard, ...
│   ├── pages/
│   │   ├── Login.jsx / Register.jsx
│   │   ├── Dashboard.jsx     # Stats + charts
│   │   ├── Vehicles.jsx      # CRUD
│   │   ├── Drivers.jsx       # CRUD
│   │   ├── Bookings.jsx      # Request / approve / trip workflow
│   │   ├── Maintenance.jsx   # Service logs
│   │   ├── Fuel.jsx          # Fuel logs
│   │   └── Documents.jsx     # Registration/insurance/PUC/license tracking
│   ├── App.jsx               # Routes + role-protected routes
│   └── main.jsx
├── tailwind.config.js         # Brand color palette (navy/steel/amber)
└── .env.example
```

## Roles & Visibility

The sidebar and available actions adapt to the logged-in user's role:

- **admin** — sees everything, can create/edit/delete across all modules,
  approves bookings, manages maintenance/fuel/documents.
- **driver** — sees vehicles, drivers, bookings, maintenance, fuel logs.
- **employee** — sees vehicles, drivers, and their own bookings; can request
  a new booking.
