# Migration Guide

This guide helps you migrate between major versions of node-rfc.

## Table of Contents

- [Migrating from 2.x to 3.x](#migrating-from-2x-to-3x)
- [Migrating from 1.x to 2.x](#migrating-from-1x-to-2x)
- [Breaking Changes Summary](#breaking-changes-summary)

---

## Migrating from 2.x to 3.x

### Overview

Version 3.0 represents a major modernization of node-rfc with:
- Full TypeScript rewrite
- Promise-based API (callbacks still supported)
- N-API (Node-API) for better stability
- Enhanced error handling
- New features (Pool, Server, Throughput)

### Prerequisites

**Minimum Requirements:**
- Node.js 14.x or higher (recommend 18.x LTS)
- SAP NetWeaver RFC SDK 7.50 or higher
- TypeScript 4.x+ (if using TypeScript)

### Step-by-Step Migration

#### 1. Update Dependencies

```json
{
  "dependencies": {
    "node-rfc": "^3.3.1"  // Update from 2.x
  }
}
```

```bash
npm install node-rfc@latest
```

#### 2. API Changes

##### Connection Method: `connect()` → `open()`

```typescript
// 2.x (deprecated in 3.x)
client.connect((err) => {
  if (err) return console.error(err);
  // ...
});

// 3.x (recommended)
await client.open();

// 3.x (backward compatible)
client.open((err) => {
  // Still works for gradual migration
});
```

**Migration Strategy:** `connect()` still works in 3.x but is deprecated. Plan to replace with `open()` before 4.0 release.

##### Function Invocation: `invoke()` → `call()`

```typescript
// 2.x
client.invoke('STFC_CONNECTION', { REQUTEXT: 'Hello' }, (err, result) => {
  if (err) return console.error(err);
  console.log(result);
});

// 3.x (Promise-based, recommended)
const result = await client.call('STFC_CONNECTION', { 
  REQUTEXT: 'Hello' 
});
console.log(result);

// 3.x (callback-based, backward compatible)
client.invoke('STFC_CONNECTION', { REQUTEXT: 'Hello' }, (err, result) => {
  // Still works
});
```

#### 3. Error Handling Changes

**2.x Error Format:**
```javascript
{
  message: "Error message",
  code: 2,
  key: "RFC_COMMUNICATION_FAILURE"
}
```

**3.x Enhanced Error Format:**
```typescript
{
  message: "Detailed error message with context",
  code: 2,
  key: "RFC_COMMUNICATION_FAILURE",
  abapMsgClass: "SR",      // New: ABAP message class
  abapMsgType: "E",        // New: Error type
  abapMsgNumber: "001",    // New: Message number
  abapMsgV1: "...",        // New: Message variables
  // ... more diagnostic info
}
```

**Migration:**
```typescript
// Update error handling to leverage new fields
try {
  await client.call('BAPI_FUNCTION', params);
} catch (error) {
  console.error('RFC Error:', error.message);
  
  // 3.x: Access additional context
  if (error.abapMsgClass) {
    console.error(`ABAP Message: ${error.abapMsgClass}${error.abapMsgNumber}`);
  }
}
```

#### 4. TypeScript Support

**2.x (types as separate package):**
```typescript
import * as noderfc from 'node-rfc';
import { RfcConnectionParameters } from '@types/node-rfc';  // Separate
```

**3.x (types included):**
```typescript
import { Client, RfcConnectionParameters } from 'node-rfc';  // Built-in
```

**Migration:** Remove `@types/node-rfc` if installed:
```bash
npm uninstall @types/node-rfc
```

#### 5. New Features to Adopt

##### Connection Pool (New in 3.x)

```typescript
import { Pool } from 'node-rfc';

const pool = new Pool({
  connectionParameters: {
    ashost: 'server.example.com',
    // ... other params
  },
  poolOptions: {
    low: 2,   // Minimum ready connections
    high: 10  // Maximum connections
  }
});

// Acquire from pool
const client = await pool.acquire();

try {
  const result = await client.call('RFC_FUNCTION', params);
} finally {
  // Always release back to pool
  await pool.release(client);
}
```

**Benefit:** Reuse connections, better performance for high-frequency calls.

##### Throughput Monitoring (New in 3.x)

```typescript
import { Throughput } from 'node-rfc';

const throughput = new Throughput(client);

await client.call('STFC_CONNECTION', { REQUTEXT: 'Hello' });
await client.call('BAPI_USER_GET_DETAIL', { USERNAME: 'DEMO' });

console.log('Statistics:', throughput.status);
// { numberOfCalls: 2, sentBytes: 1234, receivedBytes: 5678, ... }
```

**Benefit:** Monitor performance, identify bottlenecks.

##### RFC Server (New in 3.x)

```typescript
import { Server } from 'node-rfc';

const server = new Server({
  serverConnection: {
    gwhost: 'gateway.example.com',
    program_id: 'NODE_SERVER'
  },
  clientConnection: { /* ... */ }
});

await server.addFunction('Z_MY_FUNCTION', async (request) => {
  return { OUTPUT: processRequest(request.INPUT) };
});

await server.start();
```

**Benefit:** Node.js can now accept RFC calls from ABAP.

#### 6. Build System Changes

**2.x:**
```json
{
  "scripts": {
    "install": "node-pre-gyp install --fallback-to-build"
  }
}
```

**3.x (N-API prebuilds):**
```json
{
  "scripts": {
    "install": "node-gyp-build"
  }
}
```

**Migration:** No action needed, npm will handle automatically. Prebuilt binaries available for:
- macOS (x64, ARM64/M1/M2)
- Linux (x64, ARM64)
- Windows (x64)

### Deprecated APIs

| 2.x API | 3.x Replacement | Removal Timeline |
|---------|-----------------|------------------|
| `client.connect()` | `client.open()` | Removed in 4.0 |
| `client.invoke()` | `client.call()` | `invoke()` maintained |
| Callback-only | Promise or callback | Callbacks maintained |

### Testing Your Migration

```typescript
// Test script to validate migration
import { Client } from 'node-rfc';

async function testMigration() {
  const client = new Client({
    ashost: process.env.SAP_ASHOST,
    sysnr: process.env.SAP_SYSNR,
    user: process.env.SAP_USER,
    passwd: process.env.SAP_PASSWD,
    client: process.env.SAP_CLIENT,
    lang: 'EN'
  });

  try {
    // Test connection
    await client.open();
    console.log('✓ Connection successful');

    // Test function call
    const result = await client.call('STFC_CONNECTION', {
      REQUTEXT: 'Migration test'
    });
    console.log('✓ Function call successful:', result.ECHOTEXT);

    // Test connection info
    const info = client.connectionInfo;
    console.log('✓ Connection info:', info.sysId, info.client);

  } catch (error) {
    console.error('✗ Migration test failed:', error);
  } finally {
    await client.close();
  }
}

testMigration();
```

---

## Migrating from 1.x to 2.x

### Overview

Version 2.0 introduced:
- Promise support
- Connection pooling (basic)
- TypeScript definitions
- Modernized JavaScript (ES6+)

### Key Changes

#### 1. Node.js Version

**Requirement:** Node.js 10.x minimum (recommend 12.x LTS)

```bash
node --version  # Must be >= 10.0.0
```

#### 2. Package Structure

**1.x:**
```
node-rfc/
  ├── lib/
  │   └── noderfc.js
```

**2.x:**
```
node-rfc/
  ├── lib/
  │   ├── index.js
  │   ├── client.js
  │   ├── pool.js
```

**Migration:**
```javascript
// 1.x
const noderfc = require('node-rfc').noderfc;
const client = new noderfc.Client(params);

// 2.x
const { Client } = require('node-rfc');
const client = new Client(params);
```

#### 3. Promise Support

```javascript
// 1.x (callback only)
client.connect((err) => {
  if (err) return console.error(err);
  
  client.invoke('FUNC', params, (err, result) => {
    if (err) return console.error(err);
    console.log(result);
  });
});

// 2.x (promises added)
client.connect()
  .then(() => client.invoke('FUNC', params))
  .then(result => console.log(result))
  .catch(err => console.error(err));

// 2.x (async/await)
async function run() {
  await client.connect();
  const result = await client.invoke('FUNC', params);
  console.log(result);
}
```

#### 4. Connection Pool

```javascript
// 1.x (manual connection management)
const clients = [];
for (let i = 0; i < 5; i++) {
  const client = new Client(params);
  await client.connect();
  clients.push(client);
}

// 2.x (built-in pool)
const { Pool } = require('node-rfc');
const pool = new Pool(poolConfig);

const client = await pool.acquire();
await client.invoke('FUNC', params);
await pool.release(client);
```

---

## Breaking Changes Summary

### 3.0 Breaking Changes

| Category | Change | Action Required |
|----------|--------|-----------------|
| **Node.js** | Minimum version 14.x | Upgrade Node.js |
| **API** | `connect()` deprecated | Use `open()` |
| **API** | Enhanced error objects | Update error handling |
| **Build** | N-API (node-gyp-build) | Reinstall package |
| **TypeScript** | Types included | Remove @types package |

### 2.0 Breaking Changes

| Category | Change | Action Required |
|----------|--------|-----------------|
| **Node.js** | Minimum version 10.x | Upgrade Node.js |
| **Import** | Module structure changed | Update imports |
| **API** | Some signatures changed | Check API docs |

---

## Rollback Plan

If you encounter issues during migration:

### Rollback to 2.x

```bash
npm install node-rfc@2.6.3
```

### Rollback to 1.x

```bash
npm install node-rfc@1.2.0
```

**Note:** Old versions may not work with newer Node.js versions.

---

## Getting Help

If you encounter migration issues:

1. **Check Documentation:** [docs/](../docs/)
2. **Search Issues:** [GitHub Issues](https://github.com/SAP/node-rfc/issues)
3. **Ask Question:** [GitHub Discussions](https://github.com/SAP/node-rfc/discussions)
4. **Review Examples:** [examples/](../examples/)

---

## Migration Checklist

- [ ] Verify Node.js version (≥ 14.x for 3.x)
- [ ] Update package.json dependencies
- [ ] Run `npm install`
- [ ] Replace `connect()` with `open()`
- [ ] Replace `invoke()` with `call()` (optional)
- [ ] Update error handling (leverage new fields)
- [ ] Remove @types/node-rfc if present
- [ ] Update TypeScript imports
- [ ] Run test suite
- [ ] Review deprecated API usage
- [ ] Update CI/CD pipeline
- [ ] Update deployment scripts
- [ ] Test in staging environment
- [ ] Deploy to production

---

*For questions or assistance, please open a [GitHub Discussion](https://github.com/SAP/node-rfc/discussions).*
