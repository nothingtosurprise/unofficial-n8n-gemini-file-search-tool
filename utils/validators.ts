import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

/**
 * Validates that a store name follows the required Gemini API format
 *
 * Store names must match the pattern: fileSearchStores/{id}
 * where {id} is 1-40 lowercase alphanumeric characters or dashes.
 *
 * @param this - n8n execution context
 * @param name - Store name to validate (e.g., 'fileSearchStores/my-store-123')
 * @throws {NodeOperationError} When store name doesn't match required format
 *
 * @example
 * ```typescript
 * // Valid store names
 * validateStoreName.call(this, 'fileSearchStores/my-store');
 * validateStoreName.call(this, 'fileSearchStores/store-123');
 *
 * // Invalid - throws error
 * validateStoreName.call(this, 'my-store'); // Missing prefix
 * validateStoreName.call(this, 'fileSearchStores/My-Store'); // Uppercase not allowed
 * ```
 */
export function validateStoreName(this: IExecuteFunctions, name: string): void {
  const pattern = /^fileSearchStores\/[a-z0-9-]{1,40}$/;
  if (!pattern.test(name)) {
    throw new NodeOperationError(
      this.getNode(),
      'Invalid store name format. Must be: fileSearchStores/{id} where id is 1-40 lowercase alphanumeric characters or dashes',
    );
  }
}

/**
 * Validates that a display name doesn't exceed the maximum allowed length
 *
 * Gemini API limits display names to 512 characters for both stores and documents.
 *
 * @param this - n8n execution context
 * @param name - Display name to validate
 * @throws {NodeOperationError} When display name exceeds 512 characters
 *
 * @example
 * ```typescript
 * // Valid display name
 * validateDisplayName.call(this, 'My Document Store');
 *
 * // Invalid - throws error if > 512 chars
 * validateDisplayName.call(this, 'x'.repeat(513));
 * ```
 */
export function validateDisplayName(this: IExecuteFunctions, name: string): void {
  if (name.length > 512) {
    throw new NodeOperationError(this.getNode(), 'Display name must be 512 characters or less');
  }
}

/**
 * Validates custom metadata array against Gemini API constraints
 *
 * Validates that:
 * - Maximum 20 metadata items are provided
 * - Each item has a key
 * - Each item has exactly one value type (stringValue, stringListValue, or numericValue)
 *
 * @param this - n8n execution context
 * @param metadata - Array of custom metadata items to validate
 * @throws {NodeOperationError} When metadata exceeds limits or has invalid structure
 *
 * @example
 * ```typescript
 * // Valid metadata
 * validateCustomMetadata.call(this, [
 *   { key: 'category', stringValue: 'docs' },
 *   { key: 'version', numericValue: 2.0 },
 *   { key: 'tags', stringListValue: { values: ['tag1', 'tag2'] } }
 * ]);
 *
 * // Invalid - throws error
 * validateCustomMetadata.call(this, [
 *   { key: 'test', stringValue: 'a', numericValue: 1 } // Multiple value types
 * ]);
 * ```
 */
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

/**
 * Validates metadata filter query syntax for balanced quotes and parentheses
 *
 * Ensures that filter expressions have:
 * - Even number of double quotes (balanced pairs)
 * - Balanced parentheses (matching opening and closing)
 *
 * @param this - n8n execution context
 * @param filter - Metadata filter expression to validate
 * @throws {NodeOperationError} When filter has unbalanced quotes or parentheses
 *
 * @example
 * ```typescript
 * // Valid filters
 * validateMetadataFilter.call(this, 'category="docs"');
 * validateMetadataFilter.call(this, '(category="docs" OR category="api") AND version>1');
 *
 * // Invalid - throws error
 * validateMetadataFilter.call(this, 'category="docs'); // Unbalanced quote
 * validateMetadataFilter.call(this, '(category="docs"'); // Unbalanced parenthesis
 * ```
 */
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

/**
 * Validates that a file size doesn't exceed the Gemini API maximum limit
 *
 * Gemini File Search API limits individual files to 100MB (104,857,600 bytes).
 *
 * @param this - n8n execution context
 * @param sizeBytes - File size in bytes to validate
 * @throws {NodeOperationError} When file size exceeds 100MB limit
 *
 * @example
 * ```typescript
 * // Valid file size
 * validateFileSize.call(this, 50 * 1024 * 1024); // 50MB - OK
 *
 * // Invalid - throws error
 * validateFileSize.call(this, 150 * 1024 * 1024); // 150MB - too large
 * ```
 */
export function validateFileSize(this: IExecuteFunctions, sizeBytes: number): void {
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (sizeBytes > maxSize) {
    throw new NodeOperationError(
      this.getNode(),
      `File size (${(sizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds maximum of 100MB`,
    );
  }
}
