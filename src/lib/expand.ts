export interface Section {
  title: string;
  content: string;
}

export function parseMarkdownSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+)/);
    if (match) {
      if (current) sections.push({ ...current, content: current.content.trim() });
      current = { title: match[1].trim(), content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) sections.push({ ...current, content: current.content.trim() });

  return sections.filter((s) => s.title);
}
