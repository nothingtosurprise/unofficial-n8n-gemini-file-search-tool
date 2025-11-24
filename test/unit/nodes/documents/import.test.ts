/**
 * Unit tests for document import operation
 */

import { IExecuteFunctions } from 'n8n-workflow';
import { importFile } from '../../../../nodes/GeminiFileSearchDocuments/operations/document/import';
import * as apiClient from '../../../../utils/apiClient';
import * as validators from '../../../../utils/validators';

jest.mock('../../../../utils/apiClient');
jest.mock('../../../../utils/validators');

describe('Document Import Operation', () => {
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
      getCredentials: jest.fn().mockResolvedValue({ apiKey: 'test-key' }),
    };

    (validators.validateStoreName as jest.Mock) = jest.fn();
    (validators.validateDisplayName as jest.Mock) = jest.fn();
    (validators.validateCustomMetadata as jest.Mock) = jest.fn();
  });

  describe('Basic Import', () => {
    it('should import file with minimal parameters', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store') // storeName
        .mockReturnValueOnce('files/abc-123') // fileName
        .mockReturnValueOnce('') // displayName
        .mockReturnValueOnce(false) // waitForCompletion
        .mockReturnValueOnce({}) // customMetadata
        .mockReturnValueOnce({}); // chunkingOptions

      const mockOperation = { name: 'operations/import-op', done: false };
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(mockOperation);

      // Act
      const result = await importFile.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(validators.validateStoreName).toHaveBeenCalledWith('fileSearchStores/test-store');
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'POST',
        '/fileSearchStores/test-store:importFile',
        { fileName: 'files/abc-123' },
      );
      expect(result).toEqual(mockOperation);
    });

    it('should import file with display name', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('files/abc-123')
        .mockReturnValueOnce('Imported Document')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({}) // customMetadata
        .mockReturnValueOnce({}); // chunkingOptions

      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await importFile.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(validators.validateDisplayName).toHaveBeenCalledWith('Imported Document');
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'POST',
        '/fileSearchStores/test-store:importFile',
        expect.objectContaining({
          fileName: 'files/abc-123',
          displayName: 'Imported Document',
        }),
      );
    });

    it('should wait for completion when requested', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('files/abc-123')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(true) // waitForCompletion
        .mockReturnValueOnce({}) // customMetadata
        .mockReturnValueOnce({}); // chunkingOptions

      const mockOperation = { name: 'operations/import-op', done: false };
      const mockCompleted = { name: 'documents/imported-doc', state: 'STATE_ACTIVE' };
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(mockOperation);
      (apiClient.pollOperation as jest.Mock).mockResolvedValue(mockCompleted);

      // Act
      const result = await importFile.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.pollOperation).toHaveBeenCalledWith('operations/import-op');
      expect(result).toEqual(mockCompleted);
    });
  });

  describe('Metadata Handling', () => {
    it('should include custom metadata in import', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('files/abc-123')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({
          metadataValues: [
            { key: 'source', valueType: 'string', value: 'Files API' },
            { key: 'imported_year', valueType: 'number', value: '2024' },
          ],
        })
        .mockReturnValueOnce({}); // chunkingOptions

      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await importFile.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'POST',
        '/fileSearchStores/test-store:importFile',
        expect.objectContaining({
          customMetadata: [
            { key: 'source', stringValue: 'Files API' },
            { key: 'imported_year', numericValue: 2024 },
          ],
        }),
      );
    });

    it('should include chunking config in import', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('files/abc-123')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({}) // customMetadata
        .mockReturnValueOnce({ maxTokensPerChunk: 400, maxOverlapTokens: 40 });

      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await importFile.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'POST',
        '/fileSearchStores/test-store:importFile',
        expect.objectContaining({
          chunkingConfig: {
            whiteSpaceConfig: {
              maxTokensPerChunk: 400,
              maxOverlapTokens: 40,
            },
          },
        }),
      );
    });

    it('should include string list metadata in import', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('files/abc-123')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({
          metadataValues: [
            { key: 'tags', valueType: 'stringList', values: 'important, archived, reviewed' },
          ],
        })
        .mockReturnValueOnce({}); // chunkingOptions

      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await importFile.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'POST',
        '/fileSearchStores/test-store:importFile',
        expect.objectContaining({
          customMetadata: [
            {
              key: 'tags',
              stringListValue: {
                values: ['important', 'archived', 'reviewed'],
              },
            },
          ],
        }),
      );
    });

    it('should handle mixed metadata types including string list', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('files/abc-123')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({
          metadataValues: [
            { key: 'source', valueType: 'string', value: 'Files API' },
            { key: 'year', valueType: 'number', value: '2024' },
            { key: 'categories', valueType: 'stringList', values: 'finance, legal' },
          ],
        })
        .mockReturnValueOnce({}); // chunkingOptions

      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await importFile.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'POST',
        '/fileSearchStores/test-store:importFile',
        expect.objectContaining({
          customMetadata: [
            { key: 'source', stringValue: 'Files API' },
            { key: 'year', numericValue: 2024 },
            {
              key: 'categories',
              stringListValue: {
                values: ['finance', 'legal'],
              },
            },
          ],
        }),
      );
    });
  });
});
