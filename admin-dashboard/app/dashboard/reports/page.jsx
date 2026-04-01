"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "../../../lib/api";

export default function ReportsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    try {
      const data = await api("/api/admin/reports");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "فشل تحميل البلاغات");
    }
  };

  useEffect(() => {
    if (!getToken()) { router.push("/"); return; }
    load();
  }, [router]);

  const filtered = useMemo(() => rows.filter((item) => (statusFilter ? item.status === statusFilter : true)), [rows, statusFilter]);

  return (
    <>
      {error ? <div className="panel">{error}</div> : null}

      <div className="panel">
        <div className="section-head">
          <div>
            <h3 className="section-title">فلترة البلاغات</h3>
            <p className="section-subtitle">اعرض فقط البلاغات المفتوحة أو المغلقة عند الحاجة.</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <select className="input" style={{ minWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">كل الحالات</option>
              <option value="open">open</option>
              <option value="reviewed">reviewed</option>
              <option value="closed">closed</option>
            </select>
            <button className="btn" onClick={load}>تحديث</button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>المبلّغ</th>
                <th>النوع</th>
                <th>الهدف</th>
                <th>السبب</th>
                <th>الحالة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>{item.reporter_name || "—"}</td>
                  <td>{item.target_type}</td>
                  <td>{item.target_id}</td>
                  <td>{item.reason}</td>
                  <td>{item.status}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn"
                        onClick={async () => {
                          await api(`/api/admin/reports/${item.id}`, { method: "PUT", body: { status: "reviewed" } });
                          await load();
                        }}
                      >
                        مراجعة
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={async () => {
                          await api(`/api/admin/reports/${item.id}`, { method: "PUT", body: { status: "closed" } });
                          await load();
                        }}
                      >
                        إغلاق
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan="6">لا توجد بلاغات مطابقة.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
