export default function KpiStrip({ items = [] }) {
  return (
    <div className="grid statsGrid">
      {items.map((item) => (
        <div key={item.label} className="miniStat glassMini">
          <div className="badge">Pricing</div>
          <strong className="gold-text">{item.value}</strong>
          <span>{item.label}</span>
          {item.note ? <small>{item.note}</small> : null}
        </div>
      ))}
    </div>
  );
}
