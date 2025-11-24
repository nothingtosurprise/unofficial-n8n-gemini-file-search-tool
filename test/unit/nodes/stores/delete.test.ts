import { IExecuteFunctions } from 'n8n-workflow';
import { deleteStore } from '../../../../nodes/GeminiFileSearchStores/operations/store/delete';
import * as apiClient from '../../../../utils/apiClient';
import * as validators from '../../../../utils/validators';

jest.mock('../../../../utils/apiClient');
jest.mock('../../../../utils/validators');

describe('Store Delete Operation', () => {
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

  it('should delete store without force', async () => {
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((param: string) => {
      if (param === 'storeName') return 'fileSearchStores/test-123';
      if (param === 'force') return false;
      return undefined;
    });

    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteStore.call(mockExecuteFunctions, 0);

    expect(result).toEqual({ success: true });
    expect(validators.validateStoreName).toHaveBeenCalledWith('fileSearchStores/test-123');
    expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
      'DELETE',
      '/fileSearchStores/test-123',
      {},
      { force: false },
    );
  });

  it('should delete store with force flag', async () => {
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((param: string) => {
      if (param === 'storeName') return 'fileSearchStores/test-456';
      if (param === 'force') return true;
      return undefined;
    });

    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteStore.call(mockExecuteFunctions, 0);

    expect(result).toEqual({ success: true });
    expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
      'DELETE',
      '/fileSearchStores/test-456',
      {},
      { force: true },
    );
  });

  it('should validate store name before deletion', async () => {
    const storeName = 'fileSearchStores/valid-store';
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((param: string) => {
      if (param === 'storeName') return storeName;
      if (param === 'force') return false;
      return undefined;
    });

    (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue(undefined);

    await deleteStore.call(mockExecuteFunctions, 0);

    expect(validators.validateStoreName).toHaveBeenCalledWith(storeName);
  });

  it('should handle validation errors', async () => {
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((param: string) => {
      if (param === 'storeName') return 'invalid-name';
      if (param === 'force') return false;
      return undefined;
    });

    (validators.validateStoreName as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid store name format');
    });

    await expect(deleteStore.call(mockExecuteFunctions, 0)).rejects.toThrow(
      'Invalid store name format',
    );
  });

  it('should handle API errors', async () => {
    (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((param: string) => {
      if (param === 'storeName') return 'fileSearchStores/test-123';
      if (param === 'force') return false;
      return undefined;
    });

    // Reset the mock to not throw validation errors
    (validators.validateStoreName as jest.Mock).mockImplementation(() => {});

    (apiClient.geminiApiRequest as jest.Mock).mockRejectedValue(new Error('Store not found'));

    await expect(deleteStore.call(mockExecuteFunctions, 0)).rejects.toThrow('Store not found');
  });
});
