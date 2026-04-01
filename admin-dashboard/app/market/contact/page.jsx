"use client";

import { useEffect, useState } from "react";
import { apiPublic } from "../../../lib/api";

export default function MarketContactPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiPublic("/api/public/settings/public-copy").then(setData).catch(() => null);
  }, []);

  return (
    <div className="marketHomeGrid">
      <section className="marketSectionBlock contactBlockNew">
        <div className="section-head">
          <div>
            <h2 className="section-title">تواصل مع سوقي</h2>
            <p className="section-subtitle">التواصل وإتمام الصفقة بين المستخدمين يكونان مباشرة عبر الهاتف أو واتساب أو الرسائل داخل التطبيق.</p>
          </div>
        </div>
        <div className="contactGridNew">
          <div className="marketPanelSoft"><p className="section-subtitle">الهاتف</p><h3>{data?.contactPhone || "—"}</h3></div>
          <div className="marketPanelSoft"><p className="section-subtitle">البريد</p><h3>{data?.contactEmail || "—"}</h3></div>
          <div className="marketPanelSoft"><p className="section-subtitle">الشروط</p><p>{data?.termsText || "يمكنك إضافة الشروط النهائية من لوحة الأدمن قبل الإطلاق."}</p></div>
          <div className="marketPanelSoft"><p className="section-subtitle">الخصوصية</p><p>{data?.privacyText || "يمكنك إضافة سياسة الخصوصية النهائية من لوحة الأدمن قبل الإطلاق."}</p></div>
        </div>
      </section>
    </div>
  );
}
