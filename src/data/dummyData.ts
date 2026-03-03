import {
  User,
  StudentProfile,
  OwnerProfile,
  Property,
  Booking,
  Review,
  Agreement,
  RoommateProfile,
} from "../types";

// Dummy property images from Unsplash
const propertyImages = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136",
  "https://images.unsplash.com/photo-1545324418-cc1a9a6fded0",
  "https://images.unsplash.com/photo-1493857671505-72967e2e2760",
  "https://images.unsplash.com/photo-1503894020904-feb89c86dc60",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858",
];

const generatePropertyImages = (count: number = 5) => {
  return Array.from(
    { length: count },
    (_, i) =>
      `${propertyImages[i % propertyImages.length]}?w=800&h=600&fit=crop&q=80`,
  );
};

const generateCategorizedImages = (bedrooms: number) => ({
  bedroom: generatePropertyImages(Math.min(bedrooms, 3)),
  bathroom: generatePropertyImages(1),
  kitchen: generatePropertyImages(1),
  living: generatePropertyImages(1),
  balcony: generatePropertyImages(1),
});

// Indian cities for properties
const cities = [
  "Bhubaneswar",
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
];
const colleges = [
  "NIT Rourkela",
  "ITER",
  "Utkal University",
  "IIT Delhi",
  "IIM Bangalore",
  "BITS Pilani",
];
const branches = [
  "CSE",
  "ECE",
  "Mechanical",
  "Civil",
  "EEE",
  "IT",
  "MBA",
  "BBA",
];
const names = {
  first: [
    "Rahul",
    "Priya",
    "Ananya",
    "Vikram",
    "Sneha",
    "Arjun",
    "Meera",
    "Rohan",
    "Divya",
    "Karan",
    "Pooja",
    "Amit",
    "Riya",
    "Sanjay",
    "Neha",
    "Aditya",
    "Swati",
    "Nikhil",
    "Kavya",
    "Harsh",
    "Shruti",
    "Varun",
    "Anjali",
    "Akash",
    "Nisha",
    "Rajesh",
    "Deepika",
    "Suresh",
    "Lakshmi",
    "Manoj",
  ],
  last: [
    "Kumar",
    "Sharma",
    "Patel",
    "Singh",
    "Verma",
    "Gupta",
    "Reddy",
    "Iyer",
    "Nair",
    "Das",
    "Desai",
    "Rao",
    "Joshi",
    "Mehta",
    "Chopra",
    "Malhotra",
    "Agarwal",
    "Banerjee",
    "Saxena",
    "Kapoor",
  ],
};

// Generate 30 tenant users
const generateTenants = (): Record<string, User> => {
  const tenants: Record<string, User> = {};
  for (let i = 1; i <= 30; i++) {
    const firstName = names.first[i % names.first.length];
    const lastName = names.last[i % names.last.length];
    tenants[`tenant${i}`] = {
      id: `tenant${i}`,
      email: `tenant${i}@example.com`,
      phone: `+91 ${9000000000 + i}`,
      name: `${firstName} ${lastName}`,
      role: "student",
      createdAt: new Date(
        Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
      ),
      verified: i % 5 !== 0,
    };
  }
  return tenants;
};

// Generate 20 owner users
const generateOwners = (): Record<string, User> => {
  const owners: Record<string, User> = {};
  for (let i = 1; i <= 20; i++) {
    const firstName = names.first[(i + 15) % names.first.length];
    const lastName = names.last[(i + 10) % names.last.length];
    owners[`owner${i}`] = {
      id: `owner${i}`,
      email: `owner${i}@example.com`,
      phone: `+91 ${8000000000 + i}`,
      name: `${firstName} ${lastName}`,
      role: "owner",
      createdAt: new Date(
        Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000,
      ),
      verified: true,
      backgroundCheckStatus: i % 4 === 0 ? "pending" : "approved",
    };
  }
  return owners;
};

// Dummy Users (50 total: 30 tenants + 20 owners)
export const dummyUsers: Record<string, User> = {
  ...generateTenants(),
  ...generateOwners(),
};

// Generate Student Profiles for all 30 tenants
const generateStudentProfiles = (): Record<string, StudentProfile> => {
  const profiles: Record<string, StudentProfile> = {};
  const diets: ("veg" | "non-veg" | "jain")[] = ["veg", "non-veg", "jain"];
  const sleepSchedules: ("early-bird" | "night-owl" | "flexible")[] = [
    "early-bird",
    "night-owl",
    "flexible",
  ];
  const roomTypes: ("single" | "sharing" | "double")[] = [
    "single",
    "sharing",
    "double",
  ];

  for (let i = 1; i <= 30; i++) {
    const user = dummyUsers[`tenant${i}`];
    profiles[`tenant${i}`] = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: "student",
      createdAt: user.createdAt,
      verified: user.verified,
      branch: branches[i % branches.length],
      college: colleges[i % colleges.length],
      diet: diets[i % diets.length],
      sleepSchedule: sleepSchedules[i % sleepSchedules.length],
      preferences: {
        budget: { min: 6000 + i * 500, max: 12000 + i * 800 },
        roomType: roomTypes[i % roomTypes.length],
        amenities: ["WiFi", "AC", "Furnished"].slice(0, 1 + (i % 3)),
        safetyRating: 3 + (i % 3),
      },
    };
  }
  return profiles;
};

// Dummy Student Profiles
export const dummyStudentProfiles: Record<string, StudentProfile> =
  generateStudentProfiles();

// Generate Owner Profiles for all 20 owners
const generateOwnerProfiles = (): Record<string, OwnerProfile> => {
  const profiles: Record<string, OwnerProfile> = {};

  for (let i = 1; i <= 20; i++) {
    const user = dummyUsers[`owner${i}`];
    const propertyIds = [`prop${(i - 1) * 2 + 1}`, `prop${(i - 1) * 2 + 2}`];

    profiles[`owner${i}`] = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: "owner",
      createdAt: user.createdAt,
      verified: user.verified,
      businessName: `${user.name.split(" ")[1]} Property Management`,
      properties: propertyIds,
      backgroundCheckComplete: user.backgroundCheckStatus === "approved",
      previousTenantReferences:
        i % 2 === 0 ? ["Excellent tenant", "Paid on time"] : ["Good tenant"],
    };
  }
  return profiles;
};

// Dummy Owner Profiles
export const dummyOwnerProfiles: Record<string, OwnerProfile> =
  generateOwnerProfiles();

// Generate 40 Properties (2 per owner)
const generateProperties = (): Record<string, Property> => {
  const properties: Record<string, Property> = {};
  const propertyTypes: ("apartment" | "pg" | "hostel" | "flat")[] = [
    "apartment",
    "pg",
    "hostel",
    "flat",
  ];
  const titles = [
    "Cozy 2BHK near Station",
    "Spacious 3BHK with Terrace",
    "Girls Hostel - Premium PG",
    "Modern 1BHK Flat with Balcony",
    "Student Shared Hostel",
    "Budget Friendly 1BHK",
    "PG with Attached Kitchen",
    "Luxury 4BHK Apartment",
    "Boys PG with Gym",
    "Studio Apartment",
    "Family Flat with Parking",
    "Co-living Space",
  ];

  for (let i = 1; i <= 40; i++) {
    const ownerIndex = Math.ceil(i / 2);
    const ownerId = `owner${ownerIndex}`;
    const city = cities[i % cities.length];
    const bedrooms = 1 + (i % 4);
    const bathrooms = 1 + (i % 3);
    const budget = 7000 + i * 1000;
    const type = propertyTypes[i % propertyTypes.length];

    properties[`prop${i}`] = {
      id: `prop${i}`,
      ownerId,
      title: `${titles[i % titles.length]} - ${city}`,
      description: `Well-maintained ${type} with modern amenities and excellent connectivity. Perfect for students and working professionals.`,
      type,
      address: `${i} Main Street, ${city}`,
      latitude: 20.2961 + i * 0.01,
      longitude: 85.8245 + i * 0.01,
      city,
      budget: { min: budget, max: budget },
      bedrooms,
      bathrooms,
      amenities: [
        "WiFi",
        ...(i % 2 === 0 ? ["AC"] : ["Fan"]),
        "Furnished",
        ...(i % 3 === 0 ? ["Parking", "Gym"] : []),
        ...(i % 5 === 0 ? ["24x7 Security", "CCTV"] : []),
        ...(type === "pg" ? ["Meals Included"] : []),
      ],
      photos: generatePropertyImages(5),
      categorizedImages: generateCategorizedImages(bedrooms),
      videoUrl: i % 3 === 0 ? `https://example.com/video${i}.mp4` : "",
      verified: i % 7 !== 0,
      safetyRating: 3.5 + (i % 3) * 0.5,
      reviews: [],
      createdAt: new Date(
        Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
      ),
      updatedAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ),
      landmarks: [
        {
          type: "bus-stop",
          name: `${city} Bus Stop`,
          distance: 300 + i * 50,
          duration: 3 + (i % 5),
        },
        {
          type: "market",
          name: `${city} Market`,
          distance: 500 + i * 100,
          duration: 5 + (i % 10),
        },
        ...(i % 3 === 0
          ? [
              {
                type: "college" as const,
                name: colleges[i % colleges.length],
                distance: 2000 + i * 200,
                duration: 15 + (i % 15),
              },
            ]
          : []),
      ],
      availableFrom: new Date(Date.now() + i * 2 * 24 * 60 * 60 * 1000),
    };
  }
  return properties;
};

// Dummy Properties (40 total)
export const dummyProperties: Record<string, Property> = generateProperties();

// Generate Reviews (60+ reviews)
const generateReviews = (): Record<string, Review> => {
  const reviews: Record<string, Review> = {};
  const comments = [
    "Great property, very clean and spacious!",
    "Excellent security and friendly atmosphere.",
    "Premium facilities and 24x7 support.",
    "Best hostel in the area. Highly recommended!",
    "Meals included and very clean. Worth every penny!",
    "Owner is very cooperative and responsive.",
    "Good location and well-maintained property.",
    "Could be better, but overall decent experience.",
  ];

  let reviewCount = 1;
  for (let i = 1; i <= 30 && reviewCount <= 60; i++) {
    const reviewsForProperty = 1 + (i % 3);
    for (let j = 0; j < reviewsForProperty && reviewCount <= 60; j++) {
      const tenantIndex = ((reviewCount + j) % 30) + 1;
      reviews[`review${reviewCount}`] = {
        id: `review${reviewCount}`,
        userId: `tenant${tenantIndex}`,
        userName: dummyUsers[`tenant${tenantIndex}`].name,
        rating: 3.5 + (reviewCount % 3) * 0.5,
        safetyRating: 4 + (reviewCount % 2),
        lighting: 4 + (reviewCount % 2),
        entryAccess: 4 + ((reviewCount + 1) % 2),
        wardenPresence: 4 + ((reviewCount + 2) % 2),
        comment: comments[reviewCount % comments.length],
        createdAt: new Date(
          Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000,
        ),
      };
      reviewCount++;
    }
  }
  return reviews;
};

// Dummy Reviews
export const dummyReviews: Record<string, Review> = generateReviews();

// Generate Roommate Profiles (30 profiles)
const generateRoommateProfiles = (): Record<string, RoommateProfile> => {
  const profiles: Record<string, RoommateProfile> = {};
  const habits = [
    ["quiet", "organized", "clean"],
    ["social", "friendly", "tidy"],
    ["studious", "punctual", "respectful"],
    ["active", "outgoing", "helpful"],
  ];
  const studyPreferences: ("silent" | "casual" | "group")[] = [
    "silent",
    "casual",
    "group",
  ];

  for (let i = 1; i <= 30; i++) {
    const student = dummyStudentProfiles[`tenant${i}`];
    profiles[`roommate${i}`] = {
      userId: student.id,
      userName: student.name,
      branch: student.branch,
      diet: student.diet,
      sleepSchedule: student.sleepSchedule,
      habits: habits[i % habits.length],
      studyPreference: studyPreferences[i % studyPreferences.length],
      compatibilityScore: 75 + (i % 20),
    };
  }
  return profiles;
};

// Dummy Roommate Profiles
export const dummyRoommateProfiles: Record<string, RoommateProfile> =
  generateRoommateProfiles();

// Generate Bookings (40 bookings)
const generateBookings = (): Record<string, Booking> => {
  const bookings: Record<string, Booking> = {};
  const statuses: ("pending" | "confirmed" | "cancelled")[] = [
    "pending",
    "confirmed",
    "cancelled",
  ];
  const ownerResponses: ("pending" | "accepted" | "rejected")[] = [
    "pending",
    "accepted",
    "rejected",
  ];

  for (let i = 1; i <= 40; i++) {
    const propertyId = `prop${i}`;
    const tenantIndex = (i % 30) + 1;
    const tenantId = `tenant${tenantIndex}`;

    bookings[`booking${i}`] = {
      id: `booking${i}`,
      propertyId,
      studentId: tenantId,
      ownerResponse: ownerResponses[i % ownerResponses.length],
      visitDate: new Date(Date.now() + i * 2 * 24 * 60 * 60 * 1000),
      status: statuses[i % statuses.length],
      createdAt: new Date(
        Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000,
      ),
    };
  }
  return bookings;
};

// Dummy Bookings
export const dummyBookings: Record<string, Booking> = generateBookings();

// Generate Agreements (25 agreements)
const generateAgreements = (): Record<string, Agreement> => {
  const agreements: Record<string, Agreement> = {};
  const statuses: (
    | "draft"
    | "pending-sign"
    | "active"
    | "expired"
    | "terminated"
  )[] = ["draft", "pending-sign", "active", "expired", "terminated"];
  const clauses = [
    ["No smoking", "No parties", "Quiet hours 10PM-8AM"],
    ["Monthly payment by 5th", "Maintain cleanliness", "No pets"],
    ["Guest policy applies", "1-month notice required", "Regular inspections"],
  ];

  for (let i = 1; i <= 25; i++) {
    const propertyId = `prop${i}`;
    const property = dummyProperties[propertyId];
    const tenantIndex = (i % 30) + 1;
    const tenantId = `tenant${tenantIndex}`;

    agreements[`agreement${i}`] = {
      id: `agreement${i}`,
      propertyId,
      studentId: tenantId,
      ownerId: property.ownerId,
      termsAndConditions: `Standard rental agreement for ${property.title}`,
      moveInDate: new Date(Date.now() + i * 5 * 24 * 60 * 60 * 1000),
      duration: 6 + (i % 7),
      depositAmount: property.budget.min,
      monthlyRent: property.budget.min,
      customClauses: clauses[i % clauses.length],
      signatureStudent: undefined,
      signatureOwner: undefined,
      status: statuses[i % statuses.length],
      createdAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ),
      updatedAt: new Date(
        Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000,
      ),
    };
  }
  return agreements;
};

// Dummy Agreements
export const dummyAgreements: Record<string, Agreement> = generateAgreements();

// Generate Messages (100 messages)
export const dummyMessages: Array<{
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: Date;
}> = Array.from({ length: 100 }, (_, i) => {
  const senderIndex = (i % 30) + 1;
  const receiverOwnerIndex = (i % 20) + 1;
  const isOwnerSending = i % 3 === 0;

  return {
    id: `message${i + 1}`,
    senderId: isOwnerSending
      ? `owner${receiverOwnerIndex}`
      : `tenant${senderIndex}`,
    receiverId: isOwnerSending
      ? `tenant${senderIndex}`
      : `owner${receiverOwnerIndex}`,
    content: isOwnerSending
      ? `Property is available for visit. When would you like to schedule?`
      : `Hi, I'm interested in your property. Can we schedule a visit?`,
    read: i % 4 !== 0,
    createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
  };
});

// Generate Visit Requests (30 requests)
export const dummyVisitRequests: Array<{
  id: string;
  tenantId: string;
  propertyId: string;
  ownerId: string;
  requestedDate: Date;
  status: "pending" | "approved" | "rejected" | "completed";
  notes?: string;
  createdAt: Date;
}> = Array.from({ length: 30 }, (_, i) => {
  const propertyId = `prop${(i % 40) + 1}`;
  const property = dummyProperties[propertyId];
  const tenantIndex = (i % 30) + 1;
  const statuses: ("pending" | "approved" | "rejected" | "completed")[] = [
    "pending",
    "approved",
    "rejected",
    "completed",
  ];

  return {
    id: `visit${i + 1}`,
    tenantId: `tenant${tenantIndex}`,
    propertyId,
    ownerId: property.ownerId,
    requestedDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
    status: statuses[i % statuses.length],
    notes: i % 3 === 0 ? "Prefer morning visit" : undefined,
    createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
  };
});

// Generate Stay Records (20 active stays)
export const dummyStayRecords: Array<{
  id: string;
  tenantId: string;
  propertyId: string;
  ownerId: string;
  status: "upcoming" | "active" | "notice_period" | "completed" | "cancelled";
  checkInDate: Date;
  checkOutDate?: Date;
  monthlyRent: number;
  depositAmount: number;
  createdAt: Date;
}> = Array.from({ length: 20 }, (_, i) => {
  const propertyId = `prop${(i % 40) + 1}`;
  const property = dummyProperties[propertyId];
  const tenantIndex = (i % 30) + 1;
  const statuses: (
    | "upcoming"
    | "active"
    | "notice_period"
    | "completed"
    | "cancelled"
  )[] = ["upcoming", "active", "notice_period", "completed", "cancelled"];

  return {
    id: `stay${i + 1}`,
    tenantId: `tenant${tenantIndex}`,
    propertyId,
    ownerId: property.ownerId,
    status: statuses[i % statuses.length],
    checkInDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
    checkOutDate:
      i % 5 === 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
    monthlyRent: property.budget.min,
    depositAmount: property.budget.min,
    createdAt: new Date(Date.now() - i * 35 * 24 * 60 * 60 * 1000),
  };
});

// Generate Ledger Entries (50 entries)
export const dummyLedgerEntries: Array<{
  id: string;
  stayRecordId: string;
  tenantId: string;
  propertyId: string;
  ownerId: string;
  month: Date;
  charges: Array<{
    type: "rent" | "electricity" | "food" | "laundry" | "penalty" | "custom";
    name: string;
    amount: number;
  }>;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: "paid" | "partial" | "overdue";
  dueDate: Date;
  createdAt: Date;
}> = Array.from({ length: 50 }, (_, i) => {
  const stayIndex = (i % 20) + 1;
  const stay = dummyStayRecords[stayIndex - 1];
  const monthsAgo = Math.floor(i / 20);

  const charges = [
    { type: "rent" as const, name: "Monthly Rent", amount: stay.monthlyRent },
    ...(i % 3 === 0
      ? [
          {
            type: "electricity" as const,
            name: "Electricity Bill",
            amount: 500 + i * 50,
          },
        ]
      : []),
    ...(i % 5 === 0
      ? [{ type: "food" as const, name: "Meal Charges", amount: 2000 }]
      : []),
  ];

  const totalAmount = charges.reduce((sum, c) => sum + c.amount, 0);
  const paidAmount =
    i % 4 === 0 ? 0 : i % 4 === 1 ? totalAmount / 2 : totalAmount;

  return {
    id: `ledger${i + 1}`,
    stayRecordId: stay.id,
    tenantId: stay.tenantId,
    propertyId: stay.propertyId,
    ownerId: stay.ownerId,
    month: new Date(Date.now() - monthsAgo * 30 * 24 * 60 * 60 * 1000),
    charges,
    totalAmount,
    paidAmount,
    balance: totalAmount - paidAmount,
    status:
      paidAmount === 0
        ? "overdue"
        : paidAmount < totalAmount
          ? "partial"
          : "paid",
    dueDate: new Date(Date.now() - (monthsAgo * 30 - 5) * 24 * 60 * 60 * 1000),
    createdAt: new Date(
      Date.now() - (monthsAgo * 30 + 2) * 24 * 60 * 60 * 1000,
    ),
  };
});

// Generate Payments (80 payments)
export const dummyPayments: Array<{
  id: string;
  tenantId: string;
  ownerId: string;
  stayRecordId?: string;
  amount: number;
  type:
    | "deposit"
    | "rent"
    | "electricity"
    | "food"
    | "laundry"
    | "penalty"
    | "custom";
  status: "pending" | "completed" | "failed" | "refunded";
  transactionId: string;
  paymentMethod: "upi" | "card" | "bank_transfer" | "cash";
  createdAt: Date;
}> = Array.from({ length: 80 }, (_, i) => {
  const stayIndex = (i % 20) + 1;
  const stay = dummyStayRecords[stayIndex - 1];
  const types: ("deposit" | "rent" | "electricity" | "food")[] = [
    "deposit",
    "rent",
    "electricity",
    "food",
  ];
  const statuses: ("pending" | "completed" | "failed" | "refunded")[] = [
    "pending",
    "completed",
    "failed",
    "refunded",
  ];
  const methods: ("upi" | "card" | "bank_transfer" | "cash")[] = [
    "upi",
    "card",
    "bank_transfer",
    "cash",
  ];

  const type = types[i % types.length];
  const amount =
    type === "deposit"
      ? stay.depositAmount
      : type === "rent"
        ? stay.monthlyRent
        : type === "electricity"
          ? 500 + i * 30
          : 2000;

  return {
    id: `payment${i + 1}`,
    tenantId: stay.tenantId,
    ownerId: stay.ownerId,
    stayRecordId: stay.id,
    amount,
    type,
    status: statuses[i % statuses.length],
    transactionId: `TXN${Date.now()}${i}`,
    paymentMethod: methods[i % methods.length],
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
  };
});

// Generate Match Profiles (30 profiles)
export const dummyMatchProfiles: Array<{
  id: string;
  userId: string;
  userName: string;
  email: string;
  lifestyle: {
    sleepTime: "early" | "late" | "flexible";
    cleanliness: "high" | "medium" | "chill";
    smoking: "yes" | "no" | "occasionally";
    drinking: "yes" | "no" | "occasionally";
    guestFrequency: "frequent" | "occasional" | "rare";
    workType: "student" | "professional" | "remote";
    personality: "introvert" | "ambivert" | "extrovert";
  };
  interests: string[];
  budgetRange: { min: number; max: number };
  bio?: string;
  createdAt: Date;
}> = Array.from({ length: 30 }, (_, i) => {
  const user = dummyUsers[`tenant${i + 1}`];
  const profile = dummyStudentProfiles[`tenant${i + 1}`];
  const sleepTimes: ("early" | "late" | "flexible")[] = [
    "early",
    "late",
    "flexible",
  ];
  const cleanliness: ("high" | "medium" | "chill")[] = [
    "high",
    "medium",
    "chill",
  ];
  const yesNo: ("yes" | "no" | "occasionally")[] = [
    "yes",
    "no",
    "occasionally",
  ];
  const personalities: ("introvert" | "ambivert" | "extrovert")[] = [
    "introvert",
    "ambivert",
    "extrovert",
  ];
  const interests = [
    "gym",
    "coding",
    "music",
    "gaming",
    "reading",
    "travel",
    "sports",
    "movies",
  ];

  return {
    id: `match${i + 1}`,
    userId: user.id,
    userName: user.name,
    email: user.email,
    lifestyle: {
      sleepTime: sleepTimes[i % sleepTimes.length],
      cleanliness: cleanliness[i % cleanliness.length],
      smoking: yesNo[i % yesNo.length],
      drinking: yesNo[(i + 1) % yesNo.length],
      guestFrequency:
        i % 3 === 0 ? "frequent" : i % 3 === 1 ? "occasional" : "rare",
      workType: "student",
      personality: personalities[i % personalities.length],
    },
    interests: interests.slice(0, 2 + (i % 5)),
    budgetRange: profile.preferences.budget,
    bio: `${profile.branch} student at ${profile.college}. Looking for like-minded roommates.`,
    createdAt: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000),
  };
});

// Runtime copies that can be modified
export const runtimeUsers = { ...dummyUsers };
export const runtimeStudentProfiles = { ...dummyStudentProfiles };
export const runtimeOwnerProfiles = { ...dummyOwnerProfiles };
export const runtimeProperties = { ...dummyProperties };
export const runtimeBookings = { ...dummyBookings };
export const runtimeReviews = { ...dummyReviews };
export const runtimeAgreements = { ...dummyAgreements };
export const runtimeRoommateProfiles = { ...dummyRoommateProfiles };
