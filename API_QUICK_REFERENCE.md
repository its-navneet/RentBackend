# PG Ecosystem Platform - API Quick Reference

## 🎯 Quick Links

- [Matching System](#matching-system)
- [Booking Lifecycle](#booking-lifecycle)
- [Ledger & Payments](#ledger--payments)
- [Ratings & Reliability](#ratings--reliability)

---

## 🤝 Matching System

### Create Match Profile

```bash
POST /api/matching/profile
Content-Type: application/json

{
  "userId": "user_id",
  "lifestyle": {
    "sleepTime": "early|late|flexible",
    "cleanliness": "high|medium|chill",
    "smoking": "yes|no|occasionally",
    "drinking": "yes|no|occasionally",
    "guestFrequency": "frequent|occasional|rare",
    "workType": "student|professional|remote",
    "personality": "introvert|ambivert|extrovert"
  },
  "interests": ["gym", "coding", "music", "gaming", "reading", "travel", "sports", "entrepreneurship", "movies"],
  "budgetRange": {
    "min": 5000,
    "max": 10000
  },
  "bio": "Optional bio"
}
```

### Find Matches

```bash
GET /api/matching/find-matches/user_id?limit=20
```

**Response:**

```json
{
  "totalMatches": 5,
  "matches": [
    {
      "profileId": "match_user_id",
      "userName": "Name",
      "matchPercentage": 87,
      "category": "excellent",
      "scoreBreakdown": {
        "budgetMatch": 100,
        "sleepScheduleMatch": 80,
        "cleanlinessMatch": 75,
        "habitsMatch": 90,
        "interestSimilarity": 60,
        "personalityMatch": 100
      }
    }
  ]
}
```

### Check Compatibility

```bash
GET /api/matching/compatibility/user_id_1/user_id_2
```

### Show Interest

```bash
POST /api/matching/show-interest

{
  "fromUserId": "user_id_1",
  "toUserId": "user_id_2"
}
```

_Chat unlocks when both users show interest_

---

## 📋 Booking Lifecycle

### Visit Request Flow

**Create Visit Request**

```bash
POST /api/booking-lifecycle/visit-request

{
  "tenantId": "tenant_id",
  "propertyId": "property_id",
  "requestedDate": "2024-03-15T10:00:00Z",
  "notes": "Optional notes"
}
```

**Get Owner's Visit Requests**

```bash
GET /api/booking-lifecycle/visit-requests/owner_id?status=pending
```

**Approve/Reject Visit**

```bash
PATCH /api/booking-lifecycle/visit-request/visit_id

{
  "status": "approved|rejected|completed",
  "rejectionReason": "Optional reason if rejected"
}
```

---

### Booking Request Flow

**Create Booking Request**

```bash
POST /api/booking-lifecycle/booking-request

{
  "tenantId": "tenant_id",
  "propertyId": "property_id",
  "visitRequestId": "optional_visit_request_id",
  "proposedCheckInDate": "2024-04-01T00:00:00Z",
  "depositAmount": 10000,
  "monthlyRent": 5000,
  "notes": "Optional notes"
}
```

**Get Owner's Booking Requests**

```bash
GET /api/booking-lifecycle/booking-requests/owner_id?status=pending
```

**Approve/Reject Booking**

```bash
PATCH /api/booking-lifecycle/booking-request/booking_id

{
  "status": "approved|payment_pending|confirmed|rejected",
  "rejectionReason": "Optional reason"
}
```

---

### Stay Record Management

**Create Stay Record** (After payment confirmed)

```bash
POST /api/booking-lifecycle/stay-record

{
  "tenantId": "tenant_id",
  "propertyId": "property_id",
  "ownerId": "owner_id",
  "bookingRequestId": "booking_request_id",
  "checkInDate": "2024-04-01T00:00:00Z",
  "monthlyRent": 5000,
  "depositAmount": 10000
}
```

**Get Tenant's Stays**

```bash
GET /api/booking-lifecycle/stay-records/tenant_id?status=active
```

**Update Stay Status**

```bash
PATCH /api/booking-lifecycle/stay-record/stay_id

{
  "status": "active|notice_period|completed|cancelled",
  "checkOutDate": "2024-05-01T00:00:00Z",
  "noticeGivenDate": "2024-04-10T00:00:00Z",
  "cancellationReason": "Optional reason"
}
```

**Get Active Tenants for Property**

```bash
GET /api/booking-lifecycle/active-stays/property_id
```

---

## 💰 Ledger & Payments

### Ledger Entries

**Get Payment History**

```bash
GET /api/ledger/entries/tenant_id?months=12
```

**Get Property Ledgers**

```bash
GET /api/ledger/entries-by-property/property_id?status=overdue
```

**Get Ledger Details**

```bash
GET /api/ledger/entry/ledger_id
```

**Add Custom Charge**

```bash
POST /api/ledger/add-charge/ledger_id

{
  "type": "penalty|custom|electricity|food|laundry",
  "name": "Late Water Charges",
  "amount": 500,
  "description": "Extra water usage"
}
```

---

### Summaries

**Tenant Ledger Summary**

```bash
GET /api/ledger/summary/tenant_id

Response:
{
  "totalPaid": 15000,
  "totalOutstanding": 5000,
  "recentPayments": [...],
  "upcomingDue": [...]
}
```

**Owner Payment Summary**

```bash
GET /api/ledger/owner-summary/owner_id

Response:
{
  "totalOutstanding": 25000,
  "totalPaid": 60000,
  "totalOverdue": 10000,
  "byStatus": {
    "paid": 12,
    "partial": 3,
    "overdue": 5
  }
}
```

---

### Payments

**Record Payment**

```bash
POST /api/ledger/record-payment/ledger_id

{
  "tenantId": "tenant_id",
  "amount": 5000,
  "transactionId": "TXN-123456",
  "paymentMethod": "upi|card|bank_transfer|cash"
}
```

**Get Payment History**

```bash
GET /api/ledger/payments/tenant_id?status=completed
```

**Get Payments Received**

```bash
GET /api/ledger/payments-for-owner/owner_id?status=completed
```

**Initiate Payment**

```bash
POST /api/ledger/initiate-payment

{
  "ledgerId": "ledger_id",
  "tenantId": "tenant_id",
  "amount": 5000
}

Response: { "transactionId": "...", "paymentId": "..." }
```

---

## ⭐ Ratings & Reliability

### Submit Rating

**Owner Rating Tenant** (After stay)

```bash
POST /api/ratings/submit

{
  "ratingType": "owner_to_tenant",
  "stayRecordId": "stay_id",
  "fromUserId": "owner_id",
  "toUserId": "tenant_id",
  "overallRating": 4,
  "criteria": {
    "rentPunctuality": 5,
    "cleanliness": 4,
    "ruleAdherence": 4,
    "behaviour": 4,
    "damageResponsibility": 5
  },
  "comment": "Great tenant!",
  "isAnonymous": false
}
```

**Tenant Rating Owner**

```bash
POST /api/ratings/submit

{
  "ratingType": "tenant_to_owner",
  "stayRecordId": "stay_id",
  "fromUserId": "tenant_id",
  "toUserId": "owner_id",
  "overallRating": 4,
  "criteria": {
    "transparency": 4,
    "maintenanceResponse": 5,
    "respectfulBehaviour": 4,
    "depositHandling": 4
  },
  "comment": "Responsive owner",
  "isAnonymous": false
}
```

**Tenant Rating Property**

```bash
POST /api/ratings/submit

{
  "ratingType": "tenant_to_property",
  "fromUserId": "tenant_id",
  "propertyId": "property_id",
  "overallRating": 4,
  "criteria": {
    "cleanliness": 4,
    "waterAvailability": 5,
    "electricity": 4,
    "wifi": 3,
    "safety": 5,
    "noise": 3
  },
  "comment": "Good property overall"
}
```

---

### View Ratings

**Get Stay Ratings**

```bash
GET /api/ratings/stay/stay_id
```

**Get Ratings Received**

```bash
GET /api/ratings/received/user_id?ratingType=owner_to_tenant
```

**Get Ratings Given**

```bash
GET /api/ratings/given/user_id?ratingType=tenant_to_owner
```

**Get Property Ratings**

```bash
GET /api/ratings/property/property_id

Response:
{
  "total": 15,
  "averageRating": 4.2,
  "ratings": [...]
}
```

---

### Tenant Reliability

**Get Full Reliability Score**

```bash
GET /api/ratings/reliability-score/tenant_id

Response:
{
  "score": 82,
  "badge": "trusted_tenant",
  "paymentPunctualityScore": 95,
  "ownerRatingAverage": 4.3,
  "complaintCount": 0,
  "totalStayDuration": 24,
  "completedStays": 3
}
```

**Get Reliability Badge** (For display)

```bash
GET /api/ratings/reliability-badge/tenant_id

Response:
{
  "badge": "trusted_tenant",
  "score": 82,
  "description": "This tenant has a proven track record..."
}
```

**Check Rating Eligibility**

```bash
GET /api/ratings/check-eligibility/stay_id/user_id

Response: { "eligible": true, "message": "..." }
```

---

## 📊 Status Codes

| Code | Meaning      |
| ---- | ------------ |
| 200  | Success      |
| 201  | Created      |
| 400  | Bad Request  |
| 404  | Not Found    |
| 403  | Forbidden    |
| 500  | Server Error |

---

## 🔐 Key Security Rules

✅ **Match Profile**: Unique per user  
✅ **Visit Request**: One per tenant per property per date  
✅ **Booking Request**: Status-locked, can't skip steps  
✅ **Stay Record**: Required for ratings  
✅ **Ratings**: Locked after submission  
✅ **Ledger**: Amount must be > 0  
✅ **Payment**: Transaction ID must be unique

---

## 📱 Common Workflows

### Workflow 1: Find & Book

```
1. Create Match Profile
2. Find Matches
3. Show Interest (mutual)
4. Request Visit
5. Owner Approves Visit
6. Create Booking Request
7. Record Payment
8. Create Stay Record
```

### Workflow 2: Monthly Payment

```
1. Ledger auto-generated (1st of month)
2. Tenant receives reminder
3. Tenant initiates payment
4. Payment recorded
5. Ledger status updated
6. Receipt sent
```

### Workflow 3: End of Stay Rating

```
1. Tenant moves out
2. Stay Record marked "completed"
3. Owner submits rating
4. Tenant submits rating
5. Ratings visible to both
6. Reliability score updated
```

---

**Version:** 1.0  
**Last Updated:** March 2024
