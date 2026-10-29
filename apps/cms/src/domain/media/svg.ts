/*
 * SVG is XML and may carry scripts, event handlers and external references. Logos and icons are
 * accepted only when they are static drawings; anything active is rejected, never "cleaned".
 */

const decoder = new TextDecoder('utf-8', { fatal: true });
const lenientDecoder = new TextDecoder('utf-8');

function decodeText(bytes: Uint8Array): string | null {
  try {
    return decoder.decode(bytes);
  } catch {
    return null;
  }
}

/** Optional XML declaration, comments and whitespace, then the `<svg` root element. */
const SVG_ROOT = /^\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i;

const toChar = (code: number) => (code <= 0x10ffff ? String.fromCodePoint(code) : '');

/** Character references are resolved first, so `&#106;avascript:` cannot slip past the checks. */
const resolveCharacterReferences = (text: string) =>
  text
    .replace(/&#x0*([0-9a-f]{1,6});?/gi, (_, hex: string) => toChar(Number.parseInt(hex, 16)))
    .replace(/&#0*(\d{1,7});?/g, (_, dec: string) => toChar(Number(dec)));

const FORBIDDEN: readonly RegExp[] = [
  /<!DOCTYPE|<!ENTITY/i, // entity expansion and external entities
  // Elements are matched with any namespace prefix too (`<svg:script>`).
  /<\s*([\w.-]+:)?(script|foreignObject|iframe|embed|object|audio|video|handler|listener)\b/i,
  /\son[a-z]+\s*=/i, // event handlers (onload, onclick...)
  /javascript:|vbscript:/i,
  /@import/i,
  // References may only point inside the file or to embedded raster images.
  /\s([\w.-]+:)?href\s*=(?!\s*["']?\s*(#|data:image\/(png|jpe?g|gif|webp);))/i,
  /url\((?!\s*["']?\s*(#|data:image\/(png|jpe?g|gif|webp);))/i,
];

export function looksLikeSvg(bytes: Uint8Array): boolean {
  // Only the beginning is read; it may end in the middle of a character, hence the lenient decoder.
  return SVG_ROOT.test(lenientDecoder.decode(bytes.subarray(0, 1024)));
}

/** True for a well-formed-looking SVG without scripts, event handlers or external references. */
export function isStaticSvg(bytes: Uint8Array): boolean {
  const text = decodeText(bytes);
  if (text === null || !SVG_ROOT.test(text)) return false;
  const resolved = resolveCharacterReferences(text).replace(/\s+/g, ' ');
  return !FORBIDDEN.some((pattern) => pattern.test(resolved));
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';
const encoder = new TextEncoder();

/**
 * SVG copied from an HTML page often lacks `xmlns`. Inline in HTML it works, but as a standalone
 * file the browser parses XML and draws nothing. The missing declarations are added to the root.
 */
export function withSvgNamespaces(bytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const text = decodeText(bytes);
  const root = text === null ? null : /<svg\b[^>]*>/i.exec(text);
  if (text === null || !root) return bytes;

  const missing = [
    /\sxmlns\s*=/.test(root[0]) ? '' : ` xmlns="${SVG_NAMESPACE}"`,
    /\sxlink:/.test(text) && !/\sxmlns:xlink\s*=/.test(root[0]) ? ` xmlns:xlink="${XLINK_NAMESPACE}"` : '',
  ].join('');
  if (!missing) return bytes;

  const insertAt = root.index + '<svg'.length;
  return encoder.encode(text.slice(0, insertAt) + missing + text.slice(insertAt));
}
