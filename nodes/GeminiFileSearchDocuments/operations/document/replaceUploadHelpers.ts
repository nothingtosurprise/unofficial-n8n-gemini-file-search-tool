import {
  CustomMetadata,
  Document,
  MatchByType,
  MetadataMergeStrategy,
} from '../../../../utils/types';

/**
 * Find documents matching the specified criteria
 *
 * Searches through an array of documents to find matches based on the specified match type.
 * Supports matching by display name, custom filename, metadata key-value pairs, or none.
 *
 * @param documents - Array of documents to search through
 * @param matchBy - Type of matching to perform ('none', 'displayName', 'customFilename', 'metadata')
 * @param displayName - Display name to match against (used when matchBy is 'displayName')
 * @param oldDocumentFilename - Filename to match against (used when matchBy is 'customFilename')
 * @param matchMetadataKey - Metadata key to match (used when matchBy is 'metadata')
 * @param matchMetadataValue - Metadata value to match (used when matchBy is 'metadata')
 * @returns Array of matching documents (empty if matchBy is 'none' or no matches found)
 *
 * @example
 * ```typescript
 * // Match by display name
 * const matches = findMatchingDocuments(
 *   docs,
 *   'displayName',
 *   'Technical Report',
 *   '',
 *   '',
 *   ''
 * );
 *
 * // Match by metadata
 * const matches = findMatchingDocuments(
 *   docs,
 *   'metadata',
 *   '',
 *   '',
 *   'documentId',
 *   'doc-123'
 * );
 * ```
 */
export function findMatchingDocuments(
  documents: Document[],
  matchBy: MatchByType,
  displayName: string,
  oldDocumentFilename: string,
  matchMetadataKey: string,
  matchMetadataValue: string,
): Document[] {
  // If matchBy is 'none', return empty array (no matching)
  if (matchBy === 'none') {
    return [];
  }

  // If matchBy is 'displayName', match by displayName field (case-insensitive)
  if (matchBy === 'displayName') {
    const normalizedDisplayName = displayName.toLowerCase();
    return documents.filter(
      (doc) => doc.displayName && doc.displayName.toLowerCase() === normalizedDisplayName,
    );
  }

  // If matchBy is 'customFilename', match by oldDocumentFilename (case-insensitive)
  if (matchBy === 'customFilename') {
    const normalizedFilename = oldDocumentFilename.toLowerCase();
    return documents.filter((doc) => {
      if (!doc.customMetadata) {
        return false;
      }
      // Look for 'filename' metadata key
      const filenameMeta = doc.customMetadata.find((meta) => meta.key === 'filename');
      if (!filenameMeta || !filenameMeta.stringValue) {
        return false;
      }
      return filenameMeta.stringValue.toLowerCase() === normalizedFilename;
    });
  }

  // If matchBy is 'metadata', match by metadata key-value pair
  if (matchBy === 'metadata') {
    return documents.filter((doc) => {
      if (!doc.customMetadata) {
        return false;
      }

      // Find metadata with matching key
      const meta = doc.customMetadata.find((m) => m.key === matchMetadataKey);
      if (!meta) {
        return false;
      }

      // Check each value type (exact match, case-sensitive for metadata values)
      if (meta.stringValue !== undefined) {
        return meta.stringValue === matchMetadataValue;
      }

      if (meta.numericValue !== undefined) {
        // Convert numeric value to string for comparison
        return meta.numericValue.toString() === matchMetadataValue;
      }

      if (meta.stringListValue !== undefined && meta.stringListValue.values) {
        // Check if any value in the list matches
        return meta.stringListValue.values.includes(matchMetadataValue);
      }

      return false;
    });
  }

  // Default: return empty array
  return [];
}

/**
 * Merge old and new metadata based on strategy
 *
 * Combines metadata from an old document with new metadata according to the specified
 * merge strategy. Handles conflicts based on the strategy (prefer new, prefer old, etc.).
 *
 * @param oldMetadata - Metadata from the old/existing document
 * @param newMetadata - Metadata from the new upload
 * @param strategy - How to merge the metadata ('replaceEntirely', 'preferNew', 'preferOld', 'mergeAll')
 * @returns Merged metadata array
 *
 * @example
 * ```typescript
 * const old = [{ key: 'version', numericValue: 1 }];
 * const new = [{ key: 'version', numericValue: 2 }, { key: 'author', stringValue: 'Alice' }];
 *
 * // Prefer new values on conflicts
 * const merged = mergeMetadata(old, new, 'preferNew');
 * // Result: [{ key: 'version', numericValue: 2 }, { key: 'author', stringValue: 'Alice' }]
 *
 * // Keep only old metadata
 * const merged = mergeMetadata(old, new, 'replaceEntirely');
 * // Result: [{ key: 'version', numericValue: 1 }]
 * ```
 */
export function mergeMetadata(
  oldMetadata: CustomMetadata[],
  newMetadata: CustomMetadata[],
  strategy: MetadataMergeStrategy,
): CustomMetadata[] {
  // Handle empty arrays
  if (!oldMetadata || oldMetadata.length === 0) {
    return strategy === 'replaceEntirely' ? [] : [...newMetadata];
  }

  if (!newMetadata || newMetadata.length === 0) {
    return [...oldMetadata];
  }

  // 'replaceEntirely' - return old metadata only (discard new)
  if (strategy === 'replaceEntirely') {
    return [...oldMetadata];
  }

  // 'preferNew' - start with old, override with new (same keys)
  if (strategy === 'preferNew') {
    const result = [...oldMetadata];
    const oldKeys = new Set(oldMetadata.map((m) => m.key));

    for (const newMeta of newMetadata) {
      if (oldKeys.has(newMeta.key)) {
        // Replace old value with new value
        const index = result.findIndex((m) => m.key === newMeta.key);
        result[index] = { ...newMeta };
      } else {
        // Add new key
        result.push({ ...newMeta });
      }
    }

    return result;
  }

  // 'preferOld' - start with new, override with old (same keys)
  if (strategy === 'preferOld') {
    const result = [...newMetadata];
    const newKeys = new Set(newMetadata.map((m) => m.key));

    for (const oldMeta of oldMetadata) {
      if (newKeys.has(oldMeta.key)) {
        // Replace new value with old value
        const index = result.findIndex((m) => m.key === oldMeta.key);
        result[index] = { ...oldMeta };
      } else {
        // Add old key
        result.push({ ...oldMeta });
      }
    }

    return result;
  }

  // 'mergeAll' - combine all unique keys (new wins on conflicts)
  if (strategy === 'mergeAll') {
    const result = [...oldMetadata];
    const oldKeys = new Set(oldMetadata.map((m) => m.key));

    for (const newMeta of newMetadata) {
      if (oldKeys.has(newMeta.key)) {
        // New wins on conflicts
        const index = result.findIndex((m) => m.key === newMeta.key);
        result[index] = { ...newMeta };
      } else {
        // Add new key
        result.push({ ...newMeta });
      }
    }

    return result;
  }

  // Default: return new metadata
  return [...newMetadata];
}

/**
 * Generate human-readable match criteria string
 *
 * Creates a descriptive string explaining what criteria was used to match documents.
 * Useful for logging, debugging, and user-facing messages.
 *
 * @param matchBy - Type of matching performed
 * @param displayName - Display name used for matching (if applicable)
 * @param oldDocumentFilename - Filename used for matching (if applicable)
 * @param matchMetadataKey - Metadata key used for matching (if applicable)
 * @param matchMetadataValue - Metadata value used for matching (if applicable)
 * @returns Human-readable description of match criteria
 *
 * @example
 * ```typescript
 * // For display name matching
 * const criteria = getMatchCriteria('displayName', 'report.pdf', '', '', '');
 * // Returns: "displayName = 'report.pdf'"
 *
 * // For metadata matching
 * const criteria = getMatchCriteria('metadata', '', '', 'documentId', 'doc-123');
 * // Returns: "metadata.documentId = 'doc-123'"
 *
 * // For no matching
 * const criteria = getMatchCriteria('none', '', '', '', '');
 * // Returns: "none (upload only)"
 * ```
 */
export function getMatchCriteria(
  matchBy: MatchByType,
  displayName: string,
  oldDocumentFilename: string,
  matchMetadataKey: string,
  matchMetadataValue: string,
): string {
  if (matchBy === 'none') {
    return 'none (upload only)';
  }

  if (matchBy === 'displayName') {
    return `displayName = '${displayName}'`;
  }

  if (matchBy === 'customFilename') {
    return `filename = '${oldDocumentFilename}'`;
  }

  if (matchBy === 'metadata') {
    return `metadata.${matchMetadataKey} = '${matchMetadataValue}'`;
  }

  // Default fallback
  return 'unknown';
}
