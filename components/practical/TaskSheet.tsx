"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeLinkUrl } from "@/lib/validation";

/**
 * Arkusz zadania (Markdown). react-markdown bez rehype-raw NIE renderuje
 * surowego HTML-a, więc treść od nauczyciela nie może wstrzyknąć skryptu.
 * Dodatkowo linki przepuszczamy przez safeLinkUrl (tylko http/https).
 */
export function TaskSheet({ markdown, title, summary }: { markdown: string; title?: string; summary?: string }) {
  return (
    <div className="prose-inf03 h-full overflow-y-auto p-4 sm:p-5">
      {title && <h1 className="mb-1 font-mono text-xl font-bold text-fg">{title}</h1>}
      {summary && <p className="mb-4 text-sm text-muted">{summary}</p>}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const safe = safeLinkUrl(href);
            if (!safe) return <span>{children}</span>;
            return (
              <a href={safe} target="_blank" rel="noopener noreferrer nofollow">
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => {
            const safe = safeLinkUrl(src);
            if (!safe) return null;
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={safe} alt={alt ?? ""} className="max-w-full rounded-lg border border-line" />;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
