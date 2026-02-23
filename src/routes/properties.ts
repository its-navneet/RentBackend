import express, { Request, Response } from 'express';
import mockDb from '../services/mockDb';
import { Property } from '../types';

const router = express.Router();

// GET /api/properties - Get all properties
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      city, 
      type, 
      minBudget, 
      maxBudget, 
      bedrooms, 
      amenities,
      verified,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let properties: Property[] = [];
    const snapshot = await mockDb.collection('properties').get();
    
    snapshot.forEach((doc: any) => {
      properties.push(doc.data());
    });

    // Apply filters
    if (city) {
      properties = properties.filter(p => p.city.toLowerCase().includes((city as string).toLowerCase()));
    }
    if (type) {
      properties = properties.filter(p => p.type === type);
    }
    if (minBudget) {
      properties = properties.filter(p => p.budget.min >= Number(minBudget));
    }
    if (maxBudget) {
      properties = properties.filter(p => p.budget.max <= Number(maxBudget));
    }
    if (bedrooms) {
      properties = properties.filter(p => p.bedrooms >= Number(bedrooms));
    }
    if (amenities) {
      const amenityList = (amenities as string).split(',');
      properties = properties.filter(p => 
        amenityList.every(a => p.amenities.includes(a.trim()))
      );
    }
    if (verified !== undefined) {
      properties = properties.filter(p => p.verified === (verified === 'true'));
    }

    // Sort
    const sortField = sortBy as string;
    properties.sort((a: any, b: any) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });

    // Paginate
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProperties = properties.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedProperties,
      total: properties.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(properties.length / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch properties',
    });
  }
});

// GET /api/properties/:id - Get property by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await mockDb.collection('properties').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
      });
    }

    res.json({
      success: true,
      data: doc.data(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch property',
    });
  }
});

// POST /api/properties - Create a new property
router.post('/', async (req: Request, res: Response) => {
  try {
    const propertyData: Property = req.body;
    
    if (!propertyData.ownerId || !propertyData.title || !propertyData.address) {
      return res.status(400).json({
        success: false,
        error: 'ownerId, title, and address are required',
      });
    }

    const id = 'prop_' + Date.now();
    const property = {
      ...propertyData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      reviews: [],
    };

    await mockDb.collection('properties').doc(id).set(property);

    // Update owner's properties list
    const ownerDoc = await mockDb.collection('ownerProfiles').doc(propertyData.ownerId).get();
    if (ownerDoc.exists) {
      const ownerData = ownerDoc.data();
      await mockDb.collection('ownerProfiles').doc(propertyData.ownerId).update({
        properties: [...(ownerData?.properties || []), id],
      });
    }

    res.status(201).json({
      success: true,
      data: property,
      message: 'Property created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create property',
    });
  }
});

// PUT /api/properties/:id - Update a property
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const doc = await mockDb.collection('properties').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
      });
    }

    await mockDb.collection('properties').doc(id).update({
      ...updates,
      updatedAt: new Date(),
    });

    const updatedDoc = await mockDb.collection('properties').doc(id).get();

    res.json({
      success: true,
      data: updatedDoc.data(),
      message: 'Property updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update property',
    });
  }
});

// DELETE /api/properties/:id - Delete a property
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const doc = await mockDb.collection('properties').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
      });
    }

    const propertyData = doc.data();

    await mockDb.collection('properties').doc(id).delete();

    // Update owner's properties list
    if (propertyData?.ownerId) {
      const ownerDoc = await mockDb.collection('ownerProfiles').doc(propertyData.ownerId).get();
      if (ownerDoc.exists) {
        const ownerData = ownerDoc.data();
        await mockDb.collection('ownerProfiles').doc(propertyData.ownerId).update({
          properties: (ownerData?.properties || []).filter((pId: string) => pId !== id),
        });
      }
    }

    res.json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete property',
    });
  }
});

// GET /api/properties/owner/:ownerId - Get properties by owner
router.get('/owner/:ownerId', async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;
    const properties: any[] = [];
    
    const snapshot = await mockDb.collection('properties').where('ownerId', '==', ownerId).get();
    snapshot.forEach((doc: any) => {
      properties.push(doc.data());
    });

    res.json({
      success: true,
      data: properties,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch properties',
    });
  }
});

// GET /api/properties/search/nearby - Get nearby properties
router.get('/search/nearby', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'latitude and longitude are required',
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const rad = Number(radius);

    const properties: any[] = [];
    const snapshot = await mockDb.collection('properties').get();
    
    snapshot.forEach((doc: any) => {
      const property = doc.data();
      // Simple distance calculation (approximate)
      const distance = Math.sqrt(
        Math.pow((property.latitude - lat) * 111, 2) +
        Math.pow((property.longitude - lng) * 111, 2) * 1000
      );
      
      if (distance <= rad / 1000) {
        properties.push({ ...property, distance: Math.round(distance * 1000) });
      }
    });

    // Sort by distance
    properties.sort((a: any, b: any) => a.distance - b.distance);

    res.json({
      success: true,
      data: properties,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch nearby properties',
    });
  }
});

export default router;


