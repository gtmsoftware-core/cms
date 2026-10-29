import { describe, expect, it } from 'vitest';
import { isStaticSvg, withSvgNamespaces } from './svg';

const svg = (body: string, attributes = '') =>
  new TextEncoder().encode(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"${attributes}>${body}</svg>`);

describe('isStaticSvg', () => {
  it('accepts static drawings, internal references and embedded raster images', () => {
    expect(isStaticSvg(svg('<path d="M0 0h10v10z" fill="#3ce11e"/>'))).toBe(true);
    expect(isStaticSvg(svg('<defs><linearGradient id="g"/></defs><rect fill="url(#g)"/><use href="#g"/>'))).toBe(true);
    expect(isStaticSvg(svg('<image xlink:href="data:image/png;base64,iVBORw0KGgo="/>'))).toBe(true);
    expect(isStaticSvg(svg('<style>.a{fill:#000}</style><text>Café &amp; cia</text>'))).toBe(true);
    expect(isStaticSvg(new TextEncoder().encode('<?xml version="1.0"?><!-- Illustrator --><svg></svg>'))).toBe(true);
  });

  it('rejects scripts, event handlers and active elements, with or without a namespace prefix', () => {
    for (const body of [
      '<script>alert(1)</script>',
      '<svg:script>alert(1)</svg:script>',
      '<foreignObject><iframe src="https://x.test"/></foreignObject>',
      '<rect onclick="alert(1)"/>',
      '<rect\nonmouseover = "alert(1)"/>',
      '<a href="javascript:alert(1)"><text>x</text></a>',
      '<a href="&#106;avascript:alert(1)">x</a>',
      '<a href="&#x0000006A;avascript:alert(1)">x</a>',
      '<set attributeName="href" to="javascript:alert(1)"/>',
    ]) {
      expect(isStaticSvg(svg(body)), body).toBe(false);
    }
    expect(isStaticSvg(svg('', ' onload="alert(1)"'))).toBe(false);
  });

  it('rejects external references and entity declarations', () => {
    for (const body of [
      '<image href="https://tracker.test/pixel.png"/>',
      '<use xlink:href="other.svg#icon"/>',
      '<image href="data:text/html;base64,PHNjcmlwdD4="/>',
      '<rect style="fill:url(https://x.test/a)"/>',
      '<style>@import url(https://x.test/a.css);</style>',
    ]) {
      expect(isStaticSvg(svg(body)), body).toBe(false);
    }
    const xxe = '<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg>&x;</svg>';
    expect(isStaticSvg(new TextEncoder().encode(xxe))).toBe(false);
  });

  it('rejects files that are not UTF-8 text or have no svg root', () => {
    expect(isStaticSvg(Uint8Array.from([0x3c, 0x73, 0x76, 0x67, 0x3e, 0xff, 0xfe]))).toBe(false);
    expect(isStaticSvg(new TextEncoder().encode('<html><svg></svg></html>'))).toBe(false);
    expect(isStaticSvg(new TextEncoder().encode('<svg><text>&#99999999999999999999;</text></svg>'))).toBe(true);
  });
});

describe('withSvgNamespaces', () => {
  const run = (text: string) => new TextDecoder().decode(withSvgNamespaces(new TextEncoder().encode(text)));

  it('adds the namespaces an SVG copied from HTML lacks', () => {
    expect(run('<svg width="44"><rect/></svg>')).toBe('<svg xmlns="http://www.w3.org/2000/svg" width="44"><rect/></svg>');
    expect(run('<?xml version="1.0"?><svg><use xlink:href="#a"/></svg>')).toBe(
      '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="#a"/></svg>',
    );
  });

  it('keeps files that already declare them unchanged', () => {
    const text = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>';
    expect(run(text)).toBe(text);
  });
});
