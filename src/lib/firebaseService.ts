import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { Shift, User, SwapRequest, ActivityLog, Availability, DayAvailability } from '@/types/shift';

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  SHIFTS: 'shifts',
  SWAP_REQUESTS: 'swapRequests',
  ACTIVITY_LOGS: 'activityLogs',
  AVAILABILITY: 'availability',
};

// Users
export const addUser = async (user: Omit<User, 'id'>) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.USERS), user);
  return docRef.id;
};

export const getUsers = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const users = await getUsers();
  return users.find(u => u.id === userId) || null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
};

// Shifts
export const addShift = async (shift: Omit<Shift, 'id'>) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.SHIFTS), shift);
  return docRef.id;
};

export const getShifts = async (): Promise<Shift[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.SHIFTS));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
};

export const getShiftsByEmployee = async (employeeId: string): Promise<Shift[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.SHIFTS),
      where('employeeId', '==', employeeId),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
  } catch (error: any) {
    // If index error, fall back to client-side sorting
    if (error.code === 'failed-precondition') {
      console.warn('Creating Firestore index... Using client-side sorting temporarily.');
      const q = query(
        collection(db, COLLECTIONS.SHIFTS),
        where('employeeId', '==', employeeId)
      );
      const querySnapshot = await getDocs(q);
      const shifts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
      return shifts.sort((a, b) => a.date.localeCompare(b.date));
    }
    throw error;
  }
};

export const updateShift = async (shiftId: string, data: Partial<Shift>) => {
  const shiftRef = doc(db, COLLECTIONS.SHIFTS, shiftId);
  await updateDoc(shiftRef, data as any);
};

export const deleteShift = async (shiftId: string) => {
  await deleteDoc(doc(db, COLLECTIONS.SHIFTS, shiftId));
};

// Swap Requests
export const addSwapRequest = async (request: Omit<SwapRequest, 'id'>) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.SWAP_REQUESTS), request);
  return docRef.id;
};

export const getSwapRequests = async (): Promise<SwapRequest[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.SWAP_REQUESTS));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SwapRequest));
};

export const getSwapRequestsByEmployee = async (employeeId: string): Promise<SwapRequest[]> => {
  const q = query(
    collection(db, COLLECTIONS.SWAP_REQUESTS),
    where('toEmployeeId', '==', employeeId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SwapRequest));
};

export const updateSwapRequest = async (requestId: string, data: Partial<SwapRequest>) => {
  const requestRef = doc(db, COLLECTIONS.SWAP_REQUESTS, requestId);
  await updateDoc(requestRef, data as any);
};

// Activity Logs
export const addActivityLog = async (log: Omit<ActivityLog, 'id'>) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), log);
  return docRef.id;
};

export const getActivityLogs = async (): Promise<ActivityLog[]> => {
  const q = query(
    collection(db, COLLECTIONS.ACTIVITY_LOGS),
    orderBy('timestamp', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
};

// Real-time listeners
export const subscribeToShifts = (callback: (shifts: Shift[]) => void) => {
  const q = query(collection(db, COLLECTIONS.SHIFTS), orderBy('date', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const shifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
    callback(shifts);
  });
};

export const subscribeToSwapRequests = (employeeId: string, callback: (requests: SwapRequest[]) => void) => {
  const q = query(
    collection(db, COLLECTIONS.SWAP_REQUESTS),
    where('toEmployeeId', '==', employeeId)
  );
  return onSnapshot(q, async (snapshot) => {
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    // Fetch shift details for each swap request
    const enrichedRequests = await Promise.all(
      requests.map(async (req) => {
        try {
          if (!req.shift && req.shiftId) {
            // Try to fetch the shift from Firestore
            const shiftDoc = await getDoc(doc(db, COLLECTIONS.SHIFTS, req.shiftId));
            if (shiftDoc.exists()) {
              req.shift = { id: shiftDoc.id, ...shiftDoc.data() } as Shift;
            }
          }
        } catch (error) {
          console.error('Error fetching shift for swap request:', error);
        }
        return req as SwapRequest;
      })
    );

    callback(enrichedRequests);
  });
};

/**
 * Real-time listener for activity logs
 * Useful for managers to see live updates of all system actions
 */
export const subscribeToActivityLogs = (callback: (logs: ActivityLog[]) => void) => {
  const q = query(
    collection(db, COLLECTIONS.ACTIVITY_LOGS),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
    callback(logs);
  });
};

// Availability
export const addAvailability = async (availability: Omit<Availability, 'id'>) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.AVAILABILITY), availability);
  return docRef.id;
};

export const getAvailability = async (): Promise<Availability[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.AVAILABILITY));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Availability));
};

export const getAvailabilityByEmployee = async (employeeId: string): Promise<Availability | null> => {
  const q = query(
    collection(db, COLLECTIONS.AVAILABILITY),
    where('employeeId', '==', employeeId)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.docs.length > 0) {
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Availability;
  }
  return null;
};

export const updateAvailability = async (availabilityId: string, data: Partial<Availability>) => {
  const availabilityRef = doc(db, COLLECTIONS.AVAILABILITY, availabilityId);
  await updateDoc(availabilityRef, data as any);
};

export const deleteAvailability = async (availabilityId: string) => {
  await deleteDoc(doc(db, COLLECTIONS.AVAILABILITY, availabilityId));
};

export const deleteAllAvailability = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.AVAILABILITY));
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

/**
 * Generate random availability data for all employees for Nov 14-30, 2024
 * Creates one document per employee with a list of availability for each day
 * This simulates a bi-weekly payweek availability submission
 */
export const generateAvailabilityData = async (shifts: Shift[], users: User[]) => {
  const employees = users.filter(u => u.role === 'employee');

  // Delete existing availability data
  await deleteAllAvailability();

  // Generate date range: Nov 14-30, 2024 (17 days)
  const startDate = new Date(2024, 10, 14); // Nov 14
  const endDate = new Date(2024, 10, 30);   // Nov 30
  const dateRange: string[] = [];

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dateRange.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Possible availability hours
  const availabilityOptions: (0 | 8 | 16 | 24)[] = [0, 8, 16, 24];

  // Generate availability list for each employee
  const availabilityRecords: Omit<Availability, 'id'>[] = [];

  employees.forEach(employee => {
    // Create availability list for this employee
    const availabilityList: DayAvailability[] = dateRange.map(date => {
      // Pick random availability from options
      const randomIndex = Math.floor(Math.random() * availabilityOptions.length);
      const randomAvailableHours = availabilityOptions[randomIndex];

      return {
        date,
        availableHours: randomAvailableHours,
      };
    });

    availabilityRecords.push({
      employeeId: employee.name.split(' ')[0].toLowerCase(),
      employeeName: employee.name,
      availabilityList,
      lastUpdated: new Date().toISOString(),
    });
  });

  // Save all availability records (one doc per employee)
  const savePromises = availabilityRecords.map(record => addAvailability(record));
  await Promise.all(savePromises);

  console.log(`Generated availability for ${availabilityRecords.length} employees`);
  availabilityRecords.forEach(record => {
    console.log(`  ${record.employeeName}: ${record.availabilityList.length} days`);
  });

  return availabilityRecords;
};
