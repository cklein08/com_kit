import { VisualizationView } from "./visualization-view";

/**
 * Amplience Content Studio visualization route.
 * Content types in Amplience should use URL:
 * {{APP_URL}}/visualization/{{hub.name}}/{{content.sys.id}}?vse={{vse.domain}}
 * e.g. http://localhost:3000/visualization/myhub/abc-123?vse=myhub.staging.bigcontent.io
 * Uses dynamic import so server-only Amplience client is not in the main Turbopack bundle.
 */
export default async function VisualizationPage({ params, searchParams }) {
  const { hubName, contentId } = await params;
  const resolvedSearchParams = typeof searchParams?.then === "function" ? await searchParams : searchParams || {};
  const vse = resolvedSearchParams.vse ?? null;
  const locale = resolvedSearchParams.locale ?? "en-US";

  const { getContentById } = await import("@/lib/amplience/client");
  const content = await getContentById(contentId, {
    vse: vse || undefined,
    hub: hubName || undefined,
    locale,
  });

  return (
    <VisualizationView
      content={content}
      hubName={hubName}
      contentId={contentId}
      vse={vse}
      locale={locale}
    />
  );
}
