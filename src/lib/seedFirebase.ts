import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { addUser, addShift, addSwapRequest, addActivityLog, COLLECTIONS } from './firebaseService';
import { mockUsers, mockShifts, mockSwapRequests, mockActivityLogs } from '@/data/mockData';

// Clear existing data
const clearCollection = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

export const seedFirebaseData = async () => {
  try {
    console.log('🌱 Starting Firebase seeding...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await clearCollection(COLLECTIONS.USERS);
    await clearCollection(COLLECTIONS.SHIFTS);
    await clearCollection(COLLECTIONS.SWAP_REQUESTS);
    await clearCollection(COLLECTIONS.ACTIVITY_LOGS);

    // Seed users and create a map of old ID -> new ID
    console.log('👥 Seeding users...');
    const userIdMap: { [oldId: string]: string } = {};
    for (const user of mockUsers) {
      const { id, ...userData } = user;
      const newId = await addUser(userData);
      userIdMap[id] = newId;
      console.log(`  ✓ Added user: ${userData.name} (${id} → ${newId})`);
    }

    // Seed shifts with proper ID mapping
    console.log('📅 Seeding shifts...');
    const shiftIdMap: { [oldId: string]: string } = {};
    for (const shift of mockShifts) {
      const { id, employeeId, ...shiftData } = shift;
      const mappedEmployeeId = userIdMap[employeeId];
      if (!mappedEmployeeId) {
        console.warn(`  ⚠️  Employee ID not found in mapping: ${employeeId}`);
        continue;
      }
      const newId = await addShift({
        ...shiftData,
        employeeId: mappedEmployeeId,
      });
      shiftIdMap[id] = newId;
    }
    console.log(`  ✓ Added ${Object.keys(shiftIdMap).length} shifts`);

    // Seed swap requests
    console.log('🔄 Seeding swap requests...');
    for (const request of mockSwapRequests) {
      const { id, fromEmployeeId, toEmployeeId, shiftId, ...requestData } = request;
      const mappedFromId = userIdMap[fromEmployeeId];
      const mappedToId = userIdMap[toEmployeeId];
      const mappedShiftId = shiftIdMap[shiftId];
      
      if (!mappedFromId || !mappedToId) {
        console.warn(`  ⚠️  Employee ID not found in mapping`);
        continue;
      }
      
      await addSwapRequest({
        ...requestData,
        fromEmployeeId: mappedFromId,
        toEmployeeId: mappedToId,
        shiftId: mappedShiftId || shiftId,
      });
    }
    console.log(`  ✓ Added swap requests`);

    // Seed activity logs
    console.log('📝 Seeding activity logs...');
    for (const log of mockActivityLogs) {
      const { id, userId, ...logData } = log;
      const mappedUserId = userIdMap[userId];
      if (!mappedUserId) {
        console.warn(`  ⚠️  User ID not found in mapping: ${userId}`);
        continue;
      }
      await addActivityLog({
        ...logData,
        userId: mappedUserId,
      });
    }
    console.log(`  ✓ Added activity logs`);

    console.log('✅ Firebase seeding completed successfully!');
    return { success: true, userIdMap, shiftIdMap };
  } catch (error) {
    console.error('❌ Firebase seeding failed:', error);
    throw error;
  }
};
