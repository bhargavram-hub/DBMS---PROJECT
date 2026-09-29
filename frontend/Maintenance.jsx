import { useEffect, useState } from "react";
import { Plus, Wrench, Loader2, Trash2 } from "lucide-react";
import { maintenanceApi, vehiclesApi } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";

const EMPTY_FORM = {
  vehicle_id: "", service_type: "", description: "", cost: "", service_date: "", next_due_date: "", status: "scheduled",
};

export default function Maintenance() {
  const { push } = useToast();
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([maintenanceApi.list(), vehiclesApi.list()])
      .then(([mRes, vRes]) => {
        setRecords(mRes.data);
        setVehicles(vRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, service_date: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await maintenanceApi.create({
        ...form,
        vehicle_id: Number(form.vehicle_id),
        cost: Number(form.cost) || 0,
        next_due_date: form.next_due_date || null,
      });
      push("Maintenance record added");
      setModalOpen(false);
      load();
    } catch (err) {
      push(err?.response?.data?.detail || "Could not save record", "error");
    } finally {
      setSaving(false);
    }
  };

  const markStatus = async (record, status) => {
    try {
      await maintenanceApi.update(record.id, { status });
      push("Status updated");
      load();
    } catch (err) {
      push(err?.response?.data?.detail || "Could not update status", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await maintenanceApi.remove(deleteTarget.id);
      push("Record removed");
      load();
    } catch (err) {
      push(err?.response?.data?.detail || "Could not delete record", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Log service schedules, repairs and upcoming due dates."
        action={
          <button className="btn-amber" onClick={openCreate}>
            <Plus size={16} /> Log Service
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-navy-400">
          <Loader2 className="animate-spin mr-2" size={18} /> Loading maintenance records...
        </div>
      ) : records.length === 0 ? (
        <div className="card">
          <EmptyState icon={Wrench} title="No maintenance records" message="Log your first service to start tracking vehicle upkeep." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                  <th className="px-5 py-3 font-semibold">Vehicle</th>
                  <th className="px-5 py-3 font-semibold">Service</th>
                  <th className="px-5 py-3 font-semibold">Cost</th>
                  <th className="px-5 py-3 font-semibold">Service Date</th>
                  <th className="px-5 py-3 font-semibold">Next Due</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-navy-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-navy-800">{r.vehicle?.name}</p>
                      <p className="text-xs text-navy-400 font-mono">{r.vehicle?.registration_number}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-navy-700">{r.service_type}</p>
                      {r.description && <p className="text-xs text-navy-400 max-w-xs truncate">{r.description}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">₹{r.cost.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-navy-600">{r.service_date}</td>
                    <td className="px-5 py-3.5 text-navy-600">{r.next_due_date || "—"}</td>
                    <td className="px-5 py-3.5">
                      <select
                        className="text-xs font-semibold rounded-full border-0 bg-transparent focus:ring-0 cursor-pointer"
                        value={r.status}
                        onChange={(e) => markStatus(r, e.target.value)}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => setDeleteTarget(r)} className="rounded-lg p-1.5 text-navy-400 hover:bg-rose-50 hover:text-rose-600">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Maintenance / Service">
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
          <div>
            <label className="label">Service Type</label>
            <input
              required
              className="input"
              placeholder="Oil change, brake check, engine service..."
              value={form.service_type}
              onChange={(e) => setForm({ ...form, service_type: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Additional notes"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cost (₹)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input"
                placeholder="3200"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Service Date</label>
              <input
                type="date"
                required
                className="input"
                value={form.service_date}
                onChange={(e) => setForm({ ...form, service_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Next Due Date</label>
              <input
                type="date"
                className="input"
                value={form.next_due_date}
                onChange={(e) => setForm({ ...form, next_due_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-amber">
              {saving ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete maintenance record?"
        message="This will permanently remove this service record."
      />
    </div>
  );
}
