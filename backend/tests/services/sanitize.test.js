const { sanitizeText, sanitizeFields } = require('../../src/utils/sanitize');

describe('utils/sanitize (input hardening)', () => {
  it('strips <script> tags and their content', () => {
    expect(sanitizeText('hi <script>alert(1)</script> there')).toBe('hi  there');
  });
  it('strips inline event handlers', () => {
    expect(sanitizeText('<img src=x onerror=alert(1)> ok')).toBe('<img src=x> ok');
    expect(sanitizeText('<a onclick="steal()">x</a>')).toBe('<a>x</a>');
  });
  it('neutralizes javascript: URIs', () => {
    expect(sanitizeText('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
  });
  it('removes style/iframe/object elements', () => {
    expect(sanitizeText('a<iframe src=evil></iframe>b')).toBe('ab');
    expect(sanitizeText('a<style>x{}</style>b')).toBe('ab');
  });
  it('leaves normal text untouched', () => {
    expect(sanitizeText('A normal sentence with <3 and 2 > 1.')).toBe('A normal sentence with <3 and 2 > 1.');
  });
  it('passes through non-strings', () => {
    expect(sanitizeText(null)).toBeNull();
    expect(sanitizeText(42)).toBe(42);
  });
  it('sanitizeFields mutates only named string fields', () => {
    const o = { title: '<script>x</script>T', n: 5 };
    sanitizeFields(o, ['title', 'n']);
    expect(o.title).toBe('T');
    expect(o.n).toBe(5);
  });
});
