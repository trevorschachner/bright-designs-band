import type { Instrumentation } from 'next';

export async function register() {
  // Nothing to initialise: the PostHog server client is created lazily by
  // reportError on first use.
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  // posthog-node is Node-only; keep it out of the edge bundle.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { reportError } = await import('./lib/observability/report-error');
  await reportError(err, {
    operation: 'onRequestError',
    source: 'onRequestError',
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
