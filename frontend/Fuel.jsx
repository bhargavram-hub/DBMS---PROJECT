import { useEffect, useState } from "react";
import { Plus, Fuel as FuelIcon, Loader2, Trash2 } from "lucide-react";
import { fuelApi, vehiclesApi } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";

const EMPTY_FORM = { vehicle_id: "", liters: "", cost: "", odometer_reading: "", fuel_date: "" };

export default function Fuel() {
  const { push } = useToast();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([fuelApi.list(), vehiclesApi.list()])
      .then(([fRes, vRes]) => {
        setLogs(fRes.data);
        setVehicles(vRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, fuel_date: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fuelApi.create({
        ...form,
        vehicle_id: Number(form.vehicle_id),
        liters: Number(form.liters),
        cost: Number(form.cost),
        odometer_reading: form.odometer_reading ? Number(form.odometer_reading) : null,
      });
      push("Fuel log added");
      setModalOpen(false);
      load();
    } catch (err) {
      push(err?.response?.data?.detail || "Could not save fuel log", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fuelApi.remove(deleteTarget.id);
      push("Fuel log removed");
      load();
    } catch (err) {
      push(err?.response?.data?.detail || "Could not delete log", "error");
    }
  };

  const totalCost = logs.reduce((sum, l) => sum + l.cost, 0);
  const totalLiters = logs.reduce((sum, l) => sum + l.liters, 0);

  return (
    <div>
      <PageHeader
        title="Fuel Logs"
        subtitle="Track fuel consumption and cost across the fleet."
        action={
          <button className="btn-amber" onClick={openCreate}>
            <Plus size={16} /> Add Fuel Log
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Fuel Cost" value={`₹${totalCost.toLocaleString()}`} icon={FuelIcon} accent="navy" />
        <StatCard label="Total Liters Logged" value={totalLiters.toFixed(1)} suffix="L" icon={FuelIcon} accent="amber" />
        <StatCard label="Total Entries" value={logs.length} icon={FuelIcon} accent="steel" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-navy-400">
          <Loader2 className="animate-spin mr-2" size={18} /> Loading fuel logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="card">
          <EmptyState icon={FuelIcon} title="No fuel logs yet" message="Add a fuel entry to start tracking consumption." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                  <th className="px-5 py-3 font-semibold">Vehicle</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Liters</th>
                  <th className="px-5 py-3 font-semibold">Cost</th>
                  <th className="px-5 py-3 font-semibold">Odometer</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-navy-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-navy-800">{l.vehicle?.name}</p>
                      <p className="text-xs text-navy-400 font-mono">{l.vehicle?.registration_number}</p>
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{l.fuel_date}</td>
                    <td className="px-5 py-3.5 text-navy-600">{l.liters} L</td>
                    <td className="px-5 py-3.5 text-navy-600">₹{l.cost.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-navy-600">{l.odometer_reading ?? "—"} km</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => setDeleteTarget(l)} className="rounded-lg p-1.5 text-navy-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Fuel Log">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Vehicle</label>
            <select
              required
              className="input"
              value={form.vehicle_id}
              onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
            >
              <option value="">Select a vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.registration_number}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Liters</label>
              <input
                type="number"
                step="0.01"
                min={0.01}
                required
                className="input"
                placeholder="42.5"
                value={form.liters}
                onChange={(e) => setForm({ ...form, liters: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                required
                className="input"
                placeholder="4250"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Odometer (km)</label>
              <input
                type="number"
                min={0}
                className="input"
                placeholder="18234"
                value={form.odometer_reading}
                onChange={(e) => setForm({ ...form, odometer_reading: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                required
                className="input"
                value={form.fuel_date}
                onChange={(e) => setForm({ ...form, fuel_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-amber">
              {saving ? "Saving..." : "Add Log"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete fuel log?"
        message="This will permanently remove this fuel entry."
      />
    </div>
  );
}
