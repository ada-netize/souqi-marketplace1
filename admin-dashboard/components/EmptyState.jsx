export default function EmptyState({ title = "لا توجد بيانات", text = "لا يوجد شيء لعرضه حاليًا." }) {
  return (
    <div className="emptyState">
      <div className="emptyIcon">◇</div>
      <strong>{title}</strong>
      <p className="mutedParagraph">{text}</p>
    </div>
  );
}
