export default function SectionCard({ title, subtitle, extra, children, id }) {
  return (
    <section className="card sectionCard premiumSection" id={id}>
      <div className="sectionAccent" />
      <div className="sectionHead">
        <div>
          <h3 style={{ margin: 0, fontSize: 28, letterSpacing: "-0.04em" }}>{title}</h3>
          {subtitle ? <p className="mutedParagraph" style={{ marginTop: 8 }}>{subtitle}</p> : null}
        </div>
        {extra ? <div>{extra}</div> : null}
      </div>
      {children}
    </section>
  );
}
