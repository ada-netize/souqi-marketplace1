import Link from "next/link";

const links = [
  { href: "/market", label: "الرئيسية" },
  { href: "/market/search", label: "البحث" },
  { href: "/market/packages", label: "الباقات" },
  { href: "/market/contact", label: "تواصل" },
];

export default function MarketLayout({ children }) {
  return (
    <div className="marketSiteShell">
      <header className="marketTopbar">
        <div className="marketTopbarInner">
          <Link href="/market" className="marketBrand">
            <div className="marketBrandLogo">س</div>
            <div>
              <strong>سوقي</strong>
              <span>Marketplace عربي حديث</span>
            </div>
          </Link>

          <nav className="marketTopNav">
            {links.map((item) => (
              <Link key={item.href} className="marketNavLink" href={item.href}>{item.label}</Link>
            ))}
          </nav>

          <div className="marketTopActions">
            <Link className="btn" href="/">دخول الأدمن</Link>
          </div>
        </div>
      </header>

      <main className="marketMainWrap">{children}</main>
    </div>
  );
}
