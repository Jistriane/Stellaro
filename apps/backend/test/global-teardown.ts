import { setTimeout } from 'timers';
import { register } from 'prom-client';

/**
 * Jest global teardown for unit tests.
 * Ensures that any Prometheus registry, timers, or open handles are cleaned up.
 */
export default async function globalTeardown(): Promise<void> {
  try {
    // Clear Prometheus metrics registry to avoid open handles
    register.clear();
  } catch {}

  try {
    // Give event loop a tick to settle pending tasks
    await new Promise((resolve) => setTimeout(resolve, 0).unref?.() ?? resolve(undefined));
  } catch {}
}
