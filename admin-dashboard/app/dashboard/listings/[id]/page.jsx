"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, API_URL } from "../../../../lib/api";
import MotionPage from "../../../../components/MotionPage";
import PageHeader from "../../../../components/PageHeader";
import SectionCard from "../../../../components/SectionCard";
import TabNav from "../../../../components/TabNav";

export default function ListingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    const res = await api(`/api/admin/listings/${params.id}`);
    setData(res);
    setForm({
      title: res.listing.title,
      price: res.listing.price,
      status: res.listing.status,
      isApproved: res.listing.is_approved,
      isFeatured: res.listing.is_featured,
      boostExpiresAt: res.listing.boost_expires_at || "",
      sponsorHomeExpiresAt: res.listing.sponsor_home_expires_at || "",
    });
  };

  useEffect(() => { if (params?.id) load(); }, [params?.id]);
  const images = useMemo(() => data?.listing?.images || [], [data]);
  if (!data) return <div className="card" style={{ padding: 24 }}>جاري تحميل تفاصيل الإعلان...</div>;

  return (
    <MotionPage>
      <PageHeader
        eyebrow="تفاصيل الإعلان"
        title={data.listing.title}
        description="صفحة مستقلة لهذا الإعلان فقط، بترتيب أوضح وتفاصيل موزعة على أقسام قابلة للتنقل السريع."
        breadcrumbs={[{ label: "لوحة الأدمن", href: "/dashboard" }, { label: "الإعلانات", href: "/dashboard/listings" }, { label: `#${data.listing.id}` }]}
        actions={<button className="btn" onClick={() => router.push("/dashboard/listings")}>رجوع للإعلانات</button>}
        stats={[
          { label: "السعر", value: `${Number(data.listing.price).toLocaleString()} ₪` },
          { label: "المدينة", value: data.listing.city_name },
          { label: "الحالة", value: data.listing.status },
        ]}
      />

      <TabNav tabs={[
        { label: "نظرة عامة", href: "#overview", note: "الصور والبيانات" },
        { label: "الإدارة", href: "#manage", note: "تعديل مباشر" },
        { label: "الترويج", href: "#promotion", note: "سجل الرفع والرعاية" },
        { label: "البلاغات والربح", href: "#compliance", note: "تقارير وسجل رقمي" },
      ]} />

      <div className="grid splitGrid" id="overview">
        <SectionCard title="معلومات الإعلان" subtitle="بيانات أساسية، صور، وسرد بصري أوضح للحالة الحالية.">
          <div className="grid galleryGrid">
            {images.map((img, i) => <img key={i} src={`${API_URL}${img}`} alt="listing" className="detailImage" />)}
          </div>
          <div className="detailList">
            <div><span>القسم</span><strong>{data.listing.category_name}</strong></div>
            <div><span>المدينة</span><strong>{data.listing.city_name}</strong></div>
            <div><span>صاحب الإعلان</span><strong>{data.listing.user_name}</strong></div>
            <div><span>الهاتف</span><strong>{data.listing.user_phone || "-"}</strong></div>
            <div><span>السعر</span><strong>{Number(data.listing.price).toLocaleString()} ₪</strong></div>
            <div><span>الحالة</span><strong>{data.listing.status}</strong></div>
          </div>
          <div className="highlightPanel">
            <strong>الوصف</strong>
            <p className="mutedParagraph" style={{ marginTop: 8 }}>{data.listing.description}</p>
          </div>
        </SectionCard>

        <SectionCard id="manage" title="إدارة الإعلان" subtitle="تعديل مباشر من نفس الصفحة مع أسلوب عرض أنظف وأكثر مهنية.">
          <div className="formGrid two">
            <div className="field"><label className="fieldLabel">العنوان</label><input className="input" value={form.title || ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="العنوان" /></div>
            <div className="field"><label className="fieldLabel">السعر</label><input className="input" type="number" value={form.price || 0} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} placeholder="السعر" /></div>
            <div className="field"><label className="fieldLabel">الحالة</label><select className="select" value={form.status || "available"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}><option value="available">متوفر</option><option value="reserved">محجوز</option><option value="sold">تم البيع</option></select></div>
            <div className="field"><label className="fieldLabel">تاريخ انتهاء الرفع / Boost</label><input className="input" value={form.boostExpiresAt || ""} onChange={(e) => setForm((f) => ({ ...f, boostExpiresAt: e.target.value }))} placeholder="YYYY-MM-DD HH:mm:ss" /></div>
            <div className="field"><label className="fieldLabel">تاريخ انتهاء Featured</label><input className="input" value={form.sponsorHomeExpiresAt || ""} onChange={(e) => setForm((f) => ({ ...f, sponsorHomeExpiresAt: e.target.value }))} placeholder="YYYY-MM-DD HH:mm:ss" /></div>
            <div className="field"><label className="fieldLabel">الحالة الإدارية</label><div className="actionRow" style={{ marginTop: 0 }}><button className={`btn ${form.isApproved ? "primary" : ""}`} onClick={() => setForm((f) => ({ ...f, isApproved: f.isApproved ? 0 : 1 }))}>{form.isApproved ? "مقبول" : "غير مقبول"}</button><button className={`btn ${form.isFeatured ? "primary" : ""}`} onClick={() => setForm((f) => ({ ...f, isFeatured: f.isFeatured ? 0 : 1 }))}>{form.isFeatured ? "مميز" : "غير مميز"}</button></div></div>
          </div>
          <div className="actionRow"><button className="btn primary" onClick={async () => { await api(`/api/admin/listings/${params.id}`, { method: "PUT", body: form }); load(); }}>حفظ التعديلات</button></div>
        </SectionCard>
      </div>

      <div className="grid splitGrid" id="promotion">
        <SectionCard title="سجل الترويج" subtitle="كل عمليات الرفع والرعاية لهذا الإعلان في مساحة مستقلة وواضحة.">
          <div className="grid">
            {data.boosts.map((boost) => (
              <div key={boost.id} className="softRow">
                <div>
                  <strong>{boost.kind === "boost" ? "رفع / Boost" : "Featured في الرئيسية"}</strong>
                  <div className="mutedParagraph">{boost.days} يوم • {Number(boost.price).toLocaleString()} ₪</div>
                </div>
                <span className="badge">{boost.end_date}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard id="compliance" title="بلاغات وسجل رقمي" subtitle="ربط إداري ومالي لنفس الإعلان دون خلط مع باقي الإعلانات.">
          <div className="grid">
            {data.reports.map((row) => <div key={`r${row.id}`} className="softRow"><div><strong>{row.reason}</strong><div className="mutedParagraph">{row.status}</div></div><span className="badge">بلاغ</span></div>)}
            {data.transactions.map((row) => <div key={`t${row.id}`} className="softRow"><div><strong>{Number(row.amount).toLocaleString()} ₪</strong><div className="mutedParagraph">{row.product_type === 'subscription' ? 'اشتراك' : 'ترقية إعلان'} • {row.product_key || '—'}</div></div><span className="badge">{row.status}</span></div>)}
          </div>
        </SectionCard>
      </div>
    </MotionPage>
  );
}
