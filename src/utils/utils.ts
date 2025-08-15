export function calculateReadingTime(text: string, wordsPerMinute: number = 200): string {
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}