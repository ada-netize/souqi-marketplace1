import Link from "next/link";

export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="breadcrumbsWrap">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="breadcrumbItem">
          {item.href ? <Link href={item.href}>{item.label}</Link> : <strong>{item.label}</strong>}
          {index < items.length - 1 ? <span className="breadcrumbDivider">/</span> : null}
        </span>
      ))}
    </div>
  );
}
