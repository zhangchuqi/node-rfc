# node-rfc Documentation

Comprehensive documentation for the SAP NetWeaver RFC SDK bindings for Node.js.

## Documentation Structure

This documentation is organized into the following sections:

### 📚 **API Reference** ([api/](api/))
Detailed API documentation for all classes, methods, and interfaces.

### 📖 **Guides** ([guides/](guides/))
Step-by-step tutorials and how-to guides for common tasks.

### 🚀 **Deployment** ([deployment/](deployment/))
Production deployment guides for various platforms.

### 🤝 **Contributing** ([contributing/](contributing/))
Guidelines for contributing to the project.

---

## Quick Links

### Getting Started
- [Installation Guide](installation.md) - Platform-specific installation instructions
- [Quick Start Tutorial](usage.md) - Get up and running in 5 minutes
- [Authentication Methods](authentication.md) - Configure SAP authentication

### Core Concepts
- [API Reference](api.md) - Complete API documentation
- [Usage Patterns](usage.md) - Common usage scenarios
- [Error Handling](troubleshooting.md) - Debugging and troubleshooting

### Advanced Topics
- [Connection Pooling](api.md#connection-pool) - Efficient connection management
- [RFC Server](api.md#rfc-server) - Accepting incoming RFC calls
- [Performance Monitoring](api.md#throughput-monitoring) - Track connection metrics
- [Environment Variables](env.md) - Configuration options

### Deployment
- [Docker Deployment](deployment/) - Containerized deployments
- [Railway Platform](deployment/) - Cloud deployment guide
- [Production Best Practices](deployment/) - Security and performance

---

## Documentation Index

### Core Documentation (Root `/doc`)

| Document | Description |
|----------|-------------|
| [api.md](api.md) | Complete API reference for Client, Pool, Server, and Throughput classes |
| [usage.md](usage.md) | Detailed usage guide with examples and patterns |
| [authentication.md](authentication.md) | Authentication methods (username/password, SNC, X.509) |
| [installation.md](installation.md) | Platform-specific installation (macOS, Linux, Windows) |
| [env.md](env.md) | Environment variable configuration |
| [troubleshooting.md](troubleshooting.md) | Common issues and solutions |

### API Documentation (`/docs/api`)

*Note: Auto-generated from source code using TypeDoc*

- **Client API** - RFC client connection and function calls
- **Pool API** - Connection pool management
- **Server API** - RFC server implementation
- **Throughput API** - Performance monitoring
- **Types** - TypeScript type definitions

### Guides (`/docs/guides`)

| Guide | Description |
|-------|-------------|
| **Installation** | Step-by-step installation for each platform |
| **Authentication** | Configure different authentication methods |
| **Usage** | Common patterns and best practices |
| **Troubleshooting** | Debug connection issues and errors |
| **Local Development** | Set up development environment |

### Deployment (`/docs/deployment`)

| Guide | Description |
|-------|-------------|
| **Docker** | Build and deploy with Docker |
| **Railway** | Deploy to Railway platform |
| **Kubernetes** | Kubernetes deployment strategies |
| **Production Checklist** | Pre-production security and performance review |

### Contributing (`/docs/contributing`)

| Guide | Description |
|-------|-------------|
| **Building** | Build from source, native compilation |
| **Testing** | Run tests, add new tests |
| **Releasing** | Release process and versioning |
| **Code Style** | Coding standards and conventions |

---

## Quick Reference

### Installation

```bash
# Install node-rfc
npm install node-rfc

# Install SAP NetWeaver RFC SDK (required)
# See installation guide for platform-specific instructions
```

### Basic Usage

```typescript
import { Client } from 'node-rfc';

// Create client
const client = new Client({
  ashost: '10.68.110.51',
  sysnr: '00',
  user: 'demo',
  passwd: 'welcome',
  client: '620',
  lang: 'EN'
});

// Connect and call RFC
await client.open();
const result = await client.call('STFC_CONNECTION', {
  REQUTEXT: 'Hello SAP'
});
console.log(result.ECHOTEXT);
await client.close();
```

### Connection Pool

```typescript
import { Pool } from 'node-rfc';

const pool = new Pool({
  connectionParameters: { /* ... */ },
  poolOptions: { low: 2, high: 10 }
});

const client = await pool.acquire();
const result = await client.call('BAPI_USER_GET_DETAIL', {
  USERNAME: 'DEMO'
});
await pool.release(client);
```

### RFC Server

```typescript
import { Server } from 'node-rfc';

const server = new Server({
  serverConnection: { gwhost: '...', program_id: 'NODE_SERVER' },
  clientConnection: { /* ... */ }
});

await server.addFunction('STFC_CONNECTION', async (request) => {
  return { 
    ECHOTEXT: request.REQUTEXT,
    RESPTEXT: 'Hello from Node.js' 
  };
});

await server.start();
```

---

## FAQ

### General Questions

**Q: What is node-rfc?**  
A: Node.js bindings for the SAP NetWeaver RFC SDK, enabling Node.js applications to communicate with SAP systems via RFC protocol.

**Q: Is it production-ready?**  
A: Yes, node-rfc is used in production environments worldwide. However, note the deprecation notice in the main README.

**Q: What SAP versions are supported?**  
A: Tested with SAP NetWeaver 7.0 and higher, including S/4HANA.

**Q: Does it support TypeScript?**  
A: Yes, full TypeScript support with complete type definitions.

### Technical Questions

**Q: Can I use promises?**  
A: Yes, all APIs support both callbacks and promises.

**Q: How do I handle large data volumes?**  
A: Use connection pooling and consider pagination for large datasets.

**Q: Can I call BAPIs?**  
A: Yes, BAPIs are RFC-enabled function modules and fully supported.

**Q: How do I debug connection issues?**  
A: Enable RFC trace logging with `setLogFilePath()` - see [troubleshooting guide](troubleshooting.md).

### Platform Questions

**Q: Which platforms are supported?**  
A: macOS (x64/ARM64), Linux (x64/ARM64), Windows (x64). See [installation guide](installation.md).

**Q: Can I use it in Docker?**  
A: Yes, see [Docker deployment guide](deployment/).

**Q: Does it work with Electron?**  
A: Yes, but requires proper native module configuration.

---

## Support

### Getting Help

1. **Documentation**: Search this documentation first
2. **Issues**: Check [GitHub Issues](https://github.com/SAP/node-rfc/issues)
3. **SAP Community**: Post questions in SAP Community forums
4. **Stack Overflow**: Tag questions with `node-rfc` and `sap`

### Reporting Issues

When reporting issues, include:
- node-rfc version (`npm list node-rfc`)
- Node.js version (`node --version`)
- Platform and architecture
- SAP NetWeaver RFC SDK version
- Error message and stack trace
- Minimal reproducible example

### Security Issues

**Do not** report security issues publicly. Contact maintainers directly.

---

## Contributing

We welcome contributions! Please see:

- [Contributing Guide](../CONTRIBUTING.md)
- [Code of Conduct](../CODE_OF_CONDUCT.md)
- [Development Guide](contributing/building.md)

---

## Resources

### Official Links
- **GitHub**: https://github.com/SAP/node-rfc
- **npm**: https://www.npmjs.com/package/node-rfc
- **SAP RFC SDK**: https://support.sap.com/nwrfcsdk

### Related Projects
- **sapnwrfc-cookbook**: Example recipes and patterns
- **SAP NetWeaver RFC SDK**: Official SAP documentation
- **PyRFC**: Python bindings (sister project)

### Community
- **SAP Community**: SAP technology forums
- **Stack Overflow**: Questions tagged `node-rfc`
- **Discussions**: GitHub Discussions

---

## License

node-rfc is licensed under the Apache License 2.0.

See [LICENSE](../LICENSE) for full text.

---

## Version History

| Version | Release Date | Major Changes |
|---------|--------------|---------------|
| 3.x | 2023+ | N-API support, improved stability |
| 2.x | 2019-2022 | Pool improvements, TypeScript |
| 1.x | 2014-2018 | Initial release |

For detailed changelog, see [CHANGELOG.md](../CHANGELOG.md).

---

## Acknowledgments

- SAP SE for the NetWeaver RFC SDK
- All contributors to the node-rfc project
- The Node.js and TypeScript communities

---

*Last updated: December 20, 2025*
