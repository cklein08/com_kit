"use strict";

const AUTH_URL = "https://auth.amplience.net/oauth/token";
const API_BASE = "https://api.amplience.net/v2/content";

/**
 * Get OAuth2 access token for Amplience Content Management API.
 * Requires AMPLIENCE_CLIENT_ID and AMPLIENCE_CLIENT_SECRET in env.
 * @returns {Promise<string|null>} Access token or null if credentials missing
 */
async function getToken() {
  const clientId = process.env.AMPLIENCE_CLIENT_ID;
  const clientSecret = process.env.AMPLIENCE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token || null;
}

/**
 * Fetch a content item by id using Amplience CMA.
 * @param {string} contentItemId
 * @returns {Promise<object|null>}
 */
async function getContentItem(contentItemId) {
  const token = await getToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/content-items/${contentItemId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Update a content item by id using Amplience CMA.
 * Fetches current item, merges bodyUpdate into body, then PATCHes.
 * @param {string} contentItemId - Content item ID (deliveryId or id)
 * @param {object} bodyUpdate - Fields to merge into the content body (title, productLineType, searchPhrase, category, skus)
 * @returns {Promise<object>} Updated content item or throws
 */
async function updateContentItem(contentItemId, bodyUpdate) {
  const token = await getToken();
  if (!token) {
    throw new Error(
      "Amplience CMA not configured. Set AMPLIENCE_CLIENT_ID and AMPLIENCE_CLIENT_SECRET."
    );
  }

  const current = await getContentItem(contentItemId);
  const mergedBody = current?.body
    ? { ...current.body, ...bodyUpdate }
    : bodyUpdate;

  const url = `${API_BASE}/content-items/${contentItemId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ body: mergedBody }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let errMsg = `Amplience CMA error: ${res.status}`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.message || errJson.error || errMsg;
    } catch {
      if (errText) errMsg += ` - ${errText.slice(0, 200)}`;
    }
    throw new Error(errMsg);
  }

  return res.json();
}

module.exports = { getToken, getContentItem, updateContentItem };
