import { matchesFilter, filterDocuments } from '../../../utils/metadataFilter';
import { Document, DocumentState } from '../../../utils/types';

describe('metadataFilter', () => {
  describe('matchesFilter', () => {
    const createDocument = (metadata: any[]): Document => ({
      name: 'test-doc',
      displayName: 'Test Document',
      customMetadata: metadata,
      state: DocumentState.STATE_ACTIVE,
      createTime: '2024-01-01T00:00:00Z',
      updateTime: '2024-01-01T00:00:00Z',
      sizeBytes: '1024',
      mimeType: 'application/pdf',
    });

    describe('string equality', () => {
      it('should match exact string value', () => {
        const doc = createDocument([{ key: 'author', stringValue: 'Latour' }]);
        expect(matchesFilter(doc, 'author="Latour"')).toBe(true);
      });

      it('should not match different string value', () => {
        const doc = createDocument([{ key: 'author', stringValue: 'Callon' }]);
        expect(matchesFilter(doc, 'author="Latour"')).toBe(false);
      });

      it('should match string in stringListValue', () => {
        const doc = createDocument([
          { key: 'tags', stringListValue: { values: ['ANT', 'sociology', 'theory'] } },
        ]);
        expect(matchesFilter(doc, 'tags="sociology"')).toBe(true);
      });

      it('should handle empty string values', () => {
        const doc = createDocument([{ key: 'note', stringValue: '' }]);
        expect(matchesFilter(doc, 'note=""')).toBe(true);
      });
    });

    describe('numeric comparison', () => {
      it('should match equality (=)', () => {
        const doc = createDocument([{ key: 'year', numericValue: 2006 }]);
        expect(matchesFilter(doc, 'year=2006')).toBe(true);
        expect(matchesFilter(doc, 'year=2005')).toBe(false);
      });

      it('should match greater than (>)', () => {
        const doc = createDocument([{ key: 'year', numericValue: 2006 }]);
        expect(matchesFilter(doc, 'year>2000')).toBe(true);
        expect(matchesFilter(doc, 'year>2010')).toBe(false);
      });

      it('should match greater than or equal (>=)', () => {
        const doc = createDocument([{ key: 'year', numericValue: 2006 }]);
        expect(matchesFilter(doc, 'year>=2006')).toBe(true);
        expect(matchesFilter(doc, 'year>=2007')).toBe(false);
      });

      it('should match less than (<)', () => {
        const doc = createDocument([{ key: 'year', numericValue: 2006 }]);
        expect(matchesFilter(doc, 'year<2010')).toBe(true);
        expect(matchesFilter(doc, 'year<2000')).toBe(false);
      });

      it('should match less than or equal (<=)', () => {
        const doc = createDocument([{ key: 'year', numericValue: 2006 }]);
        expect(matchesFilter(doc, 'year<=2006')).toBe(true);
        expect(matchesFilter(doc, 'year<=2005')).toBe(false);
      });

      it('should handle decimal numbers', () => {
        const doc = createDocument([{ key: 'version', numericValue: 1.5 }]);
        expect(matchesFilter(doc, 'version>1.0')).toBe(true);
        expect(matchesFilter(doc, 'version<2.0')).toBe(true);
        expect(matchesFilter(doc, 'version=1.5')).toBe(true);
      });

      it('should return false for missing numeric metadata', () => {
        const doc = createDocument([{ key: 'author', stringValue: 'Latour' }]);
        expect(matchesFilter(doc, 'year>2000')).toBe(false);
      });
    });

    describe('AND operator', () => {
      it('should match when both conditions are true', () => {
        const doc = createDocument([
          { key: 'author', stringValue: 'Latour' },
          { key: 'year', numericValue: 2006 },
        ]);
        expect(matchesFilter(doc, 'author="Latour" AND year>2000')).toBe(true);
      });

      it('should not match when first condition is false', () => {
        const doc = createDocument([
          { key: 'author', stringValue: 'Callon' },
          { key: 'year', numericValue: 2006 },
        ]);
        expect(matchesFilter(doc, 'author="Latour" AND year>2000')).toBe(false);
      });

      it('should not match when second condition is false', () => {
        const doc = createDocument([
          { key: 'author', stringValue: 'Latour' },
          { key: 'year', numericValue: 1990 },
        ]);
        expect(matchesFilter(doc, 'author="Latour" AND year>2000')).toBe(false);
      });

      it('should handle multiple AND conditions', () => {
        const doc = createDocument([
          { key: 'author', stringValue: 'Latour' },
          { key: 'year', numericValue: 2006 },
          { key: 'type', stringValue: 'book' },
        ]);
        expect(matchesFilter(doc, 'author="Latour" AND year>2000 AND type="book"')).toBe(true);
      });
    });

    describe('OR operator', () => {
      it('should match when first condition is true', () => {
        const doc = createDocument([{ key: 'author', stringValue: 'Latour' }]);
        expect(matchesFilter(doc, 'author="Latour" OR author="Callon"')).toBe(true);
      });

      it('should match when second condition is true', () => {
        const doc = createDocument([{ key: 'author', stringValue: 'Callon' }]);
        expect(matchesFilter(doc, 'author="Latour" OR author="Callon"')).toBe(true);
      });

      it('should match when both conditions are true', () => {
        const doc = createDocument([
          { key: 'author', stringValue: 'Latour' },
          { key: 'year', numericValue: 2006 },
        ]);
        expect(matchesFilter(doc, 'author="Latour" OR year>2010')).toBe(true);
      });

      it('should not match when both conditions are false', () => {
        const doc = createDocument([
          { key: 'author', stringValue: 'Smith' },
          { key: 'year', numericValue: 2006 },
        ]);
        expect(matchesFilter(doc, 'author="Latour" OR year>2010')).toBe(false);
      });
    });

    describe('empty or no filter', () => {
      it('should match when filter is empty string', () => {
        const doc = createDocument([{ key: 'author', stringValue: 'Latour' }]);
        expect(matchesFilter(doc, '')).toBe(true);
      });

      it('should match when filter is whitespace only', () => {
        const doc = createDocument([{ key: 'author', stringValue: 'Latour' }]);
        expect(matchesFilter(doc, '   ')).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle document with no metadata', () => {
        const doc = createDocument([]);
        expect(matchesFilter(doc, 'author="Latour"')).toBe(false);
      });

      it('should handle document with undefined customMetadata', () => {
        const doc: Document = {
          name: 'test-doc',
          displayName: 'Test',
          state: DocumentState.STATE_ACTIVE,
          createTime: '2024-01-01T00:00:00Z',
          updateTime: '2024-01-01T00:00:00Z',
          sizeBytes: '1024',
          mimeType: 'application/pdf',
        };
        expect(matchesFilter(doc, 'author="Latour"')).toBe(false);
      });

      it('should return false for invalid filter format', () => {
        const doc = createDocument([{ key: 'author', stringValue: 'Latour' }]);
        expect(matchesFilter(doc, 'invalid-format')).toBe(false);
      });
    });
  });

  describe('filterDocuments', () => {
    const createDocuments = (): Document[] => [
      {
        name: 'doc1',
        displayName: 'Document 1',
        customMetadata: [
          { key: 'author', stringValue: 'Latour' },
          { key: 'year', numericValue: 2006 },
        ],
        state: DocumentState.STATE_ACTIVE,
        createTime: '2024-01-01T00:00:00Z',
        updateTime: '2024-01-01T00:00:00Z',
        sizeBytes: '1024',
        mimeType: 'application/pdf',
      },
      {
        name: 'doc2',
        displayName: 'Document 2',
        customMetadata: [
          { key: 'author', stringValue: 'Callon' },
          { key: 'year', numericValue: 2000 },
        ],
        state: DocumentState.STATE_ACTIVE,
        createTime: '2024-01-01T00:00:00Z',
        updateTime: '2024-01-01T00:00:00Z',
        sizeBytes: '2048',
        mimeType: 'application/pdf',
      },
      {
        name: 'doc3',
        displayName: 'Document 3',
        customMetadata: [
          { key: 'author', stringValue: 'Latour' },
          { key: 'year', numericValue: 1995 },
        ],
        state: DocumentState.STATE_ACTIVE,
        createTime: '2024-01-01T00:00:00Z',
        updateTime: '2024-01-01T00:00:00Z',
        sizeBytes: '512',
        mimeType: 'text/plain',
      },
    ];

    it('should filter documents by string value', () => {
      const docs = createDocuments();
      const filtered = filterDocuments(docs, 'author="Latour"');
      expect(filtered).toHaveLength(2);
      expect(filtered.map((d) => d.name)).toEqual(['doc1', 'doc3']);
    });

    it('should filter documents by numeric value', () => {
      const docs = createDocuments();
      const filtered = filterDocuments(docs, 'year>2000');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('doc1');
    });

    it('should filter documents by AND condition', () => {
      const docs = createDocuments();
      const filtered = filterDocuments(docs, 'author="Latour" AND year>2000');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('doc1');
    });

    it('should filter documents by OR condition', () => {
      const docs = createDocuments();
      const filtered = filterDocuments(docs, 'author="Callon" OR year>2005');
      expect(filtered).toHaveLength(2);
      expect(filtered.map((d) => d.name).sort()).toEqual(['doc1', 'doc2']);
    });

    it('should return all documents when filter is empty', () => {
      const docs = createDocuments();
      const filtered = filterDocuments(docs, '');
      expect(filtered).toHaveLength(3);
    });

    it('should return empty array when no documents match', () => {
      const docs = createDocuments();
      const filtered = filterDocuments(docs, 'author="NonExistent"');
      expect(filtered).toHaveLength(0);
    });

    it('should handle empty document array', () => {
      const filtered = filterDocuments([], 'author="Latour"');
      expect(filtered).toHaveLength(0);
    });
  });
});
