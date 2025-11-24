import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

export function validateStoreName(this: IExecuteFunctions, name: string): void {
  const pattern = /^fileSearchStores\/[a-z0-9-]{1,40}$/;
  if (!pattern.test(name)) {
    throw new NodeOperationError(
      this.getNode(),
      'Invalid store name format. Must be: fileSearchStores/{id} where id is 1-40 lowercase alphanumeric characters or dashes',
    );
  }
}

export function validateDisplayName(this: IExecuteFunctions, name: string): void {
  if (name.length > 512) {
    throw new NodeOperationError(this.getNode(), 'Display name must be 512 characters or less');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateCustomMetadata(this: IExecuteFunctions, metadata: any[]): void {
  if (metadata.length > 20) {
    throw new NodeOperationError(this.getNode(), 'Maximum 20 custom metadata items allowed');
  }

  for (const item of metadata) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!item.key) {
      throw new NodeOperationError(this.getNode(), 'Custom metadata must have a key');
    }

    const valueCount = [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      item.stringValue,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      item.stringListValue,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      item.numericValue,
    ].filter((v) => v !== undefined).length;

    if (valueCount !== 1) {
      throw new NodeOperationError(
        this.getNode(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
        `Custom metadata "${item.key}" must have exactly one value type (stringValue, stringListValue, or numericValue)`,
      );
    }
  }
}

export function validateMetadataFilter(this: IExecuteFunctions, filter: string): void {
  // Check for balanced quotes
  const quotes = filter.match(/"/g);
  if (quotes && quotes.length % 2 !== 0) {
    throw new NodeOperationError(this.getNode(), 'Metadata filter has unbalanced quotes');
  }

  // Check for balanced parentheses
  let depth = 0;
  for (const char of filter) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (depth < 0) {
      throw new NodeOperationError(this.getNode(), 'Metadata filter has unbalanced parentheses');
    }
  }
  if (depth !== 0) {
    throw new NodeOperationError(this.getNode(), 'Metadata filter has unbalanced parentheses');
  }
}

export function validateFileSize(this: IExecuteFunctions, sizeBytes: number): void {
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (sizeBytes > maxSize) {
    throw new NodeOperationError(
      this.getNode(),
      `File size (${(sizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds maximum of 100MB`,
    );
  }
}
