import { CustomMetadata, Document } from './types';

/**
 * Evaluates if a document matches a metadata filter expression
 *
 * Supports simple AIP-160 style filters:
 * - String equality: key="value"
 * - Numeric comparison: key>10, key>=10, key<10, key<=10, key=10
 * - AND operator: condition1 AND condition2
 * - OR operator: condition1 OR condition2
 *
 * @param document - Document to evaluate
 * @param filterExpression - Filter expression (e.g., 'author="Latour" AND year>2000')
 * @returns True if document matches the filter
 *
 * @example
 * ```typescript
 * const doc = {
 *   customMetadata: [
 *     { key: 'author', stringValue: 'Latour' },
 *     { key: 'year', numericValue: 2006 }
 *   ]
 * };
 * matchesFilter(doc, 'author="Latour" AND year>2000'); // true
 * ```
 */
export function matchesFilter(document: Document, filterExpression: string): boolean {
  if (!filterExpression || filterExpression.trim() === '') {
    return true; // No filter means all documents match
  }

  const metadata = document.customMetadata || [];

  // Parse AND/OR operators (simple implementation)
  if (filterExpression.includes(' OR ')) {
    const conditions = filterExpression.split(' OR ');
    return conditions.some((condition) => matchesFilter(document, condition.trim()));
  }

  if (filterExpression.includes(' AND ')) {
    const conditions = filterExpression.split(' AND ');
    return conditions.every((condition) => matchesFilter(document, condition.trim()));
  }

  // Parse single condition
  return evaluateCondition(metadata, filterExpression.trim());
}

/**
 * Evaluates a single filter condition against metadata
 */
function evaluateCondition(metadata: CustomMetadata[], condition: string): boolean {
  // Match patterns: key="value", key>10, key>=10, key<10, key<=10, key=10
  const stringMatch = condition.match(/^(\w+)="([^"]*)"$/);
  if (stringMatch) {
    const [, key, value] = stringMatch;
    return metadata.some(
      (m) =>
        m.key === key && (m.stringValue === value || m.stringListValue?.values.includes(value)),
    );
  }

  const numericMatch = condition.match(/^(\w+)(>=|<=|>|<|=)(\d+(?:\.\d+)?)$/);
  if (numericMatch) {
    const [, key, operator, valueStr] = numericMatch;
    const value = parseFloat(valueStr);
    const metadataValue = metadata.find((m) => m.key === key)?.numericValue;

    if (metadataValue === undefined) {
      return false;
    }

    switch (operator) {
      case '>':
        return metadataValue > value;
      case '>=':
        return metadataValue >= value;
      case '<':
        return metadataValue < value;
      case '<=':
        return metadataValue <= value;
      case '=':
        return metadataValue === value;
      default:
        return false;
    }
  }

  // Unsupported condition format
  return false;
}

/**
 * Filters an array of documents based on a metadata filter expression
 *
 * @param documents - Array of documents to filter
 * @param filterExpression - Filter expression
 * @returns Filtered array of documents
 *
 * @example
 * ```typescript
 * const docs = await listAllDocuments();
 * const filtered = filterDocuments(docs, 'type="pdf" AND year>2020');
 * console.log(`Found ${filtered.length} matching documents`);
 * ```
 */
export function filterDocuments(documents: Document[], filterExpression: string): Document[] {
  if (!filterExpression || filterExpression.trim() === '') {
    return documents;
  }

  return documents.filter((doc) => matchesFilter(doc, filterExpression));
}
