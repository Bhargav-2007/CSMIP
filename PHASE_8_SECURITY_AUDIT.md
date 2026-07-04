# PHASE 8: SECURITY AUDIT & HARDENING
## Complete Security Implementation Guide

**Date:** 2026-06-27  
**Status:** Implementation Checklist  
**Priority:** CRITICAL  
**Estimated Duration:** 6-10 hours  

---

## 1. OUTSTANDING SECURITY VULNERABILITIES (13 total)

### 1.1 Backend Security Issues

#### Issue 1: No CSRF Protection
**Severity:** HIGH  
**Impact:** Cross-Site Request Forgery attacks possible  
**Solution:**
```javascript
// Add to backend/index.js
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(csrf({ cookie: true }));

// Add to protected routes
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  next();
});
```
**Tests:**  
- [ ] Token generated in response headers
- [ ] Requests without token rejected
- [ ] Token validated on state-changing operations

#### Issue 2: Missing Input Validation & Sanitization
**Severity:** CRITICAL  
**Impact:** SQL Injection, XSS, Data corruption  
**Solution:**
```javascript
// Create backend/src/middleware/validation.js
const { body, validationResult } = require('express-validator');

const validatePhoneNumber = body('phone')
  .trim()
  .matches(/^\d{10}$/)
  .withMessage('Invalid phone number');

const validateEmail = body('email')
  .isEmail()
  .normalizeEmail();

// Use in routes:
router.post('/', validatePhoneNumber, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process
});
```
**Tests:**
- [ ] SQL injection attempts blocked
- [ ] HTML tags sanitized
- [ ] XSS payloads neutralized
- [ ] Invalid formats rejected

#### Issue 3: No API Rate Limiting Per User
**Severity:** MEDIUM  
**Impact:** Brute force attacks, DDoS  
**Solution:**
```javascript
// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per windowMs
  keyGenerator: (req) => req.user?.id || req.ip,
  message: 'Too many requests from this account'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts
  skipSuccessfulRequests: true
});

module.exports = { userLimiter, loginLimiter };
```
**Tests:**
- [ ] Rate limits enforced per user ID
- [ ] 429 status returned on limit exceeded
- [ ] Limits reset after window
- [ ] Stricter limits on auth endpoints

#### Issue 4: Weak JWT Configuration
**Severity:** HIGH  
**Impact:** Token forgery, unauthorized access  
**Solution:**
```javascript
// backend/.env
JWT_SECRET="generate-strong-256-bit-key-with-crypto"
JWT_ALGORITHM="HS512"  # Use HS512 instead of default
JWT_EXPIRY="15m"       # Short-lived tokens
REFRESH_TOKEN_SECRET="generate-separate-strong-key"
```

**Implementation:**
```javascript
// backend/src/utils/jwt.js
const crypto = require('crypto');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, iat: Date.now() },
    process.env.JWT_SECRET,
    { 
      expiresIn: '15m',
      algorithm: 'HS512'
    }
  );
};

// Verify token signature strength
if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
```
**Tests:**
- [ ] Tokens expire properly
- [ ] Signature verification works
- [ ] Algorithm enforced (HS512)
- [ ] Short-lived tokens prevent abuse

#### Issue 5: No SQL Injection Prevention for Raw Queries
**Severity:** CRITICAL  
**Impact:** Database compromise  
**Solution:** Use Prisma (already implemented), but verify:
```javascript
// GOOD: Using Prisma
const user = await req.prisma.user.findUnique({
  where: { phone: userPhone }
});

// BAD: Never do raw queries without parameterization
const user = await req.prisma.$queryRaw(
  `SELECT * FROM User WHERE phone = ${userPhone}` // DANGEROUS!
);

// SAFE: Using parameterized queries
const user = await req.prisma.$queryRaw`
  SELECT * FROM User WHERE phone = ${userPhone}
`;
```
**Tests:**
- [ ] All database queries use Prisma
- [ ] No raw SQL with string concatenation
- [ ] Prisma validation enforced

#### Issue 6: Missing Security Headers
**Severity:** MEDIUM  
**Impact:** Client-side attacks, clickjacking, MIME sniffing  
**Solution:**
```javascript
// Already using helmet, but verify all headers:
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.BACKEND_URL]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));
```
**Tests:**
- [ ] CSP headers present and correct
- [ ] HSTS enabled (1 year)
- [ ] Clickjacking protection enabled
- [ ] MIME sniffing prevented

### 1.2 Frontend Security Issues

#### Issue 7: Token Storage in localStorage (XSS Vulnerable)
**Severity:** HIGH  
**Impact:** Token theft via XSS  
**Solution:**
```javascript
// Frontend: Move tokens to httpOnly cookies
// This requires backend support for Set-Cookie headers
// For now, with localStorage:

// 1. Implement strong CSP
// 2. Sanitize all user inputs
// 3. Use DOMPurify for any dynamic HTML

// In .env:
REACT_APP_CSP_ENABLED=true

// In index.html add:
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' http://localhost:5000;
  img-src 'self' data: https:;
  font-src 'self';
">
```
**Future:** Move to httpOnly cookies
```javascript
// Backend: Return tokens in Set-Cookie header
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000
});
```
**Tests:**
- [ ] CSP headers enforced
- [ ] XSS attempts blocked
- [ ] Inline scripts prevented
- [ ] Token not visible in developer tools

#### Issue 8: No Input Sanitization on Forms
**Severity:** MEDIUM  
**Impact:** XSS attacks through user inputs  
**Solution:**
```javascript
// Create frontend/src/utils/sanitize.js
import DOMPurify from 'dompurify';

export const sanitizeInput = (input) => {
  return input.trim().replace(/[<>\"']/g, '');
};

export const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
};

// Use in forms:
const handleSubmit = (formData) => {
  const sanitized = {
    ...formData,
    name: sanitizeInput(formData.name),
    description: sanitizeInput(formData.description)
  };
  // Submit sanitized data
};
```
**Tests:**
- [ ] HTML tags stripped from inputs
- [ ] Script tags removed
- [ ] Event handlers blocked
- [ ] Form submission validated

#### Issue 9: No Request Signing/Validation
**Severity:** MEDIUM  
**Impact:** Request tampering  
**Solution:**
```javascript
// Add request signing to API layer
// backend/src/middleware/signing.js
const crypto = require('crypto');

const signRequest = (req, res, next) => {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', process.env.REQUEST_SIGNING_SECRET)
    .update(`${timestamp}${req.url}`)
    .digest('hex');
  
  res.locals.requestId = crypto.randomUUID();
  next();
};

app.use(signRequest);
```
**Tests:**
- [ ] Requests include timestamp
- [ ] Signature validation works
- [ ] Old requests rejected (>5min)
- [ ] Tampering detected

#### Issue 10: Insufficient Logging & Audit Trail
**Severity:** MEDIUM  
**Impact:** Cannot detect/investigate attacks  
**Solution:**
```javascript
// backend/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'csmip-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Log security events:
logger.warn('Failed login attempt', {
  phone: maskPhone(phone),
  ip: req.ip,
  timestamp: new Date()
});
```
**Tests:**
- [ ] All auth events logged
- [ ] Failed attempts tracked
- [ ] Admin actions logged
- [ ] Logs secured and protected

#### Issue 11: No Rate Limiting on Frontend
**Severity:** LOW  
**Impact:** Annoying for users, but backend protects  
**Solution:**
```javascript
// frontend/src/hooks/useApiRateLimit.js
import { useState, useCallback } from 'react';

export const useApiRateLimit = (cooldownMs = 1000) => {
  const [lastCall, setLastCall] = useState(0);

  const throttle = useCallback(async (fn) => {
    const now = Date.now();
    if (now - lastCall < cooldownMs) {
      throw new Error('Too many requests, please slow down');
    }
    setLastCall(now);
    return fn();
  }, [lastCall, cooldownMs]);

  return throttle;
};
```
**Tests:**
- [ ] Requests throttled on frontend
- [ ] User-friendly cooldown messages
- [ ] Backend rate limits still enforced

#### Issue 12: PII Data Protection (Phone Numbers in Logs)
**Severity:** MEDIUM  
**Impact:** Privacy violation, GDPR/CCPA risks  
**Solution:**
```javascript
// backend/src/utils/privacy.js
const maskPhone = (phone) => {
  if (!phone || phone.length < 7) return phone;
  const start = phone.substring(0, 2);
  const end = phone.substring(phone.length - 2);
  return `${start}****${end}`;
};

const maskEmail = (email) => {
  const [local, domain] = email.split('@');
  const masked = local.substring(0, 2) + '****' + local.substring(local.length - 1);
  return `${masked}@${domain}`;
};

// Use in logging:
logger.info('User login successful', {
  phone: maskPhone(user.phone),
  role: user.role
});
```
**Tests:**
- [ ] No full phone numbers in logs
- [ ] No full emails in logs
- [ ] Masking applied consistently
- [ ] Logs validated for PII

#### Issue 13: Missing Dependency Security Audit
**Severity:** HIGH  
**Impact:** Vulnerable dependencies used  
**Solution:**
```bash
# Run security audits
cd /workspaces/CSMIP/backend
npm audit  # Check for known vulnerabilities
npm audit fix  # Auto-fix security issues

cd /workspaces/CSMIP/app/frontend
npm audit
npm audit fix
```
**Tests:**
- [ ] Run `npm audit` shows no high/critical
- [ ] All packages updated
- [ ] No deprecated packages
- [ ] License compliance checked

---

## 2. SECURITY IMPLEMENTATION CHECKLIST

### Authentication & Authorization
- [ ] JWT tokens expire after 15 minutes
- [ ] Refresh tokens expire after 7 days
- [ ] Tokens not stored in localStorage for production (use httpOnly cookies)
- [ ] Password hashing with bcrypt (rounds: 10+)
- [ ] OTP expires after 5 minutes
- [ ] Max 3 OTP attempts per phone
- [ ] Role verification server-side on all admin endpoints
- [ ] User cannot escalate own role
- [ ] Session invalidation on logout

### Input Validation & Sanitization
- [ ] Phone number validation (10 digits)
- [ ] Email validation and normalization
- [ ] Text inputs trimmed and length limited
- [ ] HTML entities escaped
- [ ] No SQL injection possible
- [ ] No command injection possible
- [ ] File uploads type-checked and size-limited
- [ ] JSON payloads validated against schema

### Data Protection
- [ ] PII masked in logs
- [ ] No sensitive data in error messages
- [ ] Database encryption at rest
- [ ] HTTPS enforced (production)
- [ ] Secure token generation (crypto.randomBytes)
- [ ] No hardcoded secrets in code
- [ ] Secrets managed via environment variables

### API Security
- [ ] CORS configured properly
- [ ] Rate limiting per user
- [ ] Request timeout enforced
- [ ] Large payload rejection
- [ ] Invalid content-type rejection
- [ ] Cache headers set correctly
- [ ] No sensitive data in URLs
- [ ] HTTPS only (production)

### Response Security
- [ ] Security headers present (Helmet)
- [ ] Content-Type specified
- [ ] No server version disclosure
- [ ] Error messages don't leak info
- [ ] JSONP disabled
- [ ] Cache-Control set
- [ ] X-Frame-Options: DENY

### Administrative Security
- [ ] Admin actions logged
- [ ] Audit trail immutable
- [ ] Change tracking enabled
- [ ] Admin account protected
- [ ] Suspicious activity alerts
- [ ] Regular security logs review
- [ ] Backup & restore procedures documented

### Infrastructure Security
- [ ] Environment variables secured
- [ ] Database credentials secured
- [ ] API keys rotated regularly
- [ ] SSH keys secured
- [ ] Server firewall configured
- [ ] DDoS protection enabled
- [ ] WAF rules configured

---

## 3. SECURITY TESTING PROCEDURES

### Manual Testing
```bash
# Test CSRF
curl -X POST http://localhost:5000/api/applications \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"1"}' \
  # Should fail without CSRF token

# Test Rate Limiting
for i in {1..150}; do
  curl http://localhost:5000/api/services
done
# Should get 429 after limit

# Test SQL Injection
curl "http://localhost:5000/api/services?search='; DROP TABLE users; --"
# Should return no results, not error

# Test XSS in Forms
# Submit form with: <script>alert('xss')</script>
# Should be sanitized, not execute
```

### Automated Testing
```bash
# Run OWASP ZAP scanner
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:5000

# Run dependency audit
npm audit --audit-level=moderate

# Run static analysis
npm install -g snyk
snyk test
```

---

## 4. DEPLOYMENT SECURITY CHECKLIST

### Before Production Deployment
- [ ] All 13 vulnerabilities addressed
- [ ] Security tests passing
- [ ] Dependency audit clean
- [ ] Secrets not in git history
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules set
- [ ] DDoS protection enabled
- [ ] Monitoring & alerting configured
- [ ] Incident response plan documented
- [ ] Security training completed

### Production Configuration
- [ ] NODE_ENV=production
- [ ] Debug mode disabled
- [ ] Error details hidden
- [ ] HTTPS enforced
- [ ] CORS restricted to frontend domain
- [ ] Rate limits strict
- [ ] Logging to file (not console)
- [ ] Database read replicas
- [ ] Cache layer (Redis)
- [ ] CDN configured

---

## 5. SECURITY BEST PRACTICES

### Code Review Checklist
- [ ] No hardcoded secrets
- [ ] No SQL in code
- [ ] All inputs validated
- [ ] Authentication checked
- [ ] Authorization verified
- [ ] Error handling appropriate
- [ ] No logging of sensitive data
- [ ] Dependencies reviewed

### Regular Security Activities
- [ ] Weekly: Review security logs
- [ ] Monthly: Dependency updates
- [ ] Quarterly: Full security audit
- [ ] Semi-annually: Penetration testing
- [ ] Annually: Security training

---

## ESTIMATED EFFORT: 6-10 hours

| Task | Hours | Priority |
|------|-------|----------|
| CSRF Protection | 1 | HIGH |
| Input Validation | 1.5 | CRITICAL |
| Rate Limiting | 1 | MEDIUM |
| Security Headers | 0.5 | MEDIUM |
| Logging & Audit | 1 | MEDIUM |
| Testing | 2 | HIGH |
| Documentation | 1 | LOW |
| **Total** | **8** | - |

---

## SUCCESS CRITERIA

✅ **Phase 8 Complete When:**
- All 13 vulnerabilities addressed
- Security audit passing
- Automated tests passing
- Code review approved
- Documentation updated
- Team trained on security practices

**Next Phase:** Phase 9 - Code Cleanup & Optimization

