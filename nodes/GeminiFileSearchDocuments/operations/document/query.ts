import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';
import { validateMetadataFilter } from '../../../../utils/validators';

interface QueryResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
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
