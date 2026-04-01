"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../lib/api";
import MotionPage from "../../../../components/MotionPage";
import PageHeader from "../../../../components/PageHeader";
import SectionCard from "../../../../components/SectionCard";
import TabNav from "../../../../components/TabNav";

export default function MessageDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  useEffect(() => { if (params?.id) api(`/api/admin/messages/${params.id}`).then(setData).catch(console.error); }, [params?.id]);
  if (!data) return <div className="card" style={{ padding: 24 }}>جاري تحميل المحادثة...</div>;

  return (
    <MotionPage>
      <PageHeader
        eyebrow="تفاصيل المحادثة"
        title={data.conversation.listing_title}
        description={`${data.conversation.buyer_name} ↔ ${data.conversation.seller_name}`}
        breadcrumbs={[{ label: "لوحة الأدمن", href: "/dashboard" }, { label: "الرسائل", href: "/dashboard/messages" }, { label: `محادثة #${data.conversation.id}` }]}
        actions={<button className="btn" onClick={() => router.push('/dashboard/messages')}>رجوع للرسائل</button>}
        stats={[
          { label: 'عدد الرسائل', value: data.messages.length },
          { label: 'عدد العروض', value: data.offers.length },
        ]}
      />

      <TabNav tabs={[
        { label: 'الرسائل', href: '#messages', note: 'كل الردود' },
        { label: 'العروض', href: '#offers', note: 'العروض المرتبطة' },
      ]} />

      <div className="grid splitGrid">
        <SectionCard id="messages" title="الرسائل" subtitle="كل الرسائل في صفحة مستقلة لهذه المحادثة فقط، بشكل أنظف وأسهل في المتابعة.">
          <div className="chatThread">
            {data.messages.map((msg) => (
              <div key={msg.id} className="chatBubble">
                <strong>{msg.sender_name}</strong>
                <p>{msg.message}</p>
                <span>{msg.created_at}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard id="offers" title="العروض المرتبطة" subtitle="أي عرض سعر داخل نفس المحادثة يظهر هنا بشكل منفصل وواضح.">
          <div className="grid">
            {data.offers.map((offer) => <div key={offer.id} className="softRow"><div><strong>{Number(offer.amount).toLocaleString()} ₪</strong><div className="mutedParagraph">الحالة: {offer.status}</div></div><span className="badge">عرض</span></div>)}
          </div>
        </SectionCard>
      </div>
    </MotionPage>
  );
}
