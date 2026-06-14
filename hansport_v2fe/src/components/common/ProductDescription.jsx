function isBullet(line) {
  return /^[-*•]\s+/.test(line);
}

function stripBullet(line) {
  return line.replace(/^[-*•]\s+/, "").trim();
}

export default function ProductDescription({ content }) {
  const text = (content || "").replace(/\r\n/g, "\n").trim();
  if (!text) {
    return <p className="text-text-muted">Chưa có mô tả chi tiết sản phẩm.</p>;
  }

  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="product-description">
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const heading = lines.length === 1 && lines[0].match(/^(#{1,3})\s+(.+)$/);

        if (heading) {
          return <h3 key={index}>{heading[2]}</h3>;
        }
        if (lines.length > 0 && lines.every(isBullet)) {
          return (
            <ul key={index}>
              {lines.map((line) => <li key={line}>{stripBullet(line)}</li>)}
            </ul>
          );
        }
        return <p key={index}>{lines.join("\n")}</p>;
      })}
    </div>
  );
}
