export interface Section {
  title: string;
  level: number;
  content: string;
  children: Section[];
}

export function parseMarkdownTree(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const roots: Section[] = [];
  // stack holds the currently open ancestor sections, shallowest first
  const stack: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      if (current) current.content = current.content.trim();

      const level = match[1].length;
      const newSection: Section = { title: match[2].trim(), level, content: "", children: [] };

      // Pop until stack top is a valid parent (strictly shallower level)
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        roots.push(newSection);
      } else {
        stack[stack.length - 1].children.push(newSection);
      }

      stack.push(newSection);
      current = newSection;
    } else if (current) {
      current.content += line + "\n";
    }
  }

  if (current) current.content = current.content.trim();

  return roots;
}
