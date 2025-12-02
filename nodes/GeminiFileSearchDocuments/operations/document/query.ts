import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest, geminiApiRequestAllItems } from '../../../../utils/apiClient';
import { validateMetadataFilter } from '../../../../utils/validators';
import { Document } from '../../../../utils/types';

/**
 * Full Gemini generateContent response structure for File Search queries
 * Includes grounding metadata with citations and source chunks
 */
interface QueryResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
      role?: string;
    };
    finishReason?: string;
    /** Grounding metadata containing citations and sources */
    groundingMetadata?: {
      /** Search queries used for grounding */
      webSearchQueries?: string[];
      /** Retrieved chunks with source information */
      groundingChunks?: Array<{
        retrievedContext?: {
          /** Document title (displayName) */
          title?: string;
          /** Text snippet from the document chunk */
          text?: string;
          /** File Search Store name containing the document */
          fileSearchStore?: string;
          /** Document metadata (added when includeSourceMetadata is enabled) */
          documentMetadata?: Document;
        };
        web?: {
          uri?: string;
          title?: string;
        };
      }>;
      /** Maps response text segments to source chunks */
      groundingSupports?: Array<{
        segment?: {
          startIndex?: number;
          endIndex?: number;
          text?: string;
        };
        groundingChunkIndices?: number[];
        confidenceScores?: number[];
      }>;
      /** Search entry point for rendering search widget */
      searchEntryPoint?: {
        renderedContent?: string;
      };
      /** Retrieval metadata for file search */
      retrievalMetadata?: {
        googleSearchDynamicRetrievalScore?: number;
      };
    };
    /** Citation metadata (alternative format) */
    citationMetadata?: {
      citationSources?: Array<{
        startIndex?: number;
        endIndex?: number;
        uri?: string;
        license?: string;
      }>;
    };
    index?: number;
    safetyRatings?: Array<{
      category?: string;
      probability?: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings?: Array<{
      category?: string;
      probability?: string;
    }>;
  };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  modelVersion?: string;
  // Allow any additional fields the API might return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Queries documents in File Search Stores using Gemini's RAG capabilities
 *
 * Performs semantic search across one or more stores using the File Search tool.
 * Supports optional metadata filtering to narrow results.
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to Gemini API response with generated content and citations
 * @throws {NodeOperationError} When metadata filter has invalid syntax
 * @throws {NodeApiError} When API request fails or model not found
 *
 * @example
 * ```typescript
 * // Query documents with metadata filter
 * const response = await query.call(this, 0);
 * // Parameters:
 * // - model: 'gemini-1.5-flash'
 * // - query: 'What are the API authentication methods?'
 * // - storeNames: 'fileSearchStores/docs-store, fileSearchStores/api-store'
 * // - metadataFilter: 'category="api" AND version>1.0'
 *
 * const answer = response.candidates?.[0]?.content?.parts?.[0]?.text;
 * console.log('Answer:', answer);
 * ```
 */
export async function query(this: IExecuteFunctions, index: number): Promise<QueryResponse> {
  const model = this.getNodeParameter('model', index) as string;
  const systemPrompt = this.getNodeParameter('systemPrompt', index, '') as string;
  const queryText = this.getNodeParameter('query', index) as string;
  const storeNamesParam = this.getNodeParameter('storeNames', index) as string | string[];
  const metadataFilter = this.getNodeParameter('metadataFilter', index, '') as string;
  const includeSourceMetadata = this.getNodeParameter(
    'includeSourceMetadata',
    index,
    false,
  ) as boolean;

  // Handle both array (from multiOptions) and string (from expression) inputs
  const storeNames = Array.isArray(storeNamesParam)
    ? storeNamesParam
    : storeNamesParam.split(',').map((s) => s.trim());

  if (metadataFilter) {
    validateMetadataFilter.call(this, metadataFilter);
  }

  // Build contents array with system prompt if provided
  const contents: IDataObject[] = [];

  if (systemPrompt && systemPrompt.trim() !== '') {
    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I will follow these instructions.' }],
    });
  }

  contents.push({
    parts: [{ text: queryText }],
  });

  const body: IDataObject = {
    contents,
    tools: [
      {
        fileSearch: {
          fileSearchStoreNames: storeNames,
          ...(metadataFilter && { metadataFilter }),
        },
      },
    ],
  };

  // API client returns 'any', but we know the endpoint returns a QueryResponse
  const response = (await geminiApiRequest.call(
    this,
    'POST',
    `/models/${model}:generateContent`,
    body,
  )) as QueryResponse;

  // Fetch document metadata for grounding chunks if enabled
  if (includeSourceMetadata) {
    await enrichGroundingChunksWithMetadata.call(this, response);
  }

  return response;
}

/**
 * Enriches grounding chunks with full document metadata
 *
 * Since the grounding response only provides fileSearchStore and title (displayName),
 * we need to list documents in each store and match by title to get full metadata.
 *
 * @param this - n8n execution context
 * @param response - The query response to enrich
 */
async function enrichGroundingChunksWithMetadata(
  this: IExecuteFunctions,
  response: QueryResponse,
): Promise<void> {
  const candidates = response.candidates;
  if (!candidates?.length) return;

  for (const candidate of candidates) {
    const groundingChunks = candidate.groundingMetadata?.groundingChunks;
    if (!groundingChunks?.length) continue;

    // Collect unique store + title combinations to look up
    const storeDocumentsToFetch = new Map<string, Set<string>>();
    const chunkIndicesByStoreTitle = new Map<string, number[]>();

    for (let i = 0; i < groundingChunks.length; i++) {
      const chunk = groundingChunks[i];
      const storeName = chunk.retrievedContext?.fileSearchStore;
      const title = chunk.retrievedContext?.title;

      if (!storeName || !title) continue;

      // Track which stores we need to list
      if (!storeDocumentsToFetch.has(storeName)) {
        storeDocumentsToFetch.set(storeName, new Set());
      }
      storeDocumentsToFetch.get(storeName)!.add(title);

      // Track chunk indices by store+title for later assignment
      const key = `${storeName}|||${title}`;
      if (!chunkIndicesByStoreTitle.has(key)) {
        chunkIndicesByStoreTitle.set(key, []);
      }
      chunkIndicesByStoreTitle.get(key)!.push(i);
    }

    // Fetch documents from each store and build metadata cache
    const metadataByStoreTitle = new Map<string, Document>();

    for (const [storeName, titlesToFind] of storeDocumentsToFetch.entries()) {
      try {
        // List all documents in the store
        const documents = (await geminiApiRequestAllItems.call(
          this,
          'documents',
          'GET',
          `/${storeName}/documents`,
        )) as Document[];

        // Match documents by displayName (title)
        for (const doc of documents) {
          if (doc.displayName && titlesToFind.has(doc.displayName)) {
            const key = `${storeName}|||${doc.displayName}`;
            metadataByStoreTitle.set(key, doc);
          }
        }
      } catch {
        // Store may not be accessible, skip silently
        continue;
      }
    }

    // Add metadata to grounding chunks
    for (const [key, indices] of chunkIndicesByStoreTitle.entries()) {
      const metadata = metadataByStoreTitle.get(key);
      if (metadata) {
        for (const idx of indices) {
          if (groundingChunks[idx].retrievedContext) {
            groundingChunks[idx].retrievedContext.documentMetadata = metadata;
          }
        }
      }
    }
  }
}
