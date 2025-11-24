/**
 * Unit tests for document upload operation
 */

import { IExecuteFunctions } from 'n8n-workflow';
import { upload } from '../../../../nodes/GeminiFileSearchDocuments/operations/document/upload';
import * as apiClient from '../../../../utils/apiClient';
import * as validators from '../../../../utils/validators';

// Mock dependencies
jest.mock('../../../../utils/apiClient');
jest.mock('../../../../utils/validators');

describe('Document Upload Operation', () => {
  let mockExecuteFunctions: Partial<IExecuteFunctions>;
  let mockGetNodeParameter: jest.Mock;
  let mockAssertBinaryData: jest.Mock;
  let mockGetBinaryDataBuffer: jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock functions
    mockGetNodeParameter = jest.fn();
    mockAssertBinaryData = jest.fn();
    mockGetBinaryDataBuffer = jest.fn();

    mockExecuteFunctions = {
      getNodeParameter: mockGetNodeParameter,
      helpers: {
        assertBinaryData: mockAssertBinaryData,
        getBinaryDataBuffer: mockGetBinaryDataBuffer,
      } as any,
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

    // Mock validators to pass by default
    (validators.validateStoreName as jest.Mock) = jest.fn();
    (validators.validateDisplayName as jest.Mock) = jest.fn();
    (validators.validateFileSize as jest.Mock) = jest.fn();
    (validators.validateCustomMetadata as jest.Mock) = jest.fn();
  });

  describe('Basic Upload', () => {
    it('should upload file with minimal parameters', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test file content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store') // storeName
        .mockReturnValueOnce('data') // binaryPropertyName
        .mockReturnValueOnce('') // displayName
        .mockReturnValueOnce(false) // waitForCompletion
        .mockReturnValueOnce({}) // customMetadata
        .mockReturnValueOnce({}); // chunkingOptions

      mockAssertBinaryData.mockReturnValue({
        mimeType: 'text/plain',
        fileName: 'test.txt',
      });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

      const mockOperation = { name: 'operations/test-op', done: false };
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue(mockOperation);

      // Act
      const result = await upload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(validators.validateStoreName).toHaveBeenCalledWith('fileSearchStores/test-store');
      expect(validators.validateFileSize).toHaveBeenCalledWith(fileBuffer.length);
      expect(apiClient.geminiResumableUpload).toHaveBeenCalledWith(
        'fileSearchStores/test-store',
        fileBuffer,
        'text/plain',
        {},
      );
      expect(result).toEqual(mockOperation);
    });

    it('should upload file with display name', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('My Document') // displayName
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({}) // customMetadata
        .mockReturnValueOnce({}); // chunkingOptions

      mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

      const mockOperation = { name: 'operations/test-op', done: false };
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue(mockOperation);

      // Act
      await upload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(validators.validateDisplayName).toHaveBeenCalledWith('My Document');
      expect(apiClient.geminiResumableUpload).toHaveBeenCalledWith(
        'fileSearchStores/test-store',
        fileBuffer,
        'application/pdf',
        { displayName: 'My Document' },
      );
    });

    it('should wait for completion when requested', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(true) // waitForCompletion = true
        .mockReturnValueOnce({}) // customMetadata
        .mockReturnValueOnce({}); // chunkingOptions

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

      const mockOperation = { name: 'operations/test-op', done: false };
      const mockCompletedDoc = { name: 'documents/test-doc', state: 'STATE_ACTIVE' };
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue(mockOperation);
      (apiClient.pollOperation as jest.Mock).mockResolvedValue(mockCompletedDoc);

      // Act
      const result = await upload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.pollOperation).toHaveBeenCalledWith('operations/test-op');
      expect(result).toEqual(mockCompletedDoc);
    });
  });

  describe('Custom Metadata', () => {
    it('should handle string metadata', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({
          // customMetadata
          metadataValues: [
            { key: 'author', valueType: 'string', value: 'John Doe' },
            { key: 'category', valueType: 'string', value: 'Research' },
          ],
        })
        .mockReturnValueOnce({}); // chunkingOptions

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await upload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiResumableUpload).toHaveBeenCalledWith(
        'fileSearchStores/test-store',
        fileBuffer,
        'text/plain',
        expect.objectContaining({
          customMetadata: [
            { key: 'author', stringValue: 'John Doe' },
            { key: 'category', stringValue: 'Research' },
          ],
        }),
      );
    });

    it('should handle numeric metadata', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({
          metadataValues: [{ key: 'year', valueType: 'number', value: '2023' }],
        })
        .mockReturnValueOnce({}); // chunkingOptions

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await upload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiResumableUpload).toHaveBeenCalledWith(
        'fileSearchStores/test-store',
        fileBuffer,
        'text/plain',
        expect.objectContaining({
          customMetadata: [{ key: 'year', numericValue: 2023 }],
        }),
      );
    });

    it('should handle string list metadata', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({
          metadataValues: [
            { key: 'tags', valueType: 'stringList', values: 'ai, ml, deep learning' },
          ],
        })
        .mockReturnValueOnce({}); // chunkingOptions

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await upload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiResumableUpload).toHaveBeenCalledWith(
        'fileSearchStores/test-store',
        fileBuffer,
        'text/plain',
        expect.objectContaining({
          customMetadata: [
            {
              key: 'tags',
              stringListValue: { values: ['ai', 'ml', 'deep learning'] },
            },
          ],
        }),
      );
    });

    it('should validate custom metadata', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({
          metadataValues: [{ key: 'author', valueType: 'string', value: 'John' }],
        })
        .mockReturnValueOnce({}); // chunkingOptions

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await upload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(validators.validateCustomMetadata).toHaveBeenCalled();
    });
  });

  describe('Chunking Options', () => {
    it('should include chunking config with maxTokensPerChunk', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({}) // customMetadata
        .mockReturnValueOnce({ maxTokensPerChunk: 300 }); // chunkingOptions

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await upload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiResumableUpload).toHaveBeenCalledWith(
        'fileSearchStores/test-store',
        fileBuffer,
        'text/plain',
        expect.objectContaining({
          chunkingConfig: {
            whiteSpaceConfig: {
              maxTokensPerChunk: 300,
            },
          },
        }),
      );
    });

    it('should include chunking config with both options', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({ maxTokensPerChunk: 250, maxOverlapTokens: 30 });

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await upload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiResumableUpload).toHaveBeenCalledWith(
        'fileSearchStores/test-store',
        fileBuffer,
        'text/plain',
        expect.objectContaining({
          chunkingConfig: {
            whiteSpaceConfig: {
              maxTokensPerChunk: 250,
              maxOverlapTokens: 30,
            },
          },
        }),
      );
    });
  });

  describe('Binary Data Handling', () => {
    it('should handle different mime types', async () => {
      // Arrange
      const fileBuffer = Buffer.from('PDF content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({}) // customMetadata
        .mockReturnValueOnce({}); // chunkingOptions

      mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await upload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiResumableUpload).toHaveBeenCalledWith(
        'fileSearchStores/test-store',
        fileBuffer,
        'application/pdf',
        expect.any(Object),
      );
    });

    it('should validate file size', async () => {
      // Arrange
      const fileBuffer = Buffer.from('large file content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({}) // customMetadata
        .mockReturnValueOnce({}); // chunkingOptions

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await upload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(validators.validateFileSize).toHaveBeenCalledWith(fileBuffer.length);
    });
  });

  describe('Error Handling', () => {
    it('should validate store name', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('invalid-store-name')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({}) // customMetadata
        .mockReturnValueOnce({}); // chunkingOptions

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

      // Act
      await upload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(validators.validateStoreName).toHaveBeenCalledWith('invalid-store-name');
    });

    it('should handle upload failure', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce({}) // customMetadata
        .mockReturnValueOnce({}); // chunkingOptions

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      // Act & Assert
      await expect(upload.call(mockExecuteFunctions as IExecuteFunctions, 0)).rejects.toThrow(
        'Upload failed',
      );
    });
  });
});
