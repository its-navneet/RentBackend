# PG Ecosystem Platform - Implementation Guide

## Overview

This document outlines the complete PG (Paying Guest) ecosystem platform implementation, including smart roommate matching, booking lifecycle management, multi-directional ratings, ledger management, and tenant reliability scoring.

---

## 1. CORE FEATURES IMPLEMENTED

### 1.1 Smart Roommate Matching System

**Models:**

- `MatchProfile.ts` - Stores user lifestyle preferences and interests

**Services:**

- `services/matching.ts` - Implements weighted compatibility algorithm

**Algorithm Weights:**

```
- Budget match: 35%
- Sleep schedule: 20%
- Cleanliness: 15%
- Smoking/Drinking habits: 15%
- Interests similarity: 10%
- Personality: 5%
```

**Match Categories:**

- Excellent: 85-100%
- Good: 70-85%
- Moderate: 50-70%
- Not recommended: <50%

**API Endpoints:**

```
POST   /api/matching/profile                    - Create/update match profile
GET    /api/matching/profile/:userId            - Get user's profile
GET    /api/matching/find-matches/:userId       - Find compatible matches
GET    /api/matching/compatibility/:userId1/:userId2 - Get compatibility score
POST   /api/matching/show-interest              - Mark interest in user
GET    /api/matching/profile-by-interests       - Search by interests
```

---

### 1.2 Booking Lifecycle Management

**Models:**

- `VisitRequest.ts` - Property visit requests
- `BookingRequest.ts` - Booking requests with deposit/rent details
- `StayRecord.ts` - Active tenancy records

**Status Flow:**

```
VISIT REQUEST:
Pending → Approved → Completed
         → Rejected

BOOKING REQUEST:
Pending → Approved → Payment Pending → Confirmed
        → Rejected

STAY RECORD:
Upcoming → Active → Notice Period → Completed
                 → Cancelled
```

**API Endpoints:**

```
POST   /api/booking-lifecycle/visit-request              - Create visit request
GET    /api/booking-lifecycle/visit-requests/:ownerId    - Get visit requests
PATCH  /api/booking-lifecycle/visit-request/:id         - Approve/reject visit

POST   /api/booking-lifecycle/booking-request            - Create booking request
GET    /api/booking-lifecycle/booking-requests/:ownerId  - Get booking requests
PATCH  /api/booking-lifecycle/booking-request/:id       - Approve/reject booking

POST   /api/booking-lifecycle/stay-record               - Create stay record
GET    /api/booking-lifecycle/stay-records/:tenantId    - Get tenant stays
PATCH  /api/booking-lifecycle/stay-record/:id           - Update stay status
GET    /api/booking-lifecycle/active-stays/:propertyId  - Get active tenants
```

---

### 1.3 Multi-Directional Rating System

**Models:**

- `Review.ts` - Updated to support three rating types

**Rating Types:**

1. **Owner → Tenant** (Monthly ratings)
   - Rent payment punctuality
   - Cleanliness
   - Rule adherence
   - Behaviour
   - Damage responsibility

2. **Tenant → Owner** (Post-stay ratings)
   - Transparency
   - Maintenance response
   - Respectful behaviour
   - Deposit handling

3. **Tenant → Property** (Post-stay ratings)
   - Cleanliness
   - Water availability
   - Electricity
   - WiFi quality
   - Safety
   - Noise levels

**Rules:**

- Only allowed if StayRecord exists
- Rating locked after submission (no editing)
- Shows only after both parties submit or after 7 days

**API Endpoints:**

```
POST   /api/ratings/submit                              - Submit rating
GET    /api/ratings/stay/:stayRecordId                 - Get stay ratings
GET    /api/ratings/received/:userId                   - Get received ratings
GET    /api/ratings/given/:userId                      - Get submitted ratings
GET    /api/ratings/property/:propertyId               - Get property ratings
GET    /api/ratings/check-eligibility/:stayRecordId/:userId
```

---

### 1.4 PG Ledger Management System

**Models:**

- `LedgerEntry.ts` - Monthly ledger entries with charges
- `Payment.ts` - Payment records

**Auto-Generated Charges:**

- Rent
- Electricity
- Food
- Laundry
- Penalties
- Custom charges

**Ledger Fields:**

- `totalAmount` - Sum of all charges
- `paidAmount` - Amount paid so far
- `balance` - Outstanding amount
- `status` - Paid / Partial / Overdue
- `dueDate` - Payment deadline (5th of next month by default)

**Services:**

- `services/ledger.ts` - Ledger creation, payment tracking, PDF generation

**API Endpoints:**

```
GET    /api/ledger/entries/:tenantId                    - Get payment history
GET    /api/ledger/entries-by-property/:propertyId    - Get property ledgers
GET    /api/ledger/entry/:ledgerId                     - Get ledger details
POST   /api/ledger/add-charge/:ledgerId                - Add custom charge
GET    /api/ledger/summary/:tenantId                   - Tenant ledger summary
GET    /api/ledger/owner-summary/:ownerId              - Owner payment summary

POST   /api/ledger/record-payment/:ledgerId            - Record payment
GET    /api/ledger/payments/:tenantId                  - Payment history
GET    /api/ledger/payments-for-owner/:ownerId         - Owner received payments
GET    /api/ledger/payment/:paymentId                  - Payment details
POST   /api/ledger/initiate-payment                    - Start payment process
```

---

### 1.5 Tenant Reliability Score

**Models:**

- `TenantReliabilityScore.ts` - Reliability metrics and badges

**Score Calculation:**

```
Score = (PaymentPunctuality × 0.4) + (OwnerRating × 0.4) + (StayDuration × 0.2)
```

**Badges:**

- 🟢 **Trusted Tenant** (80+): Proven track record of reliability
- 🟡 **Good Tenant** (60-80): Good payment history
- 🔴 **Needs Review** (<60): New tenant or needs verification

**Factors:**

- Payment punctuality (on-time payment percentage)
- Owner rating average
- Complaint frequency
- Total stay duration
- Active/completed stays ratio

**Services:**

- `services/reliabilityScore.ts` - Score calculation and updates

**API Endpoints:**

```
GET    /api/ratings/reliability-score/:tenantId        - Get full score details
GET    /api/ratings/reliability-badge/:tenantId        - Get badge + description
POST   /api/ratings/update-reliability/:tenantId       - Manual score update
```

---

### 1.6 Updated User Model

**New Fields:**

```typescript
{
  role: 'tenant' | 'owner' | 'admin',
  profileImage?: string,
  bio?: string,
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'on_review',
  ratingSummary: {
    averageRating: number,
    totalRatings: number,
    recentRatings: number[]
  },
  isActive: boolean,
  isBlocked: boolean,
  blockedUsers: ObjectId[]
}
```

---

## 2. DATABASE COLLECTIONS

```
Users
├── Profile info
├── Roles (tenant/owner/admin)
├── Verification status
├── Rating summary

MatchProfiles
├── Lifestyle preferences
├── Interests
├── Budget range
└── Preferred properties

Properties
├── Owner details
├── Address & amenities
├── Photos
└── Landmarks

Rooms
├── Room details
├── Pricing
└── Availability

VisitRequests
├── Tenant → Property visit
├── Status tracking
└── Request history

BookingRequests
├── Formal booking requests
├── Deposit & rent info
└── Status pipeline

StayRecords
├── Active tenancy tracking
├── Check-in/out dates
├── Notice period tracking
└── Cancellation records

LedgerEntries
├── Monthly charges
├── Payment status
├── Due dates
└── Payment history

Payments
├── Payment records
├── Transaction IDs
├── Payment methods
└── Status tracking

Ratings
├── Owner→Tenant ratings
├── Tenant→Owner ratings
├── Tenant→Property ratings
└── Rating criteria

TenantReliabilityScores
├── Overall score (0-100)
├── Badge assignment
├── Component scores
└── Stay metrics
```

---

## 3. SECURITY & ANTI-FRAUD MEASURES

✅ **Rating Protection:**

- Ratings only possible if StayRecord exists
- Locked after submission (prevents editing)
- Auditable rating trail

✅ **Payment Security:**

- Transaction ID tracking (unique)
- Payment method recording
- Ledger state immutability
- Payment status validation

✅ **Access Control:**

- Role-based endpoints
- Tenant can only view own ledgers
- Owner can only see own property data
- Admin oversight capabilities

✅ **Data Validation:**

- Amount validation (>0)
- Status enum validation
- Reference integrity checks
- Duplicate prevention

---

## 4. CRON JOBS & AUTOMATION

**Monthly Ledger Creation** (Run on 1st of every month):

```typescript
POST / api / ledger / create - monthly - ledgers;
```

Automatically creates ledger entries for all active stays.

**Payment Reminders** (Run on 3rd of every month):

```typescript
POST / api / ledger / send - payment - reminders;
```

Sends notifications for upcoming due dates.

**Reliability Score Updates** (Run daily):

```typescript
POST / api / ratings / daily - score - updates;
```

Recalculates reliability scores based on latest data.

---

## 5. INTEGRATION POINTS

### Payment Gateway Integration

Replace `/api/ledger/initiate-payment` with:

- Razorpay
- Stripe
- PhonePe

### Notification Service

- Email for payment reminders
- SMS for rating requests
- Push notifications for matches

### PDF Generation

Implement invoice generation in LedgerService:

```typescript
generatePDF(ledgerId: string): Promise<Buffer>
```

---

## 6. USAGE EXAMPLES

### Example 1: Roommate Matching Flow

```typescript
// 1. Create match profile
POST /api/matching/profile
{
  "userId": "...",
  "lifestyle": {
    "sleepTime": "late",
    "cleanliness": "high",
    "smoking": "no",
    "drinking": "social"
  },
  "interests": ["coding", "gym", "music"],
  "budgetRange": { "min": 5000, "max": 10000 }
}

// 2. Find matches
GET /api/matching/find-matches/userId?limit=20

// 3. Check compatibility
GET /api/matching/compatibility/userId1/userId2

// 4. Show interest (when both interested, chat unlocks)
POST /api/matching/show-interest
{
  "fromUserId": "...",
  "toUserId": "..."
}
```

### Example 2: Booking Lifecycle

```typescript
// 1. Request visit
POST /api/booking-lifecycle/visit-request
{
  "tenantId": "...",
  "propertyId": "...",
  "requestedDate": "2024-03-15"
}

// 2. Owner approves visit
PATCH /api/booking-lifecycle/visit-request/:id
{ "status": "approved" }

// 3. Create booking request
POST /api/booking-lifecycle/booking-request
{
  "tenantId": "...",
  "propertyId": "...",
  "proposedCheckInDate": "2024-04-01",
  "depositAmount": 10000,
  "monthlyRent": 5000
}

// 4. Owner approves booking
PATCH /api/booking-lifecycle/booking-request/:id
{ "status": "approved" }

// 5. Tenant makes payment
POST /api/ledger/initiate-payment
{
  "ledgerId": "...",
  "amount": 15000
}

// 6. Create stay record
POST /api/booking-lifecycle/stay-record
{
  "bookingRequestId": "...",
  "checkInDate": "2024-04-01"
}

// 7. Update to active
PATCH /api/booking-lifecycle/stay-record/:id
{ "status": "active" }
```

### Example 3: Rating & Reliability

```typescript
// 1. After stay completion, owner rates tenant
POST /api/ratings/submit
{
  "ratingType": "owner_to_tenant",
  "stayRecordId": "...",
  "fromUserId": "ownerId",
  "toUserId": "tenantId",
  "overallRating": 4,
  "criteria": {
    "rentPunctuality": 5,
    "cleanliness": 4,
    "ruleAdherence": 4,
    "behaviour": 4,
    "damageResponsibility": 5
  }
}

// 2. Get tenant reliability score
GET /api/ratings/reliability-score/tenantId

// 3. Get badge for display
GET /api/ratings/reliability-badge/tenantId
```

---

## 7. NEXT STEPS

1. **Frontend Integration**
   - Design match profile UI
   - Implement booking workflow screens
   - Create owner dashboard
   - Add rating submission forms

2. **Payment Gateway**
   - Integrate Razorpay/Stripe
   - Handle webhooks
   - Implement refunds

3. **Notifications**
   - Send SMS/Email for reminders
   - Push notifications for matches
   - Rating request notifications

4. **Admin Dashboard**
   - User management
   - Dispute resolution
   - Analytics & reports
   - Revenue tracking

5. **Analytics**
   - Occupancy rate tracking
   - Revenue analytics
   - Tenant satisfaction metrics
   - Market insights

---

## 8. API SUMMARY

| Module            | Endpoints                            | Count                |
| ----------------- | ------------------------------------ | -------------------- |
| Matching          | Profile, Find Matches, Compatibility | 6                    |
| Booking Lifecycle | Visit, Booking, Stay Records         | 10                   |
| Ledger            | Entries, Charges, Payments           | 10                   |
| Ratings           | Submit, View, Reliability Score      | 11                   |
| **TOTAL**         |                                      | **37 New Endpoints** |

---

## 9. ERROR HANDLING

All endpoints return consistent error format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common status codes:

- 400: Bad Request (validation error)
- 404: Not Found
- 403: Forbidden (permission denied)
- 500: Server Error

---

## 10. TESTING CHECKLIST

- [ ] Match algorithm accuracy
- [ ] Booking status transitions
- [ ] Ledger auto-generation
- [ ] Payment recording
- [ ] Rating eligibility checks
- [ ] Reliability score calculation
- [ ] Concurrent payment handling
- [ ] Data consistency
- [ ] Role-based access control
- [ ] Error handling edge cases

---

**Version:** 1.0  
**Last Updated:** March 2024  
**Status:** Implementation Complete
