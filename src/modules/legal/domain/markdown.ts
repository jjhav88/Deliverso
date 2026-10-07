export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "table"; headers: string[]; rows: string[][] };

export type LegalSection = {
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export function slugifyHeading(heading: string): string {
  return heading
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function splitCells(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isDivider(line: string): boolean {
  return /^\|?\s*:?-{3,}/.test(line);
}

export function parseLegalMarkdown(body: string): LegalSection[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const sections: LegalSection[] = [];
  let current: LegalSection | null = null;
  const usedIds = new Set<string>();

  function ensureSection(): LegalSection {
    if (current) {
      return current;
    }
    current = { id: "introduccion", heading: "Introducción", blocks: [] };
    sections.push(current);
    usedIds.add(current.id);
    return current;
  }

  function pushParagraph(text: string) {
    const section = ensureSection();
    const last = section.blocks.at(-1);
    if (last?.kind === "p") {
      last.text = `${last.text} ${text}`.trim();
      return;
    }
    section.blocks.push({ kind: "p", text });
  }

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? "";
    const line = raw.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      continue;
    }
    if (line.startsWith("## ")) {
      const heading = line.slice(3).trim();
      let id = slugifyHeading(heading) || `seccion-${sections.length + 1}`;
      if (usedIds.has(id)) {
        id = `${id}-${sections.length + 1}`;
      }
      usedIds.add(id);
      current = { id, heading, blocks: [] };
      sections.push(current);
      continue;
    }
    if (line.startsWith("### ")) {
      pushParagraph(line.slice(4).trim());
      continue;
    }
    if (line.startsWith("|")) {
      const section = ensureSection();
      const headers = splitCells(line);
      const next = lines[i + 1]?.trim() ?? "";
      if (isDivider(next)) {
        i += 1;
      }
      const rows: string[][] = [];
      while (i + 1 < lines.length && (lines[i + 1] ?? "").trim().startsWith("|")) {
        const rowLine = (lines[i + 1] ?? "").trim();
        i += 1;
        if (isDivider(rowLine)) {
          continue;
        }
        rows.push(splitCells(rowLine));
      }
      section.blocks.push({ kind: "table", headers, rows });
      continue;
    }
    if (line.startsWith("- ")) {
      const section = ensureSection();
      const items = [line.slice(2).trim()];
      while (i + 1 < lines.length && (lines[i + 1] ?? "").trim().startsWith("- ")) {
        items.push((lines[i + 1] ?? "").trim().slice(2).trim());
        i += 1;
      }
      section.blocks.push({ kind: "ul", items });
      continue;
    }
    pushParagraph(line);
  }

  return sections.filter((section) => section.blocks.length > 0 || section.heading !== "Introducción");
}
