import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';
import { validateMetadataFilter } from '../../../../utils/validators';

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
          uri?: string;
          title?: string;
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
  const storeNamesParam = this.getNodeParameter('storeNames', index) as string;
  const metadataFilter = this.getNodeParameter('metadataFilter', index, '') as string;

  const storeNames = storeNamesParam.split(',').map((s) => s.trim());

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
  return geminiApiRequest.call(
    this,
    'POST',
    `/models/${model}:generateContent`,
    body,
  ) as Promise<QueryResponse>;
}
