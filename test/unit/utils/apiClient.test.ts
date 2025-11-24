/**
 * Unit Tests for API Client Utilities
 * Tests all API client functions with various scenarios
 */

import {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  NodeApiError,
  NodeOperationError,
} from 'n8n-workflow';
import {
  geminiApiRequest,
  geminiApiRequestAllItems,
  geminiResumableUpload,
  pollOperation,
} from '../../../utils/apiClient';

describe('apiClient', () => {
  describe('geminiApiRequest', () => {
    let mockContext: Partial<IExecuteFunctions>;

    beforeEach(() => {
      mockContext = {
        getCredentials: jest.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
        helpers: {
          request: jest.fn().mockResolvedValue({ success: true }),
        } as any,
        getNode: jest.fn().mockReturnValue({
          id: 'test-node-id',
          name: 'Test Node',
          type: 'n8n-nodes-base.test',
          typeVersion: 1,
          position: [0, 0],
          parameters: {},
        }),
      };
    });

    it('should make a successful GET request', async () => {
      const response = { data: 'test' };
      (mockContext.helpers!.request as jest.Mock).mockResolvedValue(response);

      const result = await geminiApiRequest.call(
        mockContext as IExecuteFunctions,
        'GET',
        '/fileSearchStores',
      );

      expect(result).toEqual(response);
      expect(mockContext.helpers!.request).toHaveBeenCalledWith({
        method: 'GET',
        body: {},
        qs: {
          key: 'test-api-key',
        },
        uri: 'https://generativelanguage.googleapis.com/v1beta/fileSearchStores',
        json: true,
      });
    });

    it('should make a successful POST request with body', async () => {
      const body = { name: 'test-store', displayName: 'Test Store' };
      const response = { name: 'fileSearchStores/test-store' };
      (mockContext.helpers!.request as jest.Mock).mockResolvedValue(response);

      const result = await geminiApiRequest.call(
        mockContext as IExecuteFunctions,
        'POST',
        '/fileSearchStores',
        body,
      );

      expect(result).toEqual(response);
      expect(mockContext.helpers!.request).toHaveBeenCalledWith({
        method: 'POST',
        body,
        qs: {
          key: 'test-api-key',
        },
        uri: 'https://generativelanguage.googleapis.com/v1beta/fileSearchStores',
        json: true,
      });
    });

    it('should include query string parameters', async () => {
      const qs = { pageSize: 10, filter: 'active' };
      await geminiApiRequest.call(
        mockContext as IExecuteFunctions,
        'GET',
        '/fileSearchStores',
        {},
        qs,
      );

      expect(mockContext.helpers!.request).toHaveBeenCalledWith(
        expect.objectContaining({
          qs: {
            ...qs,
            key: 'test-api-key',
          },
        }),
      );
    });

    it('should throw NodeApiError on request failure', async () => {
      const error = new Error('Network error');
      (mockContext.helpers!.request as jest.Mock).mockRejectedValue(error);

      await expect(
        geminiApiRequest.call(mockContext as IExecuteFunctions, 'GET', '/fileSearchStores'),
      ).rejects.toThrow(NodeApiError);
    });

    it('should handle 404 errors', async () => {
      const error = { statusCode: 404, message: 'Not Found' };
      (mockContext.helpers!.request as jest.Mock).mockRejectedValue(error);

      await expect(
        geminiApiRequest.call(
          mockContext as IExecuteFunctions,
          'GET',
          '/fileSearchStores/nonexistent',
        ),
      ).rejects.toThrow(NodeApiError);
    });

    it('should handle 401 unauthorized errors', async () => {
      const error = { statusCode: 401, message: 'Unauthorized' };
      (mockContext.helpers!.request as jest.Mock).mockRejectedValue(error);

      await expect(
        geminiApiRequest.call(mockContext as IExecuteFunctions, 'GET', '/fileSearchStores'),
      ).rejects.toThrow(NodeApiError);
    });

    it('should handle 429 rate limit errors', async () => {
      const error = { statusCode: 429, message: 'Rate limit exceeded' };
      (mockContext.helpers!.request as jest.Mock).mockRejectedValue(error);

      await expect(
        geminiApiRequest.call(mockContext as IExecuteFunctions, 'GET', '/fileSearchStores'),
      ).rejects.toThrow(NodeApiError);
    });
  });

  describe('geminiApiRequestAllItems', () => {
    let mockContext: Partial<IExecuteFunctions>;

    beforeEach(() => {
      mockContext = {
        getCredentials: jest.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
        helpers: {
          request: jest.fn(),
        } as any,
        getNode: jest.fn().mockReturnValue({
          id: 'test-node-id',
          name: 'Test Node',
          type: 'n8n-nodes-base.test',
          typeVersion: 1,
          position: [0, 0],
          parameters: {},
        }),
      };
    });

    it('should retrieve all items with pagination', async () => {
      // Mock paginated responses
      (mockContext.helpers!.request as jest.Mock)
        .mockResolvedValueOnce({
          stores: [{ name: 'store1' }, { name: 'store2' }],
          nextPageToken: 'page2',
        })
        .mockResolvedValueOnce({
          stores: [{ name: 'store3' }, { name: 'store4' }],
          nextPageToken: 'page3',
        })
        .mockResolvedValueOnce({
          stores: [{ name: 'store5' }],
          nextPageToken: undefined,
        });

      const result = await geminiApiRequestAllItems.call(
        mockContext as IExecuteFunctions,
        'stores',
        'GET',
        '/fileSearchStores',
      );

      expect(result).toHaveLength(5);
      expect(result).toEqual([
        { name: 'store1' },
        { name: 'store2' },
        { name: 'store3' },
        { name: 'store4' },
        { name: 'store5' },
      ]);
      expect(mockContext.helpers!.request).toHaveBeenCalledTimes(3);
    });

    it('should handle single page response', async () => {
      (mockContext.helpers!.request as jest.Mock).mockResolvedValueOnce({
        documents: [{ name: 'doc1' }],
        nextPageToken: undefined,
      });

      const result = await geminiApiRequestAllItems.call(
        mockContext as IExecuteFunctions,
        'documents',
        'GET',
        '/fileSearchStores/test/documents',
      );

      expect(result).toHaveLength(1);
      expect(result).toEqual([{ name: 'doc1' }]);
      expect(mockContext.helpers!.request).toHaveBeenCalledTimes(1);
    });

    it('should use default page size of 20', async () => {
      (mockContext.helpers!.request as jest.Mock).mockResolvedValueOnce({
        stores: [],
        nextPageToken: undefined,
      });

      await geminiApiRequestAllItems.call(
        mockContext as IExecuteFunctions,
        'stores',
        'GET',
        '/fileSearchStores',
      );

      expect(mockContext.helpers!.request).toHaveBeenCalledWith(
        expect.objectContaining({
          qs: expect.objectContaining({
            pageSize: 20,
          }),
        }),
      );
    });

    it('should respect custom page size', async () => {
      (mockContext.helpers!.request as jest.Mock).mockResolvedValueOnce({
        stores: [],
        nextPageToken: undefined,
      });

      await geminiApiRequestAllItems.call(
        mockContext as IExecuteFunctions,
        'stores',
        'GET',
        '/fileSearchStores',
        {},
        { pageSize: 10 },
      );

      expect(mockContext.helpers!.request).toHaveBeenCalledWith(
        expect.objectContaining({
          qs: expect.objectContaining({
            pageSize: 10,
          }),
        }),
      );
    });

    it('should handle empty results', async () => {
      (mockContext.helpers!.request as jest.Mock).mockResolvedValueOnce({
        stores: [],
        nextPageToken: undefined,
      });

      const result = await geminiApiRequestAllItems.call(
        mockContext as IExecuteFunctions,
        'stores',
        'GET',
        '/fileSearchStores',
      );

      expect(result).toEqual([]);
    });

    it('should handle missing property in response', async () => {
      (mockContext.helpers!.request as jest.Mock).mockResolvedValueOnce({
        nextPageToken: undefined,
      });

      const result = await geminiApiRequestAllItems.call(
        mockContext as IExecuteFunctions,
        'stores',
        'GET',
        '/fileSearchStores',
      );

      expect(result).toEqual([]);
    });
  });

  describe('geminiResumableUpload', () => {
    let mockContext: Partial<IExecuteFunctions>;

    beforeEach(() => {
      mockContext = {
        getCredentials: jest.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
        helpers: {
          request: jest.fn(),
        } as any,
        getNode: jest.fn().mockReturnValue({
          id: 'test-node-id',
          name: 'Test Node',
          type: 'n8n-nodes-base.test',
          typeVersion: 1,
          position: [0, 0],
          parameters: {},
        }),
      };
    });

    it('should perform resumable upload successfully', async () => {
      const file = Buffer.from('test file content');
      const metadata = { displayName: 'test.pdf', customMetadata: [] };
      const uploadSessionUrl = 'https://upload.googleapis.com/session/abc123';
      const uploadResponse = { name: 'fileSearchStores/test/documents/doc1' };

      // Mock start session
      (mockContext.helpers!.request as jest.Mock).mockResolvedValueOnce({
        headers: {
          'x-goog-upload-url': uploadSessionUrl,
        },
      });

      // Mock file upload
      (mockContext.helpers!.request as jest.Mock).mockResolvedValueOnce(uploadResponse);

      const result = await geminiResumableUpload.call(
        mockContext as IExecuteFunctions,
        'fileSearchStores/test-store',
        file,
        'application/pdf',
        metadata,
      );

      expect(result).toEqual(uploadResponse);
      expect(mockContext.helpers!.request).toHaveBeenCalledTimes(2);

      // Verify start session call
      expect(mockContext.helpers!.request).toHaveBeenNthCalledWith(1, {
        method: 'POST',
        url: 'https://generativelanguage.googleapis.com/upload/v1beta/fileSearchStores/test-store:uploadToFileSearchStore?key=test-api-key',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': file.length.toString(),
          'X-Goog-Upload-Header-Content-Type': 'application/pdf',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
        resolveWithFullResponse: true,
      });

      // Verify file upload call
      expect(mockContext.helpers!.request).toHaveBeenNthCalledWith(2, {
        method: 'POST',
        url: uploadSessionUrl,
        headers: {
          'Content-Length': file.length.toString(),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize',
        },
        body: file,
        json: true,
      });
    });

    it('should handle large file upload', async () => {
      const largeFile = Buffer.alloc(10 * 1024 * 1024); // 10MB
      const metadata = { displayName: 'large.pdf' };
      const uploadSessionUrl = 'https://upload.googleapis.com/session/xyz789';

      (mockContext.helpers!.request as jest.Mock)
        .mockResolvedValueOnce({
          headers: { 'x-goog-upload-url': uploadSessionUrl },
        })
        .mockResolvedValueOnce({ name: 'fileSearchStores/test/documents/large-doc' });

      const result = await geminiResumableUpload.call(
        mockContext as IExecuteFunctions,
        'fileSearchStores/test-store',
        largeFile,
        'application/pdf',
        metadata,
      );

      expect(result.name).toBe('fileSearchStores/test/documents/large-doc');
    });

    it('should include custom metadata in upload', async () => {
      const file = Buffer.from('test');
      const metadata = {
        displayName: 'test.pdf',
        customMetadata: [
          { key: 'author', stringValue: 'John Doe' },
          { key: 'version', numericValue: 1 },
        ],
      };

      (mockContext.helpers!.request as jest.Mock)
        .mockResolvedValueOnce({
          headers: { 'x-goog-upload-url': 'http://test.com' },
        })
        .mockResolvedValueOnce({ success: true });

      await geminiResumableUpload.call(
        mockContext as IExecuteFunctions,
        'fileSearchStores/test',
        file,
        'application/pdf',
        metadata,
      );

      expect(mockContext.helpers!.request).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          body: JSON.stringify(metadata),
        }),
      );
    });
  });

  describe('pollOperation', () => {
    let mockContext: Partial<IExecuteFunctions>;

    beforeEach(() => {
      mockContext = {
        getCredentials: jest.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
        helpers: {
          request: jest.fn(),
        } as any,
        getNode: jest.fn().mockReturnValue({
          id: 'test-node-id',
          name: 'Test Node',
          type: 'n8n-nodes-base.test',
          typeVersion: 1,
          position: [0, 0],
          parameters: {},
        }),
      };
    });

    it('should return response when operation completes successfully', async () => {
      const response = { document: { name: 'fileSearchStores/test/documents/doc1' } };
      (mockContext.helpers!.request as jest.Mock).mockResolvedValueOnce({
        done: true,
        response,
      });

      const result = await pollOperation.call(
        mockContext as IExecuteFunctions,
        'operations/abc123',
        10,
        100,
      );

      expect(result).toEqual(response);
      expect(mockContext.helpers!.request).toHaveBeenCalledTimes(1);
    });

    it('should poll multiple times until completion', async () => {
      const response = { document: { name: 'fileSearchStores/test/documents/doc1' } };

      (mockContext.helpers!.request as jest.Mock)
        .mockResolvedValueOnce({ done: false })
        .mockResolvedValueOnce({ done: false })
        .mockResolvedValueOnce({ done: true, response });

      const result = await pollOperation.call(
        mockContext as IExecuteFunctions,
        'operations/abc123',
        10,
        50,
      );

      expect(result).toEqual(response);
      expect(mockContext.helpers!.request).toHaveBeenCalledTimes(3);
    });

    it('should throw error when operation fails', async () => {
      (mockContext.helpers!.request as jest.Mock).mockResolvedValue({
        done: true,
        error: {
          code: 400,
          message: 'Invalid document format',
          details: ['Document must be PDF'],
        },
      });

      await expect(
        pollOperation.call(mockContext as IExecuteFunctions, 'operations/abc123', 10, 100),
      ).rejects.toThrow(NodeOperationError);

      await expect(
        pollOperation.call(mockContext as IExecuteFunctions, 'operations/abc123', 10, 100),
      ).rejects.toThrow('Operation failed: Invalid document format');
    });

    it('should timeout after max attempts', async () => {
      (mockContext.helpers!.request as jest.Mock).mockResolvedValue({ done: false });

      await expect(
        pollOperation.call(mockContext as IExecuteFunctions, 'operations/abc123', 3, 50),
      ).rejects.toThrow(NodeOperationError);

      await expect(
        pollOperation.call(mockContext as IExecuteFunctions, 'operations/abc123', 3, 50),
      ).rejects.toThrow('Operation timeout: exceeded 10 minutes');

      expect(mockContext.helpers!.request).toHaveBeenCalled();
    });

    it('should use default parameters', async () => {
      (mockContext.helpers!.request as jest.Mock).mockResolvedValueOnce({
        done: true,
        response: { success: true },
      });

      const result = await pollOperation.call(
        mockContext as IExecuteFunctions,
        'operations/abc123',
      );

      expect(result).toEqual({ success: true });
    });

    it('should wait between poll attempts', async () => {
      const startTime = Date.now();
      (mockContext.helpers!.request as jest.Mock)
        .mockResolvedValueOnce({ done: false })
        .mockResolvedValueOnce({ done: true, response: { success: true } });

      await pollOperation.call(mockContext as IExecuteFunctions, 'operations/abc123', 10, 100);

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some timing variance
    });
  });
});
