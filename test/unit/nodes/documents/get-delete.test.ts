/**
 * Unit tests for document get and delete operations
 */

import { IExecuteFunctions } from 'n8n-workflow';
import { get } from '../../../../nodes/GeminiFileSearchDocuments/operations/document/get';
import { deleteDocument } from '../../../../nodes/GeminiFileSearchDocuments/operations/document/delete';
import * as apiClient from '../../../../utils/apiClient';

jest.mock('../../../../utils/apiClient');

describe('Document Get Operation', () => {
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
  });

  it('should get document by name', async () => {
    // Arrange
    const documentName = 'fileSearchStores/test-store/documents/doc-123';
    mockGetNodeParameter.mockReturnValueOnce(documentName);

    const mockDocument = {
      name: documentName,
      displayName: 'Test Document',
      state: 'STATE_ACTIVE',
      mimeType: 'application/pdf',
    };
    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(mockDocument);

    // Act
    const result = await get.call(mockExecuteFunctions as IExecuteFunctions, 0);

    // Assert
    expect(apiClient.geminiApiRequest).toHaveBeenCalledWith('GET', `/${documentName}`);
    expect(result).toEqual(mockDocument);
  });

  it('should handle get document error', async () => {
    // Arrange
    mockGetNodeParameter.mockReturnValueOnce('fileSearchStores/test/documents/invalid');
    (apiClient.geminiApiRequest as jest.Mock).mockRejectedValue(new Error('Document not found'));

    // Act & Assert
    await expect(get.call(mockExecuteFunctions as IExecuteFunctions, 0)).rejects.toThrow(
      'Document not found',
    );
  });
});

describe('Document Delete Operation', () => {
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
  });

  describe('Basic Delete', () => {
    it('should delete document without force', async () => {
      // Arrange
      const documentName = 'fileSearchStores/test-store/documents/doc-123';
      mockGetNodeParameter
        .mockReturnValueOnce(documentName) // documentName
        .mockReturnValueOnce(false); // force

      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await deleteDocument.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith('DELETE', `/${documentName}`, {}, {});
      expect(result).toEqual({ success: true });
    });

    it('should delete document with force flag', async () => {
      // Arrange
      const documentName = 'fileSearchStores/test-store/documents/doc-123';
      mockGetNodeParameter.mockReturnValueOnce(documentName).mockReturnValueOnce(true); // force = true

      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await deleteDocument.call(mockExecuteFunctions as IExecuteFunctions, 0);

      // Assert
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'DELETE',
        `/${documentName}`,
        {},
        { force: true },
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle delete error', async () => {
      // Arrange
      mockGetNodeParameter
        .mockReturnValueOnce('fileSearchStores/test/documents/doc-123')
        .mockReturnValueOnce(false);

      (apiClient.geminiApiRequest as jest.Mock).mockRejectedValue(new Error('Document has chunks'));

      // Act & Assert
      await expect(
        deleteDocument.call(mockExecuteFunctions as IExecuteFunctions, 0),
      ).rejects.toThrow('Document has chunks');
    });
  });
});
