import { IExecuteFunctions } from 'n8n-workflow';
import { create } from '../../../../nodes/GeminiFileSearchStores/operations/store/create';
import * as apiClient from '../../../../utils/apiClient';
import * as validators from '../../../../utils/validators';

jest.mock('../../../../utils/apiClient');
jest.mock('../../../../utils/validators');

describe('Store Create Operation', () => {
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

  it('should create store with display name', async () => {
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue('My Test Store');
    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({
      name: 'fileSearchStores/test-123',
      displayName: 'My Test Store',
      createTime: '2024-01-01T00:00:00Z',
      updateTime: '2024-01-01T00:00:00Z',
    });

    const result = await create.call(mockExecuteFunctions, 0);

    expect(result.name).toBe('fileSearchStores/test-123');
    expect(result.displayName).toBe('My Test Store');
    expect(validators.validateDisplayName).toHaveBeenCalledWith('My Test Store');
    expect(apiClient.geminiApiRequest).toHaveBeenCalledWith('POST', '/fileSearchStores', {
      displayName: 'My Test Store',
    });
  });

  it('should create store without display name', async () => {
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue('');
    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({
      name: 'fileSearchStores/test-456',
      createTime: '2024-01-01T00:00:00Z',
      updateTime: '2024-01-01T00:00:00Z',
    });

    const result = await create.call(mockExecuteFunctions, 0);

    expect(result.name).toBe('fileSearchStores/test-456');
    expect(validators.validateDisplayName).not.toHaveBeenCalled();
    expect(apiClient.geminiApiRequest).toHaveBeenCalledWith('POST', '/fileSearchStores', {});
  });

  it('should validate display name when provided', async () => {
    const displayName = 'Valid Store Name';
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue(displayName);
    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({
      name: 'fileSearchStores/test-789',
      displayName,
    });

    await create.call(mockExecuteFunctions, 0);

    expect(validators.validateDisplayName).toHaveBeenCalledWith(displayName);
  });

  it('should handle API errors', async () => {
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue('Test Store');
    (apiClient.geminiApiRequest as jest.Mock).mockRejectedValue(new Error('API Error'));

    await expect(create.call(mockExecuteFunctions, 0)).rejects.toThrow('API Error');
  });
});
