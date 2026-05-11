import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Lightweight markdown-like blocks (## headers, lists, paragraphs, [text](href) links).
 * Matches KnowledgeArticlePage behaviour for relocation guides.
 */
export function renderMarkdownLikeContent(content: string): React.ReactNode {
  if (!content) return null;

  const linkifyLine = (line: string, keyPrefix: string) => {
    const parts: React.ReactNode[] = [];
    const re = /\[([^\]]+)\]\(([^)]+)\)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let idx = 0;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) {
        parts.push(line.slice(last, m.index));
      }
      const label = m[1];
      const href = m[2];
      const internal = href.startsWith('/');
      parts.push(
        internal ? (
          <Link key={`${keyPrefix}-l-${idx}`} to={href} className="text-primary underline underline-offset-2">
            {label}
          </Link>
        ) : (
          <a key={`${keyPrefix}-l-${idx}`} href={href} className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer">
            {label}
          </a>
        ),
      );
      idx += 1;
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts.length ? parts : line;
  };

  return content.split('\n\n').map((paragraph, idx) => {
    if (paragraph.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-xl font-semibold mt-6 mb-3 text-foreground">
          {paragraph.replace('## ', '').replace(/\*\*(.+?)\*\*/g, '$1')}
        </h2>
      );
    }
    if (paragraph.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-lg font-medium mt-4 mb-2 text-foreground">
          {paragraph.replace('### ', '').replace(/\*\*(.+?)\*\*/g, '$1')}
        </h3>
      );
    }

    if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
      const items = paragraph.split('\n').filter((line) => line.startsWith('- '));
      return (
        <ul key={idx} className="list-disc list-inside space-y-1 my-3 text-foreground">
          {items.map((item, i) => (
            <li key={i} className="text-sm">
              {linkifyLine(item.replace('- ', '').replace(/\*\*(.+?)\*\*/g, '$1'), `li-${idx}-${i}`)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={idx} className="text-foreground text-sm leading-relaxed my-3">
        {linkifyLine(paragraph.replace(/\*\*(.+?)\*\*/g, '$1'), `p-${idx}`)}
      </p>
    );
  });
}
