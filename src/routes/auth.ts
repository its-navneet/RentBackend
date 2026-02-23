import express, { Request, Response } from 'express';
import mockAuth from '../services/mockAuth';
import mockDb from '../services/mockDb';
import { log } from 'console';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role, name, phone } = req.body;
    
    if (!email || !password || !role || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, role, and name are required',
      });
    }

    if (!['student', 'owner'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be either student or owner',
      });
    }

    const result = await mockAuth.createUserWithEmailAndPassword(email, password);
    
    // Create user profile
    const userData = {
      id: result.user.uid,
      email,
      name,
      phone: phone || '',
      role,
      createdAt: new Date(),
      verified: false,
    };

    await mockDb.collection('users').doc(result.user.uid).set(userData);

    // Create role-specific profile
    if (role === 'student') {
      await mockDb.collection('studentProfiles').doc(result.user.uid).set({
        ...userData,
        branch: '',
        college: '',
        diet: 'veg',
        sleepSchedule: 'flexible',
        preferences: {
          budget: { min: 0, max: 0 },
          roomType: 'single',
          amenities: [],
          safetyRating: 0,
        },
      });
    } else if (role === 'owner') {
      await mockDb.collection('ownerProfiles').doc(result.user.uid).set({
        ...userData,
        businessName: '',
        properties: [],
        backgroundCheckComplete: false,
        previousTenantReferences: [],
      });
    }

    res.status(201).json({
      success: true,
      data: {
        uid: result.user.uid,
        email: result.user.email,
        role,
      },
      message: 'User registered successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  log('Login request received with body:', req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const result = await mockAuth.signInWithEmailAndPassword(email, password);

    // Get user profile
    const userDoc = await mockDb.collection('users').doc(result.user.uid).get();
    const userData = userDoc.data();

    res.json({
      success: true,
      data: {
        uid: result.user.uid,
        email: result.user.email,
        role: userData?.role,
        name: userData?.name,
      },
      message: 'Login successful',
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message || 'Invalid credentials',
    });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    await mockAuth.signOut();
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Logout failed',
    });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const currentUser = mockAuth.getCurrentUser();
    
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const userDoc = await mockDb.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: userData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user',
    });
  }
});

// PUT /api/auth/set-user - Helper endpoint to set current user (for testing)
router.put('/set-user', async (req: Request, res: Response) => {
  try {
    const { uid, email } = req.body;
    
    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        error: 'uid and email are required',
      });
    }

    mockAuth.setCurrentUser({ uid, email });
    
    res.json({
      success: true,
      message: 'User set successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to set user',
    });
  }
});

export default router;


