import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, Loader2, Phone, Upload, FileText } from "lucide-react";
import { driversApi, documentsApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";

const DRIVER_DOCS = [
  { type: "license", label: "Driving Licence" },
  { type: "other", label: "Driver ID Proof" },
];
const EMPTY_FORM = { full_name: "", license_number: "", phone: "", status: "available", documents: DRIVER_DOCS.map((d) => ({ ...d, file: null, doc_number: "", issue_date: "", expiry_date: "" })) };

export default function Drivers() {
  const { user } = useAuth(); const { push } = useToast(); const isAdmin = user?.role === "admin";
  const [drivers, setDrivers] = useState([]); const [loading, setLoading] = useState(true); const [modalOpen, setModalOpen] = useState(false); const [editing, setEditing] = useState(null); const [form, setForm] = useState(EMPTY_FORM); const [saving, setSaving] = useState(false); const [deleteTarget, setDeleteTarget] = useState(null);
  const load = () => { setLoading(true); driversApi.list().then((res) => setDrivers(res.data)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM, documents: EMPTY_FORM.documents.map((d) => ({ ...d })) }); setModalOpen(true); };
  const openEdit = (d) => { setEditing(d); setForm({ full_name: d.full_name, license_number: d.license_number, phone: d.phone || "", status: d.status, documents: [] }); setModalOpen(true); };
  const updateDoc = (index, patch) => setForm((f) => ({ ...f, documents: f.documents.map((d, i) => i === index ? { ...d, ...patch } : d) }));
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); try {
    if (editing) { await driversApi.update(editing.id, { full_name: form.full_name, license_number: form.license_number, phone: form.phone, status: form.status }); push("Driver updated"); }
    else { const res = await driversApi.create({ full_name: form.full_name, license_number: form.license_number, phone: form.phone, status: form.status }); const driverId = res.data.id; for (const doc of form.documents) { const created = await documentsApi.create({ vehicle_id: null, driver_id: driverId, doc_type: doc.type, doc_number: doc.doc_number || (doc.type === "license" ? form.license_number : "NOT_UPLOADED"), issue_date: doc.issue_date || null, expiry_date: doc.expiry_date || null, notes: doc.label }); if (doc.file) await documentsApi.uploadFile(created.data.id, doc.file); } push("Driver added with document records"); }
    setModalOpen(false); load();
  } catch (err) { push(err?.response?.data?.detail || "Something went wrong", "error"); } finally { setSaving(false); } };
  const handleDelete = async () => { try { await driversApi.remove(deleteTarget.id); push("Driver removed"); load(); } catch (err) { push(err?.response?.data?.detail || "Could not delete driver", "error"); } };
  return <div>
    <PageHeader title="Drivers" subtitle="Maintain driver profiles and keep licences and identity documents linked to each driver." action={isAdmin && <button className="btn-amber" onClick={openCreate}><Plus size={16} /> Add Driver</button>} />
    {loading ? <div className="flex items-center justify-center py-16 text-navy-400"><Loader2 className="animate-spin mr-2" size={18} /> Loading drivers...</div> : drivers.length === 0 ? <div className="card"><EmptyState icon={Users} title="No drivers yet" message="Add your first driver to start assigning trips." /></div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{drivers.map((d) => <div key={d.id} className="card p-5"><div className="flex items-start justify-between mb-3"><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-full bg-navy-800 text-white flex items-center justify-center font-head font-bold">{d.full_name[0]?.toUpperCase()}</div><div><p className="font-semibold text-navy-800">{d.full_name}</p><p className="text-xs text-navy-400 font-mono">{d.license_number}</p></div></div><Badge value={d.status} /></div>{d.phone && <p className="text-sm text-navy-500 flex items-center gap-1.5 mb-3"><Phone size={14} /> {d.phone}</p>}{isAdmin && <div className="flex gap-2 pt-2 border-t border-navy-100"><button onClick={() => openEdit(d)} className="btn-outline flex-1 !py-1.5 text-xs"><Pencil size={14} /> Edit</button><button onClick={() => setDeleteTarget(d)} className="btn-outline flex-1 !py-1.5 text-xs !text-rose-600 hover:!bg-rose-50"><Trash2 size={14} /> Remove</button></div>}</div>)}</div>}
    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Driver" : "Add Driver + Documents"}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1"><div><label className="label">Full Name</label><input required className="input" placeholder="Ravi Kumar" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div><div><label className="label">License Number</label><input required className="input" placeholder="DL-0420110012345" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} /></div><div><label className="label">Phone</label><input className="input" placeholder="9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div><div><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="available">Available</option><option value="on_trip">On Trip</option><option value="off_duty">Off Duty</option></select></div>
      {!editing && <div className="border-t border-navy-100 pt-4"><div className="flex items-center gap-2 mb-3"><FileText size={17} /><div><p className="font-semibold text-navy-800">Driver Documents</p><p className="text-xs text-navy-400">Upload the licence and ID proof now, or leave them for later.</p></div></div><div className="space-y-4">{form.documents.map((doc, i) => <div key={doc.label} className="rounded-xl border border-navy-100 p-3"><p className="text-sm font-semibold text-navy-700 mb-2">{doc.label}</p><div className="grid grid-cols-2 gap-3 mb-2"><input className="input" placeholder="Document number (optional)" value={doc.doc_number} onChange={(e) => updateDoc(i, { doc_number: e.target.value })} /><label className="btn-outline cursor-pointer justify-center"><Upload size={14} /> {doc.file ? doc.file.name : "Choose file"}<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => updateDoc(i, { file: e.target.files?.[0] || null })} /></label></div><div className="grid grid-cols-2 gap-3"><input type="date" className="input" value={doc.issue_date} onChange={(e) => updateDoc(i, { issue_date: e.target.value })} /><input type="date" className="input" value={doc.expiry_date} onChange={(e) => updateDoc(i, { expiry_date: e.target.value })} /></div></div>)}</div></div>}
      {editing && <p className="text-xs text-navy-400 border-t pt-3">To add or replace driver files, use the Documents page.</p>}
      <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" disabled={saving} className="btn-amber">{saving ? "Saving..." : editing ? "Save Changes" : "Add Driver"}</button></div></form>
    </Modal><ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Remove driver?" message={`This will permanently remove "${deleteTarget?.full_name}" from your driver roster.`} />
  </div>;
}
