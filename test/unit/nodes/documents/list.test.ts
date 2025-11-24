/**
 * Unit tests for document list operation
 */

import { IExecuteFunctions } from 'n8n-workflow';
import { list } from '../../../../nodes/GeminiFileSearchDocuments/operations/document/list';
import * as apiClient from '../../../../utils/apiClient';
import * as validators from '../../../../utils/validators';

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
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(10);

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
        .mockReturnValueOnce(true); // returnAll

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
  });
});
