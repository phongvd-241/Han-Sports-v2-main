function parseInline(text) {
  let html = text || "";
  
  // Escape HTML to prevent XSS but keep our replacements
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Parse images: ![alt](url)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
    return `<img src="${url}" alt="${alt}" class="w-full max-w-2xl rounded-xl shadow-md mx-auto my-6 block object-contain" />`;
  });

  // Parse links: [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, linkText, url) => {
    return `<a href="${url}" class="text-brand-blue hover:text-brand-blue-dark hover:underline font-semibold transition-colors" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
  });

  // Bold text: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic text: *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  return html;
}

export default function ProductDescription({ content }) {
  const text = (content || "").replace(/\r\n/g, "\n").trim();
  if (!text) {
    return <p className="text-text-muted">Chưa có mô tả chi tiết sản phẩm.</p>;
  }

  const lines = text.split("\n");
  const elements = [];
  
  let currentList = [];
  let listKey = 0;

  const pushCurrentList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`}>
          {currentList.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // If empty line
    if (!line) {
      // Lookahead: if the next non-empty line exists and is a list item, we can continue the list,
      // otherwise push/close the current list.
      let nextLineIsList = false;
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        if (nextLine) {
          nextLineIsList = /^\s*([-*•✓+])\s*(.*)$/.test(nextLine);
          break;
        }
      }
      if (!nextLineIsList) {
        pushCurrentList();
      }
      continue;
    }

    // Check for headings: #, ##, ###
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      pushCurrentList();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const Tag = `h${level}`;
      elements.push(
        <Tag key={`h-${i}`} dangerouslySetInnerHTML={{ __html: parseInline(headingText) }} />
      );
      continue;
    }

    // Check for list items (supporting standard bullets and tick mark ✓)
    const listMatch = line.match(/^\s*([-*•✓+])\s*(.*)$/);
    if (listMatch) {
      currentList.push(listMatch[2]);
      continue;
    }

    // Regular line - normal paragraph
    pushCurrentList();
    elements.push(
      <p key={`p-${i}`} dangerouslySetInnerHTML={{ __html: parseInline(line) }} />
    );
  }

  // Push any remaining list items
  pushCurrentList();

  return (
    <div className="product-description">
      {elements}
    </div>
  );
}
