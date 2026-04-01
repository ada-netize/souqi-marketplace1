"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../lib/api";
import MotionPage from "../../../../components/MotionPage";
import PageHeader from "../../../../components/PageHeader";
import SectionCard from "../../../../components/SectionCard";
import TabNav from "../../../../components/TabNav";

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    isBlocked: false,
    isVerified: false,
    subscriptionPlan: "free",
    subscriptionStatus: "inactive",
  });
  const [saving, setSaving] = useState(false);

  const userId = useMemo(() => {
    const raw = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const parsed = Number.parseInt(String(raw ?? "").trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [params?.id]);

  const load = async () => {
    if (!userId) return;

    const res = await api(`/api/admin/users/${userId}`);
    setData(res);
    setForm({
      fullName: res.user?.full_name || "",
      phone: res.user?.phone || "",
      isBlocked: Boolean(res.user?.is_blocked),
      isVerified: Boolean(res.user?.is_verified),
      subscriptionPlan: res.user?.subscription_plan || "free",
      subscriptionStatus: res.user?.subscription_status || "inactive",
    });
  };

  const handleSave = async () => {
    if (!userId) {
      alert("معرف المستخدم غير صالح");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: String(form.fullName || ""),
        phone: String(form.phone || ""),
        isBlocked: form.isBlocked ? 1 : 0,
        isVerified: form.isVerified ? 1 : 0,
        subscriptionPlan: String(form.subscriptionPlan || "free"),
        subscriptionStatus: String(form.subscriptionStatus || "inactive"),
      };

      await api(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: payload,
      });

      await load();
      alert("تم حفظ التعديلات بنجاح");
    } catch (error) {
      console.error(error);
      alert(error?.message || "فشل حفظ التعديلات");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  if (!userId) {
    return <div className="card" style={{ padding: 24 }}>معرف المستخدم غير صالح.</div>;
  }

  if (!data) {
    return <div className="card" style={{ padding: 24 }}>جاري تحميل تفاصيل المستخدم...</div>;
  }

  return (
    <MotionPage>
      <PageHeader
        eyebrow="تفاصيل المستخدم"
        title={data.user.full_name}
        description="ملف مستقل يضم بيانات المستخدم ونشاطه وإعلاناته ومحادثاته وترقياته الرقمية، مع تنقل أسهل داخل نفس الصفحة."
        breadcrumbs={[
          { label: "لوحة الأدمن", href: "/dashboard" },
          { label: "المستخدمون", href: "/dashboard/users" },
          { label: data.user.full_name },
        ]}
        actions={<button className="btn" onClick={() => router.push('/dashboard/users')}>رجوع للمستخدمين</button>}
        stats={[
          { label: "الإعلانات", value: data.user.listings_count },
          { label: "المحفوظات", value: data.user.saved_count },
          { label: "البريد", value: data.user.email || '-' },
        ]}
      />

      <TabNav tabs={[
        { label: 'الملف', href: '#profile', note: 'البيانات الأساسية' },
        { label: 'النشاط', href: '#activity', note: 'رسائل وعروض' },
        { label: 'الإعلانات', href: '#listings', note: 'إعلانات المستخدم' },
        { label: 'الترقيات', href: '#transactions', note: 'مشتريات رقمية' },
      ]} />

      <div className="grid splitGrid" id="profile">
        <SectionCard title="ملف المستخدم" subtitle="تعديل مباشر لحالة المستخدم وبياناته الأساسية من مكان واحد واضح.">
          <div className="inlineForm fullWidth">
            <input className="input" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="الاسم الكامل" />
            <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="رقم الهاتف" />
          </div>
          <div className="statsInline">
            <button className={`btn ${form.isVerified ? 'primary' : ''}`} onClick={() => setForm((f) => ({ ...f, isVerified: !f.isVerified }))} type="button">{form.isVerified ? 'موثق' : 'غير موثق'}</button>
            <button className={`btn ${form.isBlocked ? 'danger' : ''}`} onClick={() => setForm((f) => ({ ...f, isBlocked: !f.isBlocked }))} type="button">{form.isBlocked ? 'محظور' : 'نشط'}</button>
          </div>
          <button className="btn primary" onClick={handleSave} disabled={saving} type="button">{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
          <div className="detailList" style={{ marginTop: 18 }}>
            <div><span>البريد</span><strong>{data.user.email || '-'}</strong></div>
            <div><span>إعلانات</span><strong>{data.user.listings_count}</strong></div>
            <div><span>المحفوظات</span><strong>{data.user.saved_count}</strong></div>
            <div><span>تاريخ الإنشاء</span><strong>{data.user.created_at}</strong></div>
          </div>
        </SectionCard>

        <SectionCard id="activity" title="آخر المحادثات والعروض" subtitle="لمحة سريعة عن تفاعل هذا المستخدم داخل السوق.">
          <div className="grid">
            {data.conversations.slice(0, 5).map((c) => <div key={c.id} className="softRow"><div><strong>محادثة #{c.id}</strong><div className="mutedParagraph">آخر رسالة: {c.last_message_at}</div></div><span className="badge">محادثة</span></div>)}
            {data.offers.slice(0, 5).map((o) => <div key={o.id} className="softRow"><div><strong>{Number(o.amount).toLocaleString()} ₪</strong><div className="mutedParagraph">الحالة: {o.status}</div></div><span className="badge">عرض</span></div>)}
          </div>
        </SectionCard>
      </div>

      <div className="grid splitGrid">
        <SectionCard id="listings" title="إعلانات المستخدم" subtitle="قائمة مستقلة لإعلاناته بدل خلطها مع جدول المستخدمين العام.">
          <div className="grid">
            {data.listings.map((item) => <div key={item.id} className="softRow"><div><strong>{item.title}</strong><div className="mutedParagraph">{Number(item.price).toLocaleString()} ₪ • {item.status}</div></div><span className="badge">#{item.id}</span></div>)}
          </div>
        </SectionCard>
        <SectionCard id="transactions" title="المشتريات الرقمية" subtitle="سجل ترقيات الإعلانات والاشتراكات المرتبطة بهذا المستخدم فقط.">
          <div className="grid">
            {data.transactions.map((row) => <div key={row.id} className="softRow"><div><strong>{Number(row.amount).toLocaleString()} ₪</strong><div className="mutedParagraph">{row.product_type === 'subscription' ? 'اشتراك شهري' : 'ترقية إعلان'} • {row.product_key || '—'}</div></div><span className="badge">{row.status}</span></div>)}
          </div>
        </SectionCard>
      </div>
    </MotionPage>
  );
}
