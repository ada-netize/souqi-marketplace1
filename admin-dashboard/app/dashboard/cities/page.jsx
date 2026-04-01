"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

const initialForm = { nameAr: "", regionAr: "", sortOrder: 0, isActive: true };

export default function CitiesPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setError("");
      const data = await api("/api/admin/cities");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "فشل تحميل المدن");
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      setSaving(true);
      const method = editingId ? "PUT" : "POST";
      const path = editingId ? `/api/admin/cities/${editingId}` : "/api/admin/cities";
      await api(path, { method, body: form });
      setForm(initialForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message || "فشل حفظ المدينة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="grid splitGrid">
        <div className="panel">
          <div className="section-head">
            <div>
              <h3 className="section-title">{editingId ? "تعديل مدينة" : "إضافة مدينة جديدة"}</h3>
              <p className="section-subtitle">أدخل اسم المدينة، المنطقة، وترتيب الظهور.</p>
            </div>
          </div>
          <div className="form-grid-2">
            <div className="field"><label className="fieldLabel">اسم المدينة</label><input className="input" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">المنطقة</label><input className="input" value={form.regionAr} onChange={(e) => setForm({ ...form, regionAr: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">الترتيب</label><input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value || 0) })} /></div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
            <label className="fieldLabel" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              مفعل
            </label>
            <button className="btn" onClick={save}>{saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديل" : "إضافة المدينة"}</button>
            {editingId ? <button className="btn btn-secondary" onClick={() => { setForm(initialForm); setEditingId(null); }}>إلغاء</button> : null}
          </div>
          {error ? <p className="section-subtitle" style={{ color: "#ffc9c9", marginTop: 12 }}>{error}</p> : null}
        </div>

        <div className="panel">
          <div className="section-head">
            <div>
              <h3 className="section-title">قائمة المدن</h3>
              <p className="section-subtitle">عدد المدن الحالية: {rows.length}</p>
            </div>
            <button className="btn" onClick={load}>تحديث</button>
          </div>
          <div className="grid" style={{ gap: 12 }}>
            {rows.map((item) => (
              <div key={item.id} className="listCard">
                <div className="listCardMain">
                  <div className="listTitleRow"><strong>{item.name_ar}</strong><span className="badge">{item.is_active ? "مفعلة" : "معطلة"}</span></div>
                  <div className="mutedParagraph">المنطقة: {item.region_ar || "—"}</div>
                  <div className="mutedParagraph">الترتيب: {item.sort_order}</div>
                </div>
                <div className="listCardActions">
                  <button className="btn" onClick={() => { setEditingId(item.id); setForm({ nameAr: item.name_ar, regionAr: item.region_ar || "", sortOrder: item.sort_order, isActive: !!item.is_active }); }}>تعديل</button>
                  <button className="btn btn-danger" onClick={async () => { if (!confirm("حذف هذه المدينة؟")) return; await api(`/api/admin/cities/${item.id}`, { method: "DELETE" }); await load(); }}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
