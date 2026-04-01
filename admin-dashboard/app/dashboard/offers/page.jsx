"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api("/api/admin/offers");
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "فشل تحميل العروض");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    const interval = setInterval(onFocus, 15000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(() => {
    return offers.filter((item) => (statusFilter ? item.status === statusFilter : true));
  }, [offers, statusFilter]);

  const totals = useMemo(() => {
    return {
      total: offers.length,
      pending: offers.filter((item) => item.status === "pending").length,
      accepted: offers.filter((item) => item.status === "accepted").length,
      rejected: offers.filter((item) => item.status === "rejected").length,
    };
  }, [offers]);

  return (
    <>
      <div className="grid statsGrid">
        <div className="panel"><p className="section-subtitle">كل العروض</p><h3>{totals.total}</h3></div>
        <div className="panel"><p className="section-subtitle">معلقة</p><h3>{totals.pending}</h3></div>
        <div className="panel"><p className="section-subtitle">مقبولة</p><h3>{totals.accepted}</h3></div>
        <div className="panel"><p className="section-subtitle">مرفوضة</p><h3>{totals.rejected}</h3></div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="section-head">
          <div>
            <h3 className="section-title">فلترة العروض</h3>
            <p className="section-subtitle">فلتر الحالة وحدث البيانات مباشرة.</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <select className="input" style={{ minWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">كل الحالات</option>
              <option value="pending">معلقة</option>
              <option value="accepted">مقبولة</option>
              <option value="rejected">مرفوضة</option>
              <option value="countered">عرض مقابل</option>
            </select>
            <button className="btn" onClick={load}>تحديث</button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="section-head">
          <div>
            <h3 className="section-title">قائمة العروض</h3>
            <p className="section-subtitle">كل سطر يعرض الإعلان، المشتري، البائع، وقيمة العرض.</p>
          </div>
        </div>

        {loading ? <p className="section-subtitle">جارٍ التحميل...</p> : null}
        {error ? <p className="section-subtitle" style={{ color: "#ffc9c9" }}>{error}</p> : null}
        {!loading && !filtered.length ? <p className="section-subtitle">لا توجد عروض مطابقة.</p> : null}

        <div className="grid" style={{ gap: 12 }}>
          {filtered.map((item) => (
            <div key={item.id} className="listCard">
              <div className="listCardMain">
                <div className="listTitleRow">
                  <strong>{item.listing_title}</strong>
                  <span className="badge">{item.status}</span>
                </div>
                <div className="mutedParagraph">المشتري: {item.buyer_name}</div>
                <div className="mutedParagraph">البائع: {item.seller_name}</div>
                <div className="mutedParagraph">قيمة العرض: {Number(item.amount || 0).toLocaleString()} ₪</div>
                <div className="mutedParagraph">آخر تحديث: {item.updated_at}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
