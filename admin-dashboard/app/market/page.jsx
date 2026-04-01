"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiPublic } from "../../lib/api";

function ListingCard({ item, featured = false }) {
  return (
    <Link href={`/market/listings/${item.id}`} className={`marketListingCard ${featured ? "featured" : ""}`}>
      <div className="marketListingMedia">
        <div className="marketListingBadge">{featured ? "مميز" : item.city?.name_ar || "سوقي"}</div>
      </div>
      <div className="marketListingBody">
        <strong>{item.title}</strong>
        <p>{item.category?.name_ar || "قسم عام"} • {item.city?.name_ar || "—"}</p>
        <div className="marketListingFooter">
          <span>{Number(item.price || 0).toLocaleString()} ₪</span>
          <span>عرض الإعلان</span>
        </div>
      </div>
    </Link>
  );
}

export default function MarketHomePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = () => {
      apiPublic("/api/public/bootstrap")
        .then((res) => {
          if (!mounted) return;
          setData(res);
          setError("");
        })
        .catch((err) => {
          if (!mounted) return;
          setError(err.message || "فشل تحميل الصفحة");
        });
    };

    load();
    const interval = setInterval(load, 15000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const latest = data?.latest || [];
  const featured = data?.featured || [];
  const pinnedTop = data?.pinnedTop || [];

  return (
    <div className="marketHomeGrid">
      <section className="marketHero">
        <div className="marketHeroText">
          <span className="badge">SOUQI MARKETPLACE</span>
          <h1>{data?.settings?.platformName || "سوقي"}</h1>
          <p>{data?.settings?.primaryTagline || "منصة إعلانات عربية للتواصل المباشر بين المستخدمين بدون دفع للسلعة داخل التطبيق."}</p>
          <div className="heroActionRow">
            <Link className="btn primary" href="/market/search">ابدأ البحث</Link>
            <Link className="btn" href="/market/packages">الترقيات والباقات</Link>
          </div>
          <div className="marketMiniStats">
            <div><strong>{data?.categories?.length ?? 0}</strong><span>قسم</span></div>
            <div><strong>{data?.cities?.length ?? 0}</strong><span>مدينة</span></div>
            <div><strong>{featured.length}</strong><span>إعلان مميز</span></div>
          </div>
        </div>
        <div className="marketHeroPanel">
          <div className="marketHeroPanelCard">
            <span className="badge">فكرة سوقي</span>
            <strong>تواصل مباشر بين الطرفين</strong>
            <p>لا يوجد checkout للسلعة نفسها داخل التطبيق. الدفع فقط للمزايا الرقمية مثل الرفع والـ Featured والاشتراكات.</p>
          </div>
          <div className="marketHeroPanelCard">
            <span className="badge">إدارة قوية</span>
            <strong>الموقع والتطبيق على نفس البيانات</strong>
            <p>أي تعديل على الإعلانات أو المستخدمين أو الأسعار ينعكس على التطبيق والموقع عبر نفس قاعدة البيانات والـ API.</p>
          </div>
        </div>
      </section>

      {error ? <div className="panel">{error}</div> : null}

      <section className="marketSectionBlock">
        <div className="section-head">
          <div>
            <h3 className="section-title">إعلانات مميزة</h3>
            <p className="section-subtitle">أفضل الإعلانات الظاهرة حاليًا في سوقي.</p>
          </div>
          <Link className="btn" href="/market/search?featured=1">عرض الكل</Link>
        </div>
        <div className="marketCardGrid">
          {featured.slice(0, 4).map((item) => <ListingCard key={item.id} item={item} featured />)}
          {!featured.length ? <p className="section-subtitle">لا توجد إعلانات مميزة حاليًا.</p> : null}
        </div>
      </section>

      <section className="marketSectionBlock twoCols">
        <div className="marketPanelSoft">
          <div className="section-head"><div><h3 className="section-title">الأكثر رفعًا الآن</h3><p className="section-subtitle">إعلانات عليها ترقية نشطة داخل سوقي.</p></div></div>
          <div className="stackList compactList">
            {pinnedTop.slice(0, 5).map((item) => (
              <Link key={item.id} href={`/market/listings/${item.id}`} className="stackRow clickableRow">
                <strong>{item.title}</strong>
                <span>{Number(item.price || 0).toLocaleString()} ₪</span>
              </Link>
            ))}
            {!pinnedTop.length ? <p className="section-subtitle">لا توجد ترقيات نشطة الآن.</p> : null}
          </div>
        </div>

        <div className="marketPanelSoft">
          <div className="section-head"><div><h3 className="section-title">لماذا سوقي؟</h3><p className="section-subtitle">واجهة نظيفة، عربية، وسريعة للإطلاق التجاري.</p></div></div>
          <div className="stackList compactList">
            <div className="stackRow softRow"><strong>نشر سريع</strong><span>إضافة إعلان من نفس الحساب</span></div>
            <div className="stackRow softRow"><strong>بحث مرتب</strong><span>فلاتر مدينة وقسم وسعر</span></div>
            <div className="stackRow softRow"><strong>ربح واضح</strong><span>رفع + Boost + Featured + اشتراكات</span></div>
          </div>
        </div>
      </section>

      <section className="marketSectionBlock">
        <div className="section-head">
          <div>
            <h3 className="section-title">أحدث الإعلانات</h3>
            <p className="section-subtitle">آخر ما تم نشره داخل سوقي.</p>
          </div>
        </div>
        <div className="marketCardGrid large">
          {latest.slice(0, 8).map((item) => <ListingCard key={item.id} item={item} />)}
          {!latest.length ? <p className="section-subtitle">لا توجد إعلانات بعد.</p> : null}
        </div>
      </section>
    </div>
  );
}
