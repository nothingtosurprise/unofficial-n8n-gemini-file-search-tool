export interface FileSearchStore {
  name: string;
  displayName?: string;
  createTime: string;
  updateTime: string;
  activeDocumentsCount: string;
  pendingDocumentsCount: string;
  failedDocumentsCount: string;
  sizeBytes: string;
}

export interface Document {
  name: string;
  displayName?: string;
  customMetadata?: CustomMetadata[];
  createTime: string;
  updateTime: string;
  state: DocumentState;
  sizeBytes: string;
  mimeType: string;
}

export interface CustomMetadata {
  key: string;
  stringValue?: string;
  stringListValue?: { values: string[] };
  numericValue?: number;
}

export enum DocumentState {
  STATE_UNSPECIFIED = 'STATE_UNSPECIFIED',
  STATE_PENDING = 'STATE_PENDING',
  STATE_ACTIVE = 'STATE_ACTIVE',
  STATE_FAILED = 'STATE_FAILED',
}

export interface ChunkingConfig {
  whiteSpaceConfig?: {
    maxTokensPerChunk?: number;
    maxOverlapTokens?: number;
  };
}

export interface Operation {
  name: string;
  metadata?: {
    '@type': string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  done: boolean;
  error?: {
    code: number;
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: any[];
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response?: any;
}
