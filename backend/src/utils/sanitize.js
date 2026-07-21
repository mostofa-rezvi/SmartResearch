/**
 * Lightweight, dependency-free input sanitization for user-generated content.
 *
 * React escapes text on render, so the primary risk is stored content that is
 * later rendered as HTML or reflected elsewhere. This strips the dangerous
 * vectors (script/style/iframe/object tags, inline event handlers, and
 * javascript:/vbscript:/data: URIs) while preserving normal text. It is
 * intentionally conservative — it does not attempt a full allow-list HTML
 * sanitizer (use `sanitize-html`/DOMPurify if rich HTML must be permitted).
 *
 * @param {string} input
 * @returns {string}
 */
function sanitizeText(input) {
  if (input == null) return input;
  if (typeof input !== 'string') return input;
  let out = input;
  // Remove whole dangerous elements incl. their contents
  out = out.replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  // Remove self-closing / unclosed dangerous tags
  out = out.replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*>/gi, '');
  // Strip inline event handlers: on*="..." / on*='...' / on*=value
  out = out.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
  out = out.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');
  // Neutralize dangerous URI schemes in href/src
  out = out.replace(/(href|src)\s*=\s*(["']?)\s*(javascript|vbscript|data)\s*:/gi, '$1=$2');
  return out;
}

/** Sanitize a set of string fields on an object in place; returns the object. */
function sanitizeFields(obj, fields) {
  if (!obj) return obj;
  for (const f of fields) {
    if (typeof obj[f] === 'string') obj[f] = sanitizeText(obj[f]);
  }
  return obj;
}

module.exports = { sanitizeText, sanitizeFields };
