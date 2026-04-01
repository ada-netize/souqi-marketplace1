"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

const initialForm = { nameAr: "", slug: "", sortOrder: 0, isActive: true, icon: "⬢" };

export default function CategoriesPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setError("");
      const data = await api("/api/admin/categories");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "فشل تحميل الأقسام");
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      setSaving(true);
      const method = editingId ? "PUT" : "POST";
      const path = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
      await api(path, { method, body: form });
      setForm(initialForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message || "فشل حفظ القسم");
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
              <h3 className="section-title">{editingId ? "تعديل قسم" : "إضافة قسم جديد"}</h3>
              <p className="section-subtitle">أدخل الاسم والـ slug والأيقونة وترتيب الظهور.</p>
            </div>
          </div>
          <div className="form-grid-2">
            <div className="field"><label className="fieldLabel">الاسم العربي</label><input className="input" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Slug</label><input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">الترتيب</label><input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value || 0) })} /></div>
            <div className="field"><label className="fieldLabel">الأيقونة</label><input className="input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
            <label className="fieldLabel" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              مفعل
            </label>
            <button className="btn" onClick={save}>{saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديل" : "إضافة القسم"}</button>
            {editingId ? <button className="btn btn-secondary" onClick={() => { setForm(initialForm); setEditingId(null); }}>إلغاء</button> : null}
          </div>
          {error ? <p className="section-subtitle" style={{ color: "#ffc9c9", marginTop: 12 }}>{error}</p> : null}
        </div>

        <div className="panel">
          <div className="section-head">
            <div>
              <h3 className="section-title">قائمة الأقسام</h3>
              <p className="section-subtitle">عدد الأقسام الحالية: {rows.length}</p>
            </div>
            <button className="btn" onClick={load}>تحديث</button>
          </div>
          <div className="grid" style={{ gap: 12 }}>
            {rows.map((item) => (
              <div key={item.id} className="listCard">
                <div className="listCardMain">
                  <div className="listTitleRow"><strong>{item.icon} {item.name_ar}</strong><span className="badge">{item.is_active ? "مفعل" : "معطل"}</span></div>
                  <div className="mutedParagraph">slug: {item.slug}</div>
                  <div className="mutedParagraph">الترتيب: {item.sort_order}</div>
                </div>
                <div className="listCardActions">
                  <button className="btn" onClick={() => { setEditingId(item.id); setForm({ nameAr: item.name_ar, slug: item.slug, sortOrder: item.sort_order, isActive: !!item.is_active, icon: item.icon || "⬢" }); }}>تعديل</button>
                  <button className="btn btn-danger" onClick={async () => { if (!confirm("حذف هذا القسم؟")) return; await api(`/api/admin/categories/${item.id}`, { method: "DELETE" }); await load(); }}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
