import { useEffect, useState } from "react";
import {
  Plus,
  CalendarClock,
  Loader2,
  Check,
  X,
  PlayCircle,
  CheckCircle2,
  Trash2,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { bookingsApi, vehiclesApi, driversApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";

const EMPTY_FORM = {
  vehicle_id: "",
  driver_id: "",
  purpose: "",
  start_location: "",
  end_location: "",
  start_time: "",
};

const STATUS_FILTERS = [
  "all",
  "pending",
  "approved",
  "ongoing",
  "completed",
  "rejected",
  "cancelled",
];

function toLocalInputValue(dt) {
  const d = new Date(dt);
  const pad = (n) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Bookings() {
  const { user } = useAuth();
  const { push } = useToast();

  const isAdmin = user?.role === "admin";

  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Google Maps
  const [mapLocation, setMapLocation] = useState("");

  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const getMapUrl = (location) => {
    if (!location || !googleMapsKey) return "";

    return `https://www.google.com/maps/embed/v1/place?key=${googleMapsKey}&q=${encodeURIComponent(
      location
    )}`;
  };

  const openGoogleMaps = (location) => {
    if (!location) {
      push("Please enter a location first.", "error");
      return;
    }

    // Opens Google Maps in the current browser tab
    window.location.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      location
    )}`;
  };

  const load = () => {
    setLoading(true);

    const params =
      statusFilter !== "all" ? { status: statusFilter } : {};

    Promise.all([
      bookingsApi.list(params),
      vehiclesApi.list({ status: "available" }),
      driversApi.list({ status: "available" }),
    ])
      .then(([bRes, vRes, dRes]) => {
        setBookings(bRes.data);
        setVehicles(vRes.data);
        setDrivers(dRes.data);
      })
      .catch((err) => {
        push(
          err?.response?.data?.detail || "Could not load bookings",
          "error"
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      start_time: toLocalInputValue(
        new Date(Date.now() + 3600 * 1000)
      ),
    });

    setMapLocation("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await bookingsApi.create({
        ...form,
        vehicle_id: Number(form.vehicle_id),
        driver_id: form.driver_id
          ? Number(form.driver_id)
          : null,
        start_time: new Date(form.start_time).toISOString(),
      });

      push("Booking requested");
      setModalOpen(false);
      setMapLocation("");
      load();
    } catch (err) {
      push(
        err?.response?.data?.detail || "Could not create booking",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (booking, status) => {
    try {
      await bookingsApi.update(booking.id, { status });

      push(`Booking ${status}`);
      load();
    } catch (err) {
      push(
        err?.response?.data?.detail || "Could not update booking",
        "error"
      );
    }
  };

  const handleDelete = async () => {
    try {
      await bookingsApi.remove(deleteTarget.id);

      push("Booking deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      push(
        err?.response?.data?.detail || "Could not delete booking",
        "error"
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Bookings & Trips"
        subtitle={
          isAdmin
            ? "Review, approve and track every vehicle booking."
            : "Request a vehicle and track your trips."
        }
        action={
          <button className="btn-amber" onClick={openCreate}>
            <Plus size={16} />
            New Booking
          </button>
        }
      />

      {/* STATUS FILTERS */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              statusFilter === s
                ? "bg-navy-800 text-white"
                : "bg-white border border-navy-100 text-navy-500 hover:bg-navy-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* BOOKINGS LIST */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-navy-400">
          <Loader2 className="animate-spin mr-2" size={18} />
          Loading bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CalendarClock}
            title="No bookings found"
            message="Create a new booking request to get started."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="card p-5 flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <p className="font-head font-bold text-navy-800">
                    {b.purpose}
                  </p>

                  <Badge value={b.status} />
                </div>

                <p className="text-sm text-navy-500">
                  {b.start_location} → {b.end_location}
                </p>

                <p className="text-xs text-navy-400 mt-1">
                  {b.vehicle?.name} (
                  {b.vehicle?.registration_number})
                  {b.driver
                    ? ` · Driver: ${b.driver.full_name}`
                    : ""}{" "}
                  · Requested by{" "}
                  {b.requested_by_user?.full_name}
                </p>

                <p className="text-xs text-navy-400">
                  Starts{" "}
                  {new Date(b.start_time).toLocaleString()}
                </p>
              </div>

              {isAdmin && (
                <div className="flex flex-wrap gap-2 shrink-0">
                  {b.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          updateStatus(b, "approved")
                        }
                        className="btn-outline !py-1.5 text-xs !border-emerald-200 !text-emerald-700 hover:!bg-emerald-50"
                      >
                        <Check size={14} />
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          updateStatus(b, "rejected")
                        }
                        className="btn-outline !py-1.5 text-xs !border-rose-200 !text-rose-600 hover:!bg-rose-50"
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </>
                  )}

                  {b.status === "approved" && (
                    <button
                      onClick={() =>
                        updateStatus(b, "ongoing")
                      }
                      className="btn-outline !py-1.5 text-xs !border-sky-200 !text-sky-700 hover:!bg-sky-50"
                    >
                      <PlayCircle size={14} />
                      Start Trip
                    </button>
                  )}

                  {b.status === "ongoing" && (
                    <button
                      onClick={() =>
                        updateStatus(b, "completed")
                      }
                      className="btn-outline !py-1.5 text-xs !border-emerald-200 !text-emerald-700 hover:!bg-emerald-50"
                    >
                      <CheckCircle2 size={14} />
                      Mark Completed
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteTarget(b)}
                    className="rounded-lg p-1.5 text-navy-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE BOOKING MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setMapLocation("");
        }}
        title="Request a Vehicle Booking"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* VEHICLE */}
          <div>
            <label className="label">Vehicle</label>

            <select
              required
              className="input"
              value={form.vehicle_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  vehicle_id: e.target.value,
                })
              }
            >
              <option value="">
                Select an available vehicle
              </option>

              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.registration_number} (
                  {v.capacity} seats)
                </option>
              ))}
            </select>

            {vehicles.length === 0 && (
              <p className="text-xs text-rose-500 mt-1">
                No vehicles are currently available.
              </p>
            )}
          </div>

          {/* DRIVER */}
          <div>
            <label className="label">
              Driver (optional)
            </label>

            <select
              className="input"
              value={form.driver_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  driver_id: e.target.value,
                })
              }
            >
              <option value="">Assign later</option>

              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* PURPOSE */}
          <div>
            <label className="label">Purpose</label>

            <input
              required
              className="input"
              placeholder="Client site visit"
              value={form.purpose}
              onChange={(e) =>
                setForm({
                  ...form,
                  purpose: e.target.value,
                })
              }
            />
          </div>

          {/* LOCATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FROM */}
            <div>
              <label className="label">
                From Location
              </label>

              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400"
                />

                <input
                  required
                  className="input pl-9"
                  placeholder="KL University Hyderabad"
                  value={form.start_location}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      start_location: e.target.value,
                    })
                  }
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  setMapLocation(form.start_location)
                }
                disabled={!form.start_location}
                className="btn-outline mt-2 w-full !py-2 text-xs disabled:opacity-50"
              >
                <MapPin size={14} />
                Show From Location
              </button>
            </div>

            {/* TO */}
            <div>
              <label className="label">
                To Location
              </label>

              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400"
                />

                <input
                  required
                  className="input pl-9"
                  placeholder="Rajiv Gandhi International Airport"
                  value={form.end_location}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      end_location: e.target.value,
                    })
                  }
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  setMapLocation(form.end_location)
                }
                disabled={!form.end_location}
                className="btn-outline mt-2 w-full !py-2 text-xs disabled:opacity-50"
              >
                <MapPin size={14} />
                Show Destination
              </button>
            </div>
          </div>

          {/* GOOGLE MAP */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">
                Location Map
              </label>

              {mapLocation && (
                <button
                  type="button"
                  onClick={() =>
                    openGoogleMaps(mapLocation)
                  }
                  className="text-xs font-semibold text-navy-600 hover:text-navy-900 flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  Open in Google Maps
                </button>
              )}
            </div>

            {mapLocation && googleMapsKey ? (
              <div className="overflow-hidden rounded-xl border border-navy-100 bg-navy-50">
                <iframe
                  title="Google Maps Location"
                  src={getMapUrl(mapLocation)}
                  width="100%"
                  height="320"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : mapLocation && !googleMapsKey ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">
                  Google Maps API key is missing.
                </p>

                <p className="text-xs">
                  Add VITE_GOOGLE_MAPS_API_KEY to the
                  frontend .env file and restart the Vite
                  development server.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-navy-200 bg-navy-50 p-6 text-center">
                <MapPin
                  size={28}
                  className="mx-auto mb-2 text-navy-300"
                />

                <p className="text-sm font-semibold text-navy-600">
                  Enter a location to view the map
                </p>

                <p className="text-xs text-navy-400 mt-1">
                  Enter From or To location and click the
                  corresponding button.
                </p>
              </div>
            )}
          </div>

          {/* START TIME */}
          <div>
            <label className="label">
              Start Time
            </label>

            <input
              type="datetime-local"
              required
              className="input"
              value={form.start_time}
              onChange={(e) =>
                setForm({
                  ...form,
                  start_time: e.target.value,
                })
              }
            />
          </div>

          {/* FORM BUTTONS */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setModalOpen(false);
                setMapLocation("");
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-amber"
            >
              {saving ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete booking?"
        message="This will permanently remove this booking record."
      />
    </div>
  );
}