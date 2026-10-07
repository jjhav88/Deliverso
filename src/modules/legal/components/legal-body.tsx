import { parseLegalMarkdown } from "@/modules/legal/domain/markdown";

function renderInline(text: string) {
  const parts: Array<string | { href: string; label: string; key: string }> = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1] && match[2]) {
      parts.push({ href: match[2], label: match[1], key: `l${key}` });
    } else if (match[3]) {
      parts.push(`**${match[3]}**`);
    }
    key += 1;
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.map((part, index) => {
    if (typeof part === "object") {
      const external = part.href.startsWith("http");
      return (
        <a
          key={part.key}
          href={part.href}
          className="text-secondary underline underline-offset-4"
          {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})}
        >
          {part.label}
        </a>
      );
    }
    const bold = part.match(/^\*\*(.*)\*\*$/);
    if (bold) {
      return <strong key={`b${index}`}>{bold[1]}</strong>;
    }
    const chunks = part.split(/\*\*([^*]+)\*\*/g);
    if (chunks.length === 1) {
      return <span key={`t${index}`}>{part}</span>;
    }
    return (
      <span key={`m${index}`}>
        {chunks.map((chunk, chunkIndex) =>
          chunkIndex % 2 === 1 ? <strong key={chunkIndex}>{chunk}</strong> : chunk,
        )}
      </span>
    );
  });
}

export function LegalBody({ body }: { body: string }) {
  const sections = parseLegalMarkdown(body);
  return (
    <div className="legal-document">
      {sections.length > 1 ? (
        <nav
          aria-label="Contenido"
          className="mb-10 rounded-lg border border-border bg-muted/40 p-5 print:hidden"
        >
          <p className="type-label tracking-[0.14em] text-secondary">Contenido</p>
          <ol className="mt-3 grid gap-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="type-body-sm text-foreground underline-offset-4 hover:underline"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24">
          <h2 className="type-h2 mt-10">{section.heading}</h2>
          {section.blocks.map((block, index) => {
            if (block.kind === "p") {
              return (
                <p key={index} className="type-body mt-4 max-w-3xl text-muted-foreground">
                  {renderInline(block.text)}
                </p>
              );
            }
            if (block.kind === "ul") {
              return (
                <ul key={index} className="mt-4 max-w-3xl list-disc space-y-2 pl-6 type-body text-muted-foreground">
                  {block.items.map((item) => (
                    <li key={item}>{renderInline(item)}</li>
                  ))}
                </ul>
              );
            }
            return (
              <div key={index} className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse text-left type-body-sm">
                  <thead>
                    <tr>
                      {block.headers.map((header) => (
                        <th key={header} className="border-b border-border px-3 py-2 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="border-b border-border px-3 py-2 text-muted-foreground">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
