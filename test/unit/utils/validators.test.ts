/**
 * Unit Tests for Validator Utilities
 * Tests all validation functions with valid, invalid, and edge case inputs
 */

import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import {
  validateStoreName,
  validateDisplayName,
  validateCustomMetadata,
  validateMetadataFilter,
  validateFileSize,
} from '../../../utils/validators';

describe('validators', () => {
  let mockContext: Partial<IExecuteFunctions>;

  beforeEach(() => {
    mockContext = {
      getNode: jest.fn().mockReturnValue({
        id: 'test-node-id',
        name: 'Test Node',
        type: 'n8n-nodes-base.test',
        typeVersion: 1,
        position: [0, 0],
        parameters: {},
      }),
    };
  });

  describe('validateStoreName', () => {
    it('should accept valid store name', () => {
      expect(() => {
        validateStoreName.call(mockContext as IExecuteFunctions, 'fileSearchStores/test-store');
      }).not.toThrow();
    });

    it('should accept store name with numbers', () => {
      expect(() => {
        validateStoreName.call(mockContext as IExecuteFunctions, 'fileSearchStores/store123');
      }).not.toThrow();
    });

    it('should accept store name with dashes', () => {
      expect(() => {
        validateStoreName.call(mockContext as IExecuteFunctions, 'fileSearchStores/my-store-name');
      }).not.toThrow();
    });

    it('should accept store name with 40 characters', () => {
      const longName = 'fileSearchStores/' + 'a'.repeat(40);
      expect(() => {
        validateStoreName.call(mockContext as IExecuteFunctions, longName);
      }).not.toThrow();
    });

    it('should accept store name with 1 character', () => {
      expect(() => {
        validateStoreName.call(mockContext as IExecuteFunctions, 'fileSearchStores/a');
      }).not.toThrow();
    });

    it('should reject store name without prefix', () => {
      expect(() => {
        validateStoreName.call(mockContext as IExecuteFunctions, 'test-store');
      }).toThrow(NodeOperationError);
    });

    it('should reject store name with uppercase letters', () => {
      expect(() => {
        validateStoreName.call(mockContext as IExecuteFunctions, 'fileSearchStores/TestStore');
      }).toThrow(NodeOperationError);
    });

    it('should reject store name with special characters', () => {
      expect(() => {
        validateStoreName.call(mockContext as IExecuteFunctions, 'fileSearchStores/test_store');
      }).toThrow(NodeOperationError);
    });

    it('should reject store name longer than 40 characters', () => {
      const longName = 'fileSearchStores/' + 'a'.repeat(41);
      expect(() => {
        validateStoreName.call(mockContext as IExecuteFunctions, longName);
      }).toThrow(NodeOperationError);
    });

    it('should reject empty store name', () => {
      expect(() => {
        validateStoreName.call(mockContext as IExecuteFunctions, 'fileSearchStores/');
      }).toThrow(NodeOperationError);
    });

    it('should reject store name with spaces', () => {
      expect(() => {
        validateStoreName.call(mockContext as IExecuteFunctions, 'fileSearchStores/test store');
      }).toThrow(NodeOperationError);
    });

    it('should provide helpful error message', () => {
      try {
        validateStoreName.call(mockContext as IExecuteFunctions, 'invalid-name');
      } catch (error: any) {
        expect(error.message).toContain('Invalid store name format');
        expect(error.message).toContain('fileSearchStores/{id}');
        expect(error.message).toContain('1-40 lowercase alphanumeric');
      }
    });
  });

  describe('validateDisplayName', () => {
    it('should accept valid display name', () => {
      expect(() => {
        validateDisplayName.call(mockContext as IExecuteFunctions, 'My Test Store');
      }).not.toThrow();
    });

    it('should accept empty display name', () => {
      expect(() => {
        validateDisplayName.call(mockContext as IExecuteFunctions, '');
      }).not.toThrow();
    });

    it('should accept display name with special characters', () => {
      expect(() => {
        validateDisplayName.call(mockContext as IExecuteFunctions, 'Store #1 (2024) - Main');
      }).not.toThrow();
    });

    it('should accept display name with unicode characters', () => {
      expect(() => {
        validateDisplayName.call(mockContext as IExecuteFunctions, 'Store 店舗 магазин');
      }).not.toThrow();
    });

    it('should accept display name with 512 characters', () => {
      const maxName = 'a'.repeat(512);
      expect(() => {
        validateDisplayName.call(mockContext as IExecuteFunctions, maxName);
      }).not.toThrow();
    });

    it('should reject display name longer than 512 characters', () => {
      const tooLong = 'a'.repeat(513);
      expect(() => {
        validateDisplayName.call(mockContext as IExecuteFunctions, tooLong);
      }).toThrow(NodeOperationError);
    });

    it('should provide helpful error message', () => {
      const tooLong = 'a'.repeat(513);
      try {
        validateDisplayName.call(mockContext as IExecuteFunctions, tooLong);
      } catch (error: any) {
        expect(error.message).toContain('Display name must be 512 characters or less');
      }
    });
  });

  describe('validateCustomMetadata', () => {
    it('should accept valid metadata with string value', () => {
      const metadata = [{ key: 'author', stringValue: 'John Doe' }];
      expect(() => {
        validateCustomMetadata.call(mockContext as IExecuteFunctions, metadata);
      }).not.toThrow();
    });

    it('should accept valid metadata with numeric value', () => {
      const metadata = [{ key: 'version', numericValue: 1 }];
      expect(() => {
        validateCustomMetadata.call(mockContext as IExecuteFunctions, metadata);
      }).not.toThrow();
    });

    it('should accept valid metadata with string list value', () => {
      const metadata = [{ key: 'tags', stringListValue: { values: ['tag1', 'tag2'] } }];
      expect(() => {
        validateCustomMetadata.call(mockContext as IExecuteFunctions, metadata);
      }).not.toThrow();
    });

    it('should accept multiple metadata items', () => {
      const metadata = [
        { key: 'author', stringValue: 'John Doe' },
        { key: 'version', numericValue: 2 },
        { key: 'tags', stringListValue: { values: ['important'] } },
      ];
      expect(() => {
        validateCustomMetadata.call(mockContext as IExecuteFunctions, metadata);
      }).not.toThrow();
    });

    it('should accept 20 metadata items', () => {
      const metadata = Array.from({ length: 20 }, (_, i) => ({
        key: `key${i}`,
        stringValue: `value${i}`,
      }));
      expect(() => {
        validateCustomMetadata.call(mockContext as IExecuteFunctions, metadata);
      }).not.toThrow();
    });

    it('should accept empty metadata array', () => {
      expect(() => {
        validateCustomMetadata.call(mockContext as IExecuteFunctions, []);
      }).not.toThrow();
    });

    it('should reject more than 20 metadata items', () => {
      const metadata = Array.from({ length: 21 }, (_, i) => ({
        key: `key${i}`,
        stringValue: `value${i}`,
      }));
      expect(() => {
        validateCustomMetadata.call(mockContext as IExecuteFunctions, metadata);
      }).toThrow(NodeOperationError);
    });

    it('should reject metadata without key', () => {
      const metadata = [{ stringValue: 'value' }];
      expect(() => {
        validateCustomMetadata.call(mockContext as IExecuteFunctions, metadata);
      }).toThrow(NodeOperationError);
    });

    it('should reject metadata with multiple value types', () => {
      const metadata = [{ key: 'test', stringValue: 'value', numericValue: 1 }];
      expect(() => {
        validateCustomMetadata.call(mockContext as IExecuteFunctions, metadata);
      }).toThrow(NodeOperationError);
    });

    it('should reject metadata with no value type', () => {
      const metadata = [{ key: 'test' }];
      expect(() => {
        validateCustomMetadata.call(mockContext as IExecuteFunctions, metadata);
      }).toThrow(NodeOperationError);
    });

    it('should provide helpful error messages', () => {
      const metadata = Array.from({ length: 21 }, (_, i) => ({
        key: `key${i}`,
        stringValue: `value${i}`,
      }));
      try {
        validateCustomMetadata.call(mockContext as IExecuteFunctions, metadata);
      } catch (error: any) {
        expect(error.message).toContain('Maximum 20 custom metadata items allowed');
      }
    });

    it('should include key name in error message for invalid metadata', () => {
      const metadata = [{ key: 'testKey', stringValue: 'value', numericValue: 1 }];
      try {
        validateCustomMetadata.call(mockContext as IExecuteFunctions, metadata);
      } catch (error: any) {
        expect(error.message).toContain('testKey');
        expect(error.message).toContain('exactly one value type');
      }
    });
  });

  describe('validateMetadataFilter', () => {
    it('should accept valid filter with balanced quotes', () => {
      expect(() => {
        validateMetadataFilter.call(mockContext as IExecuteFunctions, 'author="John Doe"');
      }).not.toThrow();
    });

    it('should accept valid filter with balanced parentheses', () => {
      expect(() => {
        validateMetadataFilter.call(
          mockContext as IExecuteFunctions,
          '(author="John" AND version>1)',
        );
      }).not.toThrow();
    });

    it('should accept filter with nested parentheses', () => {
      expect(() => {
        validateMetadataFilter.call(
          mockContext as IExecuteFunctions,
          '((author="John" OR author="Jane") AND version>1)',
        );
      }).not.toThrow();
    });

    it('should accept filter with multiple quoted strings', () => {
      expect(() => {
        validateMetadataFilter.call(
          mockContext as IExecuteFunctions,
          'author="John" OR title="Test Document"',
        );
      }).not.toThrow();
    });

    it('should accept filter without quotes', () => {
      expect(() => {
        validateMetadataFilter.call(mockContext as IExecuteFunctions, 'version>1');
      }).not.toThrow();
    });

    it('should accept empty filter', () => {
      expect(() => {
        validateMetadataFilter.call(mockContext as IExecuteFunctions, '');
      }).not.toThrow();
    });

    it('should reject filter with unbalanced opening quote', () => {
      expect(() => {
        validateMetadataFilter.call(mockContext as IExecuteFunctions, 'author="John');
      }).toThrow(NodeOperationError);
    });

    it('should reject filter with unbalanced closing quote', () => {
      expect(() => {
        validateMetadataFilter.call(mockContext as IExecuteFunctions, 'author=John"');
      }).toThrow(NodeOperationError);
    });

    it('should reject filter with unbalanced opening parenthesis', () => {
      expect(() => {
        validateMetadataFilter.call(mockContext as IExecuteFunctions, '(author="John"');
      }).toThrow(NodeOperationError);
    });

    it('should reject filter with unbalanced closing parenthesis', () => {
      expect(() => {
        validateMetadataFilter.call(mockContext as IExecuteFunctions, 'author="John")');
      }).toThrow(NodeOperationError);
    });

    it('should reject filter with mismatched parentheses', () => {
      expect(() => {
        validateMetadataFilter.call(mockContext as IExecuteFunctions, '(author="John"))');
      }).toThrow(NodeOperationError);
    });

    it('should provide helpful error message for unbalanced quotes', () => {
      try {
        validateMetadataFilter.call(mockContext as IExecuteFunctions, 'author="John');
      } catch (error: any) {
        expect(error.message).toContain('unbalanced quotes');
      }
    });

    it('should provide helpful error message for unbalanced parentheses', () => {
      try {
        validateMetadataFilter.call(mockContext as IExecuteFunctions, '(author="John"');
      } catch (error: any) {
        expect(error.message).toContain('unbalanced parentheses');
      }
    });
  });

  describe('validateFileSize', () => {
    it('should accept file size of 1 byte', () => {
      expect(() => {
        validateFileSize.call(mockContext as IExecuteFunctions, 1);
      }).not.toThrow();
    });

    it('should accept file size of 1 MB', () => {
      expect(() => {
        validateFileSize.call(mockContext as IExecuteFunctions, 1024 * 1024);
      }).not.toThrow();
    });

    it('should accept file size of 50 MB', () => {
      expect(() => {
        validateFileSize.call(mockContext as IExecuteFunctions, 50 * 1024 * 1024);
      }).not.toThrow();
    });

    it('should accept file size of exactly 100 MB', () => {
      expect(() => {
        validateFileSize.call(mockContext as IExecuteFunctions, 100 * 1024 * 1024);
      }).not.toThrow();
    });

    it('should accept file size of 0 bytes', () => {
      expect(() => {
        validateFileSize.call(mockContext as IExecuteFunctions, 0);
      }).not.toThrow();
    });

    it('should reject file size over 100 MB', () => {
      expect(() => {
        validateFileSize.call(mockContext as IExecuteFunctions, 100 * 1024 * 1024 + 1);
      }).toThrow(NodeOperationError);
    });

    it('should reject file size of 200 MB', () => {
      expect(() => {
        validateFileSize.call(mockContext as IExecuteFunctions, 200 * 1024 * 1024);
      }).toThrow(NodeOperationError);
    });

    it('should provide helpful error message with size in MB', () => {
      const size = 150 * 1024 * 1024; // 150 MB
      try {
        validateFileSize.call(mockContext as IExecuteFunctions, size);
      } catch (error: any) {
        expect(error.message).toContain('150.00MB');
        expect(error.message).toContain('exceeds maximum of 100MB');
      }
    });

    it('should format size with 2 decimal places', () => {
      const size = 125.5 * 1024 * 1024; // 125.5 MB
      try {
        validateFileSize.call(mockContext as IExecuteFunctions, size);
      } catch (error: any) {
        expect(error.message).toMatch(/\d+\.\d{2}MB/);
      }
    });
  });
});
