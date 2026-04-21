// Document parser - strips formatting from .txt and .md files
export function parseDocument(content: string, filename: string): string[] {
  const ext = filename.split('.').pop()?.toLowerCase();
  let cleaned = content;

  if (ext === 'md') {
    cleaned = cleaned
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')        // headers → keep text, remove #
      .replace(/\*\*(.+?)\*\*/g, '$1')             // bold
      .replace(/\*(.+?)\*/g, '$1')                 // italic
      .replace(/__(.+?)__/g, '$1')                 // bold alt
      .replace(/_(.+?)_/g, '$1')                   // italic alt
      .replace(/~~(.+?)~~/g, '$1')                 // strikethrough
      .replace(/`{3}[\s\S]*?`{3}/g, '')            // fenced code blocks
      .replace(/`([^`]+)`/g, '$1')                 // inline code
      .replace(/^\s*[-*+]\s+/gm, '')               // unordered lists
      .replace(/^\s*\d+\.\s+/gm, '')               // ordered lists
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')     // links → keep label
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')       // images
      .replace(/^\s*>\s*/gm, '')                    // blockquotes
      .replace(/^\s*---+\s*$/gm, '')               // horizontal rules
      .replace(/^\|.*\|$/gm, '')                   // tables
      .replace(/\|/g, ' ');                         // stray pipes
  }

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map(p => p.replace(/\n/g, ' ').trim())
    .filter(p => p.length > 0);

  return paragraphs;
}

export function getWordCount(paragraphs: string[]): number {
  return paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0);
}

export function estimateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 200); // minutes at 200 wpm
}
