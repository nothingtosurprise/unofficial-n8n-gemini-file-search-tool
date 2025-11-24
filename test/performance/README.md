# Performance Tests

## Overview

Performance tests measure operation speed, concurrency handling, and resource usage of the n8n Gemini File Search Tool nodes. These tests provide benchmarks for upload speeds, query response times, concurrent operations, and system stability under load.

## Test Structure

```
test/performance/
├── benchmarks/           # Performance benchmarks for key operations
│   ├── upload-benchmarks.test.ts
│   ├── query-benchmarks.test.ts
│   └── concurrent-benchmarks.test.ts
└── load/                 # Stress and load tests
    ├── stress-test.test.ts
    └── memory-test.test.ts
```

## Running Tests

### Run All Performance Tests
```bash
npm run test:performance
```

### Run Specific Test Suite
```bash
# Upload benchmarks only
npm run test:performance -- upload-benchmarks

# Memory tests only
npm run test:performance -- memory-test
```

### Run with Verbose Output
```bash
npm run test:performance -- --verbose
```

## Test Categories

### 1. Upload Benchmarks (`benchmarks/upload-benchmarks.test.ts`)

Tests upload performance for various file sizes and scenarios:

- **File Size Performance**: 1KB, 10KB, 100KB, 1MB
- **Concurrent Uploads**: 3 and 5 parallel uploads
- **Metadata Overhead**: Performance impact of custom metadata

**Expected Results:**
- 1KB upload: <10s
- 10KB upload: <15s
- 100KB upload: <30s
- 1MB upload: <60s
- Metadata overhead: <50%

### 2. Query Benchmarks (`benchmarks/query-benchmarks.test.ts`)

Tests document listing and retrieval performance:

- **List Response Time**: Basic listing operations
- **Pagination Performance**: Paginated list operations
- **Concurrent Lists**: Multiple simultaneous list operations
- **Store Size Impact**: Performance with growing document count

**Expected Results:**
- List operation: <10s
- Concurrent operations: Linear scaling
- Size degradation: <50% with 3x more documents

### 3. Concurrent Operations (`benchmarks/concurrent-benchmarks.test.ts`)

Tests performance of parallel operations:

- **Mixed Operations**: Concurrent uploads and lists
- **Sequential vs Parallel**: Speedup measurements
- **Batch Uploads**: Efficient batch processing

**Expected Results:**
- Mixed operations: Complete successfully
- Parallel speedup: >1.5x faster than sequential
- Batch uploads: <90s for 10 files

### 4. Stress Tests (`load/stress-test.test.ts`)

Tests system behavior under sustained load:

- **Sustained Load**: 30-second continuous operations
- **Rate Limiting**: Recovery from API rate limits
- **Error Handling**: Graceful error management

**Expected Results:**
- Complete multiple operations without crashes
- Successfully recover from rate limiting
- Handle errors gracefully

### 5. Memory Tests (`load/memory-test.test.ts`)

Tests for memory leaks and resource management:

- **Memory Leaks**: 20 repeated operations
- **Large Buffers**: Handling various file sizes
- **Resource Cleanup**: Proper cleanup after operations

**Expected Results:**
- Memory increase: <50MB for 20 uploads
- Large buffer growth: <100%
- Cleanup overhead: <30MB

## Performance Targets

| Operation | Target | Acceptable | Poor |
|-----------|--------|------------|------|
| 1KB upload | <5s | <10s | >10s |
| 100KB upload | <15s | <30s | >30s |
| 1MB upload | <30s | <60s | >60s |
| List documents | <5s | <10s | >10s |
| Concurrent 3x | <15s | <30s | >30s |
| Memory/20 ops | <25MB | <50MB | >50MB |

## Usage Notes

### API Rate Limits

- Tests use real Gemini API (rate limits may apply)
- Stress tests may trigger rate limiting (expected)
- Use `--runInBand` to avoid test interference

### Memory Tests

Memory tests work best with garbage collection:

```bash
# Run with GC enabled
node --expose-gc node_modules/.bin/jest --testPathPattern=memory-test
```

### Environment Setup

Ensure `.env` file contains valid credentials:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

## Interpreting Results

### Good Performance
```
✓ 1KB upload: 3542ms
✓ 10KB upload: 4123ms
✓ 100KB upload: 8765ms
✓ 3 concurrent uploads: 12345ms total (4115ms avg)
✓ Memory increase: 12.45MB
```

### Poor Performance (Investigation Needed)
```
✗ 1KB upload: 15234ms  ← Too slow
✗ 100KB upload: 45678ms ← Way too slow
✗ Memory increase: 78.92MB ← Possible leak
```

## Troubleshooting

### Tests Timing Out

If tests timeout frequently:
1. Check internet connection
2. Verify API key is valid
3. Check for API rate limiting
4. Increase test timeout in jest.config.js

### Memory Tests Failing

If memory tests fail:
1. Close other applications
2. Run with `--expose-gc` flag
3. Run tests individually (not in parallel)
4. Check for actual memory leaks in code

### Rate Limiting Errors

If you see 429 errors:
1. Wait 60 seconds between test runs
2. Reduce concurrent operations
3. Add delays between operations
4. Use separate API keys for testing

## Performance Optimization Tips

Based on test results, consider:

1. **Upload Optimization**
   - Use appropriate chunk sizes for large files
   - Implement retry logic for failed uploads
   - Consider compression for text files

2. **Concurrency**
   - Batch operations when possible
   - Use Promise.all() for independent operations
   - Implement queue for rate limit management

3. **Memory Management**
   - Clear buffers after use
   - Avoid keeping large objects in memory
   - Use streams for very large files

## Contributing

When adding new performance tests:

1. Follow existing test structure
2. Set realistic performance targets
3. Document expected results
4. Handle rate limiting gracefully
5. Clean up test resources

## Related Documentation

- [Integration Tests](../integration/README.md)
- [Test Environment Setup](../integration/setup/testEnvironment.ts)
- [Cleanup Handlers](../integration/setup/cleanup.ts)

---

**Last Updated:** 2025-11-24
**Phase:** 3.4 - Performance Testing
🤖 Generated with [Claude Code](https://claude.com/claude-code)
