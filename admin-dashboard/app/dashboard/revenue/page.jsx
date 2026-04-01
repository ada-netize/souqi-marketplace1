"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";

export default function RevenuePage() {
  const [payload, setPayload] = useState({ transactions: [], orders: [] });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [transactionsData, dashboardData] = await Promise.all([
        api("/api/admin/transactions"),
        api("/api/admin/dashboard"),
      ]);
      setPayload(transactionsData || { transactions: [], orders: [] });
      setDashboard(dashboardData || null);
    } catch (err) {
      setError(err.message || "فشل تحميل صفحة الإيرادات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const transactions = payload.transactions || [];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => (statusFilter ? item.status === statusFilter : true));
  }, [transactions, statusFilter]);

  const totals = useMemo(() => {
    const grossRevenue = transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const platformRevenue = transactions.reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);
    const appliedCount = transactions.filter((item) => item.status === "applied").length;
    const pendingCount = transactions.filter((item) => item.status !== "applied").length;
    return { grossRevenue, platformRevenue, appliedCount, pendingCount };
  }, [transactions]);

  return (
    <>
      <div className="grid statsGrid">
        <div className="panel"><p className="section-subtitle">إجمالي المشتريات الرقمية</p><h3>{totals.grossRevenue.toLocaleString()} ₪</h3></div>
        <div className="panel"><p className="section-subtitle">إيراد المنصة</p><h3>{totals.platformRevenue.toLocaleString()} ₪</h3></div>
        <div className="panel"><p className="section-subtitle">مطبقة</p><h3>{totals.appliedCount}</h3></div>
        <div className="panel"><p className="section-subtitle">تحتاج متابعة</p><h3>{totals.pendingCount}</h3></div>
      </div>

      <div className="grid splitGrid" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="section-head">
            <div>
              <h3 className="section-title">ملخص سريع</h3>
              <p className="section-subtitle">أرقام أساسية من لوحة الإدارة بعد إلغاء الشراء المباشر للسلع.</p>
            </div>
          </div>
          <div className="grid" style={{ gap: 12 }}>
            <div className="listCard"><div className="listCardMain"><strong>سجلات رقمية</strong><div className="mutedParagraph">{transactions.length} سجلًا بين ترقيات واشتراكات</div></div></div>
            <div className="listCard"><div className="listCardMain"><strong>سجلات غير مطبقة</strong><div className="mutedParagraph">{totals.pendingCount} سجلًا يحتاج متابعة</div></div></div>
            <div className="listCard"><div className="listCardMain"><strong>الإيراد في الداشبورد</strong><div className="mutedParagraph">{Number(dashboard?.stats?.commissions || 0).toLocaleString()} ₪</div></div></div>
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <div>
              <h3 className="section-title">فلترة الحالة</h3>
              <p className="section-subtitle">فلتر السجل حسب حالة تطبيق الميزة الرقمية.</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <select className="input" style={{ minWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">كل الحالات</option>
                <option value="applied">applied</option>
                <option value="pending">pending</option>
                <option value="failed">failed</option>
              </select>
              <button className="btn" onClick={load}>تحديث</button>
            </div>
          </div>
          {loading ? <p className="section-subtitle">جارٍ التحميل...</p> : null}
          {error ? <p className="section-subtitle" style={{ color: "#ffc9c9" }}>{error}</p> : null}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="section-head">
          <div>
            <h3 className="section-title">المعاملات الرقمية</h3>
            <p className="section-subtitle">كل سجل يعرض نوع الترقية أو الاشتراك، الحالة، وقيمة الإيراد المسجل.</p>
          </div>
        </div>

        {!loading && !filteredTransactions.length ? <p className="section-subtitle">لا توجد معاملات مطابقة.</p> : null}

        <div className="grid" style={{ gap: 12 }}>
          {filteredTransactions.map((item) => (
            <div key={item.id} className="listCard">
              <div className="listCardMain">
                <div className="listTitleRow"><strong>{item.product_key || item.listing_title || `سجل #${item.id}`}</strong><span className="badge">{item.status}</span></div>
                <div className="mutedParagraph">المستخدم: {item.seller_name || "—"}</div>
                <div className="mutedParagraph">النوع: {item.product_type === "subscription" ? "اشتراك شهري" : "ترقية إعلان"}</div>
                <div className="mutedParagraph">القيمة الإجمالية: {Number(item.amount || 0).toLocaleString()} ₪</div>
                <div className="mutedParagraph">إيراد المنصة: {Number(item.commission_amount || 0).toLocaleString()} ₪</div>
                <div className="mutedParagraph">تاريخ الإنشاء: {item.created_at}</div>
              </div>
              <div className="listCardActions">
                <button
                  className="btn"
                  onClick={async () => {
                    const nextStatus = item.status === "applied" ? "pending" : "applied";
                    await api(`/api/admin/transactions/${item.id}`, { method: "PUT", body: { status: nextStatus } });
                    await load();
                  }}
                >
                  {item.status === "applied" ? "إرجاع إلى pending" : "تعليم كـ applied"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
