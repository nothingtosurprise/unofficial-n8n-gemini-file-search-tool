import { IExecuteFunctions } from 'n8n-workflow';
import { list } from '../../../../nodes/GeminiFileSearchStores/operations/store/list';
import * as apiClient from '../../../../utils/apiClient';

jest.mock('../../../../utils/apiClient');

describe('Store List Operation', () => {
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

  it('should list all stores when returnAll is true', async () => {
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((param: string) => {
      if (param === 'returnAll') return true;
      return undefined;
    });

    const mockStores = [
      { name: 'fileSearchStores/store-1', displayName: 'Store 1' },
      { name: 'fileSearchStores/store-2', displayName: 'Store 2' },
    ];

    (apiClient.geminiApiRequestAllItems as jest.Mock).mockResolvedValue(mockStores);

    const result = await list.call(mockExecuteFunctions, 0);

    expect(result).toEqual(mockStores);
    expect(apiClient.geminiApiRequestAllItems).toHaveBeenCalledWith(
      'fileSearchStores',
      'GET',
      '/fileSearchStores',
    );
  });

  it('should list limited stores when returnAll is false', async () => {
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((param: string) => {
      if (param === 'returnAll') return false;
      if (param === 'limit') return 5;
      return undefined;
    });

    const mockResponse = {
      fileSearchStores: [
        { name: 'fileSearchStores/store-1', displayName: 'Store 1' },
        { name: 'fileSearchStores/store-2', displayName: 'Store 2' },
      ],
      nextPageToken: 'token-123',
    };

    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(mockResponse);

    const result = await list.call(mockExecuteFunctions, 0);

    expect(result).toEqual(mockResponse.fileSearchStores);
    expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
      'GET',
      '/fileSearchStores',
      {},
      { pageSize: 5 },
    );
  });

  it('should return empty array when no stores exist', async () => {
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((param: string) => {
      if (param === 'returnAll') return false;
      if (param === 'limit') return 10;
      return undefined;
    });

    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({});

    const result = await list.call(mockExecuteFunctions, 0);

    expect(result).toEqual([]);
  });

  it('should handle API errors', async () => {
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue(true);
    (apiClient.geminiApiRequestAllItems as jest.Mock).mockRejectedValue(new Error('API Error'));

    await expect(list.call(mockExecuteFunctions, 0)).rejects.toThrow('API Error');
  });
});
