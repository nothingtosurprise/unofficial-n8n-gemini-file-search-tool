import { INodeProperties } from 'n8n-workflow';

export const documentOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['document'],
      },
    },
    options: [
      {
        name: 'Upload',
        value: 'upload',
        description: 'Upload a file to a File Search store',
        action: 'Upload a document',
      },
      {
        name: 'Import',
        value: 'import',
        description: 'Import a file from Files API to a File Search store',
        action: 'Import a document',
      },
      {
        name: 'List',
        value: 'list',
        description: 'List all documents in a store',
        action: 'List documents',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get a specific document',
        action: 'Get a document',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a document',
        action: 'Delete a document',
      },
      {
        name: 'Query',
        value: 'query',
        description: 'Query documents using Gemini model',
        action: 'Query documents',
      },
      {
        name: 'Replace Upload',
        value: 'replaceUpload',
        description:
          'Upload a new document and delete the old one with matching filename (workaround for API limitation)',
        action: 'Replace upload a document',
      },
    ],
    default: 'upload',
  },
];

export const documentFields: INodeProperties[] = [
  // Common: Store selection
  {
    displayName: 'Store',
    name: 'storeName',
    type: 'string',
    default: '',
    required: true,
    displayOptions: {
      show: {
        operation: ['upload', 'import', 'list', 'replaceUpload'],
      },
    },
    placeholder: 'fileSearchStores/my-store-123',
    description: 'The name of the File Search store',
  },

  // Upload operation fields
  {
    displayName: 'Input Binary Field',
    name: 'binaryPropertyName',
    type: 'string',
    default: 'data',
    required: true,
    displayOptions: {
      show: {
        operation: ['upload', 'replaceUpload'],
      },
    },
    description: 'Name of the binary property containing the file to upload',
  },
  {
    displayName: 'Display Name',
    name: 'displayName',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        operation: ['upload', 'import', 'replaceUpload'],
      },
    },
    description: 'Human-readable display name for the document',
  },
  {
    displayName: 'Custom Metadata',
    name: 'customMetadata',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
    },
    default: {},
    displayOptions: {
      show: {
        operation: ['upload', 'import', 'replaceUpload'],
      },
    },
    description: 'Custom metadata key-value pairs (max 20)',
    options: [
      {
        name: 'metadataValues',
        displayName: 'Metadata',
        values: [
          {
            displayName: 'Key',
            name: 'key',
            type: 'string',
            default: '',
            description: 'Metadata key',
          },
          {
            displayName: 'Value Type',
            name: 'valueType',
            type: 'options',
            options: [
              {
                name: 'String',
                value: 'string',
              },
              {
                name: 'Number',
                value: 'number',
              },
              {
                name: 'String List',
                value: 'stringList',
              },
            ],
            default: 'string',
          },
          {
            displayName: 'Value',
            name: 'value',
            type: 'string',
            default: '',
            displayOptions: {
              show: {
                valueType: ['string', 'number'],
              },
            },
          },
          {
            displayName: 'Values',
            name: 'values',
            type: 'string',
            default: '',
            displayOptions: {
              show: {
                valueType: ['stringList'],
              },
            },
            description: 'Comma-separated list of values',
          },
        ],
      },
    ],
  },
  {
    displayName: 'Chunking Options',
    name: 'chunkingOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        operation: ['upload', 'import', 'replaceUpload'],
      },
    },
    options: [
      {
        displayName: 'Max Tokens Per Chunk',
        name: 'maxTokensPerChunk',
        type: 'number',
        default: 200,
        description: 'Maximum number of tokens per chunk',
      },
      {
        displayName: 'Max Overlap Tokens',
        name: 'maxOverlapTokens',
        type: 'number',
        default: 20,
        description: 'Maximum number of overlapping tokens between chunks',
      },
    ],
  },
  {
    displayName: 'Wait for Completion',
    name: 'waitForCompletion',
    type: 'boolean',
    default: true,
    displayOptions: {
      show: {
        operation: ['upload', 'import', 'replaceUpload'],
      },
    },
    description: 'Whether to wait for the upload/import operation to complete',
  },

  // Replace Upload operation fields
  {
    displayName: 'Old Document Filename',
    name: 'oldDocumentFilename',
    type: 'string',
    default: '',
    required: true,
    displayOptions: {
      show: {
        operation: ['replaceUpload'],
      },
    },
    placeholder: 'document.pdf',
    description:
      'The filename (displayName) of the old document to delete after successful upload. The search is case-insensitive.',
  },
  {
    displayName: 'Force Delete',
    name: 'forceDelete',
    type: 'boolean',
    default: true,
    displayOptions: {
      show: {
        operation: ['replaceUpload'],
      },
    },
    description: 'Whether to force delete the old document even if it contains chunks',
  },

  // Import operation fields
  {
    displayName: 'File Name',
    name: 'fileName',
    type: 'string',
    default: '',
    required: true,
    displayOptions: {
      show: {
        operation: ['import'],
      },
    },
    placeholder: 'files/abc-123',
    description: 'The resource name of the file to import (from Files API)',
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
  {
    displayName: 'Metadata Filter',
    name: 'metadataFilter',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        operation: ['list'],
      },
    },
    placeholder: 'author="Latour" AND year>2000',
    description:
      'Filter documents by metadata (AIP-160 format). Note: Filtering happens client-side after fetching all documents.',
  },

  // Get/Delete operation fields
  {
    displayName: 'Document Name',
    name: 'documentName',
    type: 'string',
    default: '',
    required: true,
    displayOptions: {
      show: {
        operation: ['get', 'delete'],
      },
    },
    placeholder: 'fileSearchStores/my-store-123/documents/doc-abc',
    description: 'The resource name of the document',
  },
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
    description: 'Whether to delete the document even if it contains chunks',
  },

  // Query operation fields
  {
    displayName: 'Model',
    name: 'model',
    type: 'options',
    required: true,
    displayOptions: {
      show: {
        operation: ['query'],
      },
    },
    options: [
      {
        name: 'Gemini 2.5 Flash',
        value: 'gemini-2.5-flash',
      },
      {
        name: 'Gemini 2.5 Pro',
        value: 'gemini-2.5-pro',
      },
      {
        name: 'Gemini 3 Pro Preview',
        value: 'gemini-3-pro-preview',
      },
    ],
    default: 'gemini-2.5-flash',
    description: 'The Gemini model to use for querying',
  },
  {
    displayName: 'System Prompt',
    name: 'systemPrompt',
    type: 'string',
    displayOptions: {
      show: {
        operation: ['query'],
      },
    },
    typeOptions: {
      rows: 4,
    },
    default: '',
    description: 'System instructions to provide context and guide the AI model response',
    placeholder:
      'You are a helpful research assistant. Answer questions based only on the provided documents.',
  },
  {
    displayName: 'Query',
    name: 'query',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        operation: ['query'],
      },
    },
    typeOptions: {
      rows: 4,
    },
    default: '',
    description: 'The query to search for in the documents',
    placeholder: 'What are the key findings about transformer models?',
  },
  {
    displayName: 'Store Names',
    name: 'storeNames',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        operation: ['query'],
      },
    },
    default: '',
    description: 'Comma-separated list of store names to search',
    placeholder: 'fileSearchStores/store-1,fileSearchStores/store-2',
  },
  {
    displayName: 'Metadata Filter',
    name: 'metadataFilter',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        operation: ['query'],
      },
    },
    description: 'Filter expression in AIP-160 format',
    placeholder: 'author="John Doe" AND year>=2023',
  },
];
