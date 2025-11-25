/**
 * Represents a Gemini File Search Store resource
 *
 * A store is a container for documents that can be searched using the File Search tool.
 * Document counts and size are returned as strings due to potential large values.
 *
 * @example
 * ```typescript
 * const store: FileSearchStore = {
 *   name: 'fileSearchStores/my-store-123',
 *   displayName: 'Technical Documentation Store',
 *   createTime: '2025-11-24T12:00:00Z',
 *   updateTime: '2025-11-24T12:30:00Z',
 *   activeDocumentsCount: '42',
 *   pendingDocumentsCount: '3',
 *   failedDocumentsCount: '1',
 *   sizeBytes: '104857600' // 100MB
 * };
 * ```
 */
export interface FileSearchStore {
  /** Full resource name (e.g., 'fileSearchStores/my-store-123') */
  name: string;
  /** Optional human-readable name (max 512 characters) */
  displayName?: string;
  /** ISO 8601 timestamp when store was created */
  createTime: string;
  /** ISO 8601 timestamp of last update */
  updateTime: string;
  /** Number of documents in ACTIVE state (string to support large numbers) */
  activeDocumentsCount: string;
  /** Number of documents in PENDING state (being processed) */
  pendingDocumentsCount: string;
  /** Number of documents in FAILED state */
  failedDocumentsCount: string;
  /** Total size of all documents in bytes (string to support large values) */
  sizeBytes: string;
}

/**
 * Represents a document within a Gemini File Search Store
 *
 * Documents are searchable files with optional metadata and lifecycle state.
 *
 * @example
 * ```typescript
 * const doc: Document = {
 *   name: 'fileSearchStores/my-store/documents/doc-123',
 *   displayName: 'API Reference v2.0',
 *   customMetadata: [
 *     { key: 'category', stringValue: 'api' },
 *     { key: 'version', numericValue: 2.0 }
 *   ],
 *   createTime: '2025-11-24T12:00:00Z',
 *   updateTime: '2025-11-24T12:05:00Z',
 *   state: DocumentState.STATE_ACTIVE,
 *   sizeBytes: '1048576', // 1MB
 *   mimeType: 'application/pdf'
 * };
 * ```
 */
export interface Document {
  /** Full resource name (e.g., 'fileSearchStores/store/documents/doc-123') */
  name: string;
  /** Optional human-readable name (max 512 characters) */
  displayName?: string;
  /** Array of custom metadata key-value pairs (max 20 items) */
  customMetadata?: CustomMetadata[];
  /** ISO 8601 timestamp when document was created */
  createTime: string;
  /** ISO 8601 timestamp of last update */
  updateTime: string;
  /** Current processing state of the document */
  state: DocumentState;
  /** File size in bytes (string to support large values) */
  sizeBytes: string;
  /** MIME type of the document (e.g., 'application/pdf', 'text/plain') */
  mimeType: string;
}

/**
 * Custom metadata key-value pair for document annotation
 *
 * Each metadata item must have exactly one value type set.
 * Maximum 20 metadata items allowed per document.
 *
 * @example
 * ```typescript
 * // String metadata
 * const meta1: CustomMetadata = {
 *   key: 'category',
 *   stringValue: 'documentation'
 * };
 *
 * // Numeric metadata
 * const meta2: CustomMetadata = {
 *   key: 'version',
 *   numericValue: 2.0
 * };
 *
 * // String list metadata
 * const meta3: CustomMetadata = {
 *   key: 'tags',
 *   stringListValue: { values: ['api', 'reference', 'v2'] }
 * };
 * ```
 */
export interface CustomMetadata {
  /** Metadata key name */
  key: string;
  /** Single string value (mutually exclusive with other value types) */
  stringValue?: string;
  /** Array of string values (mutually exclusive with other value types) */
  stringListValue?: { values: string[] };
  /** Numeric value (mutually exclusive with other value types) */
  numericValue?: number;
}

/**
 * Lifecycle state of a document in a File Search Store
 *
 * Documents transition through states during processing:
 * PENDING → ACTIVE (success) or FAILED (error)
 *
 * @example
 * ```typescript
 * // Check if document is ready for search
 * if (doc.state === DocumentState.STATE_ACTIVE) {
 *   console.log('Document is searchable');
 * } else if (doc.state === DocumentState.STATE_PENDING) {
 *   console.log('Document is being processed');
 * } else if (doc.state === DocumentState.STATE_FAILED) {
 *   console.error('Document processing failed');
 * }
 * ```
 */
export enum DocumentState {
  /** State not specified or unknown */
  STATE_UNSPECIFIED = 'STATE_UNSPECIFIED',
  /** Document is being processed and not yet searchable */
  STATE_PENDING = 'STATE_PENDING',
  /** Document is processed and available for search */
  STATE_ACTIVE = 'STATE_ACTIVE',
  /** Document processing failed and is not searchable */
  STATE_FAILED = 'STATE_FAILED',
}

/**
 * Configuration for document chunking strategy
 *
 * Controls how documents are split into chunks for embedding and search.
 * Uses whitespace-based chunking with configurable token limits.
 *
 * @example
 * ```typescript
 * // Configure chunking for large documents
 * const config: ChunkingConfig = {
 *   whiteSpaceConfig: {
 *     maxTokensPerChunk: 800,    // Larger chunks for context
 *     maxOverlapTokens: 100       // Overlap for continuity
 *   }
 * };
 *
 * // Use during document upload
 * const metadata = {
 *   displayName: 'Technical Doc',
 *   chunkingConfig: config
 * };
 * ```
 */
export interface ChunkingConfig {
  /** Whitespace-based chunking configuration */
  whiteSpaceConfig?: {
    /** Maximum tokens per chunk (affects search granularity) */
    maxTokensPerChunk?: number;
    /** Number of overlapping tokens between chunks (improves context continuity) */
    maxOverlapTokens?: number;
  };
}

/**
 * Represents a long-running operation in the Gemini API
 *
 * Operations track asynchronous tasks like document uploads and imports.
 * Poll the operation until 'done' is true, then check for error or response.
 *
 * @example
 * ```typescript
 * // Start upload operation
 * const op: Operation = await geminiResumableUpload.call(...);
 *
 * // Poll until complete
 * while (!op.done) {
 *   await sleep(5000);
 *   const updated = await geminiApiRequest.call(this, 'GET', `/${op.name}`);
 *   if (updated.done) {
 *     if (updated.error) {
 *       console.error('Failed:', updated.error.message);
 *     } else {
 *       console.log('Success:', updated.response);
 *     }
 *   }
 * }
 * ```
 */
export interface Operation {
  /** Full operation name (e.g., 'operations/abc123') used for polling */
  name: string;
  /** Optional metadata about the operation type and progress */
  metadata?: {
    /** Type URL identifying the metadata type */
    '@type': string;
    /** Additional operation-specific metadata fields */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  /** True when operation is complete (check error or response) */
  done: boolean;
  /** Error information if operation failed (mutually exclusive with response) */
  error?: {
    /** gRPC error code */
    code: number;
    /** Human-readable error message */
    message: string;
    /** Additional error details */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: any[];
  };
  /** Operation result if successful (mutually exclusive with error) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response?: any;
}

/**
 * Strategy for matching existing documents during Replace Upload operation
 *
 * Determines how to identify which document(s) to replace before uploading new content.
 *
 * @example
 * ```typescript
 * // Match by display name
 * const matchBy: MatchByType = 'displayName';
 *
 * // Match by custom metadata
 * const matchBy: MatchByType = 'metadata';
 * ```
 */
export type MatchByType = 'none' | 'displayName' | 'customFilename' | 'metadata';

/**
 * Strategy for merging metadata when preserving from old document
 *
 * Controls how old and new metadata are combined during Replace Upload.
 *
 * @example
 * ```typescript
 * // Prefer new metadata values when keys conflict
 * const strategy: MetadataMergeStrategy = 'preferNew';
 *
 * // Keep all metadata from both documents
 * const strategy: MetadataMergeStrategy = 'mergeAll';
 * ```
 */
export type MetadataMergeStrategy = 'preferNew' | 'preferOld' | 'mergeAll' | 'replaceEntirely';

/**
 * Details about a single deleted document during Replace Upload
 *
 * Tracks the deletion result for each matched document.
 *
 * @example
 * ```typescript
 * const deleted: DeletedDocumentDetail = {
 *   name: 'fileSearchStores/store/documents/doc-123',
 *   displayName: 'Old Document',
 *   deleted: true
 * };
 *
 * // Failed deletion
 * const failed: DeletedDocumentDetail = {
 *   name: 'fileSearchStores/store/documents/doc-456',
 *   deleted: false,
 *   error: 'Document not found'
 * };
 * ```
 */
export interface DeletedDocumentDetail {
  /** Full resource name of the deleted document */
  name: string;
  /** Optional display name of the deleted document */
  displayName?: string;
  /** Whether the deletion was successful */
  deleted: boolean;
  /** Error message if deletion failed */
  error?: string;
}

/**
 * Information about all documents deleted during Replace Upload
 *
 * Provides comprehensive details about the matching and deletion process.
 *
 * @example
 * ```typescript
 * const info: DeletedDocumentsInfo = {
 *   matchBy: 'displayName',
 *   matchCriteria: 'Technical Doc v1',
 *   totalFound: 3,
 *   totalDeleted: 2,
 *   deleteAllMatches: false,
 *   documents: [
 *     { name: 'doc-1', deleted: true },
 *     { name: 'doc-2', deleted: true },
 *     { name: 'doc-3', deleted: false, error: 'In use' }
 *   ]
 * };
 * ```
 */
export interface DeletedDocumentsInfo {
  /** Strategy used to match documents */
  matchBy: MatchByType;
  /** The actual criteria value used for matching */
  matchCriteria: string;
  /** Total number of documents matched */
  totalFound: number;
  /** Number of documents successfully deleted */
  totalDeleted: number;
  /** Whether all matches were deleted or just the first one */
  deleteAllMatches: boolean;
  /** Detailed information about each deleted document */
  documents: DeletedDocumentDetail[];
}

/**
 * Information about metadata preservation during Replace Upload
 *
 * Tracks how metadata was preserved and merged from the old document.
 *
 * @example
 * ```typescript
 * const info: MetadataPreservationInfo = {
 *   preserved: true,
 *   sourceDocument: 'fileSearchStores/store/documents/doc-old',
 *   strategy: 'preferNew',
 *   oldMetadataCount: 5,
 *   newMetadataCount: 3,
 *   finalMetadataCount: 7
 * };
 * ```
 */
export interface MetadataPreservationInfo {
  /** Whether metadata was preserved from old document */
  preserved: boolean;
  /** Full resource name of the source document (if metadata was preserved) */
  sourceDocument?: string;
  /** Strategy used for merging metadata */
  strategy: MetadataMergeStrategy;
  /** Number of metadata items in old document */
  oldMetadataCount: number;
  /** Number of metadata items in new upload */
  newMetadataCount: number;
  /** Total metadata items in final uploaded document */
  finalMetadataCount: number;
}

/**
 * Complete result of a Replace Upload operation
 *
 * Combines upload operation details with information about replaced documents
 * and metadata preservation.
 *
 * @example
 * ```typescript
 * const result: ReplaceUploadResult = {
 *   upload: {
 *     name: 'operations/upload-123',
 *     done: true,
 *     response: { name: 'fileSearchStores/store/documents/doc-new' }
 *   },
 *   deletedDocuments: {
 *     matchBy: 'displayName',
 *     matchCriteria: 'Technical Doc',
 *     totalFound: 1,
 *     totalDeleted: 1,
 *     deleteAllMatches: false,
 *     documents: [{ name: 'doc-old', deleted: true }]
 *   },
 *   metadata: {
 *     preserved: true,
 *     sourceDocument: 'doc-old',
 *     strategy: 'preferNew',
 *     oldMetadataCount: 3,
 *     newMetadataCount: 2,
 *     finalMetadataCount: 4
 *   }
 * };
 * ```
 */
export interface ReplaceUploadResult {
  /** The upload operation result */
  upload: Operation;
  /** Information about deleted documents (if any were matched and deleted) */
  deletedDocuments?: DeletedDocumentsInfo;
  /** Information about preserved metadata (if enabled) */
  metadata?: MetadataPreservationInfo;
}
