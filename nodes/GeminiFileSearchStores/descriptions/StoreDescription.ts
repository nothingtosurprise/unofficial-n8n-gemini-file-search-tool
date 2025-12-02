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
    displayName: 'Store',
    name: 'storeName',
    type: 'resourceLocator',
    required: true,
    default: { mode: 'list', value: '' },
    displayOptions: {
      show: {
        operation: ['get', 'delete'],
      },
    },
    description: 'The File Search store to operate on',
    modes: [
      {
        displayName: 'From List',
        name: 'list',
        type: 'list',
        placeholder: 'Select a store...',
        typeOptions: {
          searchListMethod: 'getStores',
          searchable: true,
        },
      },
      {
        displayName: 'By Name',
        name: 'name',
        type: 'string',
        placeholder: 'fileSearchStores/my-store-123',
        validation: [
          {
            type: 'regex',
            properties: {
              regex: '^fileSearchStores/.+$',
              errorMessage: 'Store name must be in format: fileSearchStores/store-id',
            },
          },
        ],
      },
    ],
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
