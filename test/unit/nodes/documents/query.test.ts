/**
 * Unit tests for document query operation
 */

import { IExecuteFunctions } from 'n8n-workflow';
import { query } from '../../../../nodes/GeminiFileSearchDocuments/operations/document/query';
import * as apiClient from '../../../../utils/apiClient';
import * as validators from '../../../../utils/validators';

jest.mock('../../../../utils/apiClient');
jest.mock('../../../../utils/validators');

describe('Document Query Operation', () => {
  let mockExecuteFunctions: Partial<IExecuteFunctions>;
  let mockGetNodeParameter: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetNodeParameter = jest.fn();
    mockExecuteFunctions = {
      getNodeParameter: mockGetNodeParameter,
      getNode: jest.fn().mockReturnValue({
        id: 'test-node',
        name: 'Test Node',
        type: 'n8n-nodes-base.geminiFileSearchDocuments',
        typeVersion: 1,
        position: [0, 0],
        parameters: {},
      }),
    };

    (validators.validateMetadataFilter as jest.Mock) = jest.fn();
  });

  describe('Basic Query', () => {
    it('should query store with Gemini 2.5 Flash', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('gemini-2.5-flash') // model
        .mockReturnValueOnce('') // systemPrompt
        .mockReturnValueOnce('What are the key findings?') // query
        .mockReturnValueOnce('fileSearchStores/store-1') // storeName
        .mockReturnValueOnce('') // metadataFilter
        .mockReturnValueOnce(false); // includeSourceMetadata

      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Based on the documents, the key findings are...' }],
            },
            groundingMetadata: {
              searchEntryPoint: {},
              groundingChunks: [{ documentName: 'documents/doc-1' }],
            },
          },
        ],
      };
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await query.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'POST',
        '/models/gemini-2.5-flash:generateContent',
        {
          contents: [
            {
              parts: [{ text: 'What are the key findings?' }],
            },
          ],
          tools: [
            {
              fileSearch: {
                fileSearchStoreNames: ['fileSearchStores/store-1'],
              },
            },
          ],
        },
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Metadata Filtering', () => {
    it('should include metadata filter in query', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('gemini-2.5-flash') // model
        .mockReturnValueOnce('') // systemPrompt
        .mockReturnValueOnce('Find documents') // query
        .mockReturnValueOnce('fileSearchStores/store-1') // storeName
        .mockReturnValueOnce('author="John Doe" AND year>=2023') // metadataFilter
        .mockReturnValueOnce(false); // includeSourceMetadata

      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({ candidates: [] });

      // Act
      await query.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(validators.validateMetadataFilter).toHaveBeenCalled();
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'POST',
        '/models/gemini-2.5-flash:generateContent',
        expect.objectContaining({
          tools: [
            {
              fileSearch: {
                fileSearchStoreNames: ['fileSearchStores/store-1'],
                metadataFilter: 'author="John Doe" AND year>=2023',
              },
            },
          ],
        }),
      );
    });

    it('should not include empty metadata filter', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('gemini-2.5-flash') // model
        .mockReturnValueOnce('') // systemPrompt
        .mockReturnValueOnce('Query') // query
        .mockReturnValueOnce('fileSearchStores/store-1') // storeName
        .mockReturnValueOnce('') // metadataFilter
        .mockReturnValueOnce(false); // includeSourceMetadata

      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({ candidates: [] });

      // Act
      await query.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(validators.validateMetadataFilter).not.toHaveBeenCalled();
      const call = (apiClient.geminiApiRequest as jest.Mock).mock.calls[0];
      expect(call[2].tools[0].fileSearch.metadataFilter).toBeUndefined();
    });
  });

  describe('Model Support', () => {
    it('should support Gemini 2.5 Pro', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('gemini-2.5-pro') // model
        .mockReturnValueOnce('') // systemPrompt
        .mockReturnValueOnce('Query') // query
        .mockReturnValueOnce('fileSearchStores/store-1') // storeName
        .mockReturnValueOnce('') // metadataFilter
        .mockReturnValueOnce(false); // includeSourceMetadata

      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({ candidates: [] });

      // Act
      await query.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'POST',
        '/models/gemini-2.5-pro:generateContent',
        expect.any(Object),
      );
    });

    it('should support Gemini 3 Pro Preview', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('gemini-3-pro-preview') // model
        .mockReturnValueOnce('') // systemPrompt
        .mockReturnValueOnce('Query') // query
        .mockReturnValueOnce('fileSearchStores/store-1') // storeName
        .mockReturnValueOnce('') // metadataFilter
        .mockReturnValueOnce(false); // includeSourceMetadata

      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({ candidates: [] });

      // Act
      await query.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'POST',
        '/models/gemini-3-pro-preview:generateContent',
        expect.any(Object),
      );
    });
  });

  describe('Response Handling', () => {
    it('should return response with grounding metadata', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('gemini-2.5-flash') // model
        .mockReturnValueOnce('') // systemPrompt
        .mockReturnValueOnce('Query') // query
        .mockReturnValueOnce('fileSearchStores/store-1') // storeName
        .mockReturnValueOnce('') // metadataFilter
        .mockReturnValueOnce(false); // includeSourceMetadata

      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Response text' }],
            },
            groundingMetadata: {
              groundingChunks: [
                {
                  documentName: 'documents/doc-1',
                  chunkName: 'chunks/chunk-1',
                },
              ],
            },
          },
        ],
      };
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await query.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(result).toEqual(mockResponse);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).candidates[0].groundingMetadata.groundingChunks).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('gemini-2.5-flash') // model
        .mockReturnValueOnce('') // systemPrompt
        .mockReturnValueOnce('Query') // query
        .mockReturnValueOnce('fileSearchStores/store-1') // storeName
        .mockReturnValueOnce('') // metadataFilter
        .mockReturnValueOnce(false); // includeSourceMetadata

      (apiClient.geminiApiRequest as jest.Mock).mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(query.call(mockExecuteFunctions as IExecuteFunctions, 0)).rejects.toThrow(
        'API Error',
      );
    });
  });
});
