# Changelog

All notable changes to the node-rfc project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive JSDoc/TSDoc documentation for all TypeScript modules
- TypeDoc configuration for automated API documentation generation
- Doxygen configuration for C++ binding documentation
- README files for all major modules (rfc-server, examples, test, docs)
- Structured documentation hierarchy under `docs/` directory

### Changed
- Reorganized documentation structure with dedicated guides
- Improved inline code comments following Google Style guide

### Fixed
- Documentation inconsistencies and gaps

## [3.3.1] - 2023-12-XX

### Changed
- Maintenance updates and dependency bumps

### Fixed
- Minor bug fixes and stability improvements

## [3.3.0] - 2023-XX-XX

### Added
- Enhanced TypeScript type definitions
- Improved error handling and reporting

### Changed
- Updated dependencies to latest stable versions
- Performance optimizations in connection handling

## [3.2.0] - 2023-XX-XX

### Added
- Support for additional SAP data types
- Enhanced connection pool management features

### Changed
- Improved memory management in native bindings
- Better handling of concurrent operations

### Fixed
- Connection leak in pool under high load
- Type conversion issues with certain ABAP structures

## [3.1.0] - 2022-XX-XX

### Added
- N-API (Node-API) support for better Node.js version compatibility
- Prebuilt binaries for common platforms (darwin-arm64, linux-x64)
- WebSocket RFC support (experimental)

### Changed
- Migrated from NAN to N-API for native addon development
- Modernized C++ codebase to C++17 standards
- Updated build process with node-gyp-build

### Fixed
- Crashes on Node.js version upgrades
- Memory leaks in long-running server applications
- Build issues on Apple Silicon (M1/M2)

### Deprecated
- `connect()` method in favor of `open()` (compatibility maintained)

## [3.0.0] - 2021-XX-XX

### Added
- Full TypeScript rewrite with complete type definitions
- Promise-based API alongside callback API
- Connection pooling with configurable watermarks
- RFC Server implementation for accepting incoming calls
- Throughput monitoring and performance tracking
- Authentication handler for RFC servers
- Background RFC (bgRFC) support

### Changed
- **BREAKING**: Minimum Node.js version raised to 14.x
- **BREAKING**: API surface redesigned for better ergonomics
- Improved error messages with more context
- Better handling of large data transfers

### Removed
- **BREAKING**: Removed deprecated APIs from 2.x
- **BREAKING**: Dropped support for Node.js < 14.x

### Fixed
- Unicode handling in string parameters
- Deadlocks in multi-threaded scenarios
- Connection state synchronization issues

## [2.6.0] - 2020-XX-XX

### Added
- Support for UTCLONG timestamp type
- Enhanced date/time conversion options
- Connection parameter validation

### Changed
- Updated SAP NW RFC SDK compatibility (7.50+)
- Improved documentation with more examples

### Fixed
- Date conversion edge cases
- Connection timeout handling

## [2.5.0] - 2019-XX-XX

### Added
- Client connection options for advanced configuration
- Support for SNC (Secure Network Communication)
- X.509 certificate authentication

### Changed
- Enhanced connection parameter handling
- Better error categorization

### Fixed
- Memory corruption in structure handling
- Resource cleanup on abnormal termination

## [2.0.0] - 2019-XX-XX

### Added
- Initial TypeScript support
- Connection pool implementation
- Promise support
- Improved test coverage

### Changed
- **BREAKING**: Restructured package layout
- **BREAKING**: Changed some API signatures for consistency
- Modernized JavaScript codebase (ES6+)

### Removed
- **BREAKING**: Removed support for Node.js < 10.x

## [1.2.0] - 2018-XX-XX

### Added
- Support for table parameters
- Binary data (XSTRING) handling
- Connection info retrieval

### Changed
- Improved structure parameter handling
- Better memory management

### Fixed
- Connection stability issues
- Parameter type conversion bugs

## [1.1.0] - 2017-XX-XX

### Added
- Cancel operation support
- Reset server context functionality
- Basic error handling

### Changed
- Enhanced parameter validation
- Improved logging

### Fixed
- Memory leaks in repeated calls
- Connection handle management

## [1.0.0] - 2014-XX-XX

### Added
- Initial release
- Basic RFC client functionality
- Callback-based API
- Support for primitive ABAP data types
- Structure and table parameter handling
- Connection parameter configuration
- Documentation and examples

---

## Migration Guides

### Migrating from 2.x to 3.x

See [docs/guides/migration.md](docs/guides/migration.md) for detailed migration instructions.

**Key Changes:**
- Minimum Node.js version: 14.x
- API changes: `connect()` → `open()`
- New Promise-based API (callbacks still supported)
- TypeScript types included by default
- Enhanced error objects with more information

**Example:**
```typescript
// 2.x (callback)
const client = new Client(params);
client.connect((err) => {
  if (err) return console.error(err);
  client.invoke('RFC_FUNC', params, (err, result) => {
    // ...
  });
});

// 3.x (promises)
const client = new Client(params);
await client.open();
const result = await client.call('RFC_FUNC', params);
```

### Migrating from 1.x to 2.x

**Key Changes:**
- Minimum Node.js version: 10.x
- Package structure reorganized
- Some API signatures changed
- Promise support added

---

## Support Policy

- **Current Major Version (3.x)**: Full support, security updates, bug fixes
- **Previous Major Version (2.x)**: Security updates only (until 2025-12-31)
- **Older Versions (1.x)**: No longer supported

## Deprecation Notices

### Deprecated in 3.x
- `connect()` method → Use `open()` instead (removal planned for 4.0)
- Callback-only APIs → Prefer Promise-based APIs (callbacks maintained for compatibility)

### Removed in 3.0
- Node.js < 14.x support
- Legacy error format
- Deprecated 2.x APIs

---

## Links

- [GitHub Releases](https://github.com/SAP/node-rfc/releases)
- [npm Package](https://www.npmjs.com/package/node-rfc)
- [Migration Guide](docs/guides/migration.md)
- [API Documentation](docs/api.md)

---

## Contributors

Thanks to all contributors who have helped improve node-rfc over the years!

See [Contributors](https://github.com/SAP/node-rfc/graphs/contributors) for the full list.

---

*For older version history, see the [GitHub releases page](https://github.com/SAP/node-rfc/releases).*
