"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navigation = [
  { label: "مركز التحكم", href: "/dashboard" },
  { label: "إدارة الإعلانات", href: "/dashboard/listings" },
  { label: "إدارة المستخدمين", href: "/dashboard/users" },
  { label: "الرسائل", href: "/dashboard/messages" },
  { label: "العروض", href: "/dashboard/offers" },
  { label: "الباقات والربح", href: "/dashboard/monetization" },
  { label: "الإيرادات", href: "/dashboard/revenue" },
  { label: "البلاغات", href: "/dashboard/reports" },
  { label: "الأقسام", href: "/dashboard/categories" },
  { label: "المدن", href: "/dashboard/cities" },
  { label: "الإعدادات", href: "/dashboard/settings" },
];

const pageMeta = [
  {
    match: (pathname) => pathname === "/dashboard",
    title: "لوحة التحكم",
    subtitle: "مركز إدارة أنيق وعملي للتطبيق والموقع، مع وصول سريع لكل ما يهمك من مكان واحد.",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard/listings"),
    title: "إدارة الإعلانات",
    subtitle: "تحكم بالإعلانات والمزايا المدفوعة والحالة والتمييز من لوحة مرتبة وسريعة.",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard/users"),
    title: "إدارة المستخدمين",
    subtitle: "راجع الحسابات، حدّث البيانات، وطبّق الحظر أو التوثيق بدون تكرار أو فوضى.",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard/messages"),
    title: "الرسائل",
    subtitle: "عرض أوضح للمحادثات والرسائل المرتبطة بالإعلانات من داخل لوحة التحكم.",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard/offers"),
    title: "العروض",
    subtitle: "متابعة عروض الأسعار وحالتها وربطها بالإعلانات والمحادثات بسهولة.",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard/monetization"),
    title: "الباقات والربح",
    subtitle: "إدارة الباقات والترقيات الرقمية ومنتجات IAP ضمن نفس هوية سوقي.",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard/revenue"),
    title: "الإيرادات",
    subtitle: "ملخص واضح للإيرادات والعمليات الرقمية والنتائج المالية داخل التطبيق.",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard/reports"),
    title: "البلاغات",
    subtitle: "صفحة مراجعة مرتبة للبلاغات المفتوحة والإجراءات الإدارية المرتبطة بها.",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard/categories"),
    title: "الأقسام",
    subtitle: "تنظيم أقسام التطبيق وترتيبها والتحكم بحالتها من واجهة أنظف.",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard/cities"),
    title: "المدن",
    subtitle: "إدارة المدن والمناطق وتنسيق ظهورها داخل سوقي بسهولة.",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard/settings"),
    title: "الإعدادات",
    subtitle: "هوية المشروع والأسعار ومعرّفات المتاجر في صفحة واحدة متماسكة.",
  },
];

function isActive(pathname, href) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getPageMeta(pathname) {
  return pageMeta.find((item) => item.match(pathname)) || pageMeta[0];
}

export default function LayoutShell({ children, actions = null }) {
  const pathname = usePathname();
  const router = useRouter();
  const meta = getPageMeta(pathname);

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
    }
    router.push("/");
  };

  return (
    <div className="app-shell desktop-only-admin adminShellRefresh">
      <aside className="desktop-sidebar adminSidebarRefresh">
        <div className="desktop-sidebar__brand adminBrandRefresh">
          <div className="desktop-sidebar__logo">س</div>
          <div>
            <h2 className="desktop-sidebar__title">سوقي</h2>
            <p className="desktop-sidebar__subtitle">لوحة إدارة التطبيق والموقع</p>
          </div>
        </div>

        <div className="desktop-sidebar__hero adminHeroCardRefresh">
          <div className="adminHeroTinyRow">
            <span className="desktop-badge">SOUQI CONTROL</span>
            <span className="adminHeroTinyLive">LIVE</span>
          </div>
          <h3>تحكم كامل وبشكل مرتب</h3>
          <p>
            كل شيء منظم هنا: المستخدمون، الإعلانات، الرسائل، البلاغات، الأسعار، الباقات، والإعدادات.
          </p>
          <div className="sidebarHeroStats adminQuickFacts">
            <div className="sidebarHeroStat"><strong>RTL</strong><span>واجهة عربية</span></div>
            <div className="sidebarHeroStat"><strong>IAP</strong><span>منتجات رقمية</span></div>
          </div>
        </div>

        <nav className="desktop-sidebar__nav adminNavRefresh">
          {navigation.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className={`desktop-nav-item ${active ? "is-active" : ""}`}>
                <span className="desktop-nav-item__dot" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="desktop-sidebar__footer adminFooterRefresh">
          <div className="desktop-status-card adminStatusCardRefresh">
            <div>
              <p className="desktop-status-card__label">الواجهة العامة</p>
              <h4>سوقي Marketplace</h4>
            </div>
            <span className="desktop-status-pill">منصة جاهزة</span>
          </div>
          <div className="sidebarFooterActions">
            <Link className="btn" href="/market">فتح الموقع</Link>
            <button className="btn" onClick={logout}>تسجيل خروج</button>
          </div>
        </div>
      </aside>

      <main className="desktop-main adminMainRefresh">
        <header className="desktop-topbar adminTopbarRefresh">
          <div className="adminHeadingBlock">
            <p className="desktop-topbar__eyebrow">SOUQI ADMIN PANEL</p>
            <h1 className="desktop-topbar__title">{meta.title}</h1>
            <p className="desktop-topbar__subtitle">{meta.subtitle}</p>
          </div>

          <div className="desktop-topbar__actions adminTopbarActionsRefresh">
            <Link className="btn" href="/dashboard/settings">الأسعار والإعدادات</Link>
            <Link className="btn" href="/dashboard/monetization">الباقات والربح</Link>
            {actions}
            <div className="desktop-profile-chip adminProfileRefresh">
              <div className="desktop-profile-chip__avatar">س</div>
              <div>
                <strong>Souqi Admin</strong>
                <span>admin@example.com</span>
              </div>
            </div>
          </div>
        </header>

        <div className="desktop-content adminContentRefresh">{children}</div>
      </main>
    </div>
  );
}
