import { IExecuteFunctions } from 'n8n-workflow';
import { getOperation } from '../../../../nodes/GeminiFileSearchStores/operations/store/getOperation';
import * as apiClient from '../../../../utils/apiClient';

jest.mock('../../../../utils/apiClient');

describe('Store GetOperation Operation', () => {
  let mockExecuteFunctions: IExecuteFunctions;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn(() => ({
        id: 'test',
        name: 'Test Node',
        type: 'n8n-nodes-base.test',
        typeVersion: 1,
        position: [0, 0],
      })),
    } as unknown as IExecuteFunctions;
  });

  it('should get operation status', async () => {
    const operationName = 'fileSearchStores/test-store/operations/op-123';
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue(operationName);

    const mockOperation = {
      name: operationName,
      done: true,
      response: {
        name: 'fileSearchStores/test-store',
        displayName: 'Test Store',
      },
    };

    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(mockOperation);

    const result = await getOperation.call(mockExecuteFunctions, 0);

    expect(result).toEqual(mockOperation);
    expect(apiClient.geminiApiRequest).toHaveBeenCalledWith('GET', `/${operationName}`);
  });

  it('should get pending operation status', async () => {
    const operationName = 'fileSearchStores/test-store/operations/op-456';
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue(operationName);

    const mockOperation = {
      name: operationName,
      done: false,
      metadata: {
        '@type': 'type.googleapis.com/google.ai.generativelanguage.v1beta.CreateDocumentMetadata',
      },
    };

    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(mockOperation);

    const result = await getOperation.call(mockExecuteFunctions, 0);

    expect(result).toEqual(mockOperation);
    expect(result.done).toBe(false);
  });

  it('should get failed operation status', async () => {
    const operationName = 'fileSearchStores/test-store/operations/op-789';
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue(operationName);

    const mockOperation = {
      name: operationName,
      done: true,
      error: {
        code: 3,
        message: 'Operation failed',
      },
    };

    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(mockOperation);

    const result = await getOperation.call(mockExecuteFunctions, 0);

    expect(result).toEqual(mockOperation);
    expect(result.error).toBeDefined();
  });

  it('should handle API errors', async () => {
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue(
      'fileSearchStores/test-store/operations/invalid',
    );
    (apiClient.geminiApiRequest as jest.Mock).mockRejectedValue(new Error('Operation not found'));

    await expect(getOperation.call(mockExecuteFunctions, 0)).rejects.toThrow('Operation not found');
  });

  it('should handle different operation name formats', async () => {
    const operationName = 'fileSearchStores/my-store-123/operations/create-op-456';
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue(operationName);
    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({
      name: operationName,
      done: true,
    });

    await getOperation.call(mockExecuteFunctions, 0);

    expect(apiClient.geminiApiRequest).toHaveBeenCalledWith('GET', `/${operationName}`);
  });
});
