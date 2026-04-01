"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import MotionPage from "../../../components/MotionPage";
import PageHeader from "../../../components/PageHeader";
import SectionCard from "../../../components/SectionCard";
import StatCard from "../../../components/StatCard";
import EmptyState from "../../../components/EmptyState";

export default function MonetizationPage() {
  const [payload, setPayload] = useState({ transactions: [], orders: [] });
  const [settings, setSettings] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  const load = async () => {
    try {
      const [transactionsData, settingsData, dashboardData] = await Promise.all([
        api("/api/admin/transactions"),
        api("/api/admin/settings"),
        api("/api/admin/dashboard"),
      ]);
      setPayload(transactionsData || { transactions: [], orders: [] });
      setSettings(settingsData || null);
      setDashboard(dashboardData || null);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { load(); }, []);

  const transactions = payload.transactions || [];
  const raise1DayPrice = Number(settings?.raise1DayPrice || 10);
  const raise3DaysPrice = Number(settings?.raise3DaysPrice || 20);
  const boost3DaysPrice = Number(settings?.boost3DaysPrice || 25);
  const featured3DaysPrice = Number(settings?.featured3DaysPrice || 35);
  const storeBasicMonthly = Number(settings?.storeBasicMonthly || 29);
  const storePlusMonthly = Number(settings?.storePlusMonthly || 49);
  const storeProMonthly = Number(settings?.storeProMonthly || 79);

  const totals = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);
    return { totalRevenue };
  }, [transactions]);

  return (
    <MotionPage>
      <PageHeader eyebrow="الربح داخل سوقي" title="مصادر الربح والتسعير" description="سوقي يربح من رفع الإعلان والـ Boost والإعلان المميز والاشتراكات الشهرية، بينما الاتفاق على السلعة نفسها يتم مباشرة بين المستخدمين." />

      <div className="grid statsGrid">
        <StatCard label="رفع يوم واحد" value={`${raise1DayPrice.toLocaleString()} ₪`} />
        <StatCard label="رفع 3 أيام" value={`${raise3DaysPrice.toLocaleString()} ₪`} />
        <StatCard label="Boost 3 أيام" value={`${boost3DaysPrice.toLocaleString()} ₪`} />
        <StatCard label="Featured 3 أيام" value={`${featured3DaysPrice.toLocaleString()} ₪`} />
      </div>

      <div className="grid splitGrid">
        <SectionCard title="الباقات الشهرية" subtitle="يوجد نوع حساب واحد فقط، لكن يمكن ترقية المزايا شهريًا دون تغيير نوع الحساب.">
          <div className="grid" style={{ gap: 12 }}>
            <div className="listCard"><div className="listCardMain"><strong>Store Basic</strong><div className="mutedParagraph">{storeBasicMonthly.toLocaleString()} ₪ / شهر — مزايا متجر أساسية ضمن نفس الحساب</div></div></div>
            <div className="listCard"><div className="listCardMain"><strong>Store Plus</strong><div className="mutedParagraph">{storePlusMonthly.toLocaleString()} ₪ / شهر — ظهور أقوى ومزايا إضافية</div></div></div>
            <div className="listCard"><div className="listCardMain"><strong>Store Pro</strong><div className="mutedParagraph">{storeProMonthly.toLocaleString()} ₪ / شهر — أعلى باقة رقمية داخل سوقي</div></div></div>
          </div>
        </SectionCard>

        <SectionCard title="الشراء داخل التطبيق" subtitle="هذه المنتجات مخصصة للشراء عبر App Store وGoogle Play لأنها ميزات رقمية داخل التطبيق.">
          <div className="grid" style={{ gap: 12 }}>
            <div className="highlightPanel"><strong>App Store IDs</strong><p className="mutedParagraph" style={{ marginTop: 8 }}>{settings?.iosRaise1DayId || "souqi_raise_1_day"} • {settings?.iosStoreBasicMonthlyId || "souqi_store_basic_monthly"}</p></div>
            <div className="highlightPanel"><strong>Google Play IDs</strong><p className="mutedParagraph" style={{ marginTop: 8 }}>{settings?.androidRaise1DayId || "souqi_raise_1_day"} • {settings?.androidStoreBasicMonthlyId || "souqi_store_basic_monthly"}</p></div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="مؤشرات من الداشبورد" subtitle="بعض المؤشرات السريعة المربوطة مباشرة مع بيانات لوحة الأدمن.">
        <div className="grid statsGrid">
          <StatCard label="رفع نشط الآن" value={`${dashboard?.stats?.activeBoosts || 0}`} />
          <StatCard label="ظهور ممول في الرئيسية" value={`${dashboard?.stats?.homeSponsors || 0}`} />
          <StatCard label="اشتراكات نشطة" value={`${dashboard?.stats?.activeSubscriptions || 0}`} />
          <StatCard label="إيراد مسجل" value={`${totals.totalRevenue.toLocaleString()} ₪`} />
        </div>
      </SectionCard>

      <SectionCard title="آخر المشتريات الرقمية" subtitle="السجل المالي الحالي خاص بالترقيات والاشتراكات الرقمية، وليس شراء السلع نفسها.">
        {!transactions.length ? <EmptyState title="لا توجد معاملات" /> : (
          <div className="grid">
            {transactions.slice(0, 8).map((item) => (
              <div key={item.id} className="listCard">
                <div className="listCardMain">
                  <div className="listTitleRow"><strong>{item.product_key || item.listing_title || `سجل #${item.id}`}</strong><span className="badge">{item.status}</span></div>
                  <div className="mutedParagraph">المنتج: {item.product_type === "subscription" ? "اشتراك شهري" : "ترقية إعلان"}</div>
                  <div className="mutedParagraph">المبلغ المسجل: {Number(item.amount || 0).toLocaleString()} ₪</div>
                  <div className="mutedParagraph">إيراد المنصة من السجل: {Number(item.commission_amount || 0).toLocaleString()} ₪</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </MotionPage>
  );
}
