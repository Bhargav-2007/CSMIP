# PHASE 9: CODE CLEANUP & OPTIMIZATION
## Refactoring and Performance Guide

**Date:** 2026-06-27  
**Status:** Implementation Checklist  
**Estimated Duration:** 4-6 hours  

---

## 1. CODE DUPLICATION ELIMINATION (20+ instances)

### 1.1 API Error Handling Duplication
**Current:** Every route has similar try-catch blocks
```javascript
// REPEATED IN EVERY ROUTE
try {
  // logic
} catch (error) {
  res.status(500).json({
    error: { code: 'ERROR_CODE', message: 'Error message' }
  });
}
```

**Solution:** Create error handler wrapper
```javascript
// backend/src/utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Use in routes:
router.get('/', asyncHandler(async (req, res) => {
  const data = await req.prisma.service.findMany();
  res.json(data);
}));
```

**Impact:** 200+ lines removed, 30+ routes simplified

### 1.2 Pagination Logic Duplication
**Current:** Every list endpoint implements pagination
```javascript
const skip = (parseInt(page) - 1) * parseInt(limit);
const [data, total] = await Promise.all([
  req.prisma.model.findMany({ skip, take: parseInt(limit) }),
  req.prisma.model.count()
]);
res.json({
  data,
  pagination: { total, page, limit, pages: Math.ceil(total / limit) }
});
```

**Solution:** Create pagination helper
```javascript
// backend/src/utils/pagination.js
const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  return { skip: (page - 1) * limit, take: limit, page, limit };
};

const formatPaginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: { total, page, limit, pages: Math.ceil(total / limit) }
});

// Use:
const { skip, take, page, limit } = getPaginationParams(req.query);
const [data, total] = await Promise.all([
  req.prisma.model.findMany({ skip, take }),
  req.prisma.model.count()
]);
res.json(formatPaginatedResponse(data, total, page, limit));
```

**Impact:** 100+ lines removed

### 1.3 Reference Number Generation Duplication
**Current:** Every route re-implements generateRefNo
```javascript
const generateRefNo = (prefix) => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `${prefix}-${year}-${random}`;
};
```

**Solution:** Centralized utility
```javascript
// backend/src/utils/refNo.js
const generateRefNo = (prefix) => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `${prefix}-${year}-${random}`;
};

module.exports = { generateRefNo };

// Import and use in all routes:
const { generateRefNo } = require('../utils/refNo');
```

**Impact:** 30+ lines removed

### 1.4 Frontend API Boilerplate
**Current:** Similar axios patterns in many pages
```javascript
try {
  const response = await apiClient.get('/api/endpoint');
  setData(response.data);
  toast.success('Success');
} catch (error) {
  toast.error(formatAPIError(error).message);
}
```

**Solution:** Custom hook
```javascript
// frontend/src/hooks/useApi.js
import { useState, useCallback } from 'react';
import { formatAPIError } from '@/services/api';
import { toast } from 'sonner';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (promise, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await promise;
      if (options.successMessage) {
        toast.success(options.successMessage);
      }
      return response.data;
    } catch (err) {
      const apiError = formatAPIError(err);
      setError(apiError);
      toast.error(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
};

// Use:
const { execute, loading } = useApi();
const data = await execute(
  apiClient.get('/api/endpoint'),
  { successMessage: 'Data loaded' }
);
```

**Impact:** 150+ lines removed from pages

---

## 2. PERFORMANCE OPTIMIZATION

### 2.1 Database Query Optimization

#### Add Indexes to Frequently Queried Fields
```javascript
// backend/prisma/schema.prisma - Already added:
@@index([phone])
@@index([role])
@@index([status])
@@index([userId])
@@index([createdAt])

// Additional for performance:
@@index([deletedAt]) // Soft deletes
@@index([serviceId]) // Foreign key
@@unique([refNo]) // Reference numbers
```

#### Implement Query Batching
```javascript
// backend/src/utils/batchLoader.js
const DataLoader = require('dataloader');

const userLoader = new DataLoader(async (userIds) => {
  return await req.prisma.user.findMany({
    where: { id: { in: userIds } }
  });
});

// Use in resolvers to prevent N+1 queries
```

### 2.2 Frontend Performance

#### Code Splitting
```javascript
// frontend/src/App.js
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Services = lazy(() => import('./pages/Services'));

<Suspense fallback={<LoadingPage />}>
  <Dashboard />
</Suspense>
```

#### Memoization for Heavy Components
```javascript
// frontend/src/components/ServiceCard.js
import { memo } from 'react';

const ServiceCard = memo(({ service, onClick }) => (
  <div onClick={onClick}>{service.name}</div>
), (prev, next) => prev.service.id === next.service.id);

export default ServiceCard;
```

#### API Response Caching
```javascript
// frontend/src/hooks/useCachedApi.js
import { useState, useEffect } from 'react';
import apiClient from '@/services/api';

export const useCachedApi = (endpoint, cacheTime = 5 * 60 * 1000) => {
  const cacheKey = `api_cache_${endpoint}`;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem(cacheKey);
    const timestamp = sessionStorage.getItem(`${cacheKey}_ts`);

    if (cached && Date.now() - parseInt(timestamp) < cacheTime) {
      setData(JSON.parse(cached));
      return;
    }

    setLoading(true);
    apiClient.get(endpoint).then(response => {
      sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
      sessionStorage.setItem(`${cacheKey}_ts`, Date.now().toString());
      setData(response.data);
      setLoading(false);
    });
  }, [endpoint]);

  return { data, loading };
};
```

### 2.3 Bundle Size Optimization

```bash
# Analyze bundle
npm run build
npm install --save-dev webpack-bundle-analyzer

# Check for large dependencies
npm list --depth=0
```

**Remove unused dependencies:**
- [ ] Unused UI components
- [ ] Unused utilities
- [ ] Duplicated dependencies

---

## 3. CODE QUALITY IMPROVEMENTS

### 3.1 Add Comprehensive Comments
```javascript
/**
 * Generates a unique reference number for service applications
 * @param {string} prefix - Type prefix (APP, CMP, RTI)
 * @returns {string} Formatted reference number: APP-2026-00123
 */
const generateRefNo = (prefix) => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `${prefix}-${year}-${random}`;
};
```

### 3.2 Extract Reusable Hooks (Frontend)

```javascript
// frontend/src/hooks/useForm.js
import { useState, useCallback } from 'react';

export const useForm = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  return { values, errors, touched, handleChange, handleBlur, handleSubmit };
};
```

### 3.3 Improve Error Handling

```javascript
// backend/src/utils/errors.js
class AppError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super('VALIDATION_ERROR', message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError
};

// Use in routes:
if (!user) {
  throw new AuthenticationError('User not found');
}
```

### 3.4 Add TypeScript Interfaces (Optional but recommended)

```typescript
// backend/src/types/index.ts
export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  refNo: string;
  userId: string;
  serviceId: string;
  status: ApplicationStatus;
  formData: Record<string, any>;
  // ... other fields
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
```

---

## 4. TESTING ADDITIONS

### 4.1 Unit Tests
```bash
npm install --save-dev jest @testing-library/react

# Create test files
backend/src/__tests__/utils/pagination.test.js
backend/src/__tests__/utils/refNo.test.js
backend/src/__tests__/middleware/auth.test.js
```

### 4.2 Integration Tests
```javascript
// backend/__tests__/integration/auth.test.js
const request = require('supertest');
const app = require('../../index');

describe('Authentication API', () => {
  it('should send OTP successfully', async () => {
    const response = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '9999999999' });
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('OTP sent successfully');
  });
});
```

### 4.3 E2E Tests (Frontend)
```bash
npm install --save-dev cypress

# Create cypress/e2e/login.cy.js
describe('Login Flow', () => {
  it('should login with OTP', () => {
    cy.visit('http://localhost:3000/login');
    cy.get('[data-testid="login-phone-input"]').type('9999999999');
    cy.get('[data-testid="send-otp-btn"]').click();
    cy.get('[data-testid="login-otp-input"]').type('123456');
    cy.get('[data-testid="verify-otp-btn"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

---

## 5. CLEANUP CHECKLIST

### Code Cleanup
- [ ] Remove dead code
- [ ] Remove console.log statements (except in development)
- [ ] Remove commented-out code
- [ ] Standardize quote style
- [ ] Fix linting errors
- [ ] Run Prettier/ESLint
- [ ] Remove unused variables
- [ ] Remove unused imports
- [ ] Rename ambiguous variables
- [ ] Update outdated comments

### Configuration Cleanup
- [ ] Remove unused dependencies
- [ ] Update outdated packages
- [ ] Verify .gitignore is correct
- [ ] Remove debug configs
- [ ] Clean up environment examples

### Documentation Cleanup
- [ ] Update README.md
- [ ] Update inline comments
- [ ] Remove old TODOs
- [ ] Document all functions
- [ ] Add architecture diagrams

---

## ESTIMATED EFFORT: 4-6 hours

| Task | Hours | Impact |
|------|-------|--------|
| Error Handling | 1 | HIGH |
| Duplication | 1.5 | MEDIUM |
| Performance | 1.5 | MEDIUM |
| Testing | 1 | LOW |
| Cleanup | 0.5 | LOW |
| **Total** | **5.5** | - |

---

## SUCCESS CRITERIA

✅ **Phase 9 Complete When:**
- 30%+ duplication removed
- Build size < 200KB (gzipped)
- Lighthouse score > 80
- Linting errors: 0
- Unit test coverage > 70%
- Documentation complete

**Next Phase:** Phase 10 - Documentation & Deployment

