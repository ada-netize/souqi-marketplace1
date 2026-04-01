"use client";

import { useState } from "react";

export default function TabNav({ tabs = [] }) {
  const [active, setActive] = useState(tabs[0]?.href || "");

  const handleClick = (href) => {
    setActive(href);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!tabs.length) return null;

  return (
    <div className="tabNavWrap card">
      <div className="tabNavInner">
        {tabs.map((tab) => (
          <button
            key={tab.href}
            className={`tabPill ${active === tab.href ? "active" : ""}`}
            onClick={() => handleClick(tab.href)}
          >
            <span>{tab.label}</span>
            {tab.note ? <small>{tab.note}</small> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
