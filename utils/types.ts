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
