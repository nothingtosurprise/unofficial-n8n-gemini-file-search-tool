/**
 * Unit tests for document list operation
 */

import { IExecuteFunctions } from 'n8n-workflow';
import {
  list,
  ListResultWithDuplicates,
} from '../../../../nodes/GeminiFileSearchDocuments/operations/document/list';
import * as apiClient from '../../../../utils/apiClient';
import * as validators from '../../../../utils/validators';
import { Document, DocumentState } from '../../../../utils/types';

jest.mock('../../../../utils/apiClient');
jest.mock('../../../../utils/validators');

describe('Document List Operation', () => {
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

    (validators.validateStoreName as jest.Mock) = jest.fn();
  });

  describe('Paginated List', () => {
    it('should list documents with limit', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store') // storeName
        .mockReturnValueOnce(false) // returnAll
        .mockReturnValueOnce('') // metadataFilter
        .mockReturnValueOnce(false) // deleteDuplicates
        .mockReturnValueOnce(10); // limit

      const mockDocuments = [
        { name: 'documents/doc-1', displayName: 'Doc 1' },
        { name: 'documents/doc-2', displayName: 'Doc 2' },
      ];
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({
        documents: mockDocuments,
      });

      // Act
      const result = await list.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(validators.validateStoreName).toHaveBeenCalledWith('fileSearchStores/test-store');
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'GET',
        '/fileSearchStores/test-store/documents',
        {},
        { pageSize: 10 },
      );
      expect(result).toEqual(mockDocuments);
    });

    it('should return empty array when no documents', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce(false) // returnAll
        .mockReturnValueOnce('') // metadataFilter
        .mockReturnValueOnce(false) // deleteDuplicates
        .mockReturnValueOnce(10); // limit

      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});

      // Act
      const result = await list.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('Return All', () => {
    it('should fetch all documents when returnAll is true', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce(true) // returnAll
        .mockReturnValueOnce('') // metadataFilter
        .mockReturnValueOnce(false); // deleteDuplicates

      const mockDocuments = [
        { name: 'documents/doc-1' },
        { name: 'documents/doc-2' },
        { name: 'documents/doc-3' },
      ];
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);

      // Act
      const result = await list.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiApiRequestAllItems).toHaveBeenCalledWith(
        'documents',
        'GET',
        '/fileSearchStores/test-store/documents',
      );
      expect(result).toEqual(mockDocuments);
    });

    it('should return all document fields including customMetadata', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce(true) // returnAll
        .mockReturnValueOnce('') // metadataFilter
        .mockReturnValueOnce(false); // deleteDuplicates

      // The API now returns all fields including customMetadata in the list response
      const mockDocuments = [
        {
          name: 'fileSearchStores/test-store/documents/doc-1',
          displayName: 'Doc 1',
          customMetadata: [{ key: 'author', stringValue: 'Test Author' }],
          createTime: '2025-01-01T10:00:00Z',
          updateTime: '2025-01-01T10:00:00Z',
          state: DocumentState.STATE_ACTIVE,
          sizeBytes: '1000',
          mimeType: 'application/pdf',
        },
      ];
      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);

      // Act
      const result = await list.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiApiRequestAllItems).toHaveBeenCalled();
      const resultArray = result as Document[];
      expect(resultArray[0].name).toBe('fileSearchStores/test-store/documents/doc-1');
      expect(resultArray[0].displayName).toBe('Doc 1');
      expect(resultArray[0].customMetadata).toBeDefined();
      expect(resultArray[0].customMetadata![0].key).toBe('author');
      expect(resultArray[0].createTime).toBe('2025-01-01T10:00:00Z');
      expect(resultArray[0].updateTime).toBe('2025-01-01T10:00:00Z');
      expect(resultArray[0].state).toBe(DocumentState.STATE_ACTIVE);
      expect(resultArray[0].sizeBytes).toBe('1000');
      expect(resultArray[0].mimeType).toBe('application/pdf');
    });
  });

  describe('Delete Duplicates', () => {
    const createMockDocument = (
      name: string,
      displayName: string,
      createTime: string,
    ): Document => ({
      name,
      displayName,
      createTime,
      updateTime: createTime,
      state: DocumentState.STATE_ACTIVE,
      sizeBytes: '1000',
      mimeType: 'application/pdf',
    });

    it('should delete duplicate documents keeping the most recent', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store') // storeName
        .mockReturnValueOnce(false) // returnAll
        .mockReturnValueOnce('') // metadataFilter
        .mockReturnValueOnce(true) // deleteDuplicates
        .mockReturnValueOnce(true) // forceDeleteDuplicates
        .mockReturnValueOnce(10); // limit

      const mockDocuments = [
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-1',
          'report.pdf',
          '2025-01-01T10:00:00Z',
        ),
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-2',
          'report.pdf',
          '2025-01-02T10:00:00Z', // More recent
        ),
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-3',
          'other.pdf',
          '2025-01-01T10:00:00Z',
        ),
      ];

      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({}); // DELETE response

      // Act
      const result = (await list.call(
        mockExecuteFunctions as IExecuteFunctions,
        0,
      )) as ListResultWithDuplicates;

      // Assert
      expect(result.documents).toHaveLength(2);
      expect(result.documents.find((d) => d.displayName === 'report.pdf')?.name).toBe(
        'fileSearchStores/test-store/documents/doc-2', // Most recent kept
      );
      expect(result.duplicatesDeleted).toBeDefined();
      expect(result.duplicatesDeleted!.totalGroups).toBe(1);
      expect(result.duplicatesDeleted!.totalDeleted).toBe(1);
      expect(result.duplicatesDeleted!.details[0].displayName).toBe('report.pdf');
      expect(result.duplicatesDeleted!.details[0].keptDocument.name).toBe(
        'fileSearchStores/test-store/documents/doc-2',
      );
      expect(result.duplicatesDeleted!.details[0].deletedDocuments[0].name).toBe(
        'fileSearchStores/test-store/documents/doc-1',
      );
    });

    it('should handle multiple duplicate groups', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce(true) // returnAll
        .mockReturnValueOnce('')
        .mockReturnValueOnce(true) // deleteDuplicates
        .mockReturnValueOnce(true); // forceDeleteDuplicates

      const mockDocuments = [
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-1',
          'report.pdf',
          '2025-01-01T10:00:00Z',
        ),
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-2',
          'report.pdf',
          '2025-01-03T10:00:00Z', // Most recent for report.pdf
        ),
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-3',
          'report.pdf',
          '2025-01-02T10:00:00Z',
        ),
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-4',
          'data.csv',
          '2025-01-01T10:00:00Z',
        ),
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-5',
          'data.csv',
          '2025-01-02T10:00:00Z', // Most recent for data.csv
        ),
      ];

      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});

      // Act
      const result = (await list.call(
        mockExecuteFunctions as IExecuteFunctions,
        0,
      )) as ListResultWithDuplicates;

      // Assert
      expect(result.documents).toHaveLength(2);
      expect(result.duplicatesDeleted!.totalGroups).toBe(2);
      expect(result.duplicatesDeleted!.totalDeleted).toBe(3); // 2 from report.pdf + 1 from data.csv
    });

    it('should not delete anything when there are no duplicates', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce('')
        .mockReturnValueOnce(true) // deleteDuplicates
        .mockReturnValueOnce(true); // forceDeleteDuplicates

      const mockDocuments = [
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-1',
          'file1.pdf',
          '2025-01-01T10:00:00Z',
        ),
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-2',
          'file2.pdf',
          '2025-01-02T10:00:00Z',
        ),
      ];

      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);

      // Act
      const result = (await list.call(
        mockExecuteFunctions as IExecuteFunctions,
        0,
      )) as ListResultWithDuplicates;

      // Assert
      expect(result.documents).toHaveLength(2);
      expect(result.duplicatesDeleted!.totalGroups).toBe(0);
      expect(result.duplicatesDeleted!.totalDeleted).toBe(0);
      expect(apiClient.geminiApiRequest).not.toHaveBeenCalled();
    });

    it('should handle delete failures gracefully', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce('')
        .mockReturnValueOnce(true) // deleteDuplicates
        .mockReturnValueOnce(true); // forceDeleteDuplicates

      const mockDocuments = [
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-1',
          'report.pdf',
          '2025-01-01T10:00:00Z',
        ),
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-2',
          'report.pdf',
          '2025-01-02T10:00:00Z',
        ),
      ];

      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
      (apiClient.geminiApiRequest as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      // Act
      const result = (await list.call(
        mockExecuteFunctions as IExecuteFunctions,
        0,
      )) as ListResultWithDuplicates;

      // Assert
      expect(result.duplicatesDeleted!.totalDeleted).toBe(0);
      expect(result.duplicatesDeleted!.totalFailed).toBe(1);
      expect(result.duplicatesDeleted!.details[0].deletedDocuments[0].deleted).toBe(false);
      expect(result.duplicatesDeleted!.details[0].deletedDocuments[0].error).toBe('Delete failed');
    });

    it('should pass force parameter when forceDeleteDuplicates is true', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce('')
        .mockReturnValueOnce(true) // deleteDuplicates
        .mockReturnValueOnce(true); // forceDeleteDuplicates

      const mockDocuments = [
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-1',
          'report.pdf',
          '2025-01-01T10:00:00Z',
        ),
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-2',
          'report.pdf',
          '2025-01-02T10:00:00Z',
        ),
      ];

      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});

      // Act
      await list.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'DELETE',
        '/fileSearchStores/test-store/documents/doc-1',
        {},
        { force: true },
      );
    });

    it('should not pass force parameter when forceDeleteDuplicates is false', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce('')
        .mockReturnValueOnce(true) // deleteDuplicates
        .mockReturnValueOnce(false); // forceDeleteDuplicates = false

      const mockDocuments = [
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-1',
          'report.pdf',
          '2025-01-01T10:00:00Z',
        ),
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-2',
          'report.pdf',
          '2025-01-02T10:00:00Z',
        ),
      ];

      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});

      // Act
      await list.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'DELETE',
        '/fileSearchStores/test-store/documents/doc-1',
        {},
        {},
      );
    });

    it('should apply limit after deleting duplicates when returnAll is false', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce(false) // returnAll = false
        .mockReturnValueOnce('')
        .mockReturnValueOnce(true) // deleteDuplicates
        .mockReturnValueOnce(true) // forceDeleteDuplicates
        .mockReturnValueOnce(1); // limit = 1

      const mockDocuments = [
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-1',
          'file1.pdf',
          '2025-01-01T10:00:00Z',
        ),
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-2',
          'file2.pdf',
          '2025-01-02T10:00:00Z',
        ),
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-3',
          'file3.pdf',
          '2025-01-03T10:00:00Z',
        ),
      ];

      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);

      // Act
      const result = (await list.call(
        mockExecuteFunctions as IExecuteFunctions,
        0,
      )) as ListResultWithDuplicates;

      // Assert - should only return 1 document due to limit
      expect(result.documents).toHaveLength(1);
    });

    it('should use resource name as fallback when displayName is missing', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce('')
        .mockReturnValueOnce(true) // deleteDuplicates
        .mockReturnValueOnce(true); // forceDeleteDuplicates

      const docWithoutDisplayName: Document = {
        name: 'fileSearchStores/test-store/documents/doc-1',
        createTime: '2025-01-01T10:00:00Z',
        updateTime: '2025-01-01T10:00:00Z',
        state: DocumentState.STATE_ACTIVE,
        sizeBytes: '1000',
        mimeType: 'application/pdf',
        // No displayName
      };

      const docWithSameName: Document = {
        name: 'fileSearchStores/test-store/documents/doc-1', // Same name used as fallback
        createTime: '2025-01-02T10:00:00Z',
        updateTime: '2025-01-02T10:00:00Z',
        state: DocumentState.STATE_ACTIVE,
        sizeBytes: '1000',
        mimeType: 'application/pdf',
      };

      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue([
        docWithoutDisplayName,
        docWithSameName,
      ]);
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});

      // Act
      const result = (await list.call(
        mockExecuteFunctions as IExecuteFunctions,
        0,
      )) as ListResultWithDuplicates;

      // Assert - should treat them as duplicates since they share the same name fallback
      expect(result.duplicatesDeleted!.totalDeleted).toBe(1);
    });

    it('should return documents array when deleteDuplicates is false', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test-store')
        .mockReturnValueOnce(true) // returnAll
        .mockReturnValueOnce('')
        .mockReturnValueOnce(false); // deleteDuplicates = false

      const mockDocuments = [
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-1',
          'report.pdf',
          '2025-01-01T10:00:00Z',
        ),
        createMockDocument(
          'fileSearchStores/test-store/documents/doc-2',
          'report.pdf',
          '2025-01-02T10:00:00Z',
        ),
      ];

      (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockDocuments);

      // Act
      const result = await list.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert - should return plain array, not ListResultWithDuplicates
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect((result as ListResultWithDuplicates).duplicatesDeleted).toBeUndefined();
    });
  });
});
