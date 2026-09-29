import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Car, Loader2, Upload, FileText } from "lucide-react";
import { vehiclesApi, documentsApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";

const VEHICLE_DOCS = [
  { type: "registration", label: "Registration Certificate (RC)" },
  { type: "insurance", label: "Insurance" },
  { type: "puc", label: "PUC / Pollution Certificate" },
  { type: "other", label: "Fitness / Permit Certificate" },
];

const EMPTY_FORM = {
  name: "", registration_number: "", type: "sedan", capacity: 4, status: "available",
  documents: VEHICLE_DOCS.map((d) => ({ ...d, file: null, doc_number: "", issue_date: "", expiry_date: "" })),
};

export default function Vehicles() {
  const { user } = useAuth();
  const { push } = useToast();
  const isAdmin = user?.role === "admin";
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    vehiclesApi.list(search ? { search } : {}).then((res) => setVehicles(res.data)).finally(() => setLoading(false));
  };
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [search]);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM, documents: EMPTY_FORM.documents.map((d) => ({ ...d })) }); setModalOpen(true); };
  const openEdit = (v) => {
    setEditing(v);
    setForm({ name: v.name, registration_number: v.registration_number, type: v.type, capacity: v.capacity, status: v.status, documents: [] });
    setModalOpen(true);
  };
  const updateDoc = (index, patch) => setForm((f) => ({ ...f, documents: f.documents.map((d, i) => i === index ? { ...d, ...patch } : d) }));

  const handleSubmit = async (e) => {
  e.preventDefault();

  const registrationNumber = form.registration_number.toUpperCase();

  // Telangana registration format: TS09AB1234 or TG09AB1234
  const registrationPattern = /^(TS|TG)[0-9]{2}[A-Z]{1,3}[0-9]{4}$/;

  if (!registrationPattern.test(registrationNumber)) {
    push(
      "Invalid registration number. Use format TS09AB1234 or TG09AB1234.",
      "error"
    );
    return;
  }

  setSaving(true);
    try {
      if (editing) {
        await vehiclesApi.update(editing.id, { name: form.name, registration_number: form.registration_number, type: form.type, capacity: form.capacity, status: form.status });
        push("Vehicle updated");
      } else {
        const res = await vehiclesApi.create({ name: form.name, registration_number: form.registration_number, type: form.type, capacity: form.capacity, status: form.status });
        const vehicleId = res.data.id;
        for (const doc of form.documents) {
          const created = await documentsApi.create({ vehicle_id: vehicleId, driver_id: null, doc_type: doc.type, doc_number: doc.doc_number || "NOT_UPLOADED", issue_date: doc.issue_date || null, expiry_date: doc.expiry_date || null, notes: doc.label });
          if (doc.file) await documentsApi.uploadFile(created.data.id, doc.file);
        }
        push("Vehicle added with document records");
      }
      setModalOpen(false); load();
    } catch (err) { push(err?.response?.data?.detail || "Something went wrong", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => { try { await vehiclesApi.remove(deleteTarget.id); push("Vehicle removed"); load(); } catch (err) { push(err?.response?.data?.detail || "Could not delete vehicle", "error"); } };

  return <div>
    <PageHeader title="Vehicles" subtitle="Register vehicles and keep their compliance documents connected to the fleet record." action={isAdmin && <button className="btn-amber" onClick={openCreate}><Plus size={16} /> Add Vehicle</button>} />
    <div className="card p-4 mb-4"><div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" /><input className="input pl-9" placeholder="Search by name or registration number..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
    <div className="card overflow-hidden">
      {loading ? <div className="flex items-center justify-center py-16 text-navy-400"><Loader2 className="animate-spin mr-2" size={18} /> Loading vehicles...</div> : vehicles.length === 0 ? <EmptyState icon={Car} title="No vehicles found" message="Try a different search, or add a new vehicle to get started." /> :
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400"><th className="px-5 py-3">Vehicle</th><th className="px-5 py-3">Registration No.</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Capacity</th><th className="px-5 py-3">Status</th>{isAdmin && <th className="px-5 py-3 text-right">Actions</th>}</tr></thead><tbody className="divide-y divide-navy-50">{vehicles.map((v) => <tr key={v.id} className="hover:bg-navy-50/50"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-navy-800 text-white flex items-center justify-center"><Car size={16} /></div><span className="font-semibold text-navy-800">{v.name}</span></div></td><td className="px-5 py-3.5 text-navy-600 font-mono text-xs">{v.registration_number}</td><td className="px-5 py-3.5 capitalize text-navy-600">{v.type}</td><td className="px-5 py-3.5 text-navy-600">{v.capacity} seats</td><td className="px-5 py-3.5"><Badge value={v.status} /></td>{isAdmin && <td className="px-5 py-3.5"><div className="flex justify-end gap-1.5"><button onClick={() => openEdit(v)} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-100 hover:text-navy-800"><Pencil size={16} /></button><button onClick={() => setDeleteTarget(v)} className="rounded-lg p-1.5 text-navy-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button></div></td>}</tr>)}</tbody></table></div>}
    </div>

    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Vehicle" : "Add Vehicle + Documents"}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <div><label className="label">Vehicle Name</label><input required className="input" placeholder="Toyota Innova Crysta" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div>
  <label className="label">Registration Number</label>
  <input
    required
    className="input uppercase"
    placeholder="TS09AB1234"
    maxLength={11}
    value={form.registration_number}
    onChange={(e) => {
      const value = e.target.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 11);

      setForm({ ...form, registration_number: value });
    }}
  />
  <p className="text-xs text-navy-400 mt-1">
    Format: TS09AB1234
  </p>
</div>
        <div className="grid grid-cols-2 gap-4"><div><label className="label">Type</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="sedan">Sedan</option><option value="suv">SUV</option><option value="van">Van</option><option value="truck">Truck</option><option value="bus">Bus</option><option value="bike">Bike</option></select></div><div><label className="label">Capacity</label><input type="number" min={1} required className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div></div>
        <div><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="available">Available</option><option value="booked">Booked</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select></div>
        {!editing && <div className="border-t border-navy-100 pt-4"><div className="flex items-center gap-2 mb-3"><FileText size={17} /><div><p className="font-semibold text-navy-800">Vehicle Documents</p><p className="text-xs text-navy-400">You can upload now or leave a document as Not Uploaded.</p></div></div><div className="space-y-4">{form.documents.map((doc, i) => <div key={doc.label} className="rounded-xl border border-navy-100 p-3"><p className="text-sm font-semibold text-navy-700 mb-2">{doc.label}</p><div className="grid grid-cols-2 gap-3 mb-2"><input className="input" placeholder="Document number (optional)" value={doc.doc_number} onChange={(e) => updateDoc(i, { doc_number: e.target.value })} /><label className="btn-outline cursor-pointer justify-center"><Upload size={14} /> {doc.file ? doc.file.name : "Choose file"}<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => updateDoc(i, { file: e.target.files?.[0] || null })} /></label></div><div className="grid grid-cols-2 gap-3"><input type="date" className="input" value={doc.issue_date} onChange={(e) => updateDoc(i, { issue_date: e.target.value })} /><input type="date" className="input" value={doc.expiry_date} onChange={(e) => updateDoc(i, { expiry_date: e.target.value })} /></div></div>)}</div></div>}
        {editing && <p className="text-xs text-navy-400 border-t pt-3">To add or replace files for this vehicle, use the Documents page.</p>}
        <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" disabled={saving} className="btn-amber">{saving ? "Saving..." : editing ? "Save Changes" : "Add Vehicle"}</button></div>
      </form>
    </Modal>
    <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Remove vehicle?" message={`This will permanently remove "${deleteTarget?.name}" from your fleet.`} />
  </div>;
}
