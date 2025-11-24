import { IExecuteFunctions } from 'n8n-workflow';
import { get } from '../../../../nodes/GeminiFileSearchStores/operations/store/get';
import * as apiClient from '../../../../utils/apiClient';
import * as validators from '../../../../utils/validators';

jest.mock('../../../../utils/apiClient');
jest.mock('../../../../utils/validators');

describe('Store Get Operation', () => {
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

  it('should get store by name', async () => {
    const storeName = 'fileSearchStores/test-store-123';
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue(storeName);

    const mockStore = {
      name: storeName,
      displayName: 'Test Store',
      createTime: '2024-01-01T00:00:00Z',
      updateTime: '2024-01-01T00:00:00Z',
    };

    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(mockStore);

    const result = await get.call(mockExecuteFunctions, 0);

    expect(result).toEqual(mockStore);
    expect(validators.validateStoreName).toHaveBeenCalledWith(storeName);
    expect(apiClient.geminiApiRequest).toHaveBeenCalledWith('GET', `/${storeName}`);
  });

  it('should validate store name format', async () => {
    const storeName = 'fileSearchStores/valid-store';
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue(storeName);
    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});

    await get.call(mockExecuteFunctions, 0);

    expect(validators.validateStoreName).toHaveBeenCalledWith(storeName);
  });

  it('should handle API errors', async () => {
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue(
      'fileSearchStores/test-123',
    );
    (apiClient.geminiApiRequest as jest.Mock).mockRejectedValue(new Error('Store not found'));

    await expect(get.call(mockExecuteFunctions, 0)).rejects.toThrow('Store not found');
  });

  it('should handle validation errors', async () => {
    const invalidName = 'invalid-store-name';
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue(invalidName);
    (validators.validateStoreName as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid store name format');
    });

    await expect(get.call(mockExecuteFunctions, 0)).rejects.toThrow('Invalid store name format');
  });
});
