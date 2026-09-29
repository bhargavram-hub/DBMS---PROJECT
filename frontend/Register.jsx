import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Register() {
  const { register } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    role: "employee",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  if (!/^\d{10}$/.test(form.phone)) {
    setError("Phone number must contain exactly 10 digits.");
    return;
  }

  setLoading(true);
    try {
      await register(form);
      push("Account created — welcome!");
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="h-10 w-10 rounded-lg bg-amber flex items-center justify-center">
            <Car size={22} className="text-navy-900" />
          </div>
          <span className="font-head font-bold text-lg text-navy-800">FleetDesk</span>
        </div>

        <div className="card p-7">
          <h2 className="text-2xl font-head font-bold text-navy-800 mb-1">Create account</h2>
          <p className="text-sm text-navy-400 mb-6">Register to request and track vehicle bookings.</p>

          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                required
                className="input"
                placeholder="Jane Doe"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
  <label className="label">Phone</label>
  <input
    type="tel"
    required
    inputMode="numeric"
    pattern="[0-9]{10}"
    maxLength={10}
    className="input"
    placeholder="9876543210"
    value={form.phone}
    onChange={(e) => {
      const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
      setForm({ ...form, phone: digitsOnly });
    }}
  />
  <p className="text-xs text-navy-400 mt-1">
    Enter exactly 10 digits.
  </p>
</div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="input"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="employee">Employee (request bookings)</option>
                <option value="driver">Driver</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-xs text-navy-400 mt-1">
                In production, admin/driver roles would be assigned by an administrator — open here for demo purposes.
              </p>
            </div>
            <button type="submit" disabled={loading} className="btn-amber w-full">
              <UserPlus size={16} />
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-sm text-navy-400 mt-5 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-navy-800 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
