import express, { Request, Response } from 'express';
import mockDb from '../services/mockDb';
import { Agreement } from '../types';

const router = express.Router();

// GET /api/agreements - Get all agreements
router.get('/', async (req: Request, res: Response) => {
  try {
    const { studentId, ownerId, propertyId, status } = req.query;
    const agreements: Agreement[] = [];
    
    const snapshot = await mockDb.collection('agreements').get();
    snapshot.forEach((doc: any) => {
      agreements.push(doc.data());
    });

    // Apply filters
    let filteredAgreements = agreements;
    if (studentId) {
      filteredAgreements = filteredAgreements.filter(a => a.studentId === studentId);
    }
    if (ownerId) {
      filteredAgreements = filteredAgreements.filter(a => a.ownerId === ownerId);
    }
    if (propertyId) {
      filteredAgreements = filteredAgreements.filter(a => a.propertyId === propertyId);
    }
    if (status) {
      filteredAgreements = filteredAgreements.filter(a => a.status === status);
    }

    res.json({
      success: true,
      data: filteredAgreements,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch agreements',
    });
  }
});

// GET /api/agreements/:id - Get agreement by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await mockDb.collection('agreements').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Agreement not found',
      });
    }

    res.json({
      success: true,
      data: doc.data(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch agreement',
    });
  }
});

// POST /api/agreements - Create a new agreement
router.post('/', async (req: Request, res: Response) => {
  try {
    const { propertyId, studentId, ownerId, termsAndConditions, moveInDate, duration, depositAmount, monthlyRent, customClauses } = req.body;

    if (!propertyId || !studentId || !ownerId || !moveInDate || !duration || !depositAmount || !monthlyRent) {
      return res.status(400).json({
        success: false,
        error: 'propertyId, studentId, ownerId, moveInDate, duration, depositAmount, and monthlyRent are required',
      });
    }

    // Check if property exists
    const propertyDoc = await mockDb.collection('properties').doc(propertyId).get();
    if (!propertyDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
      });
    }

    const id = 'agreement_' + Date.now();
    const agreement: Agreement = {
      id,
      propertyId,
      studentId,
      ownerId,
      termsAndConditions: termsAndConditions || 'Standard rental agreement',
      moveInDate: new Date(moveInDate),
      duration,
      depositAmount,
      monthlyRent,
      customClauses: customClauses || [],
      signatureStudent: undefined,
      signatureOwner: undefined,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await mockDb.collection('agreements').doc(id).set(agreement);

    res.status(201).json({
      success: true,
      data: agreement,
      message: 'Agreement created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create agreement',
    });
  }
});

// PUT /api/agreements/:id - Update agreement
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const doc = await mockDb.collection('agreements').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Agreement not found',
      });
    }

    await mockDb.collection('agreements').doc(id).update({
      ...updates,
      updatedAt: new Date(),
    });

    const updatedDoc = await mockDb.collection('agreements').doc(id).get();

    res.json({
      success: true,
      data: updatedDoc.data(),
      message: 'Agreement updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update agreement',
    });
  }
});

// PUT /api/agreements/:id/sign - Sign agreement
router.put('/:id/sign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { signedBy, signature } = req.body;

    if (!signedBy || !signature) {
      return res.status(400).json({
        success: false,
        error: 'signedBy and signature are required',
      });
    }

    const doc = await mockDb.collection('agreements').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Agreement not found',
      });
    }

    const agreementData = doc.data();
    let updates: any = { updatedAt: new Date() };

    if (signedBy === 'student') {
      updates.signatureStudent = signature;
      // Check if both signatures are present
      if (agreementData?.signatureOwner) {
        updates.status = 'active';
      } else {
        updates.status = 'pending-sign';
      }
    } else if (signedBy === 'owner') {
      updates.signatureOwner = signature;
      // Check if both signatures are present
      if (agreementData?.signatureStudent) {
        updates.status = 'active';
      } else {
        updates.status = 'pending-sign';
      }
    }

    await mockDb.collection('agreements').doc(id).update(updates);

    const updatedDoc = await mockDb.collection('agreements').doc(id).get();

    res.json({
      success: true,
      data: updatedDoc.data(),
      message: 'Agreement signed successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sign agreement',
    });
  }
});

// DELETE /api/agreements/:id - Delete agreement
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const doc = await mockDb.collection('agreements').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Agreement not found',
      });
    }

    await mockDb.collection('agreements').doc(id).delete();

    res.json({
      success: true,
      message: 'Agreement deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete agreement',
    });
  }
});

export default router;


