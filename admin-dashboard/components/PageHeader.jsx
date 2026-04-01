import Breadcrumbs from "./Breadcrumbs";

export default function PageHeader({ eyebrow, title, description, actions, stats = [], breadcrumbs = [] }) {
  return (
    <section className="pageHeader heroFrame card">
      <div className="headerGlow" />
      <div className="pageHeaderMain">
        {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
        <div className="headerIntro">
          {eyebrow ? <div className="badge">{eyebrow}</div> : null}
          <h1 className="pageTitle gold-text">{title}</h1>
          {description ? <p className="mutedParagraph pageDescription">{description}</p> : null}
        </div>
        {stats.length ? (
          <div className="headerStats">
            {stats.map((item) => (
              <div key={item.label} className="headerStatGlass">
                <span>{item.label}</span>
                <strong className="gold-text">{item.value}</strong>
                {item.note ? <small>{item.note}</small> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {actions ? <div className="headerActions">{actions}</div> : null}
    </section>
  );
}
