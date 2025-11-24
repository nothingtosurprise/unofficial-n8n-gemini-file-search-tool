/**
 * Example Test Suite
 * Verifies that Jest testing framework is properly configured
 */

import {
  createMockExecuteFunction,
  createMockNodeExecutionData,
  assertDefined,
  delay,
} from './utils/testHelpers';
import { mockCreateStoreResponse, mockListStoresResponse } from './utils/mockApiResponses';
import { ENDPOINTS } from './fixtures/apiEndpoints';
import * as sampleStore from './fixtures/sampleStore.json';
import * as sampleDocument from './fixtures/sampleDocument.json';

describe('Testing Framework Setup', () => {
  describe('Test Utilities', () => {
    it('should create mock execute function', () => {
      const params = { storeName: 'test-store' };
      const mockFn = createMockExecuteFunction(params);

      expect(mockFn).toBeDefined();
      expect(mockFn.getNodeParameter).toBeDefined();
      expect(mockFn.getInputData).toBeDefined();
    });

    it('should return correct parameter value', () => {
      const params = { storeName: 'test-store', displayName: 'Test Store' };
      const mockFn = createMockExecuteFunction(params);

      const storeName = mockFn.getNodeParameter?.('storeName', 0);
      expect(storeName).toBe('test-store');
    });

    it('should create mock node execution data', () => {
      const json = { id: 1, name: 'test' };
      const data = createMockNodeExecutionData(json);

      expect(data).toBeDefined();
      expect(data.json).toEqual(json);
    });

    it('should assert defined values', () => {
      const value = 'test';
      expect(() => assertDefined(value)).not.toThrow();

      const nullValue = null;
      expect(() => assertDefined(nullValue)).toThrow('Expected value to be defined');
    });

    it('should create delay', async () => {
      const start = Date.now();
      await delay(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some timing variance
    });
  });

  describe('Mock API Responses', () => {
    it('should provide mock create store response', () => {
      expect(mockCreateStoreResponse).toBeDefined();
      expect(mockCreateStoreResponse.name).toBe('stores/test-store-123');
      expect(mockCreateStoreResponse.displayName).toBe('Test Store');
    });

    it('should provide mock list stores response', () => {
      expect(mockListStoresResponse).toBeDefined();
      expect(mockListStoresResponse.stores).toHaveLength(2);
      expect(mockListStoresResponse.nextPageToken).toBe('next-page-token');
    });
  });

  describe('Test Fixtures', () => {
    it('should load sample store fixture', () => {
      expect(sampleStore).toBeDefined();
      expect(sampleStore.name).toBe('stores/test-store-fixture');
      expect(sampleStore.displayName).toBe('Sample Test Store');
    });

    it('should load sample document fixture', () => {
      expect(sampleDocument).toBeDefined();
      expect(sampleDocument.name).toContain('stores/test-store-fixture/documents/');
      expect(sampleDocument.displayName).toBe('sample-document.pdf');
      expect(sampleDocument.mimeType).toBe('application/pdf');
    });

    it('should provide API endpoints', () => {
      expect(ENDPOINTS.stores.create).toContain('stores');
      expect(ENDPOINTS.documents.list('test-store')).toContain('test-store/documents');
    });
  });

  describe('Jest Configuration', () => {
    it('should run TypeScript tests', () => {
      const result: string = 'TypeScript is working';
      expect(result).toBe('TypeScript is working');
    });

    it('should support async/await', async () => {
      const asyncFunction = async () => {
        return 'async result';
      };

      const result = await asyncFunction();
      expect(result).toBe('async result');
    });

    it('should support ES6 imports', () => {
      expect(createMockExecuteFunction).toBeDefined();
      expect(mockCreateStoreResponse).toBeDefined();
    });
  });

  describe('Code Coverage', () => {
    function calculateSum(a: number, b: number): number {
      return a + b;
    }

    function calculateProduct(a: number, b: number): number {
      return a * b;
    }

    it('should cover basic functions', () => {
      expect(calculateSum(2, 3)).toBe(5);
      expect(calculateProduct(2, 3)).toBe(6);
    });
  });
});
