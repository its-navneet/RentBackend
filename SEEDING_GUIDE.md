# Database Seeding Guide

This guide explains how to populate your MongoDB database with comprehensive dummy data for testing and development.

## 📊 Dummy Data Overview

The seeding script will populate your database with:

- **50 Users** (30 tenants + 20 owners)
- **40 Properties** (2 properties per owner with multiple images)
- **40 Bookings** (property visit requests)
- **60+ Reviews** (property reviews with ratings)
- **25 Agreements** (rental agreements in various stages)
- **100 Messages** (conversations between tenants and owners)
- **30 Visit Requests** (scheduled property visits)
- **20 Stay Records** (active and completed stays)
- **50 Ledger Entries** (monthly rent and charge tracking)
- **80 Payments** (payment transactions)
- **30 Match Profiles** (roommate matching profiles)

## 🎨 Property Images

All properties include:

- **5 main photos** from Unsplash (high-quality property images)
- **Categorized images**:
  - Bedroom photos
  - Bathroom photos
  - Kitchen photos
  - Living room photos
  - Balcony photos

Images are automatically generated based on property type and bedroom count.

## 🚀 How to Seed the Database

### Prerequisites

1. Ensure MongoDB is running (local or remote)
2. Configure your `.env` file with the correct MongoDB URI:
   ```env
   MONGODB_URI=mongodb://localhost:27017/rentbackend
   ```

### Running the Seed Script

Execute the seeding script using:

```bash
npm run seed
```

Or directly with ts-node:

```bash
ts-node src/scripts/seedDatabase.ts
```

### What Happens During Seeding

1. **Connects to MongoDB** using your configured URI
2. **Clears existing data** (⚠️ WARNING: This deletes all data!)
3. **Seeds data in order**:
   - Users (tenants & owners)
   - Properties (with images and details)
   - Bookings
   - Reviews
   - Agreements
   - Messages
   - Visit Requests
   - Stay Records
   - Ledger Entries
   - Payments
   - Match Profiles
4. **Displays summary** of inserted records
5. **Closes connection** gracefully

## 📋 Sample Data Details

### Users

#### Tenants (30)

- Email format: `tenant1@example.com` to `tenant30@example.com`
- Default password: `password123` (hashed)
- Phone numbers: `+91 9000000001` to `+91 9000000030`
- Diverse profiles with different colleges, branches, and preferences

#### Owners (20)

- Email format: `owner1@example.com` to `owner20@example.com`
- Default password: `password123` (hashed)
- Phone numbers: `+91 8000000001` to `+91 8000000020`
- Each owner has exactly 2 properties
- Most owners have approved background checks

### Properties (40)

Properties are distributed across multiple cities:

- Bhubaneswar
- Delhi
- Mumbai
- Bangalore
- Pune
- Hyderabad
- Chennai
- Kolkata

Property types:

- **Apartments**: Modern flats with various BHK configurations
- **PG/Hostels**: Shared accommodations for students
- **Flats**: Budget-friendly options

Features:

- Budget range: ₹7,000 to ₹47,000/month
- 1-4 bedrooms
- 1-3 bathrooms
- Amenities: WiFi, AC/Fan, Furnished, Parking, Gym, Security, etc.
- Landmark information (bus stops, markets, colleges)
- Safety ratings (3.5-5.0 stars)
- Availability dates

### Test Credentials

You can log in with any of these sample accounts:

**Tenants:**

```
Email: tenant1@example.com
Password: password123
```

**Owners:**

```
Email: owner1@example.com
Password: password123
```

## 🔍 API Testing

After seeding, you can test these endpoints:

### Users

```bash
# Get all users
GET http://localhost:3001/api/users

# Get user by ID
GET http://localhost:3001/api/users/tenant1
```

### Properties

```bash
# Get all properties
GET http://localhost:3001/api/properties

# Search properties by city
GET http://localhost:3001/api/properties?city=Bhubaneswar

# Get property by ID
GET http://localhost:3001/api/properties/prop1
```

### Bookings

```bash
# Get all bookings
GET http://localhost:3001/api/bookings

# Create new booking
POST http://localhost:3001/api/bookings
```

### Reviews

```bash
# Get reviews for a property
GET http://localhost:3001/api/reviews?propertyId=prop1
```

### Messages

```bash
# Get messages between users
GET http://localhost:3001/api/messages
```

### Payments

```bash
# Get payment history
GET http://localhost:3001/api/payments
```

### Ledger

```bash
# Get ledger entries
GET http://localhost:3001/api/ledger
```

### Match Profiles

```bash
# Get roommate matches
GET http://localhost:3001/api/matching/profiles
```

## ⚠️ Important Notes

1. **Data Deletion**: The seed script will DELETE all existing data before inserting new data
2. **MongoDB Connection**: Ensure your MongoDB instance is running before executing the script
3. **Environment Variables**: Make sure your `.env` file is properly configured
4. **Development Only**: This seeding script is intended for development/testing purposes only

## 🔄 Re-seeding

To re-seed the database with fresh data:

```bash
npm run seed
```

This will:

1. Clear all existing data
2. Insert new dummy data
3. Reset all IDs and relationships

## 🛠️ Customization

To customize the dummy data:

1. Edit `/src/data/dummyData.ts`
2. Modify the generation functions for each entity type
3. Run `npm run seed` to apply changes

## 📚 Data Relationships

The data is structured with proper relationships:

```
Users (Owners) ──┬─→ Properties ──→ Reviews
                 │                 ├─→ Bookings
                 │                 └─→ Visit Requests
                 │
                 └─→ Agreements ──→ Stay Records ──→ Ledger Entries
                                                    └─→ Payments

Users (Tenants) ──→ Match Profiles
               └──→ Messages ←─── Users (Owners)
```

## 🐛 Troubleshooting

### Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Start your MongoDB service

### Authentication Error

```
Error: Authentication failed
```

**Solution**: Check your MongoDB credentials in `.env`

### Duplicate Key Error

```
Error: E11000 duplicate key error
```

**Solution**: The script should auto-clear data. Try running again or manually clear the database.

## 📞 Support

For issues or questions about the seeding script:

1. Check the console output for detailed error messages
2. Verify your MongoDB connection
3. Ensure all required environment variables are set
4. Check that all model files are present in `/src/models/`
