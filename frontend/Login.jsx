import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, Lock, Mail, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const { login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      push("Welcome back!");
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="min-h-screen flex bg-navy-950">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-navy-900">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-steel/30" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-amber/10" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg bg-amber flex items-center justify-center">
              <Car size={22} className="text-navy-900" />
            </div>
            <span className="font-head font-bold text-lg">FleetDesk</span>
          </div>
          <div>
            <h1 className="font-head text-4xl font-bold leading-tight mb-4">
              Smart Vehicle Booking &amp; Management System
            </h1>
            <p className="text-white/70 text-base max-w-md">
              One secure platform for vehicles, drivers, bookings, maintenance, fuel and documents.
            </p>
          </div>
          <p className="text-xs text-white/40">
            Database Systems Engineering &amp; Distributed Backend Development · 25CS1302E
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="h-10 w-10 rounded-lg bg-amber flex items-center justify-center">
              <Car size={22} className="text-navy-900" />
            </div>
            <span className="font-head font-bold text-lg text-navy-800">FleetDesk</span>
          </div>

          <h2 className="text-2xl font-head font-bold text-navy-800 mb-1">Sign in</h2>
          <p className="text-sm text-navy-400 mb-6">Enter your credentials to access your dashboard.</p>

          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                <input
                  type="email"
                  required
                  className="input pl-9"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                <input
                  type="password"
                  required
                  className="input pl-9"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-amber w-full">
              <LogIn size={16} />
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-navy-400 mt-5 text-center">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-navy-800 font-semibold hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-8 rounded-xl border border-navy-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-2">
              Demo accounts
            </p>
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillDemo("admin@fleet.com", "Admin@123")}
                className="flex w-full justify-between rounded-md px-2 py-1.5 hover:bg-navy-50"
              >
                <span className="font-medium text-navy-700">Admin</span>
                <span className="text-navy-400">admin@fleet.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("driver@fleet.com", "Driver@123")}
                className="flex w-full justify-between rounded-md px-2 py-1.5 hover:bg-navy-50"
              >
                <span className="font-medium text-navy-700">Driver</span>
                <span className="text-navy-400">driver@fleet.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("employee@fleet.com", "Employee@123")}
                className="flex w-full justify-between rounded-md px-2 py-1.5 hover:bg-navy-50"
              >
                <span className="font-medium text-navy-700">Employee</span>
                <span className="text-navy-400">employee@fleet.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
