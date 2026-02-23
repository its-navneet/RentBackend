/**
 * Mock Authentication Service
 * Simulates Firebase Auth without requiring actual Firebase
 */

export interface MockAuthUser {
  uid: string;
  email: string;
}

let currentUser: MockAuthUser | null = null;

let mockUsers: Record<string, { email: string; password: string; uid: string }> = {
  'student@example.com': {
    email: 'student@example.com',
    password: 'password123',
    uid: 'student1',
  },
  'owner@example.com': {
    email: 'owner@example.com',
    password: 'password123',
    uid: 'owner1',
  },
  'rahul@example.com': {
    email: 'rahul@example.com',
    password: 'password123',
    uid: 'student1',
  },
  'priya@example.com': {
    email: 'priya@example.com',
    password: 'password123',
    uid: 'student2',
  },
  'owner1@example.com': {
    email: 'owner1@example.com',
    password: 'password123',
    uid: 'owner1',
  },
  'owner2@example.com': {
    email: 'owner2@example.com',
    password: 'password123',
    uid: 'owner2',
  },
};

export const mockAuth = {
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    if (mockUsers[email]) {
      throw new Error('Email already exists');
    }
    const uid = 'user_' + Date.now();
    mockUsers[email] = { email, password, uid };
    return { user: { uid, email } };
  },

  signInWithEmailAndPassword: async (email: string, password: string) => {
    const user = mockUsers[email];
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }
    currentUser = { uid: user.uid, email };
    return { user: { uid: user.uid, email } };
  },

  signOut: async () => {
    currentUser = null;
  },

  getCurrentUser: () => {
    return currentUser;
  },

  setCurrentUser: (user: MockAuthUser | null) => {
    currentUser = user;
  },

  getAllUsers: () => {
    return mockUsers;
  },
};

export default mockAuth;


