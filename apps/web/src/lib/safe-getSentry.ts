export async function getSentry() {
  try {
    if (typeof process !== 'undefined' && (process as any).versions?.node) {
      const s: any = await import('@sentry/nextjs');
      return s && 'startSpan' in s ? s : undefined;
    }
  } catch {
    // no-op
  }
  return undefined;
}


