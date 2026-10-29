import { describe, expect, it } from 'vitest';
import { signWebhook, verifyWebhookSignature, WEBHOOK_TOLERANCE_SECONDS } from './webhook';

const secret = 'whsec_test';
const rawBody = '{"tags":["cms:site"]}';
const now = 1_767_225_600;

describe('webhook signature', () => {
  it('verifies what it signs (round trip)', () => {
    const signature = signWebhook(secret, now, rawBody);
    expect(signature).toMatch(/^v1=[0-9a-f]{64}$/);
    expect(verifyWebhookSignature({ secret, rawBody, timestamp: String(now), signature, now })).toEqual({ ok: true });
  });

  it('rejects another secret, a changed body or a re-serialized body', () => {
    const signature = signWebhook(secret, now, rawBody);
    const check = (input: { secret?: string; rawBody?: string }) =>
      verifyWebhookSignature({ secret, rawBody, timestamp: String(now), signature, now, ...input });
    expect(check({ secret: 'whsec_other' })).toEqual({ ok: false, reason: 'mismatch' });
    expect(check({ rawBody: '{"tags":["cms:page:list"]}' })).toEqual({ ok: false, reason: 'mismatch' });
    expect(check({ rawBody: JSON.stringify(JSON.parse(rawBody), null, 2) })).toEqual({ ok: false, reason: 'mismatch' });
  });

  it('rejects timestamps outside the tolerance (replay)', () => {
    const old = now - WEBHOOK_TOLERANCE_SECONDS - 1;
    const signature = signWebhook(secret, old, rawBody);
    expect(verifyWebhookSignature({ secret, rawBody, timestamp: String(old), signature, now })).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('rejects missing headers', () => {
    expect(verifyWebhookSignature({ secret, rawBody, timestamp: null, signature: null, now })).toEqual({
      ok: false,
      reason: 'missing',
    });
  });
});
