/**
 * Database Seeding Script
 * Uploads comprehensive dummy data to MongoDB
 * Run with: ts-node src/scripts/seedDatabase.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Property from "../models/Property";
import Booking from "../models/Booking";
import BookingRequest, { BookingRequestStatus } from "../models/BookingRequest";
import Review from "../models/Review";
import Agreement from "../models/Agreement";
import Message from "../models/Message";
import Payment from "../models/Payment";
import StayRecord from "../models/StayRecord";
import LedgerEntry from "../models/LedgerEntry";
import VisitRequest from "../models/VisitRequest";
import MatchProfile from "../models/MatchProfile";
import {
  dummyUsers,
  dummyProperties,
  dummyBookings,
  dummyReviews,
  dummyAgreements,
  dummyMessages,
  dummyPayments,
  dummyStayRecords,
  dummyLedgerEntries,
  dummyVisitRequests,
  dummyMatchProfiles,
} from "../data/dummyData";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/rentbackend";

const userIdMap = new Map<string, mongoose.Types.ObjectId>();
const propertyIdMap = new Map<string, mongoose.Types.ObjectId>();
const bookingIdMap = new Map<string, mongoose.Types.ObjectId>();
const visitIdMap = new Map<string, mongoose.Types.ObjectId>();
const stayIdMap = new Map<string, mongoose.Types.ObjectId>();
const bookingRequestIds: mongoose.Types.ObjectId[] = [];
const propertyKeys = Object.keys(dummyProperties);
const tenantKeys = Object.entries(dummyUsers)
  .filter(([, user]) => user.role === "student")
  .map(([key]) => key);

const getOrCreateId = (
  map: Map<string, mongoose.Types.ObjectId>,
  key: string,
): mongoose.Types.ObjectId => {
  const existing = map.get(key);
  if (existing) return existing;
  const id = new mongoose.Types.ObjectId();
  map.set(key, id);
  return id;
};

async function connectDB() {
  await mongoose.connect(MONGODB_URI);
}

async function clearDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Property.deleteMany({}),
    Booking.deleteMany({}),
    BookingRequest.deleteMany({}),
    Review.deleteMany({}),
    Agreement.deleteMany({}),
    Message.deleteMany({}),
    Payment.deleteMany({}),
    StayRecord.deleteMany({}),
    LedgerEntry.deleteMany({}),
    VisitRequest.deleteMany({}),
    MatchProfile.deleteMany({}),
  ]);
}

async function seedUsers() {
  const seededPasswordHash = await bcrypt.hash("test", 10);

  const users = Object.entries(dummyUsers).map(([key, user]) => ({
    _id: getOrCreateId(userIdMap, key),
    email: user.email,
    password: seededPasswordHash,
    phone: user.phone,
    name: user.name,
    role: user.role === "student" ? "tenant" : "owner",
    createdAt: user.createdAt,
    verified: user.verified,
    verificationStatus: user.verified ? "verified" : "pending",
    backgroundCheckStatus: user.backgroundCheckStatus,
    isActive: true,
    isBlocked: false,
    updatedAt: new Date(),
  }));

  await User.insertMany(users);
  console.log(`✅ Users: ${users.length}`);
}

async function seedProperties() {
  const properties = Object.entries(dummyProperties).map(([key, p]) => ({
    _id: getOrCreateId(propertyIdMap, key),
    ownerId: getOrCreateId(userIdMap, p.ownerId),
    title: p.title,
    description: p.description,
    type: p.type,
    address: p.address,
    latitude: p.latitude,
    longitude: p.longitude,
    city: p.city,
    budget: p.budget,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    amenities: p.amenities,
    photos: p.photos,
    categorizedImages: p.categorizedImages,
    videoUrl: p.videoUrl,
    verified: p.verified,
    safetyRating: p.safetyRating,
    reviews: [],
    landmarks: p.landmarks,
    availableFrom: p.availableFrom,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  await Property.insertMany(properties);
  console.log(`✅ Properties: ${properties.length}`);
}

async function seedBookings() {
  const bookings = Object.entries(dummyBookings).map(([key, b]) => ({
    _id: getOrCreateId(bookingIdMap, key),
    propertyId: getOrCreateId(propertyIdMap, b.propertyId),
    studentId: getOrCreateId(userIdMap, b.studentId),
    ownerResponse: b.ownerResponse,
    visitDate: b.visitDate,
    status: b.status,
    createdAt: b.createdAt,
  }));

  await Booking.insertMany(bookings);
  console.log(`✅ Bookings: ${bookings.length}`);
}

async function seedVisitRequests() {
  const visits = dummyVisitRequests.map((v) => {
    const visitId = new mongoose.Types.ObjectId();
    visitIdMap.set(v.id, visitId);

    return {
      _id: visitId,
      tenantId: getOrCreateId(userIdMap, v.tenantId),
      propertyId: getOrCreateId(propertyIdMap, v.propertyId),
      ownerId: getOrCreateId(userIdMap, v.ownerId),
      requestedDate: v.requestedDate,
      status: v.status,
      notes: v.notes || "",
      rejectionReason: "",
      createdAt: v.createdAt,
      updatedAt: new Date(),
    };
  });

  await VisitRequest.insertMany(visits);
  console.log(`✅ Visit Requests: ${visits.length}`);
}

async function seedBookingRequests() {
  const statuses: BookingRequestStatus[] = [
    "pending",
    "approved",
    "rejected",
    "payment_pending",
    "confirmed",
  ];

  const requests = Array.from({ length: 35 }, (_, i) => {
    const propKey = propertyKeys[i % propertyKeys.length];
    const ownerKey = dummyProperties[propKey].ownerId;
    const tenantKey = tenantKeys[i % tenantKeys.length];

    const id = new mongoose.Types.ObjectId();
    bookingRequestIds.push(id);

    return {
      _id: id,
      tenantId: getOrCreateId(userIdMap, tenantKey),
      propertyId: getOrCreateId(propertyIdMap, propKey),
      ownerId: getOrCreateId(userIdMap, ownerKey),
      visitRequestId:
        i < dummyVisitRequests.length
          ? visitIdMap.get(
              dummyVisitRequests[i % dummyVisitRequests.length].id,
            ) || null
          : null,
      status: statuses[i % statuses.length],
      proposedCheckInDate: new Date(Date.now() + (i + 7) * 86400000),
      proposedCheckOutDate:
        i % 3 === 0 ? new Date(Date.now() + (i + 180) * 86400000) : null,
      depositAmount: dummyProperties[propKey].budget.min,
      monthlyRent: dummyProperties[propKey].budget.min,
      totalAmount: dummyProperties[propKey].budget.min * 2,
      notes: i % 4 === 0 ? "Looking for long-term stay" : "",
      rejectionReason: "",
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 15) * 86400000,
      ),
      updatedAt: new Date(),
    };
  });

  await BookingRequest.insertMany(requests);
  console.log(`✅ Booking Requests: ${requests.length}`);
}

async function seedStayRecords() {
  const stays = dummyStayRecords.map((s, i) => {
    const stayId = new mongoose.Types.ObjectId();
    stayIdMap.set(s.id, stayId);

    return {
      _id: stayId,
      tenantId: getOrCreateId(userIdMap, s.tenantId),
      propertyId: getOrCreateId(propertyIdMap, s.propertyId),
      ownerId: getOrCreateId(userIdMap, s.ownerId),
      bookingRequestId: bookingRequestIds[i % bookingRequestIds.length],
      status: s.status,
      checkInDate: s.checkInDate,
      checkOutDate: s.checkOutDate || null,
      noticeGivenDate: null,
      noticeExpiryDate: null,
      monthlyRent: s.monthlyRent,
      depositAmount: s.depositAmount,
      cancellationReason: "",
      createdAt: s.createdAt,
      updatedAt: new Date(),
    };
  });

  await StayRecord.insertMany(stays);
  console.log(`✅ Stay Records: ${stays.length}`);
}

async function seedLedgerEntries() {
  const ledgers = dummyLedgerEntries.map((l) => ({
    _id: new mongoose.Types.ObjectId(),
    stayRecordId: getOrCreateId(stayIdMap, l.stayRecordId),
    tenantId: getOrCreateId(userIdMap, l.tenantId),
    propertyId: getOrCreateId(propertyIdMap, l.propertyId),
    ownerId: getOrCreateId(userIdMap, l.ownerId),
    month: l.month,
    charges: l.charges,
    totalAmount: l.totalAmount,
    paidAmount: l.paidAmount,
    balance: l.balance,
    status: l.status,
    dueDate: l.dueDate,
    paidDate: null,
    notes: "",
    createdAt: l.createdAt,
    updatedAt: new Date(),
  }));

  await LedgerEntry.insertMany(ledgers);
  console.log(`✅ Ledger Entries: ${ledgers.length}`);
}

async function seedPayments() {
  const payments = dummyPayments.map((p) => ({
    _id: new mongoose.Types.ObjectId(),
    tenantId: getOrCreateId(userIdMap, p.tenantId),
    ownerId: getOrCreateId(userIdMap, p.ownerId),
    stayRecordId: p.stayRecordId
      ? getOrCreateId(stayIdMap, p.stayRecordId)
      : null,
    ledgerEntryId: null,
    amount: p.amount,
    type: p.type,
    status: p.status,
    transactionId: p.transactionId,
    paymentMethod: p.paymentMethod,
    notes: "",
    createdAt: p.createdAt,
    updatedAt: new Date(),
  }));

  await Payment.insertMany(payments);
  console.log(`✅ Payments: ${payments.length}`);
}

async function seedReviews() {
  const reviews = Object.values(dummyReviews).map((r, i) => ({
    _id: new mongoose.Types.ObjectId(),
    ratingType: "tenant_to_property",
    stayRecordId: null,
    fromUserId: getOrCreateId(userIdMap, r.userId),
    toUserId: null,
    propertyId: getOrCreateId(
      propertyIdMap,
      propertyKeys[i % propertyKeys.length],
    ),
    overallRating: r.rating,
    propertyCriteria: {
      cleanliness: r.safetyRating,
      waterAvailability: r.entryAccess,
      electricity: r.wardenPresence,
      wifi: r.lighting,
      safety: r.safetyRating,
      noise: 4,
    },
    comment: r.comment,
    isAnonymous: false,
    isLocked: true,
    createdAt: r.createdAt,
    updatedAt: new Date(),
  }));

  await Review.insertMany(reviews);
  console.log(`✅ Reviews: ${reviews.length}`);
}

async function seedAgreements() {
  const agreements = Object.values(dummyAgreements).map((a) => ({
    _id: new mongoose.Types.ObjectId(),
    propertyId: getOrCreateId(propertyIdMap, a.propertyId),
    studentId: getOrCreateId(userIdMap, a.studentId),
    ownerId: getOrCreateId(userIdMap, a.ownerId),
    termsAndConditions: a.termsAndConditions,
    moveInDate: a.moveInDate,
    duration: a.duration,
    depositAmount: a.depositAmount,
    monthlyRent: a.monthlyRent,
    customClauses: a.customClauses,
    signatureStudent: a.signatureStudent,
    signatureOwner: a.signatureOwner,
    status: a.status,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));

  await Agreement.insertMany(agreements);
  console.log(`✅ Agreements: ${agreements.length}`);
}

async function seedMessages() {
  const messages = dummyMessages.map((m) => ({
    _id: new mongoose.Types.ObjectId(),
    senderId: getOrCreateId(userIdMap, m.senderId),
    receiverId: getOrCreateId(userIdMap, m.receiverId),
    content: m.content,
    read: m.read,
    createdAt: m.createdAt,
    updatedAt: new Date(),
  }));

  await Message.insertMany(messages);
  console.log(`✅ Messages: ${messages.length}`);
}

async function seedMatchProfiles() {
  const profiles = dummyMatchProfiles.map((m) => ({
    _id: new mongoose.Types.ObjectId(),
    userId: getOrCreateId(userIdMap, m.userId),
    userName: m.userName,
    email: m.email,
    profileImage: undefined,
    lifestyle: m.lifestyle,
    interests: m.interests,
    budgetRange: m.budgetRange,
    bio: m.bio || "",
    preferredProperties: [],
    createdAt: m.createdAt,
    updatedAt: new Date(),
  }));

  await MatchProfile.insertMany(profiles);
  console.log(`✅ Match Profiles: ${profiles.length}`);
}

async function main() {
  console.log("🌱 Seeding MongoDB...");
  console.log(`📍 URI: ${MONGODB_URI}`);

  await connectDB();
  await clearDatabase();

  await seedUsers();
  await seedProperties();
  await seedBookings();
  await seedVisitRequests();
  await seedBookingRequests();
  await seedStayRecords();
  await seedLedgerEntries();
  await seedPayments();
  await seedReviews();
  await seedAgreements();
  await seedMessages();
  await seedMatchProfiles();

  console.log("\n✅ Done. Seeded all API collections.");
  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error("❌ Seeding failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
