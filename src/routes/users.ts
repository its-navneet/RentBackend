import express, { Request, Response } from 'express';
import mockDb from '../services/mockDb';
import { User, StudentProfile, OwnerProfile } from '../types';

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    const users: User[] = [];
    
    const snapshot = await mockDb.collection('users').get();
    snapshot.forEach((doc: any) => {
      users.push(doc.data());
    });

    if (role) {
      const filteredUsers = users.filter(u => u.role === role);
      return res.json({
        success: true,
        data: filteredUsers,
      });
    }

    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch users',
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await mockDb.collection('users').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: doc.data(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user',
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const doc = await mockDb.collection('users').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    await mockDb.collection('users').doc(id).update(updates);

    const updatedDoc = await mockDb.collection('users').doc(id).get();

    res.json({
      success: true,
      data: updatedDoc.data(),
      message: 'User updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user',
    });
  }
});

// GET /api/users/student/:id - Get student profile
router.get('/student/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await mockDb.collection('studentProfiles').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found',
      });
    }

    res.json({
      success: true,
      data: doc.data(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch student profile',
    });
  }
});

// PUT /api/users/student/:id - Update student profile
router.put('/student/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const doc = await mockDb.collection('studentProfiles').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found',
      });
    }

    await mockDb.collection('studentProfiles').doc(id).update(updates);

    const updatedDoc = await mockDb.collection('studentProfiles').doc(id).get();

    res.json({
      success: true,
      data: updatedDoc.data(),
      message: 'Student profile updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update student profile',
    });
  }
});

// GET /api/users/owner/:id - Get owner profile
router.get('/owner/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await mockDb.collection('ownerProfiles').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Owner profile not found',
      });
    }

    res.json({
      success: true,
      data: doc.data(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch owner profile',
    });
  }
});

// PUT /api/users/owner/:id - Update owner profile
router.put('/owner/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const doc = await mockDb.collection('ownerProfiles').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Owner profile not found',
      });
    }

    await mockDb.collection('ownerProfiles').doc(id).update(updates);

    const updatedDoc = await mockDb.collection('ownerProfiles').doc(id).get();

    res.json({
      success: true,
      data: updatedDoc.data(),
      message: 'Owner profile updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update owner profile',
    });
  }
});

// GET /api/users/roommates - Get all roommate profiles
router.get('/roommates/all', async (req: Request, res: Response) => {
  try {
    const profiles: any[] = [];
    
    const snapshot = await mockDb.collection('roommateProfiles').get();
    snapshot.forEach((doc: any) => {
      profiles.push(doc.data());
    });

    res.json({
      success: true,
      data: profiles,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch roommate profiles',
    });
  }
});

export default router;


