"use strict";

const { ContentClient } = require("dc-delivery-sdk-js");
const amplienceConfig = require("../../config/amplience");

const DEFAULT_LOCALE = "en-US,*";

/**
 * Create a Content Client for the given hub and optional VSE (staging environment).
 * Used for preview/visualization when vse is set.
 * @param {{ hub?: string, vse?: string, locale?: string }} options
 * @returns {ContentClient}
 */
function createContentClient(options = {}) {
  const hub = options.hub ?? amplienceConfig.default.hub;
  const locale = options.locale ?? DEFAULT_LOCALE;
  const config = {
    hubName: hub,
    locale,
  };
  if (options.vse) {
    config.stagingEnvironment = options.vse;
  }
  return new ContentClient(config);
}

/**
 * Fetch content by id or key. Supports batch and optional VSE for preview.
 * @param {Array<{id: string} | {key: string}>} args - List of { id } or { key }
 * @param {{ locale?: string, vse?: string, hub?: string }} params
 * @returns {Promise<any[]>} - Array of content items (errors returned as items with _meta undefined or error)
 */
async function fetchContent(args, params = {}) {
  if (!args || args.length === 0) return [];
  const client = createContentClient({
    hub: params.hub,
    vse: params.vse,
    locale: params.locale ?? DEFAULT_LOCALE,
  });
  const requests = args.map((arg) => ("id" in arg ? { id: arg.id } : { key: arg.key }));
  const { responses } = await client.getContentItems(requests, {
    locale: params.locale ?? DEFAULT_LOCALE,
    depth: params.depth ?? "all",
    format: params.format ?? "inlined",
  });
  return (responses || []).map((r) => ("content" in r ? r.content : r.error || null));
}

/**
 * Fetch a single content item by id.
 * @param {string} id - Delivery id
 * @param {{ locale?: string, vse?: string, hub?: string }} params
 * @returns {Promise<any|null>}
 */
async function getContentById(id, params = {}) {
  const client = createContentClient({
    hub: params.hub,
    vse: params.vse,
    locale: params.locale ?? DEFAULT_LOCALE,
  });
  try {
    const item = await client.getContentItemById(id);
    return item?.toJSON ? item.toJSON() : item;
  } catch {
    return null;
  }
}

/**
 * Fetch a single content item by delivery key.
 * @param {string} key - Delivery key (e.g. 'main-nav', 'home/slot/top')
 * @param {{ locale?: string, vse?: string, hub?: string }} params
 * @returns {Promise<any|null>}
 */
async function getContentByKey(key, params = {}) {
  const client = createContentClient({
    hub: params.hub,
    vse: params.vse,
    locale: params.locale ?? DEFAULT_LOCALE,
  });
  try {
    const item = await client.getContentItemByKey(key);
    return item?.toJSON ? item.toJSON() : item;
  } catch {
    return null;
  }
}

module.exports = {
  createContentClient,
  fetchContent,
  getContentById,
  getContentByKey,
  getAmplienceConfig: () => amplienceConfig,
};
