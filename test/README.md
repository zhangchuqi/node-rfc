# Test Suite - node-rfc Automated Tests

Comprehensive test suite for the node-rfc library covering all major functionality.

## Overview

The test suite validates:
- RFC client connections and operations
- Connection pooling
- RFC server functionality  
- Data type conversions
- Error handling
- Performance characteristics
- Concurrency behavior

## Test Organization

```
test/
├── addon.methods.spec.ts         # Core addon functions
├── call_options/                 # Call option variations
├── cancel/                       # Operation cancellation
├── client/                       # Client connection tests
│   ├── direct.callback.spec.ts   # Callback-style client
│   ├── direct.promise.spec.ts    # Promise-style client
│   └── websocketrfc.spec.ts      # WebSocket RFC
├── concurrency/                  # Concurrent operations
├── datatypes/                    # Data type conversions
│   ├── all.spec.ts               # All ABAP types
│   └── utclong.spec.ts           # UTCLONG handling
├── errors/                       # Error handling
├── locking/                      # Connection locking
├── performance/                  # Performance benchmarks
├── pool/                         # Connection pool tests
│   ├── acquire-release.spec.ts   # Pool lifecycle
│   ├── errors.spec.ts            # Pool error handling
│   ├── options.spec.ts           # Pool configuration
│   └── ready.spec.ts             # Pool readiness
├── throughput/                   # Throughput monitoring
│   └── client.spec.ts            # Client throughput
└── utils/                        # Test utilities
```

## Prerequisites

### SAP System Access

Tests require access to a SAP system with:
- RFC-enabled user account
- Standard RFC test functions (STFC_*, BAPI_*)
- Appropriate authorizations

### Environment Configuration

Create `.env` file in project root:

```bash
# SAP Connection Parameters
ABAP_ASHOST=10.68.110.51
ABAP_SYSNR=00
ABAP_USER=demo
ABAP_PASSWD=welcome
ABAP_CLIENT=620
ABAP_LANG=EN

# Optional: Alternative authentication
# ABAP_SNCP=YourSNCPartnerName
# ABAP_X509CERT=/path/to/cert.pem

# Test Configuration
TEST_TIMEOUT=30000
SKIP_SLOW_TESTS=false
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
# Client tests only
npm test -- client

# Pool tests only
npm test -- pool

# Data type tests only
npm test -- datatypes
```

### Run Single Test File

```bash
npm test -- client/direct.promise.spec.ts
```

### Watch Mode

```bash
npm test -- --watch
```

### Coverage Report

```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory.

## Test Configuration

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/test/utils/setup.ts']
};
```

### Test Timeout

Default timeout: 30 seconds (configurable per test)

```typescript
it('long running operation', async () => {
  // Custom timeout for specific test
  await client.call('LONG_RUNNING_BAPI', params);
}, 60000); // 60 second timeout
```

## Test Categories

### 1. Client Tests

**Purpose**: Validate direct RFC client functionality

**Coverage**:
- Connection establishment (open/close)
- RFC function calls
- Callback vs Promise APIs
- Connection info retrieval
- Ping operations

**Example**:
```typescript
describe('Client Promise API', () => {
  it('should connect and call RFC', async () => {
    const client = new Client(connectionParams);
    await client.open();
    
    const result = await client.call('STFC_CONNECTION', {
      REQUTEXT: 'Hello'
    });
    
    expect(result.ECHOTEXT).toBe('Hello');
    await client.close();
  });
});
```

### 2. Pool Tests

**Purpose**: Validate connection pool management

**Coverage**:
- Pool initialization
- Client acquisition and release
- Pool sizing (low/high watermarks)
- Concurrent client handling
- Pool exhaustion scenarios
- Error recovery

**Example**:
```typescript
describe('Connection Pool', () => {
  it('should acquire and release clients', async () => {
    const pool = new Pool({
      connectionParameters: connParams,
      poolOptions: { low: 2, high: 5 }
    });
    
    const client = await pool.acquire();
    expect(client.alive).toBe(true);
    
    await pool.release(client);
    expect(pool.status.ready).toBe(2);
  });
});
```

### 3. Data Type Tests

**Purpose**: Validate ABAP ↔ Node.js type conversions

**Coverage**:
- Primitive types (INT, FLOAT, CHAR, STRING)
- Dates and times (DATS, TIMS, UTCLONG)
- Binary data (BYTE, XSTRING)
- Structures
- Internal tables
- Decimal types (BCD, CURR, QUAN)

**Example**:
```typescript
describe('Data Types', () => {
  it('should handle UTCLONG timestamps', async () => {
    const result = await client.call('Z_TEST_UTCLONG', {
      TIMESTAMP: '2025-12-20T10:30:00.123456Z'
    });
    
    expect(result.TIMESTAMP).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
```

### 4. Error Tests

**Purpose**: Validate error handling and recovery

**Coverage**:
- Connection failures
- Invalid parameters
- ABAP exceptions
- Timeout handling
- System errors
- Error message formats

**Example**:
```typescript
describe('Error Handling', () => {
  it('should handle invalid function name', async () => {
    await expect(
      client.call('NON_EXISTENT_FUNC', {})
    ).rejects.toThrow(/FU_NOT_FOUND/);
  });
});
```

### 5. Concurrency Tests

**Purpose**: Validate thread-safety and parallel operations

**Coverage**:
- Multiple simultaneous calls
- Pool contention
- Resource locking
- Deadlock prevention

**Example**:
```typescript
describe('Concurrency', () => {
  it('should handle parallel calls', async () => {
    const promises = Array(10).fill(null).map((_, i) => 
      client.call('STFC_CONNECTION', { 
        REQUTEXT: `Call ${i}` 
      })
    );
    
    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
  });
});
```

### 6. Performance Tests

**Purpose**: Validate performance characteristics

**Coverage**:
- Call latency
- Throughput measurement
- Memory usage
- Connection overhead

**Example**:
```typescript
describe('Performance', () => {
  it('should complete 100 calls in reasonable time', async () => {
    const start = Date.now();
    
    for (let i = 0; i < 100; i++) {
      await client.call('STFC_CONNECTION', {});
    }
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10000); // < 10s
  });
});
```

## Test Utilities

### Mock Connections

```typescript
// test/utils/mock.ts
export function createMockClient(): Client {
  return {
    open: jest.fn().mockResolvedValue(undefined),
    call: jest.fn().mockResolvedValue({}),
    close: jest.fn().mockResolvedValue(undefined),
    alive: true
  } as unknown as Client;
}
```

### Connection Helpers

```typescript
// test/utils/connection.ts
export async function withClient<T>(
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const client = new Client(getConnectionParams());
  await client.open();
  
  try {
    return await callback(client);
  } finally {
    await client.close();
  }
}

// Usage
await withClient(async (client) => {
  const result = await client.call('STFC_CONNECTION', {});
  expect(result).toBeDefined();
});
```

### Retry Logic

```typescript
// test/utils/retry.ts
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
  
  throw lastError!;
}
```

## Writing New Tests

### Test Template

```typescript
import { Client } from '../src';
import { getConnectionParams } from './utils/connection';

describe('Feature Name', () => {
  let client: Client;
  
  beforeAll(async () => {
    client = new Client(getConnectionParams());
    await client.open();
  });
  
  afterAll(async () => {
    await client.close();
  });
  
  describe('Specific Behavior', () => {
    it('should do something', async () => {
      // Arrange
      const input = { PARAM: 'value' };
      
      // Act
      const result = await client.call('RFC_FUNCTION', input);
      
      // Assert
      expect(result.OUTPUT).toBe('expected');
    });
    
    it('should handle errors', async () => {
      await expect(
        client.call('RFC_FUNCTION', { INVALID: 'param' })
      ).rejects.toThrow();
    });
  });
});
```

### Best Practices

1. **Descriptive Names**: Use clear test descriptions
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Independent Tests**: Each test should be self-contained
4. **Cleanup**: Always close connections in afterEach/afterAll
5. **Error Cases**: Test both success and failure scenarios
6. **Timeouts**: Set appropriate timeouts for slow operations
7. **Mock External**: Mock external dependencies when possible

## Continuous Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
        env:
          ABAP_ASHOST: ${{ secrets.SAP_HOST }}
          ABAP_USER: ${{ secrets.SAP_USER }}
          ABAP_PASSWD: ${{ secrets.SAP_PASSWD }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Troubleshooting Tests

### Connection Failures

```
Error: RFC_COMMUNICATION_FAILURE
```

**Solutions**:
- Verify SAP system is accessible
- Check credentials in .env
- Ensure RFC SDK is installed
- Check firewall rules

### Timeout Errors

```
Error: Timeout of 30000ms exceeded
```

**Solutions**:
- Increase TEST_TIMEOUT in .env
- Check network latency
- Verify SAP system performance
- Use smaller test data sets

### Random Failures

**Solutions**:
- Add retry logic for flaky tests
- Increase delays between operations
- Check for resource cleanup
- Verify test independence

## Coverage Goals

Target coverage levels:
- **Statements**: > 85%
- **Branches**: > 80%
- **Functions**: > 85%
- **Lines**: > 85%

Current coverage can be viewed by running:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Related Documentation

- [API Reference](../doc/api.md)
- [Usage Guide](../doc/usage.md)
- [Examples](../examples/README.md)
- [Contributing Guide](../CONTRIBUTING.md)

## Contributing

To contribute tests:

1. Follow existing test structure
2. Add tests for new features
3. Maintain code coverage
4. Document test purpose
5. Update this README if adding new test category

## License

Apache-2.0 - See [LICENSE](../LICENSE) file for details.
