import { CustomMetadata, Document } from './types';

/**
 * Evaluates if a document matches a metadata filter expression
 *
 * Supports AIP-160 style filters with parentheses:
 * - String equality: key="value"
 * - String contains: key~"value" (case-insensitive)
 * - String starts with: key^="value" (case-insensitive)
 * - String ends with: key$="value" (case-insensitive)
 * - Numeric comparison: key>10, key>=10, key<10, key<=10, key=10
 * - AND operator: condition1 AND condition2
 * - OR operator: condition1 OR condition2
 * - Parentheses grouping: (condition1 OR condition2) AND condition3
 *
 * @param document - Document to evaluate
 * @param filterExpression - Filter expression (e.g., 'filename~"Latour" AND year>2000')
 * @returns True if document matches the filter
 *
 * @example
 * ```typescript
 * const doc = {
 *   customMetadata: [
 *     { key: 'filename', stringValue: 'Latour - 2006 - Paper.pdf' },
 *     { key: 'year', numericValue: 2006 }
 *   ]
 * };
 * matchesFilter(doc, 'filename~"Latour" AND year>2000'); // true
 * matchesFilter(doc, 'filename^="Latour"'); // true (starts with)
 * matchesFilter(doc, 'filename$=".pdf"'); // true (ends with)
 * ```
 */
export function matchesFilter(document: Document, filterExpression: string): boolean {
  if (!filterExpression || filterExpression.trim() === '') {
    return true; // No filter means all documents match
  }

  const metadata = document.customMetadata || [];
  const expression = filterExpression.trim();

  // Parse the expression with parentheses support
  return evaluateExpression(metadata, expression);
}

/**
 * Evaluates a filter expression with support for parentheses, AND, and OR operators
 */
function evaluateExpression(metadata: CustomMetadata[], expression: string): boolean {
  const expr = expression.trim();

  // Handle placeholders from parentheses evaluation
  if (expr === '__TRUE__') return true;
  if (expr === '__FALSE__') return false;

  // Handle parentheses first - find and evaluate innermost parentheses
  if (expr.includes('(')) {
    return evaluateWithParentheses(metadata, expr);
  }

  // No parentheses - evaluate OR operators (lower precedence)
  if (expr.includes(' OR ')) {
    const conditions = splitByOperator(expr, ' OR ');
    return conditions.some((condition) => evaluateExpression(metadata, condition.trim()));
  }

  // Evaluate AND operators (higher precedence)
  if (expr.includes(' AND ')) {
    const conditions = splitByOperator(expr, ' AND ');
    return conditions.every((condition) => evaluateExpression(metadata, condition.trim()));
  }

  // Single condition
  return evaluateCondition(metadata, expr);
}

/**
 * Handles expressions with parentheses by recursively evaluating grouped expressions
 */
function evaluateWithParentheses(metadata: CustomMetadata[], expression: string): boolean {
  let processed = expression;

  // Keep processing until no parentheses remain
  while (processed.includes('(')) {
    // Find innermost parentheses (one without nested parentheses)
    let start = -1;
    let end = -1;

    for (let i = 0; i < processed.length; i++) {
      if (processed[i] === '(') {
        start = i; // Keep updating start to get the last opening paren before a closing
      } else if (processed[i] === ')' && start !== -1) {
        end = i;
        break; // Found a pair with no nested parens between them
      }
    }

    if (start === -1 || end === -1) {
      // Malformed expression - unbalanced parentheses
      return false;
    }

    // Extract and evaluate the expression inside parentheses
    const innerExpression = processed.substring(start + 1, end);
    const result = evaluateExpression(metadata, innerExpression);

    // Replace the parenthesized expression with a placeholder based on result
    const placeholder = result ? '__TRUE__' : '__FALSE__';
    processed = processed.substring(0, start) + placeholder + processed.substring(end + 1);
  }

  // Now evaluate the expression with mixed placeholders and conditions
  return evaluateMixedExpression(metadata, processed.trim());
}

/**
 * Evaluates an expression containing mixed __TRUE__/__FALSE__ placeholders and conditions
 */
function evaluateMixedExpression(metadata: CustomMetadata[], expression: string): boolean {
  const expr = expression.trim();

  // Handle single placeholder
  if (expr === '__TRUE__') return true;
  if (expr === '__FALSE__') return false;

  // Handle OR operators (lower precedence)
  const orParts = expr.split(' OR ');
  if (orParts.length > 1) {
    return orParts.some((part) => evaluateMixedExpression(metadata, part.trim()));
  }

  // Handle AND operators (higher precedence)
  const andParts = expr.split(' AND ');
  if (andParts.length > 1) {
    return andParts.every((part) => evaluateMixedExpression(metadata, part.trim()));
  }

  // Must be a single condition
  return evaluateCondition(metadata, expr);
}

/**
 * Splits an expression by an operator, respecting quoted strings
 * This ensures we don't split on operators inside quoted strings
 */
function splitByOperator(expression: string, operator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < expression.length) {
    const char = expression[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      i++;
    } else if (!inQuotes && expression.substring(i, i + operator.length) === operator) {
      // Found operator outside quotes
      result.push(current);
      current = '';
      i += operator.length;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last part
  if (current) {
    result.push(current);
  }

  return result;
}

/**
 * Evaluates a single filter condition against metadata
 */
function evaluateCondition(metadata: CustomMetadata[], condition: string): boolean {
  // Match string equality: key="value"
  const stringEqualityMatch = condition.match(/^(\w+)="([^"]*)"$/);
  if (stringEqualityMatch) {
    const [, key, value] = stringEqualityMatch;
    return metadata.some(
      (m) =>
        m.key === key && (m.stringValue === value || m.stringListValue?.values.includes(value)),
    );
  }

  // Match string contains: key~"value" (case-insensitive)
  const containsMatch = condition.match(/^(\w+)~"([^"]*)"$/);
  if (containsMatch) {
    const [, key, value] = containsMatch;
    const valueLower = value.toLowerCase();
    return metadata.some((m) => {
      if (m.key !== key) return false;
      if (m.stringValue) {
        return m.stringValue.toLowerCase().includes(valueLower);
      }
      if (m.stringListValue?.values) {
        return m.stringListValue.values.some((v) => v.toLowerCase().includes(valueLower));
      }
      return false;
    });
  }

  // Match string starts with: key^="value" (case-insensitive)
  const startsWithMatch = condition.match(/^(\w+)\^="([^"]*)"$/);
  if (startsWithMatch) {
    const [, key, value] = startsWithMatch;
    const valueLower = value.toLowerCase();
    return metadata.some((m) => {
      if (m.key !== key) return false;
      if (m.stringValue) {
        return m.stringValue.toLowerCase().startsWith(valueLower);
      }
      if (m.stringListValue?.values) {
        return m.stringListValue.values.some((v) => v.toLowerCase().startsWith(valueLower));
      }
      return false;
    });
  }

  // Match string ends with: key$="value" (case-insensitive)
  const endsWithMatch = condition.match(/^(\w+)\$="([^"]*)"$/);
  if (endsWithMatch) {
    const [, key, value] = endsWithMatch;
    const valueLower = value.toLowerCase();
    return metadata.some((m) => {
      if (m.key !== key) return false;
      if (m.stringValue) {
        return m.stringValue.toLowerCase().endsWith(valueLower);
      }
      if (m.stringListValue?.values) {
        return m.stringListValue.values.some((v) => v.toLowerCase().endsWith(valueLower));
      }
      return false;
    });
  }

  // Match numeric comparison: key>10, key>=10, key<10, key<=10, key=10
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
