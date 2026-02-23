/**
 * Mock Database Service
 * Simulates Firestore without requiring actual Firebase
 */

import {
  runtimeUsers,
  runtimeStudentProfiles,
  runtimeOwnerProfiles,
  runtimeProperties,
  runtimeBookings,
  runtimeReviews,
  runtimeAgreements,
  runtimeRoommateProfiles,
} from '../data/dummyData';

const collections: Record<string, Record<string, any>> = {
  users: runtimeUsers,
  studentProfiles: runtimeStudentProfiles,
  ownerProfiles: runtimeOwnerProfiles,
  properties: runtimeProperties,
  bookings: runtimeBookings,
  reviews: runtimeReviews,
  agreements: runtimeAgreements,
  roommateProfiles: runtimeRoommateProfiles,
};

interface DocSnapshot {
  exists: boolean;
  data: () => any;
  id: string;
}

interface QuerySnapshot {
  forEach: (callback: (doc: QueryDocumentSnapshot) => void) => void;
}

interface QueryDocumentSnapshot {
  id: string;
  data: () => any;
}

export const mockDb = {
  collection: (collectionName: string) => {
    return {
      doc: (docId: string): any => {
        return {
          get: async (): Promise<DocSnapshot> => {
            const data = collections[collectionName]?.[docId];
            return {
              exists: !!data,
              data: () => data,
              id: docId,
            };
          },
          set: async (data: any, options?: { merge?: boolean }) => {
            if (!collections[collectionName]) {
              collections[collectionName] = {};
            }
            if (options?.merge) {
              collections[collectionName][docId] = {
                ...collections[collectionName][docId],
                ...data,
                id: docId,
              };
            } else {
              collections[collectionName][docId] = { ...data, id: docId };
            }
          },
          update: async (updates: any) => {
            if (collections[collectionName]?.[docId]) {
              collections[collectionName][docId] = {
                ...collections[collectionName][docId],
                ...updates,
              };
            }
          },
          delete: async () => {
            if (collections[collectionName]?.[docId]) {
              delete collections[collectionName][docId];
            }
          },
        };
      },
      where: (field: string, operator: string, value: any): any => {
        return {
          get: async (): Promise<QuerySnapshot> => {
            const docs = collections[collectionName] || {};
            const filtered = Object.entries(docs)
              .filter(([_, data]: [string, any]) => {
                const fieldValue = data[field];
                if (operator === '==') return fieldValue === value;
                if (operator === '<') return fieldValue < value;
                if (operator === '>') return fieldValue > value;
                if (operator === '<=') return fieldValue <= value;
                if (operator === '>=') return fieldValue >= value;
                if (operator === 'array-contains') return Array.isArray(fieldValue) && fieldValue.includes(value);
                if (operator === 'in') return Array.isArray(value) && value.includes(fieldValue);
                return false;
              })
              .map(([id, data]: [string, any]) => ({
                id,
                data: () => data,
              }));

            return {
              forEach: (callback: (doc: QueryDocumentSnapshot) => void) => {
                filtered.forEach(callback);
              },
            };
          },
          orderBy: (field: string, direction: string = 'asc') => {
            return {
              get: async (): Promise<QuerySnapshot> => {
                const docs = collections[collectionName] || {};
                let filtered = Object.entries(docs)
                  .filter(([_, data]: [string, any]) => {
                    const fieldValue = data[field];
                    if (operator === '==') return fieldValue === value;
                    if (operator === '<') return fieldValue < value;
                    if (operator === '>') return fieldValue > value;
                    if (operator === '<=') return fieldValue <= value;
                    if (operator === '>=') return fieldValue >= value;
                    if (operator === 'array-contains') return Array.isArray(fieldValue) && fieldValue.includes(value);
                    return false;
                  })
                  .map(([id, data]: [string, any]) => ({
                    id,
                    data: () => data,
                  }));

                filtered.sort((a, b) => {
                  const aVal = a.data()[field];
                  const bVal = b.data()[field];
                  if (direction === 'desc') {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                  }
                  return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                });

                return {
                  forEach: (callback: (doc: QueryDocumentSnapshot) => void) => {
                    filtered.forEach(callback);
                  },
                };
              },
            };
          },
          limit: (limitNum: number) => {
            return {
              get: async (): Promise<QuerySnapshot> => {
                const docs = collections[collectionName] || {};
                const filtered = Object.entries(docs)
                  .filter(([_, data]: [string, any]) => {
                    const fieldValue = data[field];
                    if (operator === '==') return fieldValue === value;
                    if (operator === '<') return fieldValue < value;
                    if (operator === '>') return fieldValue > value;
                    if (operator === '<=') return fieldValue <= value;
                    if (operator === '>=') return fieldValue >= value;
                    if (operator === 'array-contains') return Array.isArray(fieldValue) && fieldValue.includes(value);
                    return false;
                  })
                  .slice(0, limitNum)
                  .map(([id, data]: [string, any]) => ({
                    id,
                    data: () => data,
                  }));

                return {
                  forEach: (callback: (doc: QueryDocumentSnapshot) => void) => {
                    filtered.forEach(callback);
                  },
                };
              },
            };
          },
        };
      },
      get: async (): Promise<QuerySnapshot> => {
        const docs = collections[collectionName] || {};
        const result = Object.entries(docs).map(([id, data]: [string, any]) => ({
          id,
          data: () => data,
        }));

        return {
          forEach: (callback: (doc: QueryDocumentSnapshot) => void) => {
            result.forEach(callback);
          },
        };
      },
      add: async (data: any): Promise<{ id: string }> => {
        if (!collections[collectionName]) {
          collections[collectionName] = {};
        }
        const id = collectionName + '_' + Date.now();
        collections[collectionName][id] = { ...data, id };
        return { id };
      },
      orderBy: (field: string, direction: string = 'asc') => {
        return {
          get: async (): Promise<QuerySnapshot> => {
            const docs = collections[collectionName] || {};
            let result = Object.entries(docs)
              .map(([id, data]: [string, any]) => ({
                id,
                data: () => data,
              }));

            result.sort((a, b) => {
              const aVal = a.data()[field];
              const bVal = b.data()[field];
              if (direction === 'desc') {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
              }
              return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            });

            return {
              forEach: (callback: (doc: QueryDocumentSnapshot) => void) => {
                result.forEach(callback);
              },
            };
          },
          limit: (limitNum: number) => {
            return {
              get: async (): Promise<QuerySnapshot> => {
                const docs = collections[collectionName] || {};
                let result = Object.entries(docs)
                  .map(([id, data]: [string, any]) => ({
                    id,
                    data: () => data,
                  }));

                result.sort((a, b) => {
                  const aVal = a.data()[field];
                  const bVal = b.data()[field];
                  if (direction === 'desc') {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                  }
                  return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                });

                result = result.slice(0, limitNum);

                return {
                  forEach: (callback: (doc: QueryDocumentSnapshot) => void) => {
                    result.forEach(callback);
                  },
                };
              },
            };
          },
        };
      },
      limit: (limitNum: number) => {
        return {
          get: async (): Promise<QuerySnapshot> => {
            const docs = collections[collectionName] || {};
            const result = Object.entries(docs)
              .slice(0, limitNum)
              .map(([id, data]: [string, any]) => ({
                id,
                data: () => data,
              }));

            return {
              forEach: (callback: (doc: QueryDocumentSnapshot) => void) => {
                result.forEach(callback);
              },
            };
          },
        };
      },
    };
  },

  // Helper to get all collections data (for debugging/testing)
  getCollections: () => collections,

  // Reset to initial dummy data
  reset: () => {
    collections.users = { ...runtimeUsers };
    collections.studentProfiles = { ...runtimeStudentProfiles };
    collections.ownerProfiles = { ...runtimeOwnerProfiles };
    collections.properties = { ...runtimeProperties };
    collections.bookings = { ...runtimeBookings };
    collections.reviews = { ...runtimeReviews };
    collections.agreements = { ...runtimeAgreements };
    collections.roommateProfiles = { ...runtimeRoommateProfiles };
  },
};

export default mockDb;


