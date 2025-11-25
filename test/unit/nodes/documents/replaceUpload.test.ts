/**
 * Unit tests for document replaceUpload operation
 *
 * Tests cover:
 * - T6: matchBy = 'none', 'displayName', 'customFilename'
 * - T7: matchBy = 'metadata' and deleteAllMatches
 * - T8: Metadata preservation and merge strategies
 * - T9: Error handling and edge cases
 */

import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { replaceUpload } from '../../../../nodes/GeminiFileSearchDocuments/operations/document/replaceUpload';
import * as apiClient from '../../../../utils/apiClient';
import * as validators from '../../../../utils/validators';
import { DocumentState } from '../../../../utils/types';

// Mock dependencies
jest.mock('../../../../utils/apiClient');
jest.mock('../../../../utils/validators');

describe('Document ReplaceUpload Operation', () => {
  let mockExecuteFunctions: Partial<IExecuteFunctions>;
  let mockGetNodeParameter: jest.Mock;
  let mockAssertBinaryData: jest.Mock;
  let mockGetBinaryDataBuffer: jest.Mock;

  // Helper to create parameter mock that returns values in sequence
  const setupParameters = (params: Record<string, any>) => {
    mockGetNodeParameter.mockImplementation((name: string, _index: number, defaultValue?: any) => {
      if (name in params) {
        return params[name];
      }
      return defaultValue;
    });
  };

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

  // ========================================================================================
  // T6: matchBy = 'none', 'displayName', 'customFilename' Tests
  // ========================================================================================

  describe('T6: matchBy modes - none, displayName, customFilename', () => {
    describe('matchBy = none (upload only)', () => {
      it('should upload file without searching or deleting any documents', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'new-document.pdf',
          matchBy: 'none',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: true,
          customMetadata: {},
          chunkingOptions: {},
        });

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

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        // Should NOT call list documents or delete
        expect(apiClient.geminiApiRequestAllItems).not.toHaveBeenCalled();
        expect(apiClient.geminiApiRequest).not.toHaveBeenCalled();

        // Should upload the file
        expect(apiClient.geminiResumableUpload).toHaveBeenCalledWith(
          'fileSearchStores/test-store',
          fileBuffer,
          'application/pdf',
          { displayName: 'new-document.pdf' },
        );

        // Result should have no deletedDocuments info
        expect(result.upload).toEqual(mockCompletedDoc);
        expect(result.deletedDocuments).toBeUndefined();
        expect(result.metadata).toBeUndefined();
      });

      it('should not wait for completion when waitForCompletion is false', async () => {
        const fileBuffer = Buffer.from('test content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'test.pdf',
          matchBy: 'none',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockOperation = { name: 'operations/test-op', done: false };
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue(mockOperation);

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        expect(apiClient.pollOperation).not.toHaveBeenCalled();
        expect(result.upload).toEqual(mockOperation);
      });
    });

    describe('matchBy = displayName', () => {
      it('should delete document matching displayName before upload', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'report.pdf',
          matchBy: 'displayName',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: true,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/old-doc',
            displayName: 'report.pdf',
            state: DocumentState.STATE_ACTIVE,
          },
          {
            name: 'fileSearchStores/test-store/documents/other-doc',
            displayName: 'other.pdf',
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });
        (apiClient.pollOperation as jest.Mock).mockResolvedValue({ name: 'doc', done: true });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        // Should list documents
        expect(apiClient.geminiApiRequestAllItems).toHaveBeenCalledWith(
          'documents',
          'GET',
          '/fileSearchStores/test-store/documents',
        );

        // Should delete the matched document
        expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
          'DELETE',
          '/fileSearchStores/test-store/documents/old-doc',
          {},
          { force: true },
        );

        // Result should have deletion info
        expect(result.deletedDocuments).toBeDefined();
        expect(result.deletedDocuments?.matchBy).toBe('displayName');
        expect(result.deletedDocuments?.matchCriteria).toBe("displayName = 'report.pdf'");
        expect(result.deletedDocuments?.totalFound).toBe(1);
        expect(result.deletedDocuments?.totalDeleted).toBe(1);
        expect(result.deletedDocuments?.documents).toHaveLength(1);
        expect(result.deletedDocuments?.documents[0].deleted).toBe(true);
      });

      it('should handle case-insensitive displayName matching', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'REPORT.PDF', // uppercase
          matchBy: 'displayName',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/old-doc',
            displayName: 'report.pdf', // lowercase
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        expect(result.deletedDocuments?.totalFound).toBe(1);
        expect(apiClient.geminiApiRequest).toHaveBeenCalled();
      });

      it('should handle no match found for displayName', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'nonexistent.pdf',
          matchBy: 'displayName',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue([]);
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        // Should NOT call delete
        expect(apiClient.geminiApiRequest).not.toHaveBeenCalled();

        // Result should show no documents found
        expect(result.deletedDocuments?.totalFound).toBe(0);
        expect(result.deletedDocuments?.totalDeleted).toBe(0);
        expect(result.deletedDocuments?.documents).toHaveLength(0);
      });
    });

    describe('matchBy = customFilename', () => {
      it('should delete document matching filename metadata before upload', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'new-report.pdf',
          matchBy: 'customFilename',
          oldDocumentFilename: 'original-report.pdf',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/doc-1',
            displayName: 'uploaded.pdf',
            customMetadata: [{ key: 'filename', stringValue: 'original-report.pdf' }],
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
          'DELETE',
          '/fileSearchStores/test-store/documents/doc-1',
          {},
          { force: true },
        );

        expect(result.deletedDocuments?.matchBy).toBe('customFilename');
        expect(result.deletedDocuments?.matchCriteria).toBe("filename = 'original-report.pdf'");
        expect(result.deletedDocuments?.totalDeleted).toBe(1);
      });

      it('should throw error when oldDocumentFilename is missing', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'new-report.pdf',
          matchBy: 'customFilename',
          oldDocumentFilename: '', // Missing!
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        await expect(
          replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0),
        ).rejects.toThrow('Old Document Filename is required when matching by custom filename');
      });
    });
  });

  // ========================================================================================
  // T7: matchBy = 'metadata' and deleteAllMatches Tests
  // ========================================================================================

  describe('T7: matchBy = metadata and deleteAllMatches', () => {
    describe('matchBy = metadata', () => {
      it('should delete document matching metadata key-value before upload', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'new-document.pdf',
          matchBy: 'metadata',
          oldDocumentFilename: '',
          matchMetadataKey: 'documentId',
          matchMetadataValue: 'doc-123',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/match-doc',
            displayName: 'old-document.pdf',
            customMetadata: [{ key: 'documentId', stringValue: 'doc-123' }],
            state: DocumentState.STATE_ACTIVE,
          },
          {
            name: 'fileSearchStores/test-store/documents/other-doc',
            displayName: 'other.pdf',
            customMetadata: [{ key: 'documentId', stringValue: 'doc-456' }],
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        // Should only delete the matching document (first match)
        expect(apiClient.geminiApiRequest).toHaveBeenCalledTimes(1);
        expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
          'DELETE',
          '/fileSearchStores/test-store/documents/match-doc',
          {},
          { force: true },
        );

        expect(result.deletedDocuments?.matchBy).toBe('metadata');
        expect(result.deletedDocuments?.matchCriteria).toBe("metadata.documentId = 'doc-123'");
        expect(result.deletedDocuments?.totalFound).toBe(1);
        expect(result.deletedDocuments?.totalDeleted).toBe(1);
      });

      it('should match numeric metadata value', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'report-2024.pdf',
          matchBy: 'metadata',
          oldDocumentFilename: '',
          matchMetadataKey: 'year',
          matchMetadataValue: '2023',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/2023-doc',
            displayName: 'report-2023.pdf',
            customMetadata: [{ key: 'year', numericValue: 2023 }],
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        expect(result.deletedDocuments?.totalDeleted).toBe(1);
      });

      it('should throw error when matchMetadataKey is missing', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'new-document.pdf',
          matchBy: 'metadata',
          oldDocumentFilename: '',
          matchMetadataKey: '', // Missing!
          matchMetadataValue: 'value',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        await expect(
          replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0),
        ).rejects.toThrow('Metadata Key is required when matching by metadata');
      });

      it('should throw error when matchMetadataValue is missing', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'new-document.pdf',
          matchBy: 'metadata',
          oldDocumentFilename: '',
          matchMetadataKey: 'key',
          matchMetadataValue: '', // Missing!
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        await expect(
          replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0),
        ).rejects.toThrow('Metadata Value is required when matching by metadata');
      });
    });

    describe('deleteAllMatches = true', () => {
      it('should delete ALL matching documents when deleteAllMatches is true', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'consolidated-report.pdf',
          matchBy: 'metadata',
          oldDocumentFilename: '',
          matchMetadataKey: 'project',
          matchMetadataValue: 'alpha',
          deleteAllMatches: true, // Delete all matches!
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/alpha-1',
            displayName: 'alpha-report-1.pdf',
            customMetadata: [{ key: 'project', stringValue: 'alpha' }],
            state: DocumentState.STATE_ACTIVE,
          },
          {
            name: 'fileSearchStores/test-store/documents/alpha-2',
            displayName: 'alpha-report-2.pdf',
            customMetadata: [{ key: 'project', stringValue: 'alpha' }],
            state: DocumentState.STATE_ACTIVE,
          },
          {
            name: 'fileSearchStores/test-store/documents/alpha-3',
            displayName: 'alpha-report-3.pdf',
            customMetadata: [{ key: 'project', stringValue: 'alpha' }],
            state: DocumentState.STATE_ACTIVE,
          },
          {
            name: 'fileSearchStores/test-store/documents/beta-1',
            displayName: 'beta-report.pdf',
            customMetadata: [{ key: 'project', stringValue: 'beta' }],
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        // Should delete all 3 matching documents
        expect(apiClient.geminiApiRequest).toHaveBeenCalledTimes(3);
        expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
          'DELETE',
          '/fileSearchStores/test-store/documents/alpha-1',
          {},
          { force: true },
        );
        expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
          'DELETE',
          '/fileSearchStores/test-store/documents/alpha-2',
          {},
          { force: true },
        );
        expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
          'DELETE',
          '/fileSearchStores/test-store/documents/alpha-3',
          {},
          { force: true },
        );

        expect(result.deletedDocuments?.totalFound).toBe(3);
        expect(result.deletedDocuments?.totalDeleted).toBe(3);
        expect(result.deletedDocuments?.deleteAllMatches).toBe(true);
        expect(result.deletedDocuments?.documents).toHaveLength(3);
      });

      it('should only delete first match when deleteAllMatches is false with metadata match', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'report.pdf',
          matchBy: 'metadata',
          oldDocumentFilename: '',
          matchMetadataKey: 'project',
          matchMetadataValue: 'alpha',
          deleteAllMatches: false, // Only delete first match
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/alpha-1',
            customMetadata: [{ key: 'project', stringValue: 'alpha' }],
            state: DocumentState.STATE_ACTIVE,
          },
          {
            name: 'fileSearchStores/test-store/documents/alpha-2',
            customMetadata: [{ key: 'project', stringValue: 'alpha' }],
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        // Should only delete first match
        expect(apiClient.geminiApiRequest).toHaveBeenCalledTimes(1);
        expect(result.deletedDocuments?.totalFound).toBe(2); // Found 2 matches
        expect(result.deletedDocuments?.totalDeleted).toBe(1); // But only deleted 1
        expect(result.deletedDocuments?.deleteAllMatches).toBe(false);
      });

      it('should only affect metadata matching mode for deleteAllMatches', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'common-name.pdf',
          matchBy: 'displayName', // Not metadata
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: true, // This should be ignored for displayName
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/doc-1',
            displayName: 'common-name.pdf',
            state: DocumentState.STATE_ACTIVE,
          },
          {
            name: 'fileSearchStores/test-store/documents/doc-2',
            displayName: 'COMMON-NAME.PDF', // Same name, different case
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        // For displayName matching, deleteAllMatches is ignored - only first match is deleted
        expect(apiClient.geminiApiRequest).toHaveBeenCalledTimes(1);
        expect(result.deletedDocuments?.totalDeleted).toBe(1);
      });
    });
  });

  // ========================================================================================
  // T8: Metadata Preservation and Merge Strategies Tests
  // ========================================================================================

  describe('T8: Metadata preservation and merge strategies', () => {
    describe('preserveMetadata = true', () => {
      it('should preserve metadata from first matched document with preferNew strategy', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'new-report.pdf',
          matchBy: 'displayName',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: true,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {
            metadataValues: [
              { key: 'version', valueType: 'number', value: '2' },
              { key: 'status', valueType: 'string', value: 'updated' },
            ],
          },
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/old-doc',
            displayName: 'new-report.pdf',
            customMetadata: [
              { key: 'author', stringValue: 'Alice Smith' },
              { key: 'department', stringValue: 'Engineering' },
              { key: 'version', numericValue: 1 },
            ],
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        // Verify metadata was merged
        const uploadCall = (apiClient.geminiResumableUpload as jest.Mock).mock.calls[0];
        const metadata = uploadCall[3];

        expect(metadata.customMetadata).toBeDefined();
        // Should have: author (old), department (old), version (new), status (new)
        expect(metadata.customMetadata).toHaveLength(4);

        // preferNew: version should be 2 (new value)
        const versionMeta = metadata.customMetadata.find((m: any) => m.key === 'version');
        expect(versionMeta.numericValue).toBe(2);

        // Old keys should be preserved
        const authorMeta = metadata.customMetadata.find((m: any) => m.key === 'author');
        expect(authorMeta.stringValue).toBe('Alice Smith');

        // Result should have metadata info
        expect(result.metadata).toBeDefined();
        expect(result.metadata?.preserved).toBe(true);
        expect(result.metadata?.strategy).toBe('preferNew');
        expect(result.metadata?.oldMetadataCount).toBe(3);
        expect(result.metadata?.newMetadataCount).toBe(2);
        expect(result.metadata?.finalMetadataCount).toBe(4);
      });

      it('should use preferOld strategy when specified', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'report.pdf',
          matchBy: 'displayName',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: true,
          metadataMergeStrategy: 'preferOld',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {
            metadataValues: [{ key: 'version', valueType: 'number', value: '2' }],
          },
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/old-doc',
            displayName: 'report.pdf',
            customMetadata: [{ key: 'version', numericValue: 1 }],
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        const uploadCall = (apiClient.geminiResumableUpload as jest.Mock).mock.calls[0];
        const metadata = uploadCall[3];

        // preferOld: version should be 1 (old value)
        const versionMeta = metadata.customMetadata.find((m: any) => m.key === 'version');
        expect(versionMeta.numericValue).toBe(1);
      });

      it('should use replaceEntirely strategy when specified', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'report.pdf',
          matchBy: 'displayName',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: true,
          metadataMergeStrategy: 'replaceEntirely',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {
            metadataValues: [{ key: 'newKey', valueType: 'string', value: 'newValue' }],
          },
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/old-doc',
            displayName: 'report.pdf',
            customMetadata: [{ key: 'oldKey', stringValue: 'oldValue' }],
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        const uploadCall = (apiClient.geminiResumableUpload as jest.Mock).mock.calls[0];
        const metadata = uploadCall[3];

        // replaceEntirely: should only have old metadata
        expect(metadata.customMetadata).toHaveLength(1);
        expect(metadata.customMetadata[0].key).toBe('oldKey');
        expect(metadata.customMetadata[0].stringValue).toBe('oldValue');
      });

      it('should throw error when merged metadata exceeds 20 items', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'report.pdf',
          matchBy: 'displayName',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: true,
          metadataMergeStrategy: 'mergeAll',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {
            metadataValues: Array(15)
              .fill(null)
              .map((_, i) => ({
                key: `newKey${i}`,
                valueType: 'string',
                value: `newValue${i}`,
              })),
          },
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/old-doc',
            displayName: 'report.pdf',
            customMetadata: Array(10)
              .fill(null)
              .map((_, i) => ({
                key: `oldKey${i}`,
                stringValue: `oldValue${i}`,
              })),
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);

        await expect(
          replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0),
        ).rejects.toThrow('Merged metadata exceeds maximum of 20 items');
      });
    });

    describe('preserveMetadata = false', () => {
      it('should not include metadata info in result when preserveMetadata is false', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'report.pdf',
          matchBy: 'displayName',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/old-doc',
            displayName: 'report.pdf',
            customMetadata: [{ key: 'old', stringValue: 'value' }],
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        expect(result.metadata).toBeUndefined();
      });
    });
  });

  // ========================================================================================
  // T9: Error Handling and Edge Cases Tests
  // ========================================================================================

  describe('T9: Error handling and edge cases', () => {
    describe('Validation errors', () => {
      it('should validate store name', async () => {
        const fileBuffer = Buffer.from('test content');
        setupParameters({
          storeName: '',
          binaryPropertyName: 'data',
          displayName: 'test.pdf',
          matchBy: 'none',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        (validators.validateStoreName as jest.Mock).mockImplementation(() => {
          throw new NodeOperationError(
            mockExecuteFunctions.getNode!() as any,
            'Store name is required',
          );
        });

        await expect(
          replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0),
        ).rejects.toThrow('Store name is required');
      });

      it('should validate display name', async () => {
        const fileBuffer = Buffer.from('test content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: '',
          matchBy: 'none',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        (validators.validateDisplayName as jest.Mock).mockImplementation(() => {
          throw new NodeOperationError(
            mockExecuteFunctions.getNode!() as any,
            'Display name is required',
          );
        });

        await expect(
          replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0),
        ).rejects.toThrow('Display name is required');
      });
    });

    describe('API errors', () => {
      it('should handle upload failure', async () => {
        const fileBuffer = Buffer.from('test content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'test.pdf',
          matchBy: 'none',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        (apiClient.geminiResumableUpload as jest.Mock).mockRejectedValue(
          new Error('Upload failed'),
        );

        await expect(
          replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0),
        ).rejects.toThrow('Upload failed');
      });

      it('should handle poll operation timeout', async () => {
        const fileBuffer = Buffer.from('test content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'test.pdf',
          matchBy: 'none',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: true,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });
        (apiClient.pollOperation as jest.Mock).mockRejectedValue(new Error('Poll timeout'));

        await expect(
          replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0),
        ).rejects.toThrow('Poll timeout');
      });

      it('should handle document list fetch failure', async () => {
        const fileBuffer = Buffer.from('test content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'test.pdf',
          matchBy: 'displayName',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockRejectedValue(
          new Error('List fetch failed'),
        );

        await expect(
          replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0),
        ).rejects.toThrow('List fetch failed');
      });

      it('should continue deleting other documents if one delete fails', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'report.pdf',
          matchBy: 'metadata',
          oldDocumentFilename: '',
          matchMetadataKey: 'project',
          matchMetadataValue: 'alpha',
          deleteAllMatches: true,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/alpha-1',
            displayName: 'alpha-1.pdf',
            customMetadata: [{ key: 'project', stringValue: 'alpha' }],
            state: DocumentState.STATE_ACTIVE,
          },
          {
            name: 'fileSearchStores/test-store/documents/alpha-2',
            displayName: 'alpha-2.pdf',
            customMetadata: [{ key: 'project', stringValue: 'alpha' }],
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock)
          .mockRejectedValueOnce(new Error('Delete failed')) // First delete fails
          .mockResolvedValueOnce({}); // Second delete succeeds
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        // Should have tried to delete both
        expect(apiClient.geminiApiRequest).toHaveBeenCalledTimes(2);

        // Result should show partial success
        expect(result.deletedDocuments?.totalFound).toBe(2);
        expect(result.deletedDocuments?.totalDeleted).toBe(1); // Only 1 succeeded
        expect(result.deletedDocuments?.documents).toHaveLength(2);

        // Check individual results
        const failedDoc = result.deletedDocuments?.documents.find(
          (d) => d.name === 'fileSearchStores/test-store/documents/alpha-1',
        );
        expect(failedDoc?.deleted).toBe(false);
        expect(failedDoc?.error).toBe('Delete failed');

        const successDoc = result.deletedDocuments?.documents.find(
          (d) => d.name === 'fileSearchStores/test-store/documents/alpha-2',
        );
        expect(successDoc?.deleted).toBe(true);
      });
    });

    describe('Edge cases', () => {
      it('should handle documents without displayName', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'test.pdf',
          matchBy: 'displayName',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        // Documents without displayName
        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/doc-1',
            state: DocumentState.STATE_ACTIVE,
            // No displayName
          },
          {
            name: 'fileSearchStores/test-store/documents/doc-2',
            displayName: undefined,
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        expect(result.deletedDocuments?.totalFound).toBe(0);
        expect(apiClient.geminiApiRequest).not.toHaveBeenCalled();
      });

      it('should handle empty document list', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'test.pdf',
          matchBy: 'displayName',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue([]);
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        const result = await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        expect(result.deletedDocuments?.totalFound).toBe(0);
        expect(result.deletedDocuments?.totalDeleted).toBe(0);
        expect(apiClient.geminiApiRequest).not.toHaveBeenCalled();
      });

      it('should not include force parameter when forceDelete is false', async () => {
        const fileBuffer = Buffer.from('new file content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'report.pdf',
          matchBy: 'displayName',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: false, // forceDelete is false
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'application/pdf' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);

        const mockDocuments = [
          {
            name: 'fileSearchStores/test-store/documents/old-doc',
            displayName: 'report.pdf',
            state: DocumentState.STATE_ACTIVE,
          },
        ];

        (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
        (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

        // force should NOT be in query string
        expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
          'DELETE',
          '/fileSearchStores/test-store/documents/old-doc',
          {},
          {}, // Empty query string
        );
      });
    });

    describe('Custom metadata handling', () => {
      it('should handle string metadata', async () => {
        const fileBuffer = Buffer.from('test content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'test.pdf',
          matchBy: 'none',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {
            metadataValues: [
              { key: 'author', valueType: 'string', value: 'John Doe' },
              { key: 'category', valueType: 'string', value: 'Research' },
            ],
          },
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

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
        const fileBuffer = Buffer.from('test content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'test.pdf',
          matchBy: 'none',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {
            metadataValues: [{ key: 'year', valueType: 'number', value: '2023' }],
          },
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

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
        const fileBuffer = Buffer.from('test content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'test.pdf',
          matchBy: 'none',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {
            metadataValues: [
              { key: 'tags', valueType: 'stringList', values: 'ai, ml, deep learning' },
            ],
          },
          chunkingOptions: {},
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

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

    describe('Chunking options', () => {
      it('should include chunking config when options provided', async () => {
        const fileBuffer = Buffer.from('test content');
        setupParameters({
          storeName: 'fileSearchStores/test-store',
          binaryPropertyName: 'data',
          displayName: 'test.pdf',
          matchBy: 'none',
          oldDocumentFilename: '',
          matchMetadataKey: '',
          matchMetadataValue: '',
          deleteAllMatches: false,
          preserveMetadata: false,
          metadataMergeStrategy: 'preferNew',
          forceDelete: true,
          waitForCompletion: false,
          customMetadata: {},
          chunkingOptions: { maxTokensPerChunk: 250, maxOverlapTokens: 30 },
        });

        mockAssertBinaryData.mockReturnValue({ mimeType: 'text/plain' });
        mockGetBinaryDataBuffer.mockResolvedValue(fileBuffer);
        (apiClient.geminiResumableUpload as jest.Mock).mockResolvedValue({ name: 'op' });

        await replaceUpload.call(mockExecuteFunctions as IExecuteFunctions, 0);

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
  });
});
