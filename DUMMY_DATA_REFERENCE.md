# Quick Reference: Dummy Data Usage

## 🎯 Quick Start

```bash
# Seed the database with all dummy data
npm run seed
```

## 📊 Data Summary

| Entity           | Count | Description                |
| ---------------- | ----- | -------------------------- |
| Users            | 50    | 30 tenants + 20 owners     |
| Properties       | 40    | 2 per owner with images    |
| Bookings         | 40    | Property visit bookings    |
| Booking Requests | 35    | Rental booking requests    |
| Reviews          | 60+   | Property reviews           |
| Agreements       | 25    | Rental agreements          |
| Messages         | 100   | Tenant-Owner conversations |
| Visit Requests   | 30    | Scheduled property visits  |
| Stay Records     | 20    | Active/completed stays     |
| Ledger Entries   | 50    | Monthly charges            |
| Payments         | 80    | Payment transactions       |
| Match Profiles   | 30    | Roommate matching          |

## 🔐 Test Credentials

### Tenants (30 accounts)

```
Email: tenant1@example.com to tenant30@example.com
Password: password123
Phone: +91 9000000001 to +91 9000000030
```

### Owners (20 accounts)

```
Email: owner1@example.com to owner20@example.com
Password: password123
Phone: +91 8000000001 to +91 8000000020
```

## 🏠 Property Distribution

Each owner has exactly 2 properties:

- Owner 1: prop1, prop2
- Owner 2: prop3, prop4
- Owner 3: prop5, prop6
- ... and so on

### Property Budget Range

- Minimum: ₹7,000/month
- Maximum: ₹47,000/month

### Cities Covered

- Bhubaneswar
- Delhi
- Mumbai
- Bangalore
- Pune
- Hyderabad
- Chennai
- Kolkata

### Property Types

- **Apartments**: Modern flats (1-4 BHK)
- **PG/Hostels**: Shared accommodations
- **Flats**: Budget-friendly options

## 🖼️ Property Images

All properties include multiple images from Unsplash:

### Main Photos (5 per property)

High-quality property images at 800x600px

### Categorized Images

- Bedroom: 1-3 images (based on bedroom count)
- Bathroom: 1 image
- Kitchen: 1 image
- Living room: 1 image
- Balcony: 1 image

### Sample Image URLs

```javascript
// Main property photos
https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&q=80
https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&q=80
```

## 🔌 API Endpoints to Test

### Authentication

```bash
POST /api/auth/register
POST /api/auth/login
```

### Users

```bash
GET /api/users
GET /api/users/:id
PUT /api/users/:id
```

### Properties

```bash
GET /api/properties
GET /api/properties/:id
GET /api/properties?city=Bhubaneswar
GET /api/properties?budget_min=8000&budget_max=15000
POST /api/properties
PUT /api/properties/:id
DELETE /api/properties/:id
```

### Bookings

```bash
GET /api/bookings
GET /api/bookings/:id
POST /api/bookings
PUT /api/bookings/:id
```

### Booking Lifecycle

```bash
GET /api/booking-lifecycle/visit-requests
POST /api/booking-lifecycle/visit-requests
GET /api/booking-lifecycle/booking-requests
POST /api/booking-lifecycle/booking-requests
```

### Reviews

```bash
GET /api/reviews
GET /api/reviews?propertyId=prop1
POST /api/reviews
```

### Agreements

```bash
GET /api/agreements
GET /api/agreements/:id
POST /api/agreements
PUT /api/agreements/:id/sign
```

### Messages

```bash
GET /api/messages
GET /api/messages/:conversationId
POST /api/messages
```

### Payments

```bash
GET /api/payments
GET /api/payments/:id
POST /api/payments
```

### Ledger

```bash
GET /api/ledger
GET /api/ledger/:stayRecordId
POST /api/ledger/entries
```

### Matching

```bash
GET /api/matching/profiles
GET /api/matching/recommendations/:userId
POST /api/matching/profiles
```

## 📋 Sample API Requests

### Login as Tenant

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tenant1@example.com",
    "password": "password123"
  }'
```

### Get All Properties

```bash
curl http://localhost:3001/api/properties
```

### Search Properties by City

```bash
curl "http://localhost:3001/api/properties?city=Bhubaneswar"
```

### Get Property Details

```bash
curl http://localhost:3001/api/properties/prop1
```

### Create Booking

```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "propertyId": "prop1",
    "visitDate": "2025-04-01"
  }'
```

### Get Messages

```bash
curl http://localhost:3001/api/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Review

```bash
curl -X POST http://localhost:3001/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "propertyId": "prop1",
    "rating": 4.5,
    "comment": "Great property!"
  }'
```

## 🔄 Resetting Data

To clear and re-seed the database:

```bash
npm run seed
```

⚠️ **Warning**: This will delete ALL existing data!

## 🎨 Property Amenities

Common amenities in dummy data:

- WiFi
- AC/Fan
- Furnished
- Parking
- Gym
- 24x7 Security
- CCTV
- Meals Included (PG/Hostels)
- Hot Water
- Balcony
- Water Purifier

## 📍 Landmark Types

Properties include nearby landmarks:

- **Bus stops**: 300-600m away
- **Markets**: 200-1000m away
- **Colleges**: 2-5km away
- **Hospitals**: Varies
- **Parks**: Varies

## 💡 Tips

1. **IDs**: All IDs follow a pattern (tenant1, owner1, prop1, etc.)
2. **Relationships**: Data is properly linked (properties → owners, bookings → properties, etc.)
3. **Dates**: Most dates are relative to current date
4. **Status**: Various statuses included for testing different scenarios
5. **Images**: All images are from Unsplash (no storage costs)

## 🐛 Common Issues

### MongoDB not running

```bash
# Start MongoDB
mongod
# or
brew services start mongodb-community
```

### Port already in use

```bash
# Check what's using port 3001
lsof -ti:3001
# Kill the process
kill -9 <PID>
```

### Seeding errors

```bash
# Check MongoDB connection
mongo
# or
mongosh

# Verify .env file
cat .env | grep MONGODB
```

## 📚 Learn More

- See [SEEDING_GUIDE.md](./SEEDING_GUIDE.md) for detailed documentation
- Check [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) for API details
- View [README.md](./README.md) for project overview
