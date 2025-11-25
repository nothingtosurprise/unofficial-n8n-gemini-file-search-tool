/**
 * Unit tests for document replaceUpload operation
 */

import { IExecuteFunctions } from 'n8n-workflow';
import { replaceUpload } from '../../../../nodes/GeminiFileSearchDocuments/operations/document/replaceUpload';
import * as apiClient from '../../../../utils/apiClient';
import * as validators from '../../../../utils/validators';

// Mock dependencies
jest.mock('../../../../utils/apiClient');
jest.mock('../../../../utils/validators');

describe('Document ReplaceUpload Operation', () => {
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

  describe('Basic Replace Upload - Document Found', () => {
    it('should upload new file and delete old document when found', async () => {
      // Arrange
      const fileBuffer = Buffer.from('new file content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store') // storeName
        .mockReturnValueOnce('data') // binaryPropertyName
        .mockReturnValueOnce('new-document.pdf') // displayName
        .mockReturnValueOnce(true) // waitForCompletion
        .mockReturnValueOnce('old-document.pdf') // oldDocumentFilename
        .mockReturnValueOnce(true) // forceDelete
        .mockReturnValueOnce({}) // customMetadata
        .mockReturnValueOnce({}); // chunkingOptions

      mockAssertBinaryData.mockReturnValue({
        mimeType: 'application/pdf',
        fileName: 'new-document.pdf',
      });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

      const mockOperation = { name: 'operations/test-op', done: false };
      const mockCompletedDoc = {
        name: 'fileSearchStores/test-store/documents/new-doc-123',
        displayName: 'new-document.pdf',
        state: 'STATE_ACTIVE',
      };

      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue(mockOperation);
      (apiClient.pollOperation as jest.Mock).mockResolvedValue(mockCompletedDoc);

      // Mock list of documents including the old one to delete
      const mockDocuments = [
        {
          name: 'fileSearchStores/test-store/documents/old-doc-456',
          displayName: 'old-document.pdf',
          state: 'STATE_ACTIVE',
        },
        {
          name: 'fileSearchStores/test-store/documents/other-doc',
          displayName: 'other-document.pdf',
          state: 'STATE_ACTIVE',
        },
      ];
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});

      // Act
      const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(validators.validateStoreName).toHaveBeenCalledWith('fileSearchStores/test-store');
      expect(validators.validateDisplayName).toHaveBeenCalledWith('new-document.pdf');
      expect(validators.validateFileSize).toHaveBeenCalledWith(fileBuffer.length);

      // Verify upload was called
      expect(apiClient.geminiResumableUpload).toHaveBeenCalledWith(
        'fileSearchStores/test-store',
        fileBuffer,
        'application/pdf',
        { displayName: 'new-document.pdf' },
      );
      expect(apiClient.pollOperation).toHaveBeenCalledWith('operations/test-op');

      // Verify document list was fetched
      expect(apiClient.geminiApiRequestAllItems).toHaveBeenCalledWith(
        'documents',
        'GET',
        '/fileSearchStores/test-store/documents',
      );

      // Verify old document was deleted
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'DELETE',
        '/fileSearchStores/test-store/documents/old-doc-456',
        {},
        { force: true },
      );

      // Verify result structure
      expect(result.upload).toEqual(mockCompletedDoc);
      expect(result.deletedDocument.found).toBe(true);
      expect(result.deletedDocument.documentName).toBe(
        'fileSearchStores/test-store/documents/old-doc-456',
      );
      expect(result.deletedDocument.displayName).toBe('old-document.pdf');
      expect(result.deletedDocument.message).toContain('Successfully deleted');
    });

    it('should handle case-insensitive filename matching', async () => {
      // Arrange
      const fileBuffer = Buffer.from('new file content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce('OLD-DOCUMENT.PDF') // uppercase
        .mockReturnValueOnce(true)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op', done: false });
      (apiClient.pollOperation as jest.Mock).mockResolvedValue({ name: 'doc', done: true });

      // Document with lowercase name
      const mockDocuments = [
        {
          name: 'fileSearchStores/test-store/documents/old-doc',
          displayName: 'old-document.pdf',
          state: 'STATE_ACTIVE',
        },
      ];
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});

      // Act
      const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(result.deletedDocument.found).toBe(true);
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'DELETE',
        '/fileSearchStores/test-store/documents/old-doc',
        {},
        { force: true },
      );
    });
  });

  describe('Basic Replace Upload - Document Not Found', () => {
    it('should upload new file and return not found when old document does not exist', async () => {
      // Arrange
      const fileBuffer = Buffer.from('new file content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('new-document.pdf')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce('nonexistent-document.pdf')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

      const mockCompletedDoc = {
        name: 'fileSearchStores/test-store/documents/new-doc-123',
        state: 'STATE_ACTIVE',
      };
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({
        name: 'op',
        done: false,
      });
      (apiClient.pollOperation as jest.Mock).mockResolvedValue(mockCompletedDoc);

      // Empty document list (or documents with different names)
      const mockDocuments = [
        {
          name: 'fileSearchStores/test-store/documents/other-doc',
          displayName: 'other-document.pdf',
          state: 'STATE_ACTIVE',
        },
      ];
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);

      // Act
      const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(result.upload).toEqual(mockCompletedDoc);
      expect(result.deletedDocument.found).toBe(false);
      expect(result.deletedDocument.documentName).toBeUndefined();
      expect(result.deletedDocument.message).toContain('No document found');

      // Verify delete was NOT called
      expect(apiClient.geminiApiRequest).not.toHaveBeenCalled();
    });

    it('should handle empty document list', async () => {
      // Arrange
      const fileBuffer = Buffer.from('new file content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce('old-document.pdf')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({
        name: 'op',
        done: false,
      });
      (apiClient.pollOperation as jest.Mock).mockResolvedValue({ name: 'doc', done: true });
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(result.deletedDocument.found).toBe(false);
      expect(apiClient.geminiApiRequest).not.toHaveBeenCalled();
    });
  });

  describe('Wait for Completion', () => {
    it('should not wait for completion when waitForCompletion is false', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false) // waitForCompletion = false
        .mockReturnValueOnce('old-document.pdf')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

      const mockOperation = { name: 'operations/test-op', done: false };
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue(mockOperation);
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.pollOperation).not.toHaveBeenCalled();
      expect(result.upload).toEqual(mockOperation);
    });
  });

  describe('Force Delete Option', () => {
    it('should not include force parameter when forceDelete is false', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce('old-document.pdf')
        .mockReturnValueOnce(false) // forceDelete = false
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({
        name: 'op',
        done: false,
      });
      (apiClient.pollOperation as jest.Mock).mockResolvedValue({ name: 'doc', done: true });

      const mockDocuments = [
        {
          name: 'fileSearchStores/test-store/documents/old-doc',
          displayName: 'old-document.pdf',
          state: 'STATE_ACTIVE',
        },
      ];
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});

      // Act
      await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert - force should NOT be in the query string
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'DELETE',
        '/fileSearchStores/test-store/documents/old-doc',
        {},
        {}, // No force parameter
      );
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
        .mockReturnValueOnce('old-document.pdf')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce({
          metadataValues: [
            { key: 'author', valueType: 'string', value: 'John Doe' },
            { key: 'category', valueType: 'string', value: 'Research' },
          ],
        })
        .mockReturnValueOnce({});

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue([]);

      // Act
      await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

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
        .mockReturnValueOnce('old-document.pdf')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce({
          metadataValues: [{ key: 'year', valueType: 'number', value: '2023' }],
        })
        .mockReturnValueOnce({});

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue([]);

      // Act
      await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

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
        .mockReturnValueOnce('old-document.pdf')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce({
          metadataValues: [
            { key: 'tags', valueType: 'stringList', values: 'ai, ml, deep learning' },
          ],
        })
        .mockReturnValueOnce({});

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue([]);

      // Act
      await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

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
  });

  describe('Chunking Options', () => {
    it('should include chunking config with both options', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce('old-document.pdf')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({ maxTokensPerChunk: 250, maxOverlapTokens: 30 });

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue([]);

      // Act
      await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

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

  describe('Error Handling', () => {
    it('should handle upload failure', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce('old-document.pdf')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      // Act & Assert
      await expect(
        replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0),
      ).rejects.toThrow('Upload failed');

      // Verify delete was NOT attempted
      expect(apiClient.geminiApiRequest).not.toHaveBeenCalled();
    });

    it('should handle poll operation failure', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(true) // waitForCompletion
        .mockReturnValueOnce('old-document.pdf')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({
        name: 'op',
        done: false,
      });
      (apiClient.pollOperation as jest.Mock).mockRejectedValue(new Error('Poll timeout'));

      // Act & Assert
      await expect(
        replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0),
      ).rejects.toThrow('Poll timeout');

      // Verify delete was NOT attempted
      expect(apiClient.geminiApiRequest).not.toHaveBeenCalled();
    });

    it('should handle document list fetch failure', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce('old-document.pdf')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({
        name: 'op',
        done: false,
      });
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockRejectedValue(
        new Error('List fetch failed'),
      );

      // Act & Assert
      await expect(
        replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0),
      ).rejects.toThrow('List fetch failed');
    });

    it('should handle delete failure', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce('old-document.pdf')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

      const mockDocuments = [
        {
          name: 'fileSearchStores/test-store/documents/old-doc',
          displayName: 'old-document.pdf',
          state: 'STATE_ACTIVE',
        },
      ];
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
      (apiClient.geminiApiRequest as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      // Act & Assert
      await expect(
        replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0),
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('Documents Without DisplayName', () => {
    it('should not match documents without displayName', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce('data')
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce('old-document.pdf')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
      mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

      (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

      // Documents without displayName
      const mockDocuments = [
        {
          name: 'fileSearchStores/test-store/documents/doc-1',
          state: 'STATE_ACTIVE',
          // No displayName
        },
        {
          name: 'fileSearchStores/test-store/documents/doc-2',
          displayName: undefined,
          state: 'STATE_ACTIVE',
        },
      ];
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);

      // Act
      const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(result.deletedDocument.found).toBe(false);
      expect(apiClient.geminiApiRequest).not.toHaveBeenCalled();
    });
  });
});
