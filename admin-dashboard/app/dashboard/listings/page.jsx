"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "../../../lib/api";

const emptyEditor = {
  id: null,
  title: "",
  price: 0,
  status: "available",
  isApproved: true,
  isFeatured: false,
  boostExpiresAt: "",
  sponsorHomeExpiresAt: "",
  pinnedUntil: "",
};

function toInputDateTime(value) {
  if (!value) return "";
  return String(value).slice(0, 16);
}

export default function ListingsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editor, setEditor] = useState(emptyEditor);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async (search = q, statusValue = status) => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusValue) params.set("status", statusValue);
      const data = await api(`/api/admin/listings${params.toString() ? `?${params.toString()}` : ""}`);
      setRows(Array.isArray(data) ? data : []);
      if (!selectedId && data?.[0]?.id) setSelectedId(data[0].id);
    } catch (err) {
      setError(err.message || "فشل تحميل الإعلانات");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    if (!id) return;
    try {
      setError("");
      const data = await api(`/api/admin/listings/${id}`);
      const listing = data?.listing;
      if (!listing) return;
      setEditor({
        id: listing.id,
        title: listing.title || "",
        price: listing.price || 0,
        status: listing.status || "available",
        isApproved: Boolean(listing.is_approved),
        isFeatured: Boolean(listing.is_featured),
        boostExpiresAt: toInputDateTime(listing.boost_expires_at),
        sponsorHomeExpiresAt: toInputDateTime(listing.sponsor_home_expires_at),
        pinnedUntil: toInputDateTime(listing.pinned_until),
      });
    } catch (err) {
      setError(err.message || "فشل تحميل تفاصيل الإعلان");
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.push("/");
      return;
    }
    load("", "");
    const onFocus = () => { load(q, status); if (selectedId) loadDetail(selectedId); };
    window.addEventListener("focus", onFocus);
    const interval = setInterval(onFocus, 15000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [router, q, status, selectedId]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId]);

  const selectedListing = useMemo(() => rows.find((item) => item.id === selectedId), [rows, selectedId]);

  const save = async () => {
    if (!editor.id) return;
    try {
      setSaving(true);
      setMessage("");
      await api(`/api/admin/listings/${editor.id}`, {
        method: "PUT",
        body: {
          title: editor.title,
          price: Number(editor.price || 0),
          status: editor.status,
          isApproved: editor.isApproved,
          isFeatured: editor.isFeatured,
          boostExpiresAt: editor.boostExpiresAt || null,
          sponsorHomeExpiresAt: editor.sponsorHomeExpiresAt || null,
          pinnedUntil: editor.pinnedUntil || null,
        },
      });
      setMessage("تم حفظ الإعلان بنجاح");
      await load(q, status);
      await loadDetail(editor.id);
    } catch (err) {
      setError(err.message || "فشل حفظ الإعلان");
    } finally {
      setSaving(false);
    }
  };

  const removeListing = async () => {
    if (!editor.id) return;
    try {
      await api(`/api/admin/listings/${editor.id}`, { method: "DELETE" });
      setMessage("تم حذف الإعلان");
      setSelectedId(null);
      setEditor(emptyEditor);
      await load(q, status);
    } catch (err) {
      setError(err.message || "فشل حذف الإعلان");
    }
  };

  return (
    <>
      <section className="panel">
        <div className="section-head">
          <div>
            <h3 className="section-title">بحث وفلاتر الإدارة</h3>
            <p className="section-subtitle">ابحث ثم افتح أي إعلان للتحكم به من نفس الصفحة.</p>
          </div>
          <div className="heroActionRow">
            <button className="btn primary" onClick={() => load()}>تحديث النتائج</button>
          </div>
        </div>
        <div className="form-grid-3">
          <div className="field">
            <label className="fieldLabel">بحث</label>
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="عنوان الإعلان أو الوصف" />
          </div>
          <div className="field">
            <label className="fieldLabel">الحالة</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">كل الحالات</option>
              <option value="available">متاح</option>
              <option value="reserved">محجوز</option>
              <option value="sold">مباع</option>
              <option value="hidden">مخفي</option>
            </select>
          </div>
          <div className="field statusCardField">
            <span className="fieldLabel">عدد النتائج</span>
            <div className="statusMetricBox"><strong>{rows.length}</strong><span>إعلان</span></div>
          </div>
        </div>
        {error ? <p className="errorText">{error}</p> : null}
        {message ? <p className="successText">{message}</p> : null}
      </section>

      <section className="adminTwoColumn" style={{ marginTop: 22 }}>
        <div className="panel">
          <div className="section-head">
            <div>
              <h3 className="section-title">قائمة الإعلانات</h3>
              <p className="section-subtitle">اختر إعلانًا لفتح تفاصيله وإدارته.</p>
            </div>
          </div>
          <div className="stackList listingStack">
            {loading ? <p className="section-subtitle">جارٍ التحميل...</p> : null}
            {!loading && !rows.length ? <p className="section-subtitle">لا توجد إعلانات مطابقة.</p> : null}
            {rows.map((item) => (
              <button
                key={item.id}
                className={`selectCard ${selectedId === item.id ? "active" : ""}`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="selectCardHeader">
                  <strong>{item.title}</strong>
                  <span className="badge">#{item.id}</span>
                </div>
                <p className="mutedParagraph">{item.category?.name_ar || item.category_name || "—"} • {item.city?.name_ar || item.city_name || "—"}</p>
                <div className="selectCardMeta">
                  <span>₪{Number(item.price || 0).toLocaleString()}</span>
                  <span>{item.status}</span>
                  <span>{item.is_featured ? "مميز" : "عادي"}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel detailPanelSticky">
          <div className="section-head">
            <div>
              <h3 className="section-title">لوحة التحكم بالإعلان</h3>
              <p className="section-subtitle">التغييرات هنا تنعكس مباشرة على التطبيق والويب.</p>
            </div>
          </div>

          {!selectedListing ? <p className="section-subtitle">اختر إعلانًا من القائمة.</p> : (
            <div className="grid" style={{ gap: 16 }}>
              <div className="detailHeroBar">
                <div>
                  <strong>{selectedListing.title}</strong>
                  <p className="mutedParagraph">{selectedListing.seller?.full_name || selectedListing.user_name || "—"}</p>
                </div>
                <span className="badge">{selectedListing.status}</span>
              </div>

              <div className="form-grid-2">
                <div className="field"><label className="fieldLabel">العنوان</label><input className="input" value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} /></div>
                <div className="field"><label className="fieldLabel">السعر</label><input className="input" type="number" value={editor.price} onChange={(e) => setEditor({ ...editor, price: e.target.value })} /></div>
                <div className="field"><label className="fieldLabel">الحالة</label><select className="input" value={editor.status} onChange={(e) => setEditor({ ...editor, status: e.target.value })}><option value="available">متاح</option><option value="reserved">محجوز</option><option value="sold">مباع</option><option value="hidden">مخفي</option></select></div>
                <div className="field">
                  <label className="fieldLabel">الموافقة والتمييز</label>
                  <div className="toggleRowWrap">
                    <label className="togglePill"><input type="checkbox" checked={editor.isApproved} onChange={(e) => setEditor({ ...editor, isApproved: e.target.checked })} /><span>معتمد</span></label>
                    <label className="togglePill"><input type="checkbox" checked={editor.isFeatured} onChange={(e) => setEditor({ ...editor, isFeatured: e.target.checked })} /><span>مميز</span></label>
                  </div>
                </div>
                <div className="field"><label className="fieldLabel">رفع / Boost حتى</label><input className="input" type="datetime-local" value={editor.boostExpiresAt} onChange={(e) => setEditor({ ...editor, boostExpiresAt: e.target.value })} /></div>
                <div className="field"><label className="fieldLabel">Featured بالرئيسية حتى</label><input className="input" type="datetime-local" value={editor.sponsorHomeExpiresAt} onChange={(e) => setEditor({ ...editor, sponsorHomeExpiresAt: e.target.value })} /></div>
              </div>

              <div className="detailFactsGrid">
                <div className="detailFact"><span>المدينة</span><strong>{selectedListing.city?.name_ar || selectedListing.city_name || "—"}</strong></div>
                <div className="detailFact"><span>القسم</span><strong>{selectedListing.category?.name_ar || selectedListing.category_name || "—"}</strong></div>
                <div className="detailFact"><span>المفضلة</span><strong>{selectedListing.favorite_count ?? 0}</strong></div>
                <div className="detailFact"><span>الحالة الحالية</span><strong>{selectedListing.status}</strong></div>
              </div>

              <div className="heroActionRow">
                <button className="btn primary" onClick={save} disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}</button>
                <button className="btn" onClick={() => setEditor({ ...editor, isApproved: !editor.isApproved })}>تبديل الاعتماد</button>
                <button className="btn danger" onClick={removeListing}>حذف الإعلان</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
