# Examples - RFC Usage Patterns and Code Samples

Practical examples demonstrating various node-rfc usage scenarios and patterns.

## Overview

This directory contains working examples of RFC client and server implementations, including:

- RFC server implementations
- Common RFC function patterns
- ABAP client code samples
- Integration patterns

## Examples Index

### RFC Server Examples

#### [server.ts](server.ts)
**Complete RFC Server Implementation**

Demonstrates a full-featured RFC server that:
- Accepts incoming RFC calls from ABAP systems
- Implements authentication handlers
- Registers multiple function handlers
- Handles errors gracefully

```typescript
// Key features demonstrated:
// - Server configuration
// - Function registration (STFC_CONNECTION, STFC_STRUCTURE)
// - Authentication handler
// - Error handling
```

**Usage:**
```bash
npx ts-node examples/server.ts
```

#### [server_functions.ts](server_functions.ts)
**RFC Function Handler Implementations**

Collection of function handlers for common RFC scenarios:
- `STFC_CONNECTION` - Echo/connection test
- `STFC_STRUCTURE` - Structure parameter handling
- Custom functions with complex data types

**Key Concepts:**
- Request/response structure handling
- Table parameter processing
- Type conversion between Node.js and ABAP
- Error propagation

### ABAP Client Examples

#### [zserver_stfc_connection.abap](zserver_stfc_connection.abap)
**ABAP Client for STFC_CONNECTION**

ABAP code demonstrating how to:
- Call Node.js RFC server from ABAP
- Handle connection parameters
- Process responses
- Error handling in ABAP

```abap
* Call Node.js RFC server
CALL FUNCTION 'STFC_CONNECTION'
  DESTINATION 'NODE_RFC_SERVER'
  EXPORTING
    requtext = 'Hello from ABAP'
  IMPORTING
    echotext = lv_echo
    resptext = lv_resp.
```

#### [zserver_stfc_struct.abap](zserver_stfc_struct.abap)
**ABAP Client for Structure Handling**

Demonstrates:
- Complex structure parameters
- Table parameter passing
- Nested structures
- Data type mappings

### Test Server

#### [server-test-blog.mjs](server-test-blog.mjs)
**ESM Module Server Example**

Minimal RFC server using ES modules:
- Modern JavaScript (ESM) syntax
- Simplified configuration
- Quick testing and prototyping

**Usage:**
```bash
node examples/server-test-blog.mjs
```

## Common Usage Patterns

### Pattern 1: Simple Echo Server

```typescript
import { Server } from 'node-rfc';

const server = new Server({
  serverConnection: {
    gwhost: 'gateway.company.com',
    gwserv: '3300',
    tpname: 'NODE_SERVER',
    program_id: 'NODE_RFC_SERVER'
  },
  clientConnection: connectionParams
});

// Register echo function
await server.addFunction('Z_ECHO', async (request) => {
  return { ECHO_TEXT: request.INPUT_TEXT };
});

await server.start();
console.log('Echo server running...');
```

### Pattern 2: Data Transformation Service

```typescript
// Transform SAP data before returning
await server.addFunction('Z_TRANSFORM_DATA', async (request) => {
  const input = request.INPUT_TABLE;
  
  // Transform data
  const output = input.map(row => ({
    ...row,
    PROCESSED: 'X',
    TIMESTAMP: new Date().toISOString()
  }));
  
  return { OUTPUT_TABLE: output };
});
```

### Pattern 3: External API Integration

```typescript
// Call external API from RFC handler
await server.addFunction('Z_GET_WEATHER', async (request) => {
  const city = request.CITY;
  
  // Call external weather API
  const response = await fetch(`https://api.weather.com/${city}`);
  const weather = await response.json();
  
  return {
    TEMPERATURE: weather.temp,
    CONDITIONS: weather.description,
    HUMIDITY: weather.humidity
  };
});
```

### Pattern 4: Database Integration

```typescript
import { Pool } from 'pg'; // PostgreSQL example

const dbPool = new Pool({ connectionString: process.env.DATABASE_URL });

await server.addFunction('Z_GET_CUSTOMER', async (request) => {
  const customerId = request.CUSTOMER_ID;
  
  // Query database
  const result = await dbPool.query(
    'SELECT * FROM customers WHERE id = $1',
    [customerId]
  );
  
  if (result.rows.length === 0) {
    throw new Error(`Customer ${customerId} not found`);
  }
  
  return {
    CUSTOMER_NAME: result.rows[0].name,
    EMAIL: result.rows[0].email,
    PHONE: result.rows[0].phone
  };
});
```

### Pattern 5: Authentication Handler

```typescript
const server = new Server({
  serverConnection: serverParams,
  clientConnection: clientParams,
  serverOptions: {
    authHandler: async (securityAttributes) => {
      console.log(`Auth request from: ${securityAttributes.user}`);
      console.log(`System: ${securityAttributes.sysId}`);
      console.log(`Client: ${securityAttributes.client}`);
      
      // Validate user
      const allowedUsers = ['SAPUSER01', 'SAPUSER02', 'ADMIN'];
      if (!allowedUsers.includes(securityAttributes.user)) {
        return `User ${securityAttributes.user} not authorized`;
      }
      
      // Check system
      if (securityAttributes.sysId !== 'PRD') {
        return 'Only production system allowed';
      }
      
      return true; // Allow
    }
  }
});
```

## Running Examples

### Prerequisites

1. **SAP System Access**: Valid SAP credentials and RFC-enabled user
2. **SAP NetWeaver RFC SDK**: Installed and configured (see [installation guide](../doc/installation.md))
3. **Node.js**: Version 14 or higher
4. **TypeScript** (for .ts examples): `npm install -g typescript ts-node`

### Setup

1. Clone the repository:
```bash
git clone https://github.com/SAP/node-rfc.git
cd node-rfc
```

2. Install dependencies:
```bash
npm install
```

3. Configure connection:
```bash
# Create environment file
cp .env.example .env

# Edit with your SAP credentials
vim .env
```

### Running TypeScript Examples

```bash
# Run server example
npx ts-node examples/server.ts

# Or compile first
npx tsc examples/server.ts
node examples/server.js
```

### Running JavaScript Examples

```bash
# Run ESM example
node examples/server-test-blog.mjs
```

## Testing with ABAP

### Step 1: Configure RFC Destination in SAP

Transaction: **SM59**

1. Create new TCP/IP connection
2. Connection Type: **T** (TCP/IP)
3. RFC Destination: **NODE_RFC_SERVER**
4. Activation Type: **Registered Server Program**
5. Program ID: **NODE_RFC_SERVER** (must match your server config)
6. Gateway Host: Your gateway hostname
7. Gateway Service: **sapgw00** (or your gateway service)

### Step 2: Start Node.js RFC Server

```bash
npx ts-node examples/server.ts
```

### Step 3: Test from ABAP

```abap
REPORT z_test_node_rfc.

DATA: lv_echo TYPE string,
      lv_resp TYPE string.

CALL FUNCTION 'STFC_CONNECTION'
  DESTINATION 'NODE_RFC_SERVER'
  EXPORTING
    requtext = 'Hello from ABAP!'
  IMPORTING
    echotext = lv_echo
    resptext = lv_resp
  EXCEPTIONS
    communication_failure = 1
    system_failure = 2
    OTHERS = 3.

IF sy-subrc = 0.
  WRITE: / 'Echo:', lv_echo.
  WRITE: / 'Response:', lv_resp.
ELSE.
  WRITE: / 'Error:', sy-subrc.
ENDIF.
```

## Data Type Examples

### Structures

```typescript
// ABAP Structure
// TYPES: BEGIN OF ty_address,
//          name   TYPE string,
//          street TYPE string,
//          city   TYPE string,
//        END OF ty_address.

await server.addFunction('Z_PROCESS_ADDRESS', async (request) => {
  const address = request.ADDRESS; // { name, street, city }
  
  return {
    ADDRESS: {
      name: address.name.toUpperCase(),
      street: address.street,
      city: address.city,
      country: 'USA' // Add new field
    }
  };
});
```

### Tables

```typescript
// ABAP Table Type
// TYPES: tt_items TYPE TABLE OF ty_item.

await server.addFunction('Z_PROCESS_ITEMS', async (request) => {
  const items = request.ITEMS; // Array of objects
  
  // Process each item
  const processed = items.map(item => ({
    ...item,
    total: item.quantity * item.price,
    processed_date: new Date().toISOString()
  }));
  
  return { ITEMS: processed };
});
```

### Binary Data

```typescript
await server.addFunction('Z_GET_IMAGE', async (request) => {
  const imageId = request.IMAGE_ID;
  const imageBuffer = await loadImageFromDb(imageId);
  
  return {
    IMAGE_DATA: imageBuffer, // Buffer/Uint8Array
    IMAGE_SIZE: imageBuffer.length,
    MIME_TYPE: 'image/png'
  };
});
```

## Error Handling Patterns

### Pattern 1: Custom Error Messages

```typescript
await server.addFunction('Z_VALIDATE_DATA', async (request) => {
  if (!request.CUSTOMER_ID) {
    throw new Error('CUSTOMER_ID is required');
  }
  
  if (request.AMOUNT < 0) {
    throw new Error('AMOUNT must be positive');
  }
  
  // Process valid data...
  return { STATUS: 'SUCCESS' };
});
```

### Pattern 2: ABAP Exception Mapping

```typescript
await server.addFunction('Z_DATABASE_READ', async (request) => {
  try {
    const data = await database.query(request.QUERY);
    return { DATA: data };
  } catch (error) {
    // Map to ABAP exception
    if (error.code === 'NOT_FOUND') {
      throw new Error('DATA_NOT_FOUND');
    }
    throw new Error('DATABASE_ERROR');
  }
});
```

## Performance Tips

1. **Connection Pooling**: Reuse connections for multiple calls
2. **Caching**: Cache frequently accessed data
3. **Batch Processing**: Process multiple records together
4. **Async Operations**: Use async/await for I/O operations
5. **Resource Cleanup**: Always release connections

## Debugging

### Enable RFC Trace

```typescript
import { setLogFilePath } from 'node-rfc';

setLogFilePath('./rfc-trace.log');
```

### Log Request/Response

```typescript
await server.addFunction('Z_FUNCTION', async (request) => {
  console.log('Request:', JSON.stringify(request, null, 2));
  
  const response = await processRequest(request);
  
  console.log('Response:', JSON.stringify(response, null, 2));
  return response;
});
```

## Related Documentation

- [API Reference](../doc/api.md) - Complete API documentation
- [Usage Guide](../doc/usage.md) - Detailed usage instructions
- [Authentication](../doc/authentication.md) - Authentication methods
- [Troubleshooting](../doc/troubleshooting.md) - Common issues

## Contributing

To add new examples:

1. Create well-commented code file
2. Add entry to this README
3. Include setup instructions
4. Provide test data or ABAP code if applicable
5. Submit pull request

## License

Apache-2.0 - See [LICENSE](../LICENSE) file for details.
