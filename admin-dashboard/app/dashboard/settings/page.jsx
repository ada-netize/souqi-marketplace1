"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "../../../lib/api";

const empty = {
  platformName: "سوقي",
  primaryTagline: "منصة إعلانات محلية عربية للتواصل المباشر بين المستخدمين.",
  contactPhone: "",
  contactEmail: "",
  supportPhone: "",
  supportEmail: "",
  termsText: "",
  privacyText: "",
  maxImages: "8",
  raise1DayPrice: "10",
  raise3DaysPrice: "20",
  boost3DaysPrice: "25",
  featured3DaysPrice: "35",
  storeBasicMonthly: "29",
  storePlusMonthly: "49",
  storeProMonthly: "79",
  iosRaise1DayId: "souqi_raise_1_day",
  iosRaise3DaysId: "souqi_raise_3_days",
  iosBoost3DaysId: "souqi_boost_3_days",
  iosFeatured3DaysId: "souqi_featured_3_days",
  iosStoreBasicMonthlyId: "souqi_store_basic_monthly",
  iosStorePlusMonthlyId: "souqi_store_plus_monthly",
  iosStoreProMonthlyId: "souqi_store_pro_monthly",
  androidRaise1DayId: "souqi_raise_1_day",
  androidRaise3DaysId: "souqi_raise_3_days",
  androidBoost3DaysId: "souqi_boost_3_days",
  androidFeatured3DaysId: "souqi_featured_3_days",
  androidStoreBasicMonthlyId: "souqi_store_basic_monthly",
  androidStorePlusMonthlyId: "souqi_store_plus_monthly",
  androidStoreProMonthlyId: "souqi_store_pro_monthly",
};

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/"); return; }
    api("/api/admin/settings")
      .then((data) => setForm({ ...empty, ...data }))
      .catch((err) => setMessage(err.message || "فشل تحميل الإعدادات"))
      .finally(() => setLoading(false));
  }, [router]);

  const save = async () => {
    try {
      setSaving(true);
      setMessage("");
      await api("/api/admin/settings", { method: "POST", body: form });
      setMessage("تم حفظ الإعدادات بنجاح");
    } catch (err) {
      setMessage(err.message || "فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="grid splitGrid">
        <div className="panel">
          <div className="section-head"><div><h3 className="section-title">الهوية العامة</h3><p className="section-subtitle">الاسم، السطر التعريفي، وبيانات التواصل.</p></div></div>
          <div className="form-grid-2">
            <div className="field"><label className="fieldLabel">اسم المنصة</label><input className="input" value={form.platformName} onChange={(e) => setForm({ ...form, platformName: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">السطر التعريفي</label><input className="input" value={form.primaryTagline} onChange={(e) => setForm({ ...form, primaryTagline: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">هاتف التواصل</label><input className="input" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">بريد التواصل</label><input className="input" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">هاتف الدعم</label><input className="input" value={form.supportPhone} onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">بريد الدعم</label><input className="input" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} /></div>
          </div>
        </div>

        <div className="panel">
          <div className="section-head"><div><h3 className="section-title">تسعير المزايا الرقمية</h3><p className="section-subtitle">بدون أي دفع للسلعة نفسها داخل التطبيق.</p></div></div>
          <div className="form-grid-2">
            <div className="field"><label className="fieldLabel">رفع الإعلان يوم واحد ₪</label><input className="input" value={form.raise1DayPrice} onChange={(e) => setForm({ ...form, raise1DayPrice: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">رفع الإعلان 3 أيام ₪</label><input className="input" value={form.raise3DaysPrice} onChange={(e) => setForm({ ...form, raise3DaysPrice: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Boost 3 أيام ₪</label><input className="input" value={form.boost3DaysPrice} onChange={(e) => setForm({ ...form, boost3DaysPrice: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Featured 3 أيام ₪</label><input className="input" value={form.featured3DaysPrice} onChange={(e) => setForm({ ...form, featured3DaysPrice: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Store Basic ₪ / شهر</label><input className="input" value={form.storeBasicMonthly} onChange={(e) => setForm({ ...form, storeBasicMonthly: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Store Plus ₪ / شهر</label><input className="input" value={form.storePlusMonthly} onChange={(e) => setForm({ ...form, storePlusMonthly: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Store Pro ₪ / شهر</label><input className="input" value={form.storeProMonthly} onChange={(e) => setForm({ ...form, storeProMonthly: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">أقصى عدد صور</label><input className="input" value={form.maxImages} onChange={(e) => setForm({ ...form, maxImages: e.target.value })} /></div>
          </div>
        </div>
      </div>

      <div className="grid splitGrid" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="section-head"><div><h3 className="section-title">منتجات App Store</h3><p className="section-subtitle">Product IDs الخاصة بـ iOS.</p></div></div>
          <div className="form-grid-2">
            <div className="field"><label className="fieldLabel">Raise 1 day</label><input className="input" value={form.iosRaise1DayId} onChange={(e) => setForm({ ...form, iosRaise1DayId: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Raise 3 days</label><input className="input" value={form.iosRaise3DaysId} onChange={(e) => setForm({ ...form, iosRaise3DaysId: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Boost</label><input className="input" value={form.iosBoost3DaysId} onChange={(e) => setForm({ ...form, iosBoost3DaysId: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Featured</label><input className="input" value={form.iosFeatured3DaysId} onChange={(e) => setForm({ ...form, iosFeatured3DaysId: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Store Basic</label><input className="input" value={form.iosStoreBasicMonthlyId} onChange={(e) => setForm({ ...form, iosStoreBasicMonthlyId: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Store Plus</label><input className="input" value={form.iosStorePlusMonthlyId} onChange={(e) => setForm({ ...form, iosStorePlusMonthlyId: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Store Pro</label><input className="input" value={form.iosStoreProMonthlyId} onChange={(e) => setForm({ ...form, iosStoreProMonthlyId: e.target.value })} /></div>
          </div>
        </div>

        <div className="panel">
          <div className="section-head"><div><h3 className="section-title">منتجات Google Play</h3><p className="section-subtitle">Product IDs الخاصة بـ Android.</p></div></div>
          <div className="form-grid-2">
            <div className="field"><label className="fieldLabel">Raise 1 day</label><input className="input" value={form.androidRaise1DayId} onChange={(e) => setForm({ ...form, androidRaise1DayId: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Raise 3 days</label><input className="input" value={form.androidRaise3DaysId} onChange={(e) => setForm({ ...form, androidRaise3DaysId: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Boost</label><input className="input" value={form.androidBoost3DaysId} onChange={(e) => setForm({ ...form, androidBoost3DaysId: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Featured</label><input className="input" value={form.androidFeatured3DaysId} onChange={(e) => setForm({ ...form, androidFeatured3DaysId: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Store Basic</label><input className="input" value={form.androidStoreBasicMonthlyId} onChange={(e) => setForm({ ...form, androidStoreBasicMonthlyId: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Store Plus</label><input className="input" value={form.androidStorePlusMonthlyId} onChange={(e) => setForm({ ...form, androidStorePlusMonthlyId: e.target.value })} /></div>
            <div className="field"><label className="fieldLabel">Store Pro</label><input className="input" value={form.androidStoreProMonthlyId} onChange={(e) => setForm({ ...form, androidStoreProMonthlyId: e.target.value })} /></div>
          </div>
        </div>
      </div>

      <div className="grid splitGrid" style={{ marginTop: 18 }}>
        <div className="panel"><div className="section-head"><div><h3 className="section-title">الشروط</h3></div></div><textarea className="textarea tallTextarea" value={form.termsText} onChange={(e) => setForm({ ...form, termsText: e.target.value })} /></div>
        <div className="panel"><div className="section-head"><div><h3 className="section-title">الخصوصية</h3></div></div><textarea className="textarea tallTextarea" value={form.privacyText} onChange={(e) => setForm({ ...form, privacyText: e.target.value })} /></div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="section-head"><div><h3 className="section-title">الحفظ</h3><p className="section-subtitle">احفظ التعديلات لتنعكس على التطبيق والواجهة العامة مباشرة.</p></div><button className="btn primary" onClick={save}>{saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}</button></div>
        {loading ? <p className="section-subtitle">جارٍ تحميل الإعدادات...</p> : null}
        {message ? <p className="section-subtitle" style={{ color: message.includes("بنجاح") ? "#bdf7d3" : "#ffc9c9" }}>{message}</p> : null}
      </div>
    </>
  );
}
