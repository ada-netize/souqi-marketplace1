"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken } from "../../lib/api";

const controlCards = [
  {
    href: "/dashboard/listings",
    title: "تحكم كامل بالإعلانات",
    text: "اعتماد، تمييز، تعديل السعر والحالة، إخفاء أو حذف الإعلان من نفس الصفحة.",
    tag: "Listings",
  },
  {
    href: "/dashboard/users",
    title: "تحكم كامل بالمستخدمين",
    text: "توثيق، حظر، تحديث الهاتف والاسم، وإدارة الاشتراك من الموقع مباشرة.",
    tag: "Users",
  },
  {
    href: "/dashboard/messages",
    title: "مراقبة المحادثات",
    text: "عرض المحادثات وقراءة تفاصيل الرسائل والعروض المرتبطة بها داخل الأدمن.",
    tag: "Messages",
  },
  {
    href: "/dashboard/settings",
    title: "أسعار التطبيق والباقات",
    text: "تعديل أسعار الرفع والـ Boost والـ Featured والاشتراكات وـ Product IDs من اللوحة.",
    tag: "Pricing",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/");
      return;
    }
    api("/api/admin/dashboard")
      .then(setData)
      .catch((err) => setError(err.message));
  }, [router]);

  const stats = data?.stats || {};
  const overview = useMemo(() => ([
    { label: "المستخدمون", value: stats.totalUsers ?? "—" },
    { label: "الإعلانات", value: stats.totalListings ?? "—" },
    { label: "الرسائل", value: stats.totalMessages ?? "—" },
    { label: "البلاغات المفتوحة", value: stats.pendingReports ?? stats.reports ?? "—" },
    { label: "الاشتراكات النشطة", value: stats.activeSubscriptions ?? "—" },
    { label: "الإيراد الرقمي", value: `₪${stats.commissions ?? 0}` },
  ]), [stats]);

  return (
    <>
      {error ? <div className="panel">{error}</div> : null}

      <section className="souqiHeroDashboard panel">
        <div>
          <div className="badge">APP + WEB CONTROL</div>
          <h2>تحكم بالتطبيق كاملًا من الموقع</h2>
          <p>
            هذه اللوحة صارت أقرب لمركز عمليات حقيقي: إدارة مستخدمين، إدارة إعلانات، مراجعة الرسائل والبلاغات، وتعديل الباقات والأسعار
            من واجهة واحدة منظمة.
          </p>
          <div className="heroActionRow">
            <Link className="btn primary" href="/dashboard/listings">ابدأ بإدارة الإعلانات</Link>
            <Link className="btn" href="/dashboard/users">إدارة المستخدمين</Link>
            <Link className="btn" href="/market">معاينة الواجهة العامة</Link>
          </div>
        </div>
        <div className="dashboardPulseCard">
          <div className="dashboardPulseGrid">
            {overview.map((item) => (
              <div key={item.label} className="dashboardPulseStat">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 22 }}>
        <div className="section-head">
          <div>
            <h3 className="section-title">وحدات التحكم الرئيسية</h3>
            <p className="section-subtitle">كل قسم هنا يغيّر بيانات التطبيق فعليًا عبر الـ API.</p>
          </div>
        </div>
        <div className="adminControlGrid">
          {controlCards.map((item) => (
            <Link key={item.href} href={item.href} className="controlCard">
              <span className="badge">{item.tag}</span>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
              <span className="controlCardLink">فتح القسم ←</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="form-grid-2" style={{ marginTop: 22 }}>
        <div className="panel">
          <div className="section-head">
            <div>
              <h3 className="section-title">أفضل المدن</h3>
              <p className="section-subtitle">أكثر المدن نشاطًا حاليًا داخل سوقي.</p>
            </div>
          </div>
          <div className="stackList compactList">
            {(data?.topCities || []).map((item) => (
              <div key={item.name_ar} className="stackRow">
                <strong>{item.name_ar}</strong>
                <span className="badge">{item.count}</span>
              </div>
            ))}
            {!data?.topCities?.length ? <p className="section-subtitle">لا توجد بيانات بعد.</p> : null}
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <div>
              <h3 className="section-title">آخر النشاطات</h3>
              <p className="section-subtitle">ملخص سريع لأحدث ما حصل داخل التطبيق.</p>
            </div>
          </div>
          <div className="stackList compactList">
            {(data?.latestActivities || []).map((item, idx) => (
              <div key={`${item.type}-${idx}`} className="activityRow">
                <div>
                  <strong>{item.type === "promotion" ? "ترقية رقمية" : item.type}</strong>
                  <p className="mutedParagraph">{item.label}</p>
                </div>
                <span className="section-subtitle">{item.created_at}</span>
              </div>
            ))}
            {!data?.latestActivities?.length ? <p className="section-subtitle">لا توجد نشاطات حديثة.</p> : null}
          </div>
        </div>
      </section>
    </>
  );
}
