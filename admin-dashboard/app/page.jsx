"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "../lib/api";

const perks = [
  ["واجهة مرتبة جدًا", "هوية خضراء حديثة ومريحة تعطي انطباع مشروع حقيقي قابل للبيع."],
  ["نموذج ربح واضح", "رفع إعلان، Boost، إعلان مميز، وباقات شهرية للمستخدمين من لوحة واحدة."],
  ["جاهزة للعرض", "صفحة دخول وهيكل إداري مناسبين للشرح والعرض التجاري أمام العميل."],
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const data = await api("/api/auth/admin/login", { method: "POST", body: { email, password } });
      localStorage.setItem("admin_token", data.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page adminLuxuryBg" style={{ display: "grid", placeItems: "center", padding: 28, minHeight: "100vh" }}>
      <motion.div initial={{ opacity: 0, scale: 0.985, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.34, ease: "easeOut" }} className="card" style={{ width: "min(1560px, 100%)", padding: 28 }}>
        <div className="grid splitGrid">
          <div className="heroPanel" style={{ minHeight: 640, display: "grid", alignContent: "space-between" }}>
            <div className="badge">SOUQI ADMIN LOGIN</div>

            <div>
              <h2 className="gold-text">إدارة سوقي من لوحة أنيقة وواضحة</h2>
              <p className="mutedParagraph" style={{ maxWidth: 820, marginTop: 16 }}>
                سوقي منصة إعلانات محلية تسمح بالتواصل المباشر بين المستخدمين، وتربح من رفع الإعلان والـ Boost والإعلانات المميزة والباقات الشهرية داخل التطبيق.
              </p>
            </div>

            <div className="grid statsGrid">
              {perks.map(([title, text]) => <div key={title} className="glassMini"><strong style={{ fontSize: 18, display: "block", marginBottom: 8 }}>{title}</strong><span className="mutedParagraph" style={{ fontSize: 14 }}>{text}</span></div>)}
            </div>

            <div className="highlightPanel">
              <div className="badge">Souqi Control</div>
              <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                <strong style={{ fontSize: 24 }}>لوحة تشغيل جاهزة</strong>
                <div className="mutedParagraph">أدخل بيانات الأدمن الخاصة بك للوصول إلى إدارة التطبيق والموقع.</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 38, alignSelf: "center" }}>
            <div className="badge">Secure Access</div>
            <h1 style={{ margin: "18px 0 10px", fontSize: 46, letterSpacing: "-0.05em" }} className="gold-text">دخول لوحة سوقي</h1>
            <p className="mutedParagraph" style={{ marginBottom: 24 }}>سجل الدخول لإدارة الإعلانات والمستخدمين والرسائل والربح والترويج من واجهة عصرية ومرتبة.</p>
            <div className="actionRow" style={{ marginBottom: 20 }}>
              <a className="btn" href="/market">فتح الواجهة العامة</a>
              <a className="btn" href="/market/packages">الباقات العامة</a>
            </div>
            <form onSubmit={onSubmit} className="grid">
              <div className="field"><label className="fieldLabel">البريد الإلكتروني</label><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="أدخل بريد الأدمن" /></div>
              <div className="field"><label className="fieldLabel">كلمة المرور</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
              {error ? <div style={{ color: "#ffd8de" }}>{error}</div> : null}
              <button className="btn primary" disabled={loading}>{loading ? "جاري الدخول..." : "الدخول إلى النظام"}</button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
