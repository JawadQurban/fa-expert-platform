import { describe, expect, it } from 'vitest';
import { linkify } from './linkify';

const TEAMS =
  'https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc%40thread.v2/0?context=%7b%22Tid%22%3a%22t%22%7d';

describe('linkify (BUG-054)', () => {
  it('turns the E-015 meeting link into a link and leaves the sentence’s full stop outside it', () => {
    const body = `تم تأكيد موعد مقابلتك. التفاصيل: 2026-11-02 - 10:00. الرابط: ${TEAMS}.`;
    expect(linkify(body)).toEqual([
      { kind: 'text', value: 'تم تأكيد موعد مقابلتك. التفاصيل: 2026-11-02 - 10:00. الرابط: ' },
      { kind: 'link', href: TEAMS, value: TEAMS },
      { kind: 'text', value: '.' },
    ]);
  });

  it('gives the text back unchanged when it carries no link', () => {
    expect(linkify('تنتهي اتفاقيتك خلال 90 يومًا.')).toEqual([
      { kind: 'text', value: 'تنتهي اتفاقيتك خلال 90 يومًا.' },
    ]);
  });

  it('never makes a link of anything but http(s), and never yields markup', () => {
    const body = 'javascript:alert(1) <img src=x onerror=alert(1)> data:text/html,x';
    const segments = linkify(body);
    expect(segments.every((segment) => segment.kind === 'text')).toBe(true);
    expect(segments.map((segment) => segment.value).join('')).toBe(body);
  });

  it('stops a link at a quote or an Arabic comma', () => {
    const segments = linkify('افتح «https://example.test/a»، ثم تابع');
    expect(segments.filter((segment) => segment.kind === 'link')).toEqual([
      { kind: 'link', href: 'https://example.test/a', value: 'https://example.test/a' },
    ]);
  });

  it('finds every link, in order', () => {
    const links = linkify('one https://a.test/1 and http://b.test/2').filter(
      (segment) => segment.kind === 'link'
    );
    expect(links.map((link) => link.value)).toEqual(['https://a.test/1', 'http://b.test/2']);
  });
});
