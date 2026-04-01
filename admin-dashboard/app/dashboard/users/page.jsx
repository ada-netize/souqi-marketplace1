"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "../../../lib/api";

const emptyEditor = {
  id: null,
  fullName: "",
  phone: "",
  isBlocked: false,
  isVerified: false,
  subscriptionPlan: "free",
  subscriptionStatus: "inactive",
};

const planOptions = [
  { value: "free", label: "مجاني" },
  { value: "souqi_store_basic", label: "Store Basic" },
  { value: "souqi_store_plus", label: "Store Plus" },
  { value: "souqi_store_pro", label: "Store Pro" },
];

export default function UsersPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editor, setEditor] = useState(emptyEditor);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState(null);

  const load = async (search = q) => {
    try {
      setLoading(true);
      setError("");
      const data = await api(`/api/admin/users?q=${encodeURIComponent(search)}`);
      setRows(Array.isArray(data) ? data : []);
      if (!selectedId && data?.[0]?.id) setSelectedId(data[0].id);
    } catch (err) {
      setError(err.message || "فشل تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    if (!id) return;
    try {
      const data = await api(`/api/admin/users/${id}`);
      setDetails(data || null);
      const user = data?.user;
      if (!user) return;
      setEditor({
        id: user.id,
        fullName: user.full_name || "",
        phone: user.phone || "",
        isBlocked: Boolean(user.is_blocked),
        isVerified: Boolean(user.is_verified),
        subscriptionPlan: user.subscription_plan || "free",
        subscriptionStatus: user.subscription_status || "inactive",
      });
    } catch (err) {
      setError(err.message || "فشل تحميل تفاصيل المستخدم");
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.push("/");
      return;
    }
    load("");
    const onFocus = () => { load(""); if (selectedId) loadDetail(selectedId); };
    window.addEventListener("focus", onFocus);
    const interval = setInterval(onFocus, 15000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [router, selectedId]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId]);

  const selectedUser = useMemo(() => rows.find((item) => item.id === selectedId), [rows, selectedId]);

  const save = async () => {
    if (!editor.id) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api(`/api/admin/users/${editor.id}`, {
        method: "PUT",
        body: {
          fullName: editor.fullName,
          phone: editor.phone,
          isBlocked: editor.isBlocked,
          isVerified: editor.isVerified,
          subscriptionPlan: editor.subscriptionPlan,
          subscriptionStatus: editor.subscriptionStatus,
        },
      });
      setMessage("تم حفظ المستخدم بنجاح");
      await load(q);
      await loadDetail(editor.id);
    } catch (err) {
      setError(err.message || "فشل حفظ المستخدم");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="panel">
        <div className="section-head">
          <div>
            <h3 className="section-title">بحث بالمستخدمين</h3>
            <p className="section-subtitle">ابحث بالاسم أو البريد أو الهاتف ثم افتح ملف المستخدم مباشرة.</p>
          </div>
          <button className="btn primary" onClick={() => load()}>تحديث القائمة</button>
        </div>
        <div className="form-grid-3">
          <div className="field"><label className="fieldLabel">كلمة البحث</label><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="الاسم / البريد / الهاتف" /></div>
          <div className="field statusCardField"><span className="fieldLabel">إجمالي الظاهر</span><div className="statusMetricBox"><strong>{rows.length}</strong><span>مستخدم</span></div></div>
          <div className="field statusCardField"><span className="fieldLabel">الوصول السريع</span><div className="statusMetricBox"><strong>{rows.filter((item) => item.is_verified).length}</strong><span>موثق</span></div></div>
        </div>
        {error ? <p className="errorText">{error}</p> : null}
        {message ? <p className="successText">{message}</p> : null}
      </section>

      <section className="adminTwoColumn" style={{ marginTop: 22 }}>
        <div className="panel">
          <div className="section-head"><div><h3 className="section-title">قائمة المستخدمين</h3><p className="section-subtitle">اختر مستخدمًا لفتح ملف التحكم الخاص به.</p></div></div>
          <div className="stackList listingStack">
            {loading ? <p className="section-subtitle">جارٍ التحميل...</p> : null}
            {!loading && !rows.length ? <p className="section-subtitle">لا توجد نتائج.</p> : null}
            {rows.map((item) => (
              <button key={item.id} className={`selectCard ${selectedId === item.id ? "active" : ""}`} onClick={() => setSelectedId(item.id)}>
                <div className="selectCardHeader">
                  <strong>{item.full_name}</strong>
                  <span className="badge">#{item.id}</span>
                </div>
                <p className="mutedParagraph">{item.phone || item.email || "بدون بيانات اتصال"}</p>
                <div className="selectCardMeta">
                  <span>{item.is_verified ? "موثق" : "غير موثق"}</span>
                  <span>{item.is_blocked ? "محظور" : "نشط"}</span>
                  <span>{item.subscription_plan || "free"}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel detailPanelSticky">
          <div className="section-head"><div><h3 className="section-title">ملف التحكم بالمستخدم</h3><p className="section-subtitle">أي تعديل هنا ينعكس على التطبيق مباشرة.</p></div></div>
          {!selectedUser ? <p className="section-subtitle">اختر مستخدمًا من القائمة.</p> : (
            <div className="grid" style={{ gap: 16 }}>
              <div className="detailHeroBar">
                <div>
                  <strong>{selectedUser.full_name}</strong>
                  <p className="mutedParagraph">{selectedUser.email || "بدون بريد"}</p>
                </div>
                <span className="badge">{selectedUser.is_blocked ? "محظور" : "نشط"}</span>
              </div>

              <div className="form-grid-2">
                <div className="field"><label className="fieldLabel">الاسم</label><input className="input" value={editor.fullName} onChange={(e) => setEditor({ ...editor, fullName: e.target.value })} /></div>
                <div className="field"><label className="fieldLabel">الهاتف</label><input className="input" value={editor.phone} onChange={(e) => setEditor({ ...editor, phone: e.target.value })} /></div>
                <div className="field"><label className="fieldLabel">الخطة</label><select className="input" value={editor.subscriptionPlan} onChange={(e) => setEditor({ ...editor, subscriptionPlan: e.target.value })}>{planOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
                <div className="field"><label className="fieldLabel">حالة الاشتراك</label><select className="input" value={editor.subscriptionStatus} onChange={(e) => setEditor({ ...editor, subscriptionStatus: e.target.value })}><option value="inactive">inactive</option><option value="active">active</option><option value="expired">expired</option></select></div>
                <div className="field">
                  <label className="fieldLabel">صلاحيات الحساب</label>
                  <div className="toggleRowWrap">
                    <label className="togglePill"><input type="checkbox" checked={editor.isVerified} onChange={(e) => setEditor({ ...editor, isVerified: e.target.checked })} /><span>موثق</span></label>
                    <label className="togglePill"><input type="checkbox" checked={editor.isBlocked} onChange={(e) => setEditor({ ...editor, isBlocked: e.target.checked })} /><span>محظور</span></label>
                  </div>
                </div>
              </div>

              <div className="detailFactsGrid">
                <div className="detailFact"><span>عدد الإعلانات</span><strong>{details?.user?.listings_count ?? 0}</strong></div>
                <div className="detailFact"><span>المحفوظات</span><strong>{details?.user?.saved_count ?? 0}</strong></div>
                <div className="detailFact"><span>إجمالي المشتريات</span><strong>₪{Number(details?.user?.purchases_total || 0).toLocaleString()}</strong></div>
                <div className="detailFact"><span>الخطة الحالية</span><strong>{editor.subscriptionPlan}</strong></div>
              </div>

              <div className="heroActionRow">
                <button className="btn primary" onClick={save} disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}</button>
                <button className="btn" onClick={() => setEditor({ ...editor, isVerified: !editor.isVerified })}>تبديل التوثيق</button>
                <button className="btn danger" onClick={() => setEditor({ ...editor, isBlocked: !editor.isBlocked })}>{editor.isBlocked ? "فك الحظر" : "حظر المستخدم"}</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
