"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "../../../lib/api";

export default function MessagesPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api("/api/admin/messages");
      setRows(Array.isArray(data) ? data : []);
      if (!selectedId && data?.[0]?.id) setSelectedId(data[0].id);
    } catch (err) {
      setError(err.message || "فشل تحميل المحادثات");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    if (!id) return;
    try {
      const data = await api(`/api/admin/messages/${id}`);
      setDetails(data || null);
    } catch (err) {
      setError(err.message || "فشل تحميل تفاصيل المحادثة");
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.push("/");
      return;
    }
    load();
    const onFocus = () => { load(); if (selectedId) loadDetail(selectedId); };
    window.addEventListener("focus", onFocus);
    const interval = setInterval(onFocus, 15000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [router, selectedId]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId]);

  const selectedConversation = useMemo(() => rows.find((item) => item.id === selectedId), [rows, selectedId]);

  return (
    <>
      <section className="panel">
        <div className="section-head">
          <div>
            <h3 className="section-title">المحادثات النشطة</h3>
            <p className="section-subtitle">اختر أي محادثة لقراءة الرسائل والتفاصيل المرتبطة بها.</p>
          </div>
          <button className="btn primary" onClick={load}>تحديث المحادثات</button>
        </div>
        {error ? <p className="errorText">{error}</p> : null}
      </section>

      <section className="adminTwoColumn" style={{ marginTop: 22 }}>
        <div className="panel">
          <div className="stackList listingStack">
            {loading ? <p className="section-subtitle">جارٍ التحميل...</p> : null}
            {!loading && !rows.length ? <p className="section-subtitle">لا توجد محادثات حتى الآن.</p> : null}
            {rows.map((item) => (
              <button key={item.id} className={`selectCard ${selectedId === item.id ? "active" : ""}`} onClick={() => setSelectedId(item.id)}>
                <div className="selectCardHeader">
                  <strong>{item.listing_title}</strong>
                  <span className="badge">#{item.id}</span>
                </div>
                <p className="mutedParagraph">{item.buyer_name} ↔ {item.seller_name}</p>
                <div className="messagePreviewClamp">{item.last_message || "لا توجد رسالة بعد"}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel detailPanelSticky">
          <div className="section-head">
            <div>
              <h3 className="section-title">تفاصيل المحادثة</h3>
              <p className="section-subtitle">قراءة الرسائل والعروض المربوطة بهذه المحادثة.</p>
            </div>
          </div>

          {!selectedConversation ? <p className="section-subtitle">اختر محادثة من القائمة.</p> : (
            <div className="grid" style={{ gap: 16 }}>
              <div className="detailHeroBar">
                <div>
                  <strong>{details?.conversation?.listing_title || selectedConversation.listing_title}</strong>
                  <p className="mutedParagraph">{details?.conversation?.buyer_name || selectedConversation.buyer_name} ↔ {details?.conversation?.seller_name || selectedConversation.seller_name}</p>
                </div>
                <span className="badge">{details?.messages?.length || 0} رسالة</span>
              </div>

              <div className="chatAdminThread">
                {(details?.messages || []).map((item) => (
                  <div key={item.id} className="chatBubbleAdmin">
                    <div className="chatBubbleMeta">
                      <strong>{item.sender_name}</strong>
                      <span>{item.created_at}</span>
                    </div>
                    <p>{item.message}</p>
                  </div>
                ))}
                {!details?.messages?.length ? <p className="section-subtitle">لا توجد رسائل داخل هذه المحادثة.</p> : null}
              </div>

              <div className="stackList compactList">
                <strong>العروض المرتبطة</strong>
                {(details?.offers || []).map((offer) => (
                  <div key={offer.id} className="stackRow softRow">
                    <div>
                      <strong>₪{Number(offer.amount || 0).toLocaleString()}</strong>
                      <p className="mutedParagraph">{offer.status}</p>
                    </div>
                    <span className="section-subtitle">{offer.updated_at}</span>
                  </div>
                ))}
                {!details?.offers?.length ? <p className="section-subtitle">لا توجد عروض مرتبطة.</p> : null}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
