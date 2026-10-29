import { after } from 'next/server';
import { getContainer } from '@/composition/container';

/** Short wait so a burst of saves (ten in a row) leaves as one webhook per site. */
const BATCH_WINDOW_MS = 2000;

/**
 * Schedules the outbox dispatch after the response is sent. The change is already committed with its
 * event, so a failure here only delays delivery: the cron sweep and the retries pick it up.
 */
export function scheduleWebhookDispatch(): void {
  after(async () => {
    await new Promise((resolve) => setTimeout(resolve, BATCH_WINDOW_MS));
    try {
      await (await getContainer()).dispatchDue();
    } catch (error) {
      console.error('Webhook dispatch failed:', error instanceof Error ? error.name : 'unknown error');
    }
  });
}
