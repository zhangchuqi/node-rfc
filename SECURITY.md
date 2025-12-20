# Security Policy

## Supported Versions

Security updates are provided for the following versions of node-rfc:

| Version | Supported          | Support Ends |
| ------- | ------------------ | ------------ |
| 3.3.x   | :white_check_mark: | Current      |
| 3.2.x   | :white_check_mark: | 2025-06-30   |
| 3.1.x   | :white_check_mark: | 2025-03-31   |
| 3.0.x   | :x:                | 2024-12-31   |
| 2.x     | :warning: Critical only | 2025-12-31   |
| < 2.0   | :x:                | Unsupported  |

:white_check_mark: = Full support  
:warning: = Security fixes only  
:x: = No longer supported

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### Where to Report

Send security vulnerability reports to: **node-rfc-security@sap.com**

### What to Include

Please include the following information:

1. **Description** - Detailed description of the vulnerability
2. **Impact** - Potential impact and attack scenario
3. **Affected Versions** - Which versions are affected
4. **Reproduction** - Step-by-step instructions to reproduce
5. **Proof of Concept** - If available, a minimal PoC
6. **Suggested Fix** - If you have ideas for mitigation

### Response Timeline

| Timeframe | Action |
|-----------|--------|
| 24-48 hours | Initial acknowledgment of report |
| 7 days | Assessment and severity classification |
| 14-30 days | Fix development and testing |
| 30-45 days | Coordinated disclosure and patch release |

We aim to keep you informed throughout the process.

## Security Best Practices

### SAP Credentials

**Never commit credentials to version control:**

```bash
# Bad - Never do this!
const client = new Client({
  user: 'MyUser',
  passwd: 'MyPassword123'  // ⚠️ Hardcoded password!
});

# Good - Use environment variables
const client = new Client({
  user: process.env.SAP_USER,
  passwd: process.env.SAP_PASSWD
});
```

**Use a secrets manager in production:**
- AWS Secrets Manager
- Azure Key Vault
- Google Secret Manager
- HashiCorp Vault

### Network Security

**1. Use Secure Network Communication (SNC)**

```typescript
import { loadCryptoLibrary } from 'node-rfc';

// Load SAP crypto library for SNC
loadCryptoLibrary('/usr/sap/lib/sapcrypto.so');

const client = new Client({
  ashost: 'server.example.com',
  sysnr: '00',
  snc_mode: '1',
  snc_partnername: 'p:CN=SERVER, O=Company, C=US',
  snc_qop: '9'  // Maximum protection
});
```

**2. Use TLS/SSL for HTTP APIs**

For the rfc-server HTTP wrapper, always use HTTPS in production:

```javascript
// Use reverse proxy (nginx, Apache) for SSL termination
// Or use Node.js https module:
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(443);
```

**3. Firewall Configuration**

Restrict RFC access to specific IP addresses:

```bash
# Allow only specific IPs
iptables -A INPUT -p tcp --dport 3300 -s 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -p tcp --dport 3300 -j DROP
```

### Input Validation

**Always validate and sanitize user inputs:**

```typescript
// Bad - No validation
await client.call('BAPI_USER_GET_DETAIL', {
  USERNAME: userInput  // ⚠️ Potential injection!
});

// Good - Validate input
function validateUsername(username: string): string {
  if (!/^[A-Z0-9_]{1,12}$/.test(username)) {
    throw new Error('Invalid username format');
  }
  return username.toUpperCase();
}

await client.call('BAPI_USER_GET_DETAIL', {
  USERNAME: validateUsername(userInput)
});
```

### Error Handling

**Don't leak sensitive information in error messages:**

```typescript
// Bad - Exposes internals
app.post('/rfc', async (req, res) => {
  try {
    const result = await client.call(req.body.func, req.body.params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });  // ⚠️ May leak info!
  }
});

// Good - Generic error messages
app.post('/rfc', async (req, res) => {
  try {
    const result = await client.call(req.body.func, req.body.params);
    res.json(result);
  } catch (error) {
    console.error('RFC Error:', error);  // Log detailed error
    res.status(500).json({ 
      error: 'Internal server error'  // ✓ Generic message
    });
  }
});
```

### Rate Limiting

**Implement rate limiting to prevent abuse:**

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Limit each IP to 100 requests per window
  message: 'Too many requests, please try again later'
});

app.use('/rfc', limiter);
```

### Authentication & Authorization

**Add authentication for HTTP APIs:**

```typescript
import jwt from 'jsonwebtoken';

// JWT middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.use('/rfc', authenticate);
```

### Connection Pool Security

**Set appropriate pool limits:**

```typescript
const pool = new Pool({
  connectionParameters: params,
  poolOptions: {
    low: 2,
    high: 10  // ✓ Limit concurrent connections
  }
});

// Implement connection timeout
const timeout = setTimeout(() => {
  throw new Error('Connection pool acquisition timeout');
}, 5000);

try {
  const client = await pool.acquire();
  clearTimeout(timeout);
  // Use client...
} finally {
  await pool.release(client);
}
```

### Dependency Security

**Regularly update dependencies:**

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check outdated packages
npm outdated
```

**Use npm security features:**

```json
{
  "scripts": {
    "pretest": "npm audit --omit=dev",
    "security": "npm audit --audit-level=high"
  }
}
```

## Known Vulnerabilities

### None Currently

No known security vulnerabilities at this time.

Past vulnerabilities:
- See [GitHub Security Advisories](https://github.com/SAP/node-rfc/security/advisories)

## Security Checklist for Production

- [ ] **Credentials**: Use environment variables or secrets manager
- [ ] **SNC**: Enable Secure Network Communication if possible
- [ ] **TLS**: Use HTTPS for HTTP wrappers
- [ ] **Firewall**: Restrict RFC access to known IPs
- [ ] **Input Validation**: Validate all user inputs
- [ ] **Error Handling**: Don't leak sensitive information
- [ ] **Rate Limiting**: Implement rate limiting
- [ ] **Authentication**: Require authentication for APIs
- [ ] **Authorization**: Verify user permissions
- [ ] **Logging**: Log security events (without sensitive data)
- [ ] **Monitoring**: Monitor for suspicious activity
- [ ] **Updates**: Keep dependencies up to date
- [ ] **Audits**: Regular security audits
- [ ] **Backups**: Regular configuration backups

## Compliance

### Data Protection

When handling personal data through SAP RFC:

1. **GDPR Compliance** (EU)
   - Document data flows
   - Implement data minimization
   - Ensure right to erasure
   - Maintain audit logs

2. **CCPA Compliance** (California)
   - Provide data access mechanisms
   - Enable data deletion
   - Disclose data collection

3. **General Best Practices**
   - Encrypt data in transit (SNC/TLS)
   - Encrypt data at rest
   - Implement access controls
   - Regular security assessments

### SOX Compliance

For financial data access:

- Maintain audit trails of all RFC calls
- Implement segregation of duties
- Regular access reviews
- Change management procedures

## Security Resources

### SAP Security Resources
- [SAP Security Notes](https://launchpad.support.sap.com)
- [SAP Security Documentation](https://help.sap.com/security)
- [SAP NetWeaver RFC SDK Security Guide](https://support.sap.com/nwrfcsdk)

### Node.js Security
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [npm Security Advisories](https://www.npmjs.com/advisories)
- [OWASP Node.js Security](https://owasp.org/www-project-nodejs-security/)

### Standards & Frameworks
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)

## Contact

- **Security Issues**: node-rfc-security@sap.com
- **General Questions**: [GitHub Discussions](https://github.com/SAP/node-rfc/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/SAP/node-rfc/issues) (non-security)

## Acknowledgments

We appreciate responsible disclosure and thank security researchers who help improve node-rfc security.

---

*Last updated: December 20, 2025*
