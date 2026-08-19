/**
 * HTML/Regex Escaping Utilities
 * AI-generated and user-supplied strings are rendered via innerHTML throughout
 * the UI layer; escape them before interpolation to prevent markup/script injection.
 */

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

export function escapeRegex(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
