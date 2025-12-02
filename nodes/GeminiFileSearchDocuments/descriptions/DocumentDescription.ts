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
        description: 'Query documents using Gemini RAG with source citations',
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
    type: 'resourceLocator',
    required: true,
    default: { mode: 'list', value: '' },
    displayOptions: {
      show: {
        operation: ['upload', 'import', 'list', 'replaceUpload'],
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
  // Display Name - Optional for upload/import
  {
    displayName: 'Display Name',
    name: 'displayName',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        operation: ['upload', 'import'],
      },
    },
    description: 'Human-readable display name for the document',
  },
  // Display Name - Required for replaceUpload
  {
    displayName: 'Display Name',
    name: 'displayName',
    type: 'string',
    default: '',
    required: true,
    displayOptions: {
      show: {
        operation: ['replaceUpload'],
      },
    },
    placeholder: 'my-document.pdf',
    description:
      'Display name for the new document. When "Delete Old Document By" is set to "Display Name", this is also used to find the old document.',
  },
  // Match By - How to find old documents
  {
    displayName: 'Delete Old Document By',
    name: 'matchBy',
    type: 'options',
    default: 'none',
    displayOptions: {
      show: {
        operation: ['replaceUpload'],
      },
    },
    options: [
      {
        name: 'None (Upload Only)',
        value: 'none',
        description: 'Just upload the new document without deleting any existing documents',
      },
      {
        name: 'Display Name',
        value: 'displayName',
        description: 'Find and delete documents matching the Display Name above',
      },
      {
        name: 'Custom Filename',
        value: 'customFilename',
        description: 'Find and delete documents matching a different filename',
      },
      {
        name: 'Metadata Key-Value',
        value: 'metadata',
        description: 'Find and delete documents by metadata (can match multiple)',
      },
    ],
    description:
      'Optional: Choose how to find old document(s) to delete before uploading. Select "None" to just upload.',
  },
  {
    displayName: 'Old Document Filename',
    name: 'oldDocumentFilename',
    type: 'string',
    default: '',
    required: true,
    displayOptions: {
      show: {
        operation: ['replaceUpload'],
        matchBy: ['customFilename'],
      },
    },
    placeholder: 'old-document.pdf',
    description: 'The display name of the old document to delete (case-insensitive search)',
  },
  {
    displayName: 'Metadata Key',
    name: 'matchMetadataKey',
    type: 'string',
    default: '',
    required: true,
    displayOptions: {
      show: {
        operation: ['replaceUpload'],
        matchBy: ['metadata'],
      },
    },
    placeholder: 'documentId',
    description: 'The metadata key to search for',
  },
  {
    displayName: 'Metadata Value',
    name: 'matchMetadataValue',
    type: 'string',
    default: '',
    required: true,
    displayOptions: {
      show: {
        operation: ['replaceUpload'],
        matchBy: ['metadata'],
      },
    },
    placeholder: 'doc-12345',
    description: 'The metadata value to match (exact match, case-sensitive)',
  },
  {
    displayName: 'Delete All Matches',
    name: 'deleteAllMatches',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        operation: ['replaceUpload'],
        matchBy: ['metadata'],
      },
    },
    description:
      'When enabled, deletes ALL documents matching the metadata criteria. When disabled, only deletes the first match.',
  },
  {
    displayName: 'Preserve Old Document Metadata',
    name: 'preserveMetadata',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        operation: ['replaceUpload'],
      },
    },
    description:
      'Copy metadata from the old document to the new document. If multiple documents are deleted, uses metadata from the first match.',
  },
  {
    displayName: 'Metadata Merge Strategy',
    name: 'metadataMergeStrategy',
    type: 'options',
    default: 'preferNew',
    displayOptions: {
      show: {
        operation: ['replaceUpload'],
        preserveMetadata: [true],
      },
    },
    options: [
      {
        name: 'Prefer New (Override)',
        value: 'preferNew',
        description: 'New metadata values override old values for same keys',
      },
      {
        name: 'Prefer Old (Keep Original)',
        value: 'preferOld',
        description: 'Old metadata values are kept, new values only fill gaps',
      },
      {
        name: 'Merge All (Combine Keys)',
        value: 'mergeAll',
        description: 'All unique keys from both old and new metadata are included',
      },
      {
        name: 'Use Old Only',
        value: 'replaceEntirely',
        description: 'Only use old metadata, ignore any new metadata provided',
      },
    ],
    description:
      'How to handle conflicts when both old document metadata and new custom metadata exist',
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
  {
    displayName: 'Delete Duplicates',
    name: 'deleteDuplicates',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        operation: ['list'],
      },
    },
    hint: 'Deletes older documents with the same display name, keeping only the most recent',
    description:
      'When enabled, identifies documents with duplicate display names and deletes all but the most recent version (based on creation time). The deleted documents info is included in the output.',
  },
  {
    displayName: 'Force Delete Duplicates',
    name: 'forceDeleteDuplicates',
    type: 'boolean',
    default: true,
    displayOptions: {
      show: {
        operation: ['list'],
        deleteDuplicates: [true],
      },
    },
    description: 'Whether to force delete duplicate documents even if they contain chunks',
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
    description:
      'The question to ask about your documents. To extract data from the response: Answer text is at $json.candidates[0].content.parts[0].text. Source documents are in $json.candidates[0].groundingMetadata.groundingChunks[].retrievedContext (contains uri and title). Citations mapping answer segments to sources are in $json.candidates[0].groundingMetadata.groundingSupports[] (contains segment.text, groundingChunkIndices, and confidenceScores). Token usage is at $json.usageMetadata.totalTokenCount.',
    placeholder: 'What are the key findings about transformer models?',
  },
  {
    displayName: 'Store Names',
    name: 'storeNames',
    type: 'multiOptions',
    required: true,
    displayOptions: {
      show: {
        operation: ['query'],
      },
    },
    default: [],
    description: 'Select one or more stores to search. Use expressions for dynamic values.',
    typeOptions: {
      loadOptionsMethod: 'getStores',
    },
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
  {
    displayName: 'Include Source Metadata',
    name: 'includeSourceMetadata',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        operation: ['query'],
      },
    },
    hint: 'Adds one API call per unique source document to fetch its full metadata',
    description:
      'When enabled, fetches the full document metadata (customMetadata, displayName, state, etc.) for each source document referenced in the grounding response. This adds additional API calls but provides complete source information. The metadata is added to each groundingChunk under a "documentMetadata" field.',
  },
];
