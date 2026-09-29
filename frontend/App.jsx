import { Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Bookings from "./pages/Bookings";
import Maintenance from "./pages/Maintenance";
import Fuel from "./pages/Fuel";
import Documents from "./pages/Documents";

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="bookings" element={<Bookings />} />
          <Route
            path="maintenance"
            element={
              <ProtectedRoute roles={["admin", "driver"]}>
                <Maintenance />
              </ProtectedRoute>
            }
          />
          <Route
            path="fuel"
            element={
              <ProtectedRoute roles={["admin", "driver"]}>
                <Fuel />
              </ProtectedRoute>
            }
          />
          <Route
            path="documents"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Documents />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Dashboard />} />
      </Routes>
    </ToastProvider>
  );
}
