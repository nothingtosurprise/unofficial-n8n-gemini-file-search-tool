/**
 * API Endpoint Constants for Testing
 */

export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export const ENDPOINTS = {
  stores: {
    create: `${GEMINI_API_BASE}/stores`,
    list: `${GEMINI_API_BASE}/stores`,
    get: (storeId: string) => `${GEMINI_API_BASE}/stores/${storeId}`,
    update: (storeId: string) => `${GEMINI_API_BASE}/stores/${storeId}`,
    delete: (storeId: string) => `${GEMINI_API_BASE}/stores/${storeId}`,
  },
  documents: {
    create: (storeId: string) => `${GEMINI_API_BASE}/stores/${storeId}/documents`,
    list: (storeId: string) => `${GEMINI_API_BASE}/stores/${storeId}/documents`,
    get: (storeId: string, documentId: string) =>
      `${GEMINI_API_BASE}/stores/${storeId}/documents/${documentId}`,
    update: (storeId: string, documentId: string) =>
      `${GEMINI_API_BASE}/stores/${storeId}/documents/${documentId}`,
    delete: (storeId: string, documentId: string) =>
      `${GEMINI_API_BASE}/stores/${storeId}/documents/${documentId}`,
    query: (storeId: string) => `${GEMINI_API_BASE}/stores/${storeId}/documents:query`,
  },
};
