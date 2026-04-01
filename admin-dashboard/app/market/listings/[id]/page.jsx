"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiPublic } from "../../../../lib/api";

export default function ListingDetailsPage({ params }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = () => {
      apiPublic(`/api/public/listings/${params.id}`)
        .then((res) => {
          if (!mounted) return;
          setData(res);
          setError("");
        })
        .catch((err) => {
          if (!mounted) return;
          setError(err.message || "فشل تحميل الإعلان");
          setData(null);
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
  }, [params.id]);

  const listing = data?.listing;

  return (
    <div className="marketHomeGrid">
      {error ? <div className="panel">{error}</div> : null}
      {!listing ? <div className="marketEmptyState"><strong>جارٍ تحميل الإعلان...</strong></div> : (
        <>
          <section className="listingDetailsHero">
            <div className="listingGalleryMock">
              <div className="listingGalleryTag">{listing.category?.name_ar || "إعلان"}</div>
            </div>
            <div className="listingDetailsCard">
              <div className="badge">{listing.is_featured ? "إعلان مميز" : "إعلان مباشر"}</div>
              <h1>{listing.title}</h1>
              <p>{listing.description || "لا يوجد وصف إضافي لهذا الإعلان."}</p>
              <div className="listingDetailMetaGrid">
                <div><span>السعر</span><strong>{Number(listing.price || 0).toLocaleString()} ₪</strong></div>
                <div><span>المدينة</span><strong>{listing.city?.name_ar || "—"}</strong></div>
                <div><span>القسم</span><strong>{listing.category?.name_ar || "—"}</strong></div>
                <div><span>الحالة</span><strong>{listing.status || "available"}</strong></div>
              </div>
              <div className="heroActionRow">
                <a className="btn primary" href={`tel:${listing.phone || listing.seller?.phone || data?.seller?.phone || ""}`}>اتصال مباشر</a>
                <a className="btn" href={`https://wa.me/${String(listing.whatsapp || listing.phone || "").replace(/[^0-9]/g, "")}`}>واتساب</a>
                <Link className="btn" href="/market/search">رجوع للبحث</Link>
              </div>
            </div>
          </section>

          <section className="marketSectionBlock twoCols">
            <div className="marketPanelSoft">
              <div className="section-head"><div><h3 className="section-title">بيانات الإعلان</h3></div></div>
              <div className="stackList compactList">
                <div className="stackRow softRow"><strong>العروض النشطة</strong><span>{data?.meta?.activeOffers ?? 0}</span></div>
                <div className="stackRow softRow"><strong>رفع يوم</strong><span>{data?.meta?.raise1DayPrice ?? 10} ₪</span></div>
                <div className="stackRow softRow"><strong>رفع 3 أيام</strong><span>{data?.meta?.raise3DaysPrice ?? 20} ₪</span></div>
                <div className="stackRow softRow"><strong>Boost 3 أيام</strong><span>{data?.meta?.boost3DaysPrice ?? 25} ₪</span></div>
                <div className="stackRow softRow"><strong>Featured 3 أيام</strong><span>{data?.meta?.featured3DaysPrice ?? 35} ₪</span></div>
              </div>
            </div>

            <div className="marketPanelSoft">
              <div className="section-head"><div><h3 className="section-title">ملاحظات مهمة</h3></div></div>
              <div className="stackList compactList">
                <div className="stackRow softRow"><strong>الدفع</strong><span>لا يوجد شراء مباشر للسلعة داخل التطبيق</span></div>
                <div className="stackRow softRow"><strong>التواصل</strong><span>عبر الهاتف أو واتساب أو الرسائل</span></div>
                <div className="stackRow softRow"><strong>الترقيات</strong><span>مخصصة فقط لتحسين ظهور الإعلان</span></div>
              </div>
            </div>
          </section>

          <section className="marketSectionBlock">
            <div className="section-head"><div><h3 className="section-title">إعلانات مشابهة</h3><p className="section-subtitle">من نفس القسم تقريبًا.</p></div></div>
            <div className="marketCardGrid">
              {(data?.similar || []).map((item) => (
                <Link key={item.id} href={`/market/listings/${item.id}`} className="marketListingCard">
                  <div className="marketListingMedia"><div className="marketListingBadge">{item.city?.name_ar || "—"}</div></div>
                  <div className="marketListingBody">
                    <strong>{item.title}</strong>
                    <p>{item.category?.name_ar || "—"}</p>
                    <div className="marketListingFooter"><span>{Number(item.price || 0).toLocaleString()} ₪</span><span>عرض</span></div>
                  </div>
                </Link>
              ))}
              {!data?.similar?.length ? <p className="section-subtitle">لا توجد إعلانات مشابهة حاليًا.</p> : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
