/**
 * Utility functions for handling HTML content in React Native
 */

/**
 * Removes HTML tags from a string and normalizes whitespace
 * @param html HTML string to clean
 * @returns Plain text string with HTML tags removed
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // Remove HTML tags
  const textWithoutTags = html.replace(/<[^>]*>/g, '');
  
  // Replace HTML entities
  const decodedText = textWithoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…');
  
  // Normalize horizontal whitespace but KEEP \n inserted earlier
  const normalizedText = decodedText
    .replace(/[ \t]+/g, ' ')     // collapse spaces & tabs
    .replace(/\n{3,}/g, '\n\n')  // limit excessive blank lines
    .trim();
  
  return normalizedText;
}

/**
 * Converts line breaks in HTML to newline characters for React Native
 * @param html HTML content with <br>, <p>, etc. tags
 * @returns Text with appropriate line breaks for React Native
 */
export function convertHtmlLineBreaks(html: string): string {
  if (!html) return '';
  
  // Replace <br>, <p>, <div> closing tags with newlines
  const withLineBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n');
  
  // Now strip remaining HTML tags
  return stripHtmlTags(withLineBreaks);
}

/**
 * Simplifies and normalizes HTML content for display in React Native
 * Removes tags, converts breaks, and normalizes whitespace
 * @param html Raw HTML content
 * @returns Clean, formatted text for React Native
 */
export function parseHtmlForDisplay(html: string): string {
  if (!html) return '';
  
  // Handle line breaks first
  const withLineBreaks = convertHtmlLineBreaks(html);
  
  // Normalize consecutive newlines
  const normalizedNewlines = withLineBreaks.replace(/\n{3,}/g, '\n\n');
  
  return normalizedNewlines.trim();
} 