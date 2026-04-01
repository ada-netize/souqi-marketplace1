export default function StatCard({ label, value, hint }) {
  return (
    <div className="card statCardLuxury">
      <div className="statCardTop">
        <div className="badge">KPI</div>
        <span className="statDots">•••</span>
      </div>
      <div style={{ color: "var(--muted)", marginBottom: 2, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 42, fontWeight: 950, letterSpacing: "-0.06em", lineHeight: 1 }} className="gold-text">{value}</div>
      {hint ? <div style={{ color: "var(--muted)", marginTop: 6, fontSize: 14, lineHeight: 1.8 }}>{hint}</div> : null}
    </div>
  );
}
