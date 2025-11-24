import { INodeProperties } from 'n8n-workflow';

export const storeFields: INodeProperties[] = [
  // Create operation fields
  {
    displayName: 'Display Name',
    name: 'displayName',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        operation: ['create'],
      },
    },
    description: 'Human-readable display name for the store (max 512 characters)',
  },

  // Get/Delete operation fields
  {
    displayName: 'Store Name',
    name: 'storeName',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        operation: ['get', 'delete'],
      },
    },
    placeholder: 'fileSearchStores/my-store-123',
    description: 'The resource name of the store',
  },

  // Delete operation fields
  {
    displayName: 'Force',
    name: 'force',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        operation: ['delete'],
      },
    },
    description: 'Whether to delete the store even if it contains documents',
  },

  // List operation fields
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        operation: ['list'],
      },
    },
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 10,
    displayOptions: {
      show: {
        operation: ['list'],
        returnAll: [false],
      },
    },
    typeOptions: {
      minValue: 1,
      maxValue: 20,
    },
    description: 'Max number of results to return',
  },

  // Get Operation fields
  {
    displayName: 'Operation Name',
    name: 'operationName',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        operation: ['getOperation'],
      },
    },
    placeholder: 'fileSearchStores/my-store-123/operations/op-456',
    description: 'The resource name of the operation',
  },
];
