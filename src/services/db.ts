/**
 * Database Service
 * MongoDB wrapper that maintains API compatibility with the existing mockDb interface
 */

import { User, IUser } from '../models/User';
import { StudentProfile, IStudentProfile } from '../models/StudentProfile';
import { OwnerProfile, IOwnerProfile } from '../models/OwnerProfile';
import { Property, IProperty } from '../models/Property';
import { Booking, IBooking } from '../models/Booking';
import { Review, IReview } from '../models/Review';
import { Agreement, IAgreement } from '../models/Agreement';
import { RoommateProfile, IRoommateProfile } from '../models/RoommateProfile';
import mongoose from 'mongoose';

// Helper to convert MongoDB document to mockDb format
const toMockDoc = (doc: any) => ({
  exists: true,
  data: () => doc.toObject ? doc.toObject() : doc,
  id: doc._id.toString(),
});

const toMockDocs = (docs: any[]) => docs.map(toMockDoc);

const toQuerySnapshot = (docs: any[]) => ({
  forEach: (callback: (doc: any) => void) => {
    docs.forEach(doc => callback(toMockDoc(doc)));
  },
});

// Collection name to Model mapping
const getModel = (collectionName: string) => {
  const models: Record<string, any> = {
    users: User,
    studentProfiles: StudentProfile,
    ownerProfiles: OwnerProfile,
    properties: Property,
    bookings: Booking,
    reviews: Review,
    agreements: Agreement,
    roommateProfiles: RoommateProfile,
  };
  return models[collectionName];
};

export const db = {
  collection: (collectionName: string) => {
    const Model = getModel(collectionName);
    
    return {
      doc: (docId: string): any => {
        return {
          get: async () => {
            try {
              // Handle string IDs - convert to ObjectId
              let query;
              try {
                query = { _id: new mongoose.Types.ObjectId(docId) };
              } catch (e) {
                // If not a valid ObjectId, try to find by userId field
                if (collectionName === 'studentProfiles' || collectionName === 'ownerProfiles') {
                  const doc = await Model.findOne({ userId: docId });
                  return doc ? toMockDoc(doc) : { exists: false, data: () => null, id: docId };
                }
                return { exists: false, data: () => null, id: docId };
              }
              const doc = await Model.findById(query._id);
              return doc ? toMockDoc(doc) : { exists: false, data: () => null, id: docId };
            } catch (error) {
              console.error(`Error getting doc ${docId}:`, error);
              return { exists: false, data: () => null, id: docId };
            }
          },
          set: async (data: any, options?: { merge?: boolean }) => {
            try {
              // Handle string IDs - convert to ObjectId
              let docIdObj;
              try {
                docIdObj = new mongoose.Types.ObjectId(docId);
              } catch (e) {
                docIdObj = docId;
              }
              
              if (options?.merge) {
                const existing = await Model.findById(docIdObj);
                if (existing) {
                  const updated = await Model.findByIdAndUpdate(
                    docIdObj,
                    { $set: { ...data, id: docId } },
                    { new: true }
                  );
                  return updated;
                }
              }
              
              // Check if data already has _id
              const docData = data._id ? data : { ...data, _id: docIdObj, id: docId };
              const doc = new Model(docData);
              await doc.save();
              return doc;
            } catch (error) {
              console.error(`Error setting doc ${docId}:`, error);
              throw error;
            }
          },
          update: async (updates: any) => {
            try {
              let docIdObj;
              try {
                docIdObj = new mongoose.Types.ObjectId(docId);
              } catch (e) {
                // Try finding by userId
                if (collectionName === 'studentProfiles' || collectionName === 'ownerProfiles') {
                  return await Model.findOneAndUpdate(
                    { userId: docId },
                    { $set: updates },
                    { new: true }
                  );
                }
                throw e;
              }
              return await Model.findByIdAndUpdate(
                docIdObj,
                { $set: updates },
                { new: true }
              );
            } catch (error) {
              console.error(`Error updating doc ${docId}:`, error);
              throw error;
            }
          },
          delete: async () => {
            try {
              let docIdObj;
              try {
                docIdObj = new mongoose.Types.ObjectId(docId);
              } catch (e) {
                // Try finding by userId
                if (collectionName === 'studentProfiles' || collectionName === 'ownerProfiles') {
                  return await Model.findOneAndDelete({ userId: docId });
                }
                throw e;
              }
              return await Model.findByIdAndDelete(docIdObj);
            } catch (error) {
              console.error(`Error deleting doc ${docId}:`, error);
              throw error;
            }
          },
        };
      },
      where: (field: string, operator: string, value: any): any => {
        return {
          get: async () => {
            try {
              let query: any = {};
              
              switch (operator) {
                case '==':
                  query[field] = value;
                  break;
                case '<':
                  query[field] = { $lt: value };
                  break;
                case '>':
                  query[field] = { $gt: value };
                  break;
                case '<=':
                  query[field] = { $lte: value };
                  break;
                case '>=':
                  query[field] = { $gte: value };
                  break;
                case 'array-contains':
                  query[field] = value;
                  break;
                case 'in':
                  query[field] = { $in: value };
                  break;
                default:
                  query[field] = value;
              }
              
              const docs = await Model.find(query);
              return toQuerySnapshot(docs);
            } catch (error) {
              console.error(`Error in where query:`, error);
              return toQuerySnapshot([]);
            }
          },
          orderBy: (sortField: string, direction: string = 'asc') => {
            return {
              get: async () => {
                try {
                  let query: any = {};
                  
                  switch (operator) {
                    case '==':
                      query[field] = value;
                      break;
                    case '<':
                      query[field] = { $lt: value };
                      break;
                    case '>':
                      query[field] = { $gt: value };
                      break;
                    case '<=':
                      query[field] = { $lte: value };
                      break;
                    case '>=':
                      query[field] = { $gte: value };
                      break;
                    case 'array-contains':
                      query[field] = value;
                      break;
                    default:
                      query[field] = value;
                  }
                  
                  const sortDir = direction === 'desc' ? -1 : 1;
                  const docs = await Model.find(query).sort({ [sortField]: sortDir });
                  return toQuerySnapshot(docs);
                } catch (error) {
                  console.error(`Error in orderBy query:`, error);
                  return toQuerySnapshot([]);
                }
              },
              limit: async (limitNum: number) => {
                try {
                  let query: any = {};
                  
                  switch (operator) {
                    case '==':
                      query[field] = value;
                      break;
                    case '<':
                      query[field] = { $lt: value };
                      break;
                    case '>':
                      query[field] = { $gt: value };
                      break;
                    case '<=':
                      query[field] = { $lte: value };
                      break;
                    case '>=':
                      query[field] = { $gte: value };
                      break;
                    case 'array-contains':
                      query[field] = value;
                      break;
                    default:
                      query[field] = value;
                  }
                  
                  const sortDir = direction === 'desc' ? -1 : 1;
                  const docs = await Model.find(query)
                    .sort({ [sortField]: sortDir })
                    .limit(limitNum);
                  return toQuerySnapshot(docs);
                } catch (error) {
                  console.error(`Error in orderBy.limit query:`, error);
                  return toQuerySnapshot([]);
                }
              },
            };
          },
          limit: (limitNum: number) => {
            return {
              get: async () => {
                try {
                  let query: any = {};
                  
                  switch (operator) {
                    case '==':
                      query[field] = value;
                      break;
                    case '<':
                      query[field] = { $lt: value };
                      break;
                    case '>':
                      query[field] = { $gt: value };
                      break;
                    case '<=':
                      query[field] = { $lte: value };
                      break;
                    case '>=':
                      query[field] = { $gte: value };
                      break;
                    case 'array-contains':
                      query[field] = value;
                      break;
                    default:
                      query[field] = value;
                  }
                  
                  const docs = await Model.find(query).limit(limitNum);
                  return toQuerySnapshot(docs);
                } catch (error) {
                  console.error(`Error in limit query:`, error);
                  return toQuerySnapshot([]);
                }
              },
            };
          },
        };
      },
      get: async () => {
        try {
          const docs = await Model.find();
          return toQuerySnapshot(docs);
        } catch (error) {
          console.error(`Error getting all docs:`, error);
          return toQuerySnapshot([]);
        }
      },
      add: async (data: any) => {
        try {
          const doc = new Model(data);
          await doc.save();
          return { id: doc._id.toString() };
        } catch (error) {
          console.error(`Error adding doc:`, error);
          throw error;
        }
      },
      orderBy: (field: string, direction: string = 'asc') => {
        return {
          get: async () => {
            try {
              const sortDir = direction === 'desc' ? -1 : 1;
              const docs = await Model.find().sort({ [field]: sortDir });
              return toQuerySnapshot(docs);
            } catch (error) {
              console.error(`Error in orderBy:`, error);
              return toQuerySnapshot([]);
            }
          },
          limit: (limitNum: number) => {
            return {
              get: async () => {
                try {
                  const sortDir = direction === 'desc' ? -1 : 1;
                  const docs = await Model.find()
                    .sort({ [field]: sortDir })
                    .limit(limitNum);
                  return toQuerySnapshot(docs);
                } catch (error) {
                  console.error(`Error in orderBy.limit:`, error);
                  return toQuerySnapshot([]);
                }
              },
            };
          },
        };
      },
      limit: (limitNum: number) => {
        return {
          get: async () => {
            try {
              const docs = await Model.find().limit(limitNum);
              return toQuerySnapshot(docs);
            } catch (error) {
              console.error(`Error in limit:`, error);
              return toQuerySnapshot([]);
            }
          },
        };
      },
    };
  },
};

export default db;

