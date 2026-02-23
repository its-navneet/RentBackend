export type UserRole = 'student' | 'owner';

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  verified: boolean;
  backgroundCheckStatus?: 'pending' | 'approved' | 'rejected';
}

export interface StudentPreferences {
  budget: { min: number; max: number };
  roomType: 'single' | 'double' | 'sharing';
  amenities: string[];
  safetyRating: number;
}

export interface StudentProfile extends User {
  role: 'student';
  branch: string;
  college: string;
  diet: 'veg' | 'non-veg' | 'jain';
  sleepSchedule: 'early-bird' | 'night-owl' | 'flexible';
  preferences: StudentPreferences;
}

export interface OwnerProfile extends User {
  role: 'owner';
  businessName: string;
  properties: string[];
  backgroundCheckComplete: boolean;
  previousTenantReferences: string[];
}

export type PropertyType = 'apartment' | 'pg' | 'hostel' | 'flat';

export interface Landmark {
  type: 'bus-stop' | 'market' | 'college' | 'hospital' | 'park';
  name: string;
  distance: number; // in meters
  duration: number; // in minutes
}

export interface Property {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  type: PropertyType;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  budget: { min: number; max: number };
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  photos: string[];
  categorizedImages: {
    bedroom?: string[];
    bathroom?: string[];
    kitchen?: string[];
    living?: string[];
    balcony?: string[];
  };
  videoUrl: string;
  verified: boolean;
  safetyRating: number;
  reviews: string[];
  createdAt: Date;
  updatedAt: Date;
  landmarks: Landmark[];
  availableFrom: Date;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  safetyRating: number;
  lighting: number;
  entryAccess: number;
  wardenPresence: number;
  comment: string;
  createdAt: Date;
}

export interface RoommateProfile {
  userId: string;
  userName: string;
  branch: string;
  diet: 'veg' | 'non-veg' | 'jain';
  sleepSchedule: 'early-bird' | 'night-owl' | 'flexible';
  habits: string[];
  studyPreference: 'silent' | 'casual' | 'group';
  compatibilityScore: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type OwnerResponse = 'pending' | 'accepted' | 'rejected';

export interface Booking {
  id: string;
  propertyId: string;
  studentId: string;
  ownerResponse: OwnerResponse;
  visitDate: Date;
  status: BookingStatus;
  createdAt: Date;
}

export type AgreementStatus = 'draft' | 'pending-sign' | 'active' | 'expired' | 'terminated';

export interface Agreement {
  id: string;
  propertyId: string;
  studentId: string;
  ownerId: string;
  termsAndConditions: string;
  moveInDate: Date;
  duration: number; // in months
  depositAmount: number;
  monthlyRent: number;
  customClauses: string[];
  signatureStudent?: string;
  signatureOwner?: string;
  status: AgreementStatus;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


