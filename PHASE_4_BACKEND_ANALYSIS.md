# PHASE 4: UI ANALYSIS & BACKEND DESIGN
## Business Logic Inference from Frontend UI

**Date:** 2026-06-27  
**Based on:** Frontend page analysis (13 pages)  
**Deliverable:** Backend API Specification & Database Design

---

## 1. BUSINESS LOGIC ANALYSIS

### Primary User Workflows:

#### Workflow 1: Citizen Registration & Login
```
User → Enter Phone → Receive OTP → Verify OTP → Enter Name → Dashboard
```
- **Data:** Phone number (10 digits, India), Name (optional)
- **Authentication:** OTP-based (temporary, expires in 5 minutes)
- **Storage:** JWT token (24h expiry) + Refresh token (7d expiry)
- **Roles:** citizen (default)

#### Workflow 2: Browse & Apply for Services
```
Home → View Services → Service Details → Fill Form → Review → Submit → Track
```
- **Features:**
  - Search services by name/keyword
  - Filter by category
  - View service details (name, description, fee, SLA, requirements)
  - Dynamic form fields based on service
  - Application reference number generation
  - Status tracking: draft → submitted → approved/rejected
  - SMS notifications on status change

#### Workflow 3: File Complaint
```
Dashboard → New Complaint → Fill Form → Submit → Track Status
```
- **Data:** Title, Description, Category(?), Attachments(?)
- **Status:** open → assigned → resolved/closed
- **Tracking:** Reference number, status updates

#### Workflow 4: RTI (Right to Information) Request
```
Dashboard → New RTI → Submit Request → Track Response
```
- **Data:** Subject, Description, Category(?)
- **Status:** pending → assigned → responded
- **Documents:** Response attachments

#### Workflow 5: Process Payment
```
Select Service → View Fee → Initiate Payment → Payment Gateway → Success/Failure
```
- **Payment Gateway:** Appears to be mock (currently)
- **Status:** pending → success → failed
- **Tracking:** Payment ID, amount, date

#### Workflow 6: Admin/Officer Management
```
Admin → View All Applications/Complaints → Filter → Update Status → Add Remarks
```
- **Features:**
  - Dashboard with statistics
  - List of pending applications/complaints
  - Status update with remarks
  - CSV export of data
  - User management (?)

#### Workflow 7: Government Schemes Discovery
```
Browse → Search Schemes → View Details → (External Application URL?)
```

---

## 2. REQUIRED CRUD OPERATIONS

### Users
- **Create:** Registration (phone + OTP verification)
- **Read:** Get current user, get user profile
- **Update:** Update name, email(?), profile info
- **Delete:** Optional (soft delete recommended)
- **Special:** Role escalation (to admin - server-side only)

### Services
- **Create:** Admin only
- **Read:** List all (with pagination), get by slug, search by name/category, filter
- **Update:** Admin only
- **Delete:** Soft delete
- **Special:** Link to application form fields

### Applications
- **Create:** Citizen (authenticated)
- **Read:** Get own applications, admin can see all
- **Update:** Citizen (draft only), Admin (status + remarks)
- **Delete:** Soft delete
- **Special:** Generate unique ref_no, validate SLA

### Complaints
- **Create:** Citizen (authenticated)
- **Read:** Get own complaints, admin can see all
- **Update:** Citizen (if draft), Admin (assign, status, remarks)
- **Delete:** Soft delete
- **Special:** File attachment support

### RTI Requests
- **Create:** Citizen (authenticated)
- **Read:** Get own, admin can see all
- **Update:** Admin (assign, respond, upload documents)
- **Delete:** Soft delete

### Payments
- **Create:** Initiate payment for application
- **Read:** Get payment history
- **Update:** Payment status (after gateway callback)
- **Delete:** N/A (keep records)
- **Special:** Webhook from payment gateway

### Admin Logs
- **Create:** Auto-log all state changes
- **Read:** Admin dashboard reports
- **Delete:** Archive/purge old records

---

## 3. VALIDATION RULES (Inferred)

### User Input Validation:
```javascript
// Phone
- Must be 10 digits
- Must be Indian number format (+91)
- Must be unique (if registration)

// OTP
- 6 digits (assumed from UI)
- Expires in 5 minutes
- Max 3 attempts per phone

// Service Application
- All required fields must be filled
- Field types: text, textarea, number, date, select
- File upload: type and size limits (unknown)

// Complaint
- Title: required, min 10 chars
- Description: required, min 20 chars
- Attachments: optional, max 5MB per file

// Payment
- Amount: must match service fee
- Cannot process if application already paid
```

---

## 4. ENTITY RELATIONSHIPS

```
User
├── Applications (1:N)
├── Complaints (1:N)
├── RTI Requests (1:N)
├── Payments (1:N)
└── AdminLogs (N:N) - if user is admin

Service
├── Applications (1:N)
├── FormFields (1:N)
└── Payments (1:N)

Application
├── User (N:1)
├── Service (N:1)
├── FormData (N:1)
├── Payment (0:1)
├── StatusHistory (1:N)
└── Documents (1:N)

Complaint
├── User (N:1)
├── AssignedTo (0:1 - admin)
├── Attachments (1:N)
└── StatusHistory (1:N)

RTI
├── User (N:1)
├── AssignedTo (0:1 - admin)
├── ResponseDocuments (1:N)
└── StatusHistory (1:N)

Payment
├── User (N:1)
├── Application (0:1)
└── GatewayResponse (JSON)

Scheme
└── (Independent, possibly external URLs)
```

---

## 5. REQUIRED API ENDPOINTS

### Authentication (Public)
```
POST   /api/auth/send-otp              # Send OTP to phone
POST   /api/auth/verify-otp            # Verify and create session
GET    /api/auth/me                    # Get current user (requires token)
POST   /api/auth/refresh               # Refresh token
POST   /api/auth/logout                # Logout (optional)
```

### Services (Public)
```
GET    /api/services                   # List all services (paginated, filterable)
GET    /api/services/{slug}            # Get service details
GET    /api/services/search            # Search services by name
GET    /api/alerts                     # Get alerts/notifications
GET    /api/schemes                    # List government schemes
```

### Applications (Authenticated)
```
POST   /api/applications               # Create application
GET    /api/applications               # Get own applications
GET    /api/applications/{ref_no}      # Get application details
PUT    /api/applications/{ref_no}      # Update (draft only)
DELETE /api/applications/{ref_no}      # Delete draft

# Admin endpoints
GET    /api/admin/applications         # Get all applications
PUT    /api/admin/applications/{ref_no} # Update status + remarks
GET    /api/admin/export/applications  # Export as CSV
```

### Complaints (Authenticated)
```
POST   /api/complaints                 # Create complaint
GET    /api/complaints                 # Get own complaints
GET    /api/complaints/{ref_no}        # Get complaint details
PUT    /api/complaints/{ref_no}        # Update (draft only)
DELETE /api/complaints/{ref_no}        # Delete draft

# Admin endpoints
GET    /api/admin/complaints           # Get all complaints
PUT    /api/admin/complaints/{ref_no}  # Assign + update status
GET    /api/admin/export/complaints    # Export as CSV
```

### RTI (Authenticated)
```
POST   /api/rti                        # Create RTI request
GET    /api/rti                        # Get own RTI requests
GET    /api/rti/{ref_no}               # Get RTI details

# Admin endpoints
GET    /api/admin/rti                  # Get all RTI requests
PUT    /api/admin/rti/{ref_no}         # Respond to RTI
```

### Payments (Authenticated)
```
POST   /api/payments/initiate          # Initiate payment
GET    /api/payments                   # Get payment history
POST   /api/payments/webhook           # Webhook from gateway (public)

# Mock endpoint (development)
POST   /api/payments/mock              # Mock payment for testing
```

### Dashboard (Authenticated)
```
GET    /api/dashboard/stats            # Get stats (count of items)
GET    /api/track/{ref_no}             # Track any application/complaint
```

### Admin (Admin-only)
```
GET    /api/admin/stats                # Admin dashboard statistics
POST   /api/admin/promote-self         # REMOVE - security risk
GET    /api/admin/export/{kind}        # Export data (applications, complaints, users, payments, rti)
```

### User (Authenticated)
```
GET    /api/user/profile               # Get user profile
PUT    /api/user/profile               # Update profile
```

---

## 6. RESPONSE FORMATS (Inferred)

### Login Response
```json
{
  "token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "user": {
    "id": "user_id",
    "phone": "+91-9999999999",
    "name": "John Doe",
    "role": "citizen",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

### Service Response
```json
{
  "id": "service_id",
  "name": "Birth Certificate",
  "slug": "birth-certificate",
  "description": "Apply for birth certificate...",
  "category": "vital_records",
  "fee": 100,
  "sla_days": 5,
  "requirements": ["Birth proof", "ID proof"],
  "fields": [
    {
      "name": "full_name",
      "label": "Full Name",
      "type": "text",
      "required": true
    }
  ]
}
```

### Application Response
```json
{
  "ref_no": "APP-2026-001234",
  "service_id": "service_123",
  "user_id": "user_123",
  "status": "submitted",
  "form_data": { },
  "remarks": "Under review",
  "documents": [],
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

### Error Response
```json
{
  "error": {
    "code": "INVALID_OTP",
    "message": "OTP has expired or is invalid",
    "details": {}
  }
}
```

### List Response (Pagination)
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

## 7. AUTHENTICATION & AUTHORIZATION

### Authentication Method:
- **Type:** JWT (JSON Web Token)
- **Flow:** OTP-based (no passwords)
- **Token Lifetime:** 24 hours
- **Refresh Token:** 7 days
- **Storage (Frontend):** localStorage (should be moved to httpOnly cookies)

### Authorization (RBAC):
```
Roles:
- citizen:  Default role, can apply, complain, file RTI, view own data
- officer:  Can manage complaints/RTI (assigned)
- admin:    Can manage all, view reports, export data
```

### Protected Resources:
- Authenticated: /dashboard, /apply, /complaints, /rti, /payments, /user/*
- Admin: /admin, /admin/*, /api/admin/*
- Public: /, /services, /schemes, /login, /track (public tracking)

---

## 8. DASHBOARD LOGIC (Inferred)

### Citizen Dashboard
```
- Stats cards:
  - Total applications (count)
  - Total complaints (count)
  - Total RTI requests (count)
  - Total payments (sum of amounts)

- Recent items list:
  - Recent applications with status
  - Recent complaints with status
  - Recent RTI with status
  - Recent payments with status

- Quick actions:
  - Browse services
  - File complaint
  - File RTI request
  - View payments
```

### Admin Dashboard
```
- Overall stats:
  - Total users (count)
  - Total applications (count)
  - Total complaints (open/total)
  - Total RTI (count)
  - Revenue (sum of payments)

- Actions:
  - Manage applications (list, update status, add remarks)
  - Manage complaints (assign, update status)
  - Export data to CSV
```

---

## 9. SEARCH & FILTER REQUIREMENTS

### Services Search
- **Query:** Full-text search on name/description
- **Filters:** Category
- **Pagination:** 20 per page

### Applications Filter
- **Status:** submitted, approved, rejected, pending
- **Date Range:** Created date
- **Admin View:** All users' applications

### Complaints Filter
- **Status:** open, assigned, resolved, closed
- **Priority:** Low, Medium, High (if applicable)
- **Admin View:** All users' complaints

---

## 10. FILE UPLOAD REQUIREMENTS

### Application Documents
- **Types:** PDF, JPG, PNG
- **Max Size:** 5MB per file
- **Max Files:** 3-5 files
- **Storage:** Cloud storage (AWS S3, GCP, etc.)

### Complaint Attachments
- **Types:** Same as applications
- **Max Size:** 5MB
- **Max Files:** 3

### RTI Response Documents
- **Types:** Any (PDF preferred)
- **Max Size:** 10MB
- **Upload:** By admin only

---

## 11. NOTIFICATION REQUIREMENTS

### SMS Notifications:
- OTP delivery
- Application status change (submitted, approved, rejected)
- Complaint assigned
- RTI responded

### Email Notifications (Optional):
- Application receipt
- Status updates
- RTI response

---

## 12. REPORTING & ANALYTICS

### Admin Reports:
- Applications by status (daily/weekly)
- Complaints resolution time
- Revenue by service
- User growth
- Service utilization
- Export to CSV

### Data Available for Export:
- Users (phone, name, role)
- Applications (ref_no, service, status, date)
- Complaints (ref_no, status, date)
- RTI (ref_no, status, date)
- Payments (amount, status, date)

---

## 13. SECURITY REQUIREMENTS

### API Security:
- HTTPS only
- JWT authentication
- Rate limiting (100 requests/15 minutes)
- CORS configured for frontend origin
- Input validation on all endpoints
- SQL injection prevention
- XSS protection

### Data Security:
- Password hashing (not applicable - OTP only)
- Token signing with secret key
- Refresh token rotation
- Secure storage of API keys
- PII data protection (phone numbers masked in logs)

### Admin Security:
- Server-side role verification on all admin endpoints
- Audit logging of all state changes
- No client-side role escalation
- Admin actions logged with timestamp and user ID

---

## 14. PERFORMANCE REQUIREMENTS

### Endpoints Performance:
- List endpoints: <1s response time
- Single resource fetch: <500ms
- Authentication: <200ms
- Search: <1s
- Admin export: <5s

### Database Optimization:
- Indexes on frequently queried fields
- Query optimization for list endpoints
- Pagination to limit result sets
- Cache headers for static data

---

## 15. SCALABILITY CONSIDERATIONS

### Expected Load:
- Initial: 100 users/day
- Growth: 10,000 users/month

### Architecture:
- Load balancer (if scaled)
- Database replication
- Caching layer (Redis)
- CDN for static assets
- Async job queue for exports

---

## SUMMARY

This analysis infers a **Municipal Government Services Portal** with:
- Citizen self-service (apply for services, file complaints, RTI)
- Admin management dashboard
- Status tracking & notifications
- Payment integration
- Report generation
- Role-based access control

**Next Step:** Phase 5 - Design normalized relational database schema

