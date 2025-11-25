/**
 * Unit tests for replaceUpload helper functions
 */

import {
  findMatchingDocuments,
  mergeMetadata,
  getMatchCriteria,
} from '../../../../nodes/GeminiFileSearchDocuments/operations/document/replaceUploadHelpers';
import {
  Document,
  CustomMetadata,
  DocumentState,
  MatchByType,
  MetadataMergeStrategy,
} from '../../../../utils/types';

describe('replaceUploadHelpers', () => {
  // ========================================================================================
  // SAMPLE TEST DATA
  // ========================================================================================

  /**
   * Sample document with minimal fields
   */
  const mockDocument1: Document = {
    name: 'fileSearchStores/test-store/documents/doc-1',
    displayName: 'test-document.pdf',
    createTime: '2025-11-24T12:00:00Z',
    updateTime: '2025-11-24T12:00:00Z',
    state: DocumentState.STATE_ACTIVE,
    sizeBytes: '1024',
    mimeType: 'application/pdf',
  };

  /**
   * Sample document with string metadata
   */
  const mockDocument2: Document = {
    name: 'fileSearchStores/test-store/documents/doc-2',
    displayName: 'report-2023.pdf',
    customMetadata: [
      { key: 'category', stringValue: 'research' },
      { key: 'author', stringValue: 'John Doe' },
    ],
    createTime: '2025-11-24T12:00:00Z',
    updateTime: '2025-11-24T12:00:00Z',
    state: DocumentState.STATE_ACTIVE,
    sizeBytes: '2048',
    mimeType: 'application/pdf',
  };

  /**
   * Sample document with numeric metadata
   */
  const mockDocument3: Document = {
    name: 'fileSearchStores/test-store/documents/doc-3',
    displayName: 'annual-report-2023.pdf',
    customMetadata: [
      { key: 'year', numericValue: 2023 },
      { key: 'quarter', numericValue: 4 },
    ],
    createTime: '2025-11-24T12:00:00Z',
    updateTime: '2025-11-24T12:00:00Z',
    state: DocumentState.STATE_ACTIVE,
    sizeBytes: '3072',
    mimeType: 'application/pdf',
  };

  /**
   * Sample document with string list metadata
   */
  const mockDocument4: Document = {
    name: 'fileSearchStores/test-store/documents/doc-4',
    displayName: 'technical-guide.pdf',
    customMetadata: [
      { key: 'tags', stringListValue: { values: ['api', 'reference', 'v2'] } },
      { key: 'category', stringValue: 'documentation' },
    ],
    createTime: '2025-11-24T12:00:00Z',
    updateTime: '2025-11-24T12:00:00Z',
    state: DocumentState.STATE_ACTIVE,
    sizeBytes: '4096',
    mimeType: 'application/pdf',
  };

  /**
   * Sample document without displayName
   */
  const mockDocument5: Document = {
    name: 'fileSearchStores/test-store/documents/doc-5',
    // No displayName
    createTime: '2025-11-24T12:00:00Z',
    updateTime: '2025-11-24T12:00:00Z',
    state: DocumentState.STATE_ACTIVE,
    sizeBytes: '5120',
    mimeType: 'application/pdf',
  };

  /**
   * Sample document without customMetadata
   */
  const mockDocument6: Document = {
    name: 'fileSearchStores/test-store/documents/doc-6',
    displayName: 'plain-document.pdf',
    // No customMetadata
    createTime: '2025-11-24T12:00:00Z',
    updateTime: '2025-11-24T12:00:00Z',
    state: DocumentState.STATE_ACTIVE,
    sizeBytes: '6144',
    mimeType: 'application/pdf',
  };

  /**
   * Sample document with filename metadata (for customFilename matching)
   */
  const mockDocument7: Document = {
    name: 'fileSearchStores/test-store/documents/doc-7',
    displayName: 'uploaded-file.pdf',
    customMetadata: [
      { key: 'filename', stringValue: 'original-file.pdf' },
      { key: 'version', numericValue: 1 },
    ],
    createTime: '2025-11-24T12:00:00Z',
    updateTime: '2025-11-24T12:00:00Z',
    state: DocumentState.STATE_ACTIVE,
    sizeBytes: '7168',
    mimeType: 'application/pdf',
  };

  /**
   * Sample metadata for merging tests
   */
  const sampleOldMetadata: CustomMetadata[] = [
    { key: 'author', stringValue: 'Alice Smith' },
    { key: 'department', stringValue: 'Engineering' },
    { key: 'version', numericValue: 1 },
  ];

  const sampleNewMetadata: CustomMetadata[] = [
    { key: 'author', stringValue: 'Bob Johnson' },
    { key: 'status', stringValue: 'published' },
    { key: 'version', numericValue: 2 },
  ];

  // All mock documents array
  const allDocuments: Document[] = [
    mockDocument1,
    mockDocument2,
    mockDocument3,
    mockDocument4,
    mockDocument5,
    mockDocument6,
    mockDocument7,
  ];

  // ========================================================================================
  // findMatchingDocuments TESTS
  // ========================================================================================

  describe('findMatchingDocuments', () => {
    describe('matchBy = none', () => {
      it('should return empty array when matchBy is none', () => {
        const result = findMatchingDocuments(allDocuments, 'none', 'test-document.pdf', '', '', '');
        expect(result).toEqual([]);
      });

      it('should return empty array even with valid displayName when matchBy is none', () => {
        const result = findMatchingDocuments(
          allDocuments,
          'none',
          'report-2023.pdf',
          'some-filename.pdf',
          'category',
          'research',
        );
        expect(result).toEqual([]);
      });
    });

    describe('matchBy = displayName', () => {
      it('should match documents by displayName (case-insensitive)', () => {
        const result = findMatchingDocuments(
          allDocuments,
          'displayName',
          'TEST-DOCUMENT.PDF',
          '',
          '',
          '',
        );
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockDocument1);
      });

      it('should match documents by exact displayName', () => {
        const result = findMatchingDocuments(
          allDocuments,
          'displayName',
          'report-2023.pdf',
          '',
          '',
          '',
        );
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockDocument2);
      });

      it('should return empty array when no matches found', () => {
        const result = findMatchingDocuments(
          allDocuments,
          'displayName',
          'nonexistent.pdf',
          '',
          '',
          '',
        );
        expect(result).toEqual([]);
      });

      it('should return multiple matches if they exist', () => {
        // Create documents with same displayName (different case)
        const duplicateDocs: Document[] = [
          { ...mockDocument1, name: 'doc-a', displayName: 'same-file.pdf' },
          { ...mockDocument1, name: 'doc-b', displayName: 'SAME-FILE.PDF' },
          { ...mockDocument1, name: 'doc-c', displayName: 'Same-File.Pdf' },
        ];
        const result = findMatchingDocuments(
          duplicateDocs,
          'displayName',
          'same-file.pdf',
          '',
          '',
          '',
        );
        expect(result).toHaveLength(3);
      });

      it('should not match documents without displayName', () => {
        // mockDocument5 has no displayName
        const result = findMatchingDocuments(
          [mockDocument5],
          'displayName',
          'any-name.pdf',
          '',
          '',
          '',
        );
        expect(result).toEqual([]);
      });

      it('should handle mixed results with some docs having displayName and some not', () => {
        const result = findMatchingDocuments(
          allDocuments,
          'displayName',
          'test-document.pdf',
          '',
          '',
          '',
        );
        // Should only match mockDocument1, not mockDocument5 (no displayName)
        expect(result).toHaveLength(1);
        expect(result[0].displayName).toBe('test-document.pdf');
      });
    });

    describe('matchBy = customFilename', () => {
      it('should match documents by oldDocumentFilename (case-insensitive)', () => {
        const result = findMatchingDocuments(
          allDocuments,
          'customFilename',
          '',
          'ORIGINAL-FILE.PDF',
          '',
          '',
        );
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockDocument7);
      });

      it('should match documents by exact filename in metadata', () => {
        const result = findMatchingDocuments(
          allDocuments,
          'customFilename',
          '',
          'original-file.pdf',
          '',
          '',
        );
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('fileSearchStores/test-store/documents/doc-7');
      });

      it('should return empty array when no matches found', () => {
        const result = findMatchingDocuments(
          allDocuments,
          'customFilename',
          '',
          'nonexistent-file.pdf',
          '',
          '',
        );
        expect(result).toEqual([]);
      });

      it('should not match documents without customMetadata', () => {
        const result = findMatchingDocuments(
          [mockDocument6],
          'customFilename',
          '',
          'plain-document.pdf',
          '',
          '',
        );
        expect(result).toEqual([]);
      });

      it('should not match documents without filename metadata key', () => {
        // mockDocument2 has customMetadata but no 'filename' key
        const result = findMatchingDocuments(
          [mockDocument2],
          'customFilename',
          '',
          'report-2023.pdf',
          '',
          '',
        );
        expect(result).toEqual([]);
      });
    });

    describe('matchBy = metadata', () => {
      it('should match documents by string metadata value', () => {
        const result = findMatchingDocuments(
          allDocuments,
          'metadata',
          '',
          '',
          'category',
          'research',
        );
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockDocument2);
      });

      it('should match documents by numeric metadata value (converted to string)', () => {
        const result = findMatchingDocuments(allDocuments, 'metadata', '', '', 'year', '2023');
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockDocument3);
      });

      it('should match documents when value is in stringListValue', () => {
        const result = findMatchingDocuments(allDocuments, 'metadata', '', '', 'tags', 'api');
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockDocument4);
      });

      it('should match any value in stringListValue', () => {
        const result = findMatchingDocuments(allDocuments, 'metadata', '', '', 'tags', 'reference');
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockDocument4);
      });

      it('should return empty array when no metadata matches', () => {
        const result = findMatchingDocuments(
          allDocuments,
          'metadata',
          '',
          '',
          'nonexistent-key',
          'some-value',
        );
        expect(result).toEqual([]);
      });

      it('should return empty array when key exists but value does not match', () => {
        const result = findMatchingDocuments(
          allDocuments,
          'metadata',
          '',
          '',
          'category',
          'nonexistent-category',
        );
        expect(result).toEqual([]);
      });

      it('should return multiple matches when multiple docs have same metadata', () => {
        const docsWithSameMetadata: Document[] = [
          {
            ...mockDocument1,
            name: 'doc-a',
            customMetadata: [{ key: 'project', stringValue: 'alpha' }],
          },
          {
            ...mockDocument1,
            name: 'doc-b',
            customMetadata: [{ key: 'project', stringValue: 'alpha' }],
          },
          {
            ...mockDocument1,
            name: 'doc-c',
            customMetadata: [{ key: 'project', stringValue: 'beta' }],
          },
        ];
        const result = findMatchingDocuments(
          docsWithSameMetadata,
          'metadata',
          '',
          '',
          'project',
          'alpha',
        );
        expect(result).toHaveLength(2);
      });

      it('should handle documents without customMetadata', () => {
        const result = findMatchingDocuments(
          [mockDocument6],
          'metadata',
          '',
          '',
          'category',
          'research',
        );
        expect(result).toEqual([]);
      });

      it('should perform case-sensitive matching on metadata values', () => {
        // Note: Based on implementation, metadata matching is case-sensitive
        const result = findMatchingDocuments(
          allDocuments,
          'metadata',
          '',
          '',
          'category',
          'RESEARCH', // uppercase, but stored as 'research'
        );
        expect(result).toEqual([]); // Should not match due to case sensitivity
      });

      it('should match exact value for string metadata', () => {
        const result = findMatchingDocuments(
          allDocuments,
          'metadata',
          '',
          '',
          'author',
          'John Doe',
        );
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockDocument2);
      });

      it('should handle empty metadata key', () => {
        const result = findMatchingDocuments(allDocuments, 'metadata', '', '', '', 'research');
        expect(result).toEqual([]);
      });

      it('should handle empty metadata value', () => {
        const result = findMatchingDocuments(allDocuments, 'metadata', '', '', 'category', '');
        expect(result).toEqual([]);
      });
    });

    describe('edge cases', () => {
      it('should handle empty documents array', () => {
        const result = findMatchingDocuments([], 'displayName', 'test.pdf', '', '', '');
        expect(result).toEqual([]);
      });

      it('should handle undefined displayName in documents', () => {
        const docsWithUndefinedDisplayName: Document[] = [
          { ...mockDocument1, displayName: undefined },
        ];
        const result = findMatchingDocuments(
          docsWithUndefinedDisplayName,
          'displayName',
          'test.pdf',
          '',
          '',
          '',
        );
        expect(result).toEqual([]);
      });

      it('should handle documents with empty customMetadata array', () => {
        const docWithEmptyMetadata: Document = {
          ...mockDocument1,
          customMetadata: [],
        };
        const result = findMatchingDocuments(
          [docWithEmptyMetadata],
          'metadata',
          '',
          '',
          'category',
          'research',
        );
        expect(result).toEqual([]);
      });

      it('should handle documents where stringListValue.values is empty', () => {
        const docWithEmptyList: Document = {
          ...mockDocument1,
          customMetadata: [{ key: 'tags', stringListValue: { values: [] } }],
        };
        const result = findMatchingDocuments([docWithEmptyList], 'metadata', '', '', 'tags', 'api');
        expect(result).toEqual([]);
      });
    });
  });

  // ========================================================================================
  // mergeMetadata TESTS
  // ========================================================================================

  describe('mergeMetadata', () => {
    describe('strategy = replaceEntirely', () => {
      it('should return only old metadata', () => {
        const result = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'replaceEntirely');
        expect(result).toHaveLength(3);
        expect(result).toEqual(sampleOldMetadata);
      });

      it('should handle empty new metadata', () => {
        const result = mergeMetadata(sampleOldMetadata, [], 'replaceEntirely');
        expect(result).toEqual(sampleOldMetadata);
      });

      it('should return empty array when old metadata is empty', () => {
        const result = mergeMetadata([], sampleNewMetadata, 'replaceEntirely');
        expect(result).toEqual([]);
      });
    });

    describe('strategy = preferNew', () => {
      it('should override old values with new values for same keys', () => {
        const result = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'preferNew');
        const authorMeta = result.find((m) => m.key === 'author');
        expect(authorMeta?.stringValue).toBe('Bob Johnson');
      });

      it('should keep old values when no new value for key', () => {
        const result = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'preferNew');
        const deptMeta = result.find((m) => m.key === 'department');
        expect(deptMeta?.stringValue).toBe('Engineering');
      });

      it('should add new keys not in old metadata', () => {
        const result = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'preferNew');
        const statusMeta = result.find((m) => m.key === 'status');
        expect(statusMeta?.stringValue).toBe('published');
      });

      it('should update numeric values correctly', () => {
        const result = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'preferNew');
        const versionMeta = result.find((m) => m.key === 'version');
        expect(versionMeta?.numericValue).toBe(2);
      });

      it('should contain all unique keys from both arrays', () => {
        const result = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'preferNew');
        const keys = result.map((m) => m.key);
        expect(keys).toContain('author');
        expect(keys).toContain('department');
        expect(keys).toContain('version');
        expect(keys).toContain('status');
        expect(result).toHaveLength(4);
      });
    });

    describe('strategy = preferOld', () => {
      it('should keep old values for same keys', () => {
        const result = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'preferOld');
        const authorMeta = result.find((m) => m.key === 'author');
        expect(authorMeta?.stringValue).toBe('Alice Smith');
      });

      it('should add new keys not in old metadata', () => {
        const result = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'preferOld');
        const statusMeta = result.find((m) => m.key === 'status');
        expect(statusMeta?.stringValue).toBe('published');
      });

      it('should not override any old values', () => {
        const result = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'preferOld');
        const versionMeta = result.find((m) => m.key === 'version');
        expect(versionMeta?.numericValue).toBe(1); // Old value preserved
      });

      it('should preserve department from old metadata', () => {
        const result = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'preferOld');
        const deptMeta = result.find((m) => m.key === 'department');
        expect(deptMeta?.stringValue).toBe('Engineering');
      });
    });

    describe('strategy = mergeAll', () => {
      it('should combine all unique keys', () => {
        const result = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'mergeAll');
        const keys = result.map((m) => m.key);
        expect(keys).toContain('author');
        expect(keys).toContain('department');
        expect(keys).toContain('version');
        expect(keys).toContain('status');
      });

      it('should use new value when keys conflict', () => {
        const result = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'mergeAll');
        const authorMeta = result.find((m) => m.key === 'author');
        expect(authorMeta?.stringValue).toBe('Bob Johnson');
      });

      it('should preserve all non-conflicting keys from both', () => {
        const result = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'mergeAll');
        const deptMeta = result.find((m) => m.key === 'department');
        const statusMeta = result.find((m) => m.key === 'status');
        expect(deptMeta?.stringValue).toBe('Engineering');
        expect(statusMeta?.stringValue).toBe('published');
      });

      it('should have same behavior as preferNew for conflicts', () => {
        const mergeAllResult = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'mergeAll');
        const preferNewResult = mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'preferNew');

        // Both should produce same result
        expect(mergeAllResult.length).toBe(preferNewResult.length);
        expect(mergeAllResult.find((m) => m.key === 'author')?.stringValue).toBe(
          preferNewResult.find((m) => m.key === 'author')?.stringValue,
        );
      });
    });

    describe('edge cases', () => {
      it('should handle empty old metadata with preferNew', () => {
        const result = mergeMetadata([], sampleNewMetadata, 'preferNew');
        expect(result).toEqual(sampleNewMetadata);
      });

      it('should handle empty new metadata with preferNew', () => {
        const result = mergeMetadata(sampleOldMetadata, [], 'preferNew');
        expect(result).toEqual(sampleOldMetadata);
      });

      it('should handle both empty with preferNew', () => {
        const result = mergeMetadata([], [], 'preferNew');
        expect(result).toEqual([]);
      });

      it('should handle empty old metadata with preferOld', () => {
        const result = mergeMetadata([], sampleNewMetadata, 'preferOld');
        expect(result).toEqual(sampleNewMetadata);
      });

      it('should handle empty new metadata with preferOld', () => {
        const result = mergeMetadata(sampleOldMetadata, [], 'preferOld');
        expect(result).toEqual(sampleOldMetadata);
      });

      it('should handle metadata with stringListValue', () => {
        const oldWithList: CustomMetadata[] = [
          { key: 'tags', stringListValue: { values: ['old1', 'old2'] } },
        ];
        const newWithList: CustomMetadata[] = [
          { key: 'tags', stringListValue: { values: ['new1', 'new2'] } },
        ];
        const result = mergeMetadata(oldWithList, newWithList, 'preferNew');
        expect(result).toHaveLength(1);
        expect(result[0].stringListValue?.values).toEqual(['new1', 'new2']);
      });

      it('should handle duplicate keys in same metadata array', () => {
        // Note: When old metadata has duplicate keys, only the FIRST occurrence is replaced by new value
        // The second duplicate remains in the result (this is edge case behavior)
        const oldWithDupes: CustomMetadata[] = [
          { key: 'author', stringValue: 'First' },
          { key: 'author', stringValue: 'Second' },
        ];
        const result = mergeMetadata(oldWithDupes, sampleNewMetadata, 'preferNew');
        // The first 'author' gets replaced by new value, but second duplicate remains
        const authorMetas = result.filter((m) => m.key === 'author');
        expect(authorMetas).toHaveLength(2); // Both remain (edge case behavior)
        // First author should be new value (preferNew replaces first occurrence)
        expect(authorMetas[0].stringValue).toBe('Bob Johnson');
        // Second author remains from old array
        expect(authorMetas[1].stringValue).toBe('Second');
      });

      it('should create copies and not mutate original arrays', () => {
        const oldCopy = [...sampleOldMetadata];
        const newCopy = [...sampleNewMetadata];
        mergeMetadata(sampleOldMetadata, sampleNewMetadata, 'preferNew');
        expect(sampleOldMetadata).toEqual(oldCopy);
        expect(sampleNewMetadata).toEqual(newCopy);
      });

      it('should handle mixed value types for same key', () => {
        const oldMixed: CustomMetadata[] = [{ key: 'count', stringValue: 'ten' }];
        const newMixed: CustomMetadata[] = [{ key: 'count', numericValue: 10 }];
        const result = mergeMetadata(oldMixed, newMixed, 'preferNew');
        expect(result).toHaveLength(1);
        expect(result[0].numericValue).toBe(10);
        expect(result[0].stringValue).toBeUndefined();
      });
    });
  });

  // ========================================================================================
  // getMatchCriteria TESTS
  // ========================================================================================

  describe('getMatchCriteria', () => {
    it('should return descriptive string for matchBy = none', () => {
      const result = getMatchCriteria('none', '', '', '', '');
      expect(result).toBe('none (upload only)');
    });

    it('should return descriptive string for matchBy = displayName', () => {
      const result = getMatchCriteria('displayName', 'report.pdf', '', '', '');
      expect(result).toBe("displayName = 'report.pdf'");
    });

    it('should return descriptive string for matchBy = customFilename', () => {
      const result = getMatchCriteria('customFilename', '', 'original.pdf', '', '');
      expect(result).toBe("filename = 'original.pdf'");
    });

    it('should return descriptive string for matchBy = metadata', () => {
      const result = getMatchCriteria('metadata', '', '', 'documentId', 'doc-123');
      expect(result).toBe("metadata.documentId = 'doc-123'");
    });

    it('should handle empty displayName gracefully', () => {
      const result = getMatchCriteria('displayName', '', '', '', '');
      expect(result).toBe("displayName = ''");
    });

    it('should handle empty filename gracefully', () => {
      const result = getMatchCriteria('customFilename', '', '', '', '');
      expect(result).toBe("filename = ''");
    });

    it('should handle empty metadata key and value', () => {
      const result = getMatchCriteria('metadata', '', '', '', '');
      expect(result).toBe("metadata. = ''");
    });

    it('should include special characters in output', () => {
      const result = getMatchCriteria('displayName', "file's-name.pdf", '', '', '');
      expect(result).toBe("displayName = 'file's-name.pdf'");
    });

    it('should handle spaces in displayName', () => {
      const result = getMatchCriteria('displayName', 'my document.pdf', '', '', '');
      expect(result).toBe("displayName = 'my document.pdf'");
    });

    it('should handle spaces in metadata values', () => {
      const result = getMatchCriteria('metadata', '', '', 'full name', 'John Doe');
      expect(result).toBe("metadata.full name = 'John Doe'");
    });
  });
});
