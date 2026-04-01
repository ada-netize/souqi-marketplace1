"use client";

import { useEffect, useState } from "react";
import { apiPublic } from "../../../lib/api";

function PriceCard({ item, label }) {
  return (
    <div className="priceCardNew">
      <span className="badge">{label}</span>
      <strong>{item.title}</strong>
      <p>{item.subtitle}</p>
      <div className="priceCardValue">{item.price} ₪{label === "Subscription" ? " / شهر" : ""}</div>
    </div>
  );
}

export default function MarketPackagesPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiPublic("/api/public/promotion-pricing").then(setData).catch(() => null);
  }, []);

  const catalog = data?.catalog || { listingPromotions: [], subscriptions: [] };

  return (
    <div className="marketHomeGrid">
      <section className="marketSectionBlock packagesHeroBlock">
        <div className="section-head">
          <div>
            <h2 className="section-title">الباقات والترقيات</h2>
            <p className="section-subtitle">هذه الأسعار تخص المزايا الرقمية فقط داخل سوقي، وليس شراء السلعة نفسها.</p>
          </div>
        </div>
        <div className="kpi-grid">
          <div className="panel"><p className="section-subtitle">رفع يوم</p><h3>{data?.raise1DayPrice ?? 10} ₪</h3></div>
          <div className="panel"><p className="section-subtitle">رفع 3 أيام</p><h3>{data?.raise3DaysPrice ?? 20} ₪</h3></div>
          <div className="panel"><p className="section-subtitle">Boost 3 أيام</p><h3>{data?.boost3DaysPrice ?? 25} ₪</h3></div>
          <div className="panel"><p className="section-subtitle">Featured 3 أيام</p><h3>{data?.featured3DaysPrice ?? 35} ₪</h3></div>
        </div>
      </section>

      <section className="marketSectionBlock">
        <div className="section-head"><div><h3 className="section-title">ترقيات الإعلانات</h3><p className="section-subtitle">رفع الظهور للإعلان داخل السوق لفترة محددة.</p></div></div>
        <div className="marketCardGrid">
          {catalog.listingPromotions.map((item) => <PriceCard key={item.key} item={item} label="Consumable" />)}
        </div>
      </section>

      <section className="marketSectionBlock">
        <div className="section-head"><div><h3 className="section-title">اشتراكات الحساب</h3><p className="section-subtitle">نفس المستخدم يبقى بحساب واحد، لكن يحصل على مزايا أعلى وظهور أفضل.</p></div></div>
        <div className="marketCardGrid">
          {catalog.subscriptions.map((item) => <PriceCard key={item.key} item={item} label="Subscription" />)}
        </div>
      </section>
    </div>
  );
}
