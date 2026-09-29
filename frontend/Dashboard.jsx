import { useEffect, useState } from "react";
import {
  Car, Users, CalendarClock, Wrench, Fuel, FileWarning, TrendingUp, Loader2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { reportsApi, bookingsApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";

const PIE_COLORS = ["#F4A300", "#415A77", "#94A3B8"];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([reportsApi.dashboard(), bookingsApi.list()])
      .then(([statsRes, bookingsRes]) => {
        setStats(statsRes.data);
        setRecentBookings(bookingsRes.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64 text-navy-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading dashboard...
      </div>
    );
  }

  const vehiclePieData = [
    { name: "Available", value: stats.available_vehicles },
    { name: "Booked", value: stats.booked_vehicles },
    { name: "Maintenance", value: stats.maintenance_vehicles },
  ];

  const bookingBarData = [
    { name: "Pending", value: stats.pending_bookings },
    { name: "Ongoing", value: stats.ongoing_bookings },
    { name: "Completed", value: stats.completed_bookings },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.full_name?.split(" ")[0] || "there"}`}
        subtitle="Here's what's happening across your fleet today."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Vehicles" value={stats.total_vehicles} icon={Car} accent="navy" />
        <StatCard label="Available Now" value={stats.available_vehicles} icon={Car} accent="amber" />
        <StatCard label="Active Drivers" value={stats.available_drivers} suffix={`/ ${stats.total_drivers}`} icon={Users} accent="steel" />
        <StatCard label="Pending Bookings" value={stats.pending_bookings} icon={CalendarClock} accent="white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-1">
          <h3 className="font-head font-bold text-navy-800 mb-4">Vehicle Fleet Status</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehiclePieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {vehiclePieData.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 flex-wrap">
            {vehiclePieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-navy-500">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-head font-bold text-navy-800 mb-4">Booking Pipeline</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingBarData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#F1F5F9" }} />
                <Bar dataKey="value" fill="#1B263B" radius={[6, 6, 0, 0]} barSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-head font-bold text-navy-800 mb-4">Recent Bookings</h3>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-navy-400">No bookings yet.</p>
          ) : (
            <div className="divide-y divide-navy-100">
              {recentBookings.map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy-800 truncate">{b.purpose}</p>
                    <p className="text-xs text-navy-400 truncate">
                      {b.vehicle?.name} · {b.start_location} → {b.end_location}
                    </p>
                  </div>
                  <Badge value={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="font-head font-bold text-navy-800">Cost Overview</h3>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-navy-50 flex items-center justify-center text-navy-700">
              <Fuel size={18} />
            </div>
            <div>
              <p className="text-xs text-navy-400">Total Fuel Cost</p>
              <p className="font-head font-bold text-navy-800">₹{stats.total_fuel_cost.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-navy-50 flex items-center justify-center text-navy-700">
              <Wrench size={18} />
            </div>
            <div>
              <p className="text-xs text-navy-400">Total Maintenance Cost</p>
              <p className="font-head font-bold text-navy-800">₹{stats.total_maintenance_cost.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <FileWarning size={18} />
            </div>
            <div>
              <p className="text-xs text-navy-400">Documents Expiring (30d)</p>
              <p className="font-head font-bold text-navy-800">{stats.documents_expiring_soon}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
