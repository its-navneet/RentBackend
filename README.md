# Rent Backend API Documentation

A backend API service for a rental platform connecting property owners with students.

## Base URL
```
http://localhost:3000
```

## Table of Contents
- [Authentication](#authentication)
- [Users](#users)
- [Properties](#properties)
- [Bookings](#bookings)
- [Reviews](#reviews)
- [Agreements](#agreements)

---

## Authentication

### Register User
**POST** `/api/auth/register`

Register a new user (student or owner).

#### Request Payload
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |
| role | 'student' \| 'owner' | Yes | User role |
| name | string | Yes | Full name |
| phone | string | No | Phone number |

```
json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "student",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

#### Response
```
json
{
  "success": true,
  "data": {
    "uid": "user_123456",
    "email": "user@example.com",
    "role": "student"
  },
  "message": "User registered successfully"
}
```

---

### Login
**POST** `/api/auth/login`

Authenticate a user.

#### Request Payload
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

```
json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Response
```
json
{
  "success": true,
  "data": {
    "uid": "user_123456",
    "email": "user@example.com",
    "role": "student",
    "name": "John Doe"
  },
  "message": "Login successful"
}
```

---

### Logout
**POST** `/api/auth/logout`

Logout the current user.

#### Request Payload
No payload required.

#### Response
```
json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get Current User
**GET** `/api/auth/me`

Get the currently authenticated user.

#### Headers
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token (simulated) |

#### Response
```
json
{
  "success": true,
  "data": {
    "id": "user_123456",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "phone": "+1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "verified": false
  }
}
```

---

### Set Current User (Testing Helper)
**PUT** `/api/auth/set-user`

Set the current user (for testing purposes).

#### Request Payload
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| uid | string | Yes | User ID |
| email | string | Yes | User email |

```
json
{
  "uid": "user_123456",
  "email": "user@example.com"
}
```

#### Response
```
json
{
  "success": true,
  "message": "User set successfully"
}
```

---

## Users

### Get All Users
**GET** `/api/users`

Get all users (optionally filtered by role).

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| role | 'student' \| 'owner' | No | Filter by user role |

#### Response
```
json
{
  "success": true,
  "data": [
    {
      "id": "user_123456",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "student",
      "phone": "+1234567890",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "verified": false
    }
  ]
}
```

---

### Get User by ID
**GET** `/api/users/:id`

Get a specific user by ID.

#### Response
```
json
{
  "success": true,
  "data": {
    "id": "user_123456",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "phone": "+1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "verified": false
  }
}
```

---

### Update User
**PUT** `/api/users/:id`

Update user information.

#### Request Payload
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | Full name |
| phone | string | No | Phone number |
| verified | boolean | No | Verification status |

```
json
{
  "name": "John Updated",
  "phone": "+0987654321",
  "verified": true
}
```

#### Response
```
json
{
  "success": true,
  "data": { ...updated user object },
  "message": "User updated successfully"
}
```

---

### Get Student Profile
**GET** `/api/users/student/:id`

Get a student's detailed profile.

#### Response
```
json
{
  "success": true,
  "data": {
    "id": "user_123456",
    "email": "student@example.com",
    "name": "John Doe",
    "role": "student",
    "phone": "+1234567890",
    "branch": "Computer Science",
    "college": "MIT",
    "diet": "veg",
    "sleepSchedule": "night-owl",
    "preferences": {
      "budget": { "min": 5000, "max": 10000 },
      "roomType": "single",
      "amenities": ["wifi", "ac"],
      "safetyRating": 4.5
    }
  }
}
```

---

### Update Student Profile
**PUT** `/api/users/student/:id`

Update a student's profile.

#### Request Payload
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| branch | string | No | Student's branch |
| college | string | No | College name |
| diet | 'veg' \| 'non-veg' \| 'jain' | No | Dietary preference |
| sleepSchedule | 'early-bird' \| 'night-owl' \| 'flexible' | No | Sleep schedule |
| preferences | object | No | Student preferences |

```
json
{
  "branch": "Electronics",
  "college": "Stanford",
  "diet": "non-veg",
  "sleepSchedule": "early-bird",
  "preferences": {
    "budget": { "min": 8000, "max": 15000 },
    "roomType": "double",
    "amenities": ["wifi", "ac", "laundry"],
    "safetyRating": 4
  }
}
```

#### Response
```
json
{
  "success": true,
  "data": { ...updated student profile },
  "message": "Student profile updated successfully"
}
```

---

### Get Owner Profile
**GET** `/api/users/owner/:id`

Get an owner's detailed profile.

#### Response
```
json
{
  "success": true,
  "data": {
    "id": "owner_123456",
    "email": "owner@example.com",
    "name": "Property Owner",
    "role": "owner",
    "phone": "+1234567890",
    "businessName": "ABC Properties",
    "properties": ["prop_123", "prop_456"],
    "backgroundCheckComplete": true,
    "previousTenantReferences": ["ref_1", "ref_2"]
  }
}
```

---

### Update Owner Profile
**PUT** `/api/users/owner/:id`

Update an owner's profile.

#### Request Payload
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| businessName | string | No | Business name |
| backgroundCheckComplete | boolean | No | Background check status |
| previousTenantReferences | string[] | No | List of reference IDs |

```
json
{
  "businessName": "XYZ Rentals",
  "backgroundCheckComplete": true,
  "previousTenantReferences": ["ref_1", "ref_2", "ref_3"]
}
```

#### Response
```
json
{
  "success": true,
  "data": { ...updated owner profile },
  "message": "Owner profile updated successfully"
}
```

---

### Get All Roommate Profiles
**GET** `/api/users/roommates/all`

Get all available roommate profiles.

#### Response
```
json
{
  "success": true,
  "data": [
    {
      "userId": "user_123",
      "userName": "John Doe",
      "branch": "Computer Science",
      "diet": "veg",
      "sleepSchedule": "night-owl",
      "habits": ["non-smoker", "no-alcohol"],
      "studyPreference": "silent",
      "compatibilityScore": 85
    }
  ]
}
```

---

## Properties

### Get All Properties
**GET** `/api/properties`

Get all properties with optional filtering and pagination.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| city | string | No | Filter by city |
| type | 'apartment' \| 'pg' \| 'hostel' \| 'flat' | No | Filter by property type |
| minBudget | number | No | Minimum budget |
| maxBudget | number | No | Maximum budget |
| bedrooms | number | No | Minimum number of bedrooms |
| amenities | string | No | Comma-separated list of amenities |
| verified | boolean | No | Filter by verification status |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10) |
| sortBy | string | No | Field to sort by (default: createdAt) |
| sortOrder | 'asc' \| 'desc' | No | Sort order (default: desc) |

#### Response
```
json
{
  "success": true,
  "data": [
    {
      "id": "prop_123456",
      "ownerId": "owner_123",
      "title": "Modern Apartment",
      "description": "A beautiful apartment in the heart of the city",
      "type": "apartment",
      "address": "123 Main St",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "city": "New York",
      "budget": { "min": 10000, "max": 15000 },
      "bedrooms": 2,
      "bathrooms": 1,
      "amenities": ["wifi", "ac", "parking"],
      "photos": ["url1", "url2"],
      "videoUrl": "https://youtube.com/...",
      "verified": true,
      "safetyRating": 4.5,
      "reviews": ["review_1", "review_2"],
      "landmarks": [
        { "type": "college", "name": "MIT", "distance": 500, "duration": 10 }
      ],
      "availableFrom": "2024-02-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

### Get Property by ID
**GET** `/api/properties/:id`

Get a specific property by ID.

#### Response
```
json
{
  "success": true,
  "data": { ...property object }
}
```

---

### Create Property
**POST** `/api/properties`

Create a new property.

#### Request Payload
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ownerId | string | Yes | Owner's user ID |
| title | string | Yes | Property title |
| description | string | No | Property description |
| type | PropertyType | Yes | Type of property |
| address | string | Yes | Full address |
| latitude | number | No | Latitude coordinate |
| longitude | number | No | Longitude coordinate |
| city | string | Yes | City name |
| budget | object | Yes | Budget range |
| bedrooms | number | Yes | Number of bedrooms |
| bathrooms | number | Yes | Number of bathrooms |
| amenities | string[] | No | List of amenities |
| photos | string[] | No | Array of photo URLs |
| videoUrl | string | No | Video tour URL |
| landmarks | Landmark[] | No | Nearby landmarks |

```
json
{
  "ownerId": "owner_123",
  "title": "Cozy PG",
  "description": "A comfortable PG for students",
  "type": "pg",
  "address": "456 College Road",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "city": "Boston",
  "budget": { "min": 8000, "max": 12000 },
  "bedrooms": 3,
  "bathrooms": 2,
  "amenities": ["wifi", "food", "laundry"],
  "photos": ["https://example.com/img1.jpg"],
  "videoUrl": "https://youtube.com/watch?v=...",
  "landmarks": [
    { "type": "college", "name": "Harvard", "distance": 1000, "duration": 15 }
  ],
  "availableFrom": "2024-03-01"
}
```

#### Response
```
json
{
  "success": true,
  "data": { ...created property object },
  "message": "Property created successfully"
}
```

---

### Update Property
**PUT** `/api/properties/:id`

Update a property.

#### Request Payload
All fields of the Property type can be updated.

```
json
{
  "title": "Updated Title",
  "budget": { "min": 10000, "max": 15000 },
  "amenities": ["wifi", "ac", "parking", "security"]
}
```

#### Response
```
json
{
  "success": true,
  "data": { ...updated property object },
  "message": "Property updated successfully"
}
```

---

### Delete Property
**DELETE** `/api/properties/:id`

Delete a property.

#### Response
```
json
{
  "success": true,
  "message": "Property deleted successfully"
}
```

---

### Get Properties by Owner
**GET** `/api/properties/owner/:ownerId`

Get all properties owned by a specific owner.

#### Response
```
json
{
  "success": true,
  "data": [ ...array of property objects ]
}
```

---

### Get Nearby Properties
**GET** `/api/properties/search/nearby`

Get properties near a specific location.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| latitude | number | Yes | Latitude coordinate |
| longitude | number | Yes | Longitude coordinate |
| radius | number | No | Search radius in meters (default: 5000) |

#### Response
```
json
{
  "success": true,
  "data": [
    {
      ...property object,
      "distance": 500
    }
  ]
}
```

---

## Bookings

### Get All Bookings
**GET** `/api/bookings`

Get all bookings with optional filtering.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| studentId | string | No | Filter by student ID |
| ownerId | string | No | Filter by owner ID |
| propertyId | string | No | Filter by property ID |
| status | 'pending' \| 'confirmed' \| 'cancelled' | No | Filter by status |

#### Response
```
json
{
  "success": true,
  "data": [
    {
      "id": "booking_123456",
      "propertyId": "prop_123",
      "studentId": "user_123",
      "ownerResponse": "pending",
      "visitDate": "2024-02-15T00:00:00.000Z",
      "status": "pending",
      "createdAt": "2024-01-20T00:00:00.000Z"
    }
  ]
}
```

---

### Get Booking by ID
**GET** `/api/bookings/:id`

Get a specific booking by ID.

#### Response
```json
{
  "success": true,
  "data": { ...booking object }
}
```

---

### Create Booking
**POST** `/api/bookings`

Create a new booking request.

#### Request Payload
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| propertyId | string | Yes | Property ID |
| studentId | string | Yes | Student's user ID |
| visitDate | string (ISO date) | Yes | Desired visit date |

```
json
{
  "propertyId": "prop_123456",
  "studentId": "user_123456",
  "visitDate": "2024-02-15"
}
```

#### Response
```
json
{
  "success": true,
  "data": {
    "id": "booking_123456",
    "propertyId": "prop_123456",
    "studentId": "user_123456",
    "ownerResponse": "pending",
    "visitDate": "2024-02-15T00:00:00.000Z",
    "status": "pending",
    "createdAt": "2024-01-20T00:00:00.000Z"
  },
  "message": "Booking created successfully"
}
```

---

### Update Booking
**PUT** `/api/bookings/:id`

Update a booking (owner response or status).

#### Request Payload
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ownerResponse | 'pending' \| 'accepted' \| 'rejected' | No | Owner's response |
| status | 'pending' \| 'confirmed' \| 'cancelled' | No | Booking status |
| visitDate | string | No | Updated visit date |

```
json
{
  "ownerResponse": "accepted",
  "status": "confirmed"
}
```

#### Response
```
json
{
  "success": true,
  "data": { ...updated booking object },
  "message": "Booking updated successfully"
}
```

---

### Cancel Booking
**DELETE** `/api/bookings/:id`

Cancel a booking.

#### Response
```
json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

---

## Reviews

### Get All Reviews
**GET** `/api/reviews`

Get all reviews with optional filtering.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| propertyId | string | No | Filter by property ID |
| userId | string | No | Filter by user ID |

#### Response
```
json
{
  "success": true,
  "data": [
    {
      "id": "review_123456",
      "userId": "user_123",
      "userName": "John Doe",
      "rating": 4,
      "safetyRating": 5,
      "lighting": 4,
      "entryAccess": 5,
      "wardenPresence": 3,
      "comment": "Great place to live!",
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

---

### Get Review by ID
**GET** `/api/reviews/:id`

Get a specific review by ID.

#### Response
```
json
{
  "success": true,
  "data": { ...review object }
}
```

---

### Create Review
**POST** `/api/reviews`

Create a new review for a property.

#### Request Payload
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| propertyId | string | Yes | Property ID |
| userId | string | Yes | Reviewer's user ID |
| userName | string | No | Reviewer's name |
| rating | number | Yes | Overall rating (1-5) |
| safetyRating | number | No | Safety rating (1-5) |
| lighting | number | No | Lighting rating (1-5) |
| entryAccess | number | No | Entry access rating (1-5) |
| wardenPresence | number | No | Warden presence rating (1-5) |
| comment | string | No | Review comment |

```
json
{
  "propertyId": "prop_123456",
  "userId": "user_123456",
  "userName": "John Doe",
  "rating": 4,
  "safetyRating": 5,
  "lighting": 4,
  "entryAccess": 5,
  "wardenPresence": 3,
  "comment": "Nice place with good amenities"
}
```

#### Response
```
json
{
  "success": true,
  "data": {
    "id": "review_123456",
    "userId": "user_123456",
    "userName": "John Doe",
    "rating": 4,
    "safetyRating": 5,
    "lighting": 4,
    "entryAccess": 5,
    "wardenPresence": 3,
    "comment": "Nice place with good amenities",
    "createdAt": "2024-01-20T00:00:00.000Z"
  },
  "message": "Review created successfully"
}
```

---

### Update Review
**PUT** `/api/reviews/:id`

Update a review.

#### Request Payload
All fields of the Review type can be updated.

```
json
{
  "rating": 5,
  "comment": "Updated comment"
}
```

#### Response
```
json
{
  "success": true,
  "data": { ...updated review object },
  "message": "Review updated successfully"
}
```

---

### Delete Review
**DELETE** `/api/reviews/:id`

Delete a review.

#### Response
```
json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

## Agreements

### Get All Agreements
**GET** `/api/agreements`

Get all agreements with optional filtering.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| studentId | string | No | Filter by student ID |
| ownerId | string | No | Filter by owner ID |
| propertyId | string | No | Filter by property ID |
| status | 'draft' \| 'pending-sign' \| 'active' \| 'expired' \| 'terminated' | No | Filter by status |

#### Response
```
json
{
  "success": true,
  "data": [
    {
      "id": "agreement_123456",
      "propertyId": "prop_123",
      "studentId": "user_123",
      "ownerId": "owner_123",
      "termsAndConditions": "Standard rental agreement",
      "moveInDate": "2024-03-01T00:00:00.000Z",
      "duration": 12,
      "depositAmount": 20000,
      "monthlyRent": 10000,
      "customClauses": [],
      "signatureStudent": "signed",
      "signatureOwner": "signed",
      "status": "active",
      "createdAt": "2024-02-01T00:00:00.000Z",
      "updatedAt": "2024-02-05T00:00:00.000Z"
    }
  ]
}
```

---

### Get Agreement by ID
**GET** `/api/agreements/:id`

Get a specific agreement by ID.

#### Response
```
json
{
  "success": true,
  "data": { ...agreement object }
}
```

---

### Create Agreement
**POST** `/api/agreements`

Create a new rental agreement.

#### Request Payload
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| propertyId | string | Yes | Property ID |
| studentId | string | Yes | Student's user ID |
| ownerId | string | Yes | Owner's user ID |
| termsAndConditions | string | No | Custom terms and conditions |
| moveInDate | string (ISO date) | Yes | Expected move-in date |
| duration | number | Yes | Lease duration in months |
| depositAmount | number | Yes | Security deposit amount |
| monthlyRent | number | Yes | Monthly rent |
| customClauses | string[] | No | Custom agreement clauses |

```
json
{
  "propertyId": "prop_123456",
  "studentId": "user_123456",
  "ownerId": "owner_123456",
  "termsAndConditions": "Standard rental agreement terms...",
  "moveInDate": "2024-03-01",
  "duration": 12,
  "depositAmount": 20000,
  "monthlyRent": 10000,
  "customClauses": ["No pets allowed", "No smoking"]
}
```

#### Response
```
json
{
  "success": true,
  "data": {
    "id": "agreement_123456",
    "propertyId": "prop_123456",
    "studentId": "user_123456",
    "ownerId": "owner_123456",
    "termsAndConditions": "Standard rental agreement",
    "moveInDate": "2024-03-01T00:00:00.000Z",
    "duration": 12,
    "depositAmount": 20000,
    "monthlyRent": 10000,
    "customClauses": ["No pets allowed"],
    "status": "draft",
    "createdAt": "2024-02-01T00:00:00.000Z",
    "updatedAt": "2024-02-01T00:00:00.000Z"
  },
  "message": "Agreement created successfully"
}
```

---

### Update Agreement
**PUT** `/api/agreements/:id`

Update an agreement.

#### Request Payload
All fields of the Agreement type can be updated except id, createdAt.

```
json
{
  "duration": 24,
  "monthlyRent": 12000,
  "customClauses": ["Updated clause"]
}
```

#### Response
```
json
{
  "success": true,
  "data": { ...updated agreement object },
  "message": "Agreement updated successfully"
}
```

---

### Sign Agreement
**PUT** `/api/agreements/:id/sign`

Sign an agreement (by student or owner).

#### Request Payload
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| signedBy | 'student' \| 'owner' | Yes | Who is signing |
| signature | string | Yes | Digital signature |

```
json
{
  "signedBy": "student",
  "signature": "digital_signature_string"
}
```

#### Response
```
json
{
  "success": true,
  "data": { ...updated agreement object },
  "message": "Agreement signed successfully"
}
```

---

### Delete Agreement
**DELETE** `/api/agreements/:id`

Delete an agreement.

#### Response
```
json
{
  "success": true,
  "message": "Agreement deleted successfully"
}
```

---

## Type Definitions

### UserRole
```
typescript
type UserRole = 'student' | 'owner';
```

### PropertyType
```
typescript
type PropertyType = 'apartment' | 'pg' | 'hostel' | 'flat';
```

### BookingStatus
```
typescript
type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
```

### OwnerResponse
```typescript
type OwnerResponse = 'pending' | 'accepted' | 'rejected';
```

### AgreementStatus
```
typescript
type AgreementStatus = 'draft' | 'pending-sign' | 'active' | 'expired' | 'terminated';
```

### Landmark Type
```
typescript
type Landmark = {
  type: 'bus-stop' | 'market' | 'college' | 'hospital' | 'park';
  name: string;
  distance: number; // in meters
  duration: number; // in minutes
};
```

### Roommate Profile
```
typescript
type RoommateProfile = {
  userId: string;
  userName: string;
  branch: string;
  diet: 'veg' | 'non-veg' | 'jain';
  sleepSchedule: 'early-bird' | 'night-owl' | 'flexible';
  habits: string[];
  studyPreference: 'silent' | 'casual' | 'group';
  compatibilityScore: number;
};
```

---

## Health Check

### GET `/health`

Check if the server is running.

#### Response
```
json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

---

## Error Response Format

All error responses follow this format:

```
json
{
  "success": false,
  "error": "Error message description"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
