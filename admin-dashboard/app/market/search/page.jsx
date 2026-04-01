"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiPublic } from "../../../lib/api";

export default function MarketSearchPage() {
  const [bootstrap, setBootstrap] = useState(null);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ q: "", cityId: "", categoryId: "", minPrice: "", maxPrice: "", featured: "", sort: "latest" });

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(form).forEach(([key, value]) => value && params.set(key, value));
    return params.toString();
  }, [form]);

  useEffect(() => {
    let mounted = true;
    const loadBootstrap = () => apiPublic("/api/public/bootstrap").then((res) => mounted && setBootstrap(res)).catch(() => mounted && setBootstrap(null));
    loadBootstrap();
    const onFocus = () => loadBootstrap();
    window.addEventListener("focus", onFocus);
    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadRows = () => apiPublic(`/api/public/listings${query ? `?${query}` : ""}`).then((res) => mounted && setRows(res)).catch(() => mounted && setRows([]));
    loadRows();
    const interval = setInterval(loadRows, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [query]);

  return (
    <div className="marketHomeGrid">
      <section className="marketSectionBlock searchHeroBlock">
        <div className="section-head">
          <div>
            <h2 className="section-title">البحث في سوقي</h2>
            <p className="section-subtitle">ابحث داخل الإعلانات، فلتر النتائج، وافتح أي إعلان مباشرة.</p>
          </div>
        </div>
        <div className="marketFilterGrid">
          <div className="field"><label className="fieldLabel">كلمة البحث</label><input className="input" value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} placeholder="مثال: سيارة، شقة، آيفون" /></div>
          <div className="field"><label className="fieldLabel">المدينة</label><select className="input" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}><option value="">كل المدن</option>{(bootstrap?.cities || []).map((item) => <option key={item.id} value={item.id}>{item.name_ar}</option>)}</select></div>
          <div className="field"><label className="fieldLabel">القسم</label><select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">كل الأقسام</option>{(bootstrap?.categories || []).map((item) => <option key={item.id} value={item.id}>{item.name_ar}</option>)}</select></div>
          <div className="field"><label className="fieldLabel">الترتيب</label><select className="input" value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value })}><option value="latest">الأحدث</option><option value="price_low">السعر الأقل</option><option value="price_high">السعر الأعلى</option></select></div>
          <div className="field"><label className="fieldLabel">أقل سعر</label><input className="input" type="number" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })} /></div>
          <div className="field"><label className="fieldLabel">أعلى سعر</label><input className="input" type="number" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} /></div>
        </div>
      </section>

      <section className="marketSectionBlock">
        <div className="section-head">
          <div>
            <h3 className="section-title">النتائج</h3>
            <p className="section-subtitle">{rows.length} نتيجة مطابقة</p>
          </div>
        </div>
        <div className="marketCardGrid large">
          {rows.map((item) => (
            <Link key={item.id} href={`/market/listings/${item.id}`} className="marketListingCard">
              <div className="marketListingMedia"><div className="marketListingBadge">{item.city?.name_ar || "—"}</div></div>
              <div className="marketListingBody">
                <strong>{item.title}</strong>
                <p>{item.category?.name_ar || "—"} • {item.city?.name_ar || "—"}</p>
                <div className="marketListingFooter"><span>{Number(item.price || 0).toLocaleString()} ₪</span><span>عرض التفاصيل</span></div>
              </div>
            </Link>
          ))}
          {!rows.length ? <div className="marketEmptyState"><strong>لا توجد نتائج حاليًا</strong><p>جرّب تغيير القسم أو المدينة أو نطاق السعر.</p></div> : null}
        </div>
      </section>
    </div>
  );
}
