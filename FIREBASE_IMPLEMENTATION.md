# Firebase Implementation Guide - Schedulo

## Overview

This document explains how the Schedulo application implements shift management and swap functionality using Firebase Firestore. It covers the database schema, real-time operations, and the complete swap workflow.

---

## Table of Contents

1. [Collections Overview](#collections-overview)
2. [Shifts Database](#shifts-database)
3. [Swap Feature Implementation](#swap-feature-implementation)
4. [Employee ID Format Convention](#employee-id-format-convention)
5. [Real-Time Listeners](#real-time-listeners)
6. [CRUD Operations](#crud-operations)
7. [Swap Workflow](#swap-workflow)
8. [Error Handling & Validation](#error-handling--validation)

---

## Collections Overview

Schedulo uses 4 main Firestore collections:

| Collection | Purpose | Documents | Key Fields |
|-----------|---------|-----------|-----------|
| **users** | Employee & manager accounts | ~10 | id, name, email, role |
| **shifts** | Work schedules | ~240 | employeeId, employeeName, date, type, startTime, endTime |
| **swapRequests** | Shift swap requests | Variable | fromEmployeeId, toEmployeeId, shiftId, status |
| **activityLogs** | Audit trail | Variable | type, description, userId, timestamp |

---

## Shifts Database

### Schema

```typescript
interface Shift {
  id: string;              // Firestore document ID (auto-generated)
  employeeId: string;      // Short employee ID (e.g., "john")
  employeeName: string;    // Full name (e.g., "John Smith")
  date: string;            // ISO date (e.g., "2024-11-27")
  type: ShiftType;         // "day" | "afternoon" | "night"
  startTime: string;       // Time (e.g., "08:00")
  endTime: string;         // Time (e.g., "16:00")
}
```

### Example Shift Document

```json
{
  "id": "0FRMLfN7ly9kU381Ep6r",
  "employeeId": "rachel",
  "employeeName": "Rachel Taylor",
  "date": "2024-11-27",
  "type": "afternoon",
  "startTime": "16:00",
  "endTime": "00:00"
}
```

### Shift Types & Times

```typescript
const SHIFT_TIMES = {
  day: { start: "08:00", end: "16:00" },
  afternoon: { start: "16:00", end: "00:00" },
  night: { start: "00:00", end: "08:00" }
};
```

### Key Characteristics

- ✅ **Short Employee IDs**: Uses first name in lowercase (e.g., "john" not Firebase ID)
- ✅ **One shift per employee per day**: Enforced by business logic
- ✅ **Date format**: ISO 8601 (YYYY-MM-DD)
- ✅ **Consistent naming**: All shifts reference same employee name

### Shift Management Operations

#### Create Shift

```typescript
const addShift = async (shift: Omit<Shift, 'id'>) => {
  const docRef = await addDoc(collection(db, 'shifts'), shift);
  return docRef.id;
};

// Usage:
await addShift({
  employeeId: 'john',           // Short ID
  employeeName: 'John Smith',   // Full name
  date: '2024-11-27',
  type: 'day',
  startTime: '08:00',
  endTime: '16:00'
});
```

#### Read Shifts

```typescript
// Get all shifts
const getShifts = async (): Promise<Shift[]> => {
  const querySnapshot = await getDocs(collection(db, 'shifts'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
};

// Get shifts for specific employee
const getShiftsByEmployee = async (employeeId: string): Promise<Shift[]> => {
  const q = query(
    collection(db, 'shifts'),
    where('employeeId', '==', employeeId),
    orderBy('date', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
};
```

#### Update Shift

```typescript
const updateShift = async (shiftId: string, data: Partial<Shift>) => {
  const shiftRef = doc(db, 'shifts', shiftId);
  await updateDoc(shiftRef, data as any);
};

// Example: Change shift owner during swap
await updateShift(shiftId, {
  employeeId: 'sarah',           // New owner (short ID)
  employeeName: 'Sarah Johnson'  // New owner name
});
```

#### Delete Shift

```typescript
const deleteShift = async (shiftId: string) => {
  await deleteDoc(doc(db, 'shifts', shiftId));
};
```

---

## Swap Feature Implementation

### Overview

The swap feature allows employees to request shift exchanges with coworkers. The workflow involves:
1. Employee A creates a swap request with Employee B
2. Employee B receives notification and can accept/decline
3. On acceptance, shift ownership transfers to Employee B

### SwapRequest Schema

```typescript
interface SwapRequest {
  id: string;              // Firestore document ID
  fromEmployeeId: string;  // Requester's short ID (e.g., "jessica")
  fromEmployeeName: string;// Requester's full name (e.g., "Jessica Martinez")
  toEmployeeId: string;    // Recipient's short ID (e.g., "sarah")
  toEmployeeName: string;  // Recipient's full name (e.g., "Sarah Johnson")
  shiftId: string;         // ID of shift being swapped
  shift: Shift;            // Full shift object (for display)
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;       // ISO timestamp
}
```

### Example Swap Request Document

```json
{
  "id": "swapReq123",
  "fromEmployeeId": "jessica",
  "fromEmployeeName": "Jessica Martinez",
  "toEmployeeId": "sarah",
  "toEmployeeName": "Sarah Johnson",
  "shiftId": "shift456",
  "shift": {
    "id": "shift456",
    "employeeId": "jessica",
    "employeeName": "Jessica Martinez",
    "date": "2024-11-27",
    "type": "afternoon",
    "startTime": "16:00",
    "endTime": "00:00"
  },
  "status": "pending",
  "createdAt": "2024-11-14T10:30:00Z"
}
```

### Key Implementation Details

- ✅ **Short IDs Only**: Both `fromEmployeeId` and `toEmployeeId` use short format
- ✅ **Shift Reference**: Stores full shift object for display without extra queries
- ✅ **Status Tracking**: Tracks request lifecycle (pending → accepted/declined)
- ✅ **Timestamps**: Records when request was created

---

## Employee ID Format Convention

### Critical for Swap Feature Success ⚠️

The swap feature **requires consistent employee ID formatting** across all operations.

### Format Rules

```
✅ CORRECT:
  - Short ID: "john", "emma", "rachel", "sarah"
  - Format: lowercase, first name only
  - Length: 3-8 characters typically
  - Origin: Extract from user.name using name.split(' ')[0].toLowerCase()

❌ INCORRECT:
  - Firebase IDs: "U8qG4fNEydUbNFcw4QxE"
  - Mixed formats: Some short, some Firebase
  - Uppercase: "John", "JOHN"
  - Multiple words: "john_smith"
```

### Why This Matters

The swap listener queries swaps using `where('toEmployeeId', '==', shortId)`. If the stored ID format doesn't match the query format, swaps won't appear:

```typescript
// ✅ CORRECT: Stored with short ID, queried with short ID
// Storage:
{ toEmployeeId: "sarah" }
// Query:
where('toEmployeeId', '==', 'sarah')  // ✅ Match found

// ❌ BROKEN: Stored with short ID, queried with Firebase ID
// Storage:
{ toEmployeeId: "sarah" }
// Query:
where('toEmployeeId', '==', 'U8qG4fNEydUbNFcw4QxE')  // ❌ No match
```

---

## Real-Time Listeners

Schedulo uses Firestore's `onSnapshot` for live updates without page refresh.

### Shifts Listener

```typescript
export const subscribeToShifts = (callback: (shifts: Shift[]) => void) => {
  const q = query(collection(db, 'shifts'), orderBy('date', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const shifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
    callback(shifts);
  });
};

// Usage in ManagerDashboard:
useEffect(() => {
  const unsubscribe = subscribeToShifts((allShifts) => {
    setShifts(allShifts);
  });
  
  return () => unsubscribe();
}, []);
```

### Swap Requests Listener (CRITICAL)

```typescript
export const subscribeToSwapRequests = (
  employeeId: string,  // ⚠️ MUST be short ID (e.g., "sarah")
  callback: (requests: SwapRequest[]) => void
) => {
  const q = query(
    collection(db, 'swapRequests'),
    where('toEmployeeId', '==', employeeId)  // Filters by recipient
  );
  return onSnapshot(q, async (snapshot) => {
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    // Enrich with shift details
    const enrichedRequests = await Promise.all(
      requests.map(async (req) => {
        if (!req.shift && req.shiftId) {
          const shiftDoc = await getDoc(doc(db, 'shifts', req.shiftId));
          if (shiftDoc.exists()) {
            req.shift = { id: shiftDoc.id, ...shiftDoc.data() } as Shift;
          }
        }
        return req as SwapRequest;
      })
    );
    
    callback(enrichedRequests);
  });
};

// ✅ CORRECT Usage in EmployeeDashboard:
const shortEmployeeId = user.name.split(' ')[0].toLowerCase();  // "sarah"
const unsubscribeSwaps = subscribeToSwapRequests(shortEmployeeId, (requests) => {
  setSwapRequests(requests);
});

// ❌ INCORRECT Usage (causes bug):
const unsubscribeSwaps = subscribeToSwapRequests(user.id, (requests) => {  // Firebase ID!
  setSwapRequests(requests);
});
```

### Activity Logs Listener

```typescript
export const subscribeToActivityLogs = (callback: (logs: ActivityLog[]) => void) => {
  const q = query(
    collection(db, 'activityLogs'),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
    callback(logs);
  });
};
```

---

## CRUD Operations

### Swap Requests CRUD

#### Create

```typescript
const addSwapRequest = async (request: Omit<SwapRequest, 'id'>) => {
  const docRef = await addDoc(collection(db, 'swapRequests'), request);
  return docRef.id;
};

// Example: Employee A requests swap with Employee B
const fromShortId = user.name.split(' ')[0].toLowerCase();  // "jessica"
const toShortId = targetEmployeeName.split(' ')[0].toLowerCase();  // "sarah"

await addSwapRequest({
  fromEmployeeId: fromShortId,
  fromEmployeeName: user.name,
  toEmployeeId: toShortId,
  toEmployeeName: targetEmployeeName,
  shiftId: selectedShift.id,
  shift: selectedShift,
  status: 'pending',
  createdAt: new Date().toISOString(),
});
```

#### Read

```typescript
// Get all swaps
const getSwapRequests = async (): Promise<SwapRequest[]> => {
  const querySnapshot = await getDocs(collection(db, 'swapRequests'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SwapRequest));
};

// Get swaps for specific employee (via real-time listener)
subscribeToSwapRequests(shortEmployeeId, (requests) => {
  // requests = all pending swaps where toEmployeeId === shortEmployeeId
});
```

#### Update

```typescript
const updateSwapRequest = async (requestId: string, data: Partial<SwapRequest>) => {
  const requestRef = doc(db, 'swapRequests', requestId);
  await updateDoc(requestRef, data as any);
};

// Example: Accept swap
await updateSwapRequest(swapId, {
  status: 'accepted'
});

// Example: Decline swap
await updateSwapRequest(swapId, {
  status: 'declined'
});
```

#### Delete

```typescript
const deleteSwapRequest = async (swapId: string) => {
  await deleteDoc(doc(db, 'swapRequests', swapId));
};
```

---

## Swap Workflow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────┐
│ 1. EMPLOYEE A INITIATES SWAP                                │
├─────────────────────────────────────────────────────────────┤
│ • Selects their shift to swap                               │
│ • Opens shift swap modal                                    │
│ • Selects target employee (B)                               │
│ • Clicks "Send Swap Request"                                │
└─────────────────────────────────────────────────────────────┘
         ↓
         
┌─────────────────────────────────────────────────────────────┐
│ 2. CREATE SWAP REQUEST                                      │
├─────────────────────────────────────────────────────────────┤
│ Data stored:                                                │
│ {                                                           │
│   fromEmployeeId: "jessica" (A's short ID)                 │
│   toEmployeeId: "sarah" (B's short ID)                     │
│   shiftId: "shift456"                                       │
│   status: "pending"                                         │
│   createdAt: <timestamp>                                    │
│ }                                                           │
│                                                             │
│ Activity Log Created:                                       │
│ {                                                           │
│   type: "swap_requested"                                    │
│   description: "Jessica requested to swap afternoon shift"  │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
         ↓
         
┌─────────────────────────────────────────────────────────────┐
│ 3. EMPLOYEE B RECEIVES NOTIFICATION                         │
├─────────────────────────────────────────────────────────────┤
│ • subscribeToSwapRequests listener fires                   │
│ • Queries: where('toEmployeeId', '==', 'sarah')           │
│ • Finds newly created swap request                         │
│ • Displays in "Pending Swaps" section                      │
│ • Shows: "Jessica Martinez wants to swap afternoon shift"  │
└─────────────────────────────────────────────────────────────┘
         ↓
         
┌─────────────────────────────────────────────────────────────┐
│ 4. EMPLOYEE B ACCEPTS/DECLINES                             │
├─────────────────────────────────────────────────────────────┤
│ IF ACCEPTS:                                                 │
│ • Update swap status: 'pending' → 'accepted'               │
│ • Update shift ownership:                                  │
│   { employeeId: "sarah", employeeName: "Sarah Johnson" }   │
│ • Activity Log: "Sarah accepted swap from Jessica"         │
│                                                             │
│ IF DECLINES:                                                │
│ • Update swap status: 'pending' → 'declined'               │
│ • Shift remains with original owner                        │
│ • Activity Log: "Sarah declined swap from Jessica"         │
└─────────────────────────────────────────────────────────────┘
         ↓
         
┌─────────────────────────────────────────────────────────────┐
│ 5. BOTH EMPLOYEES SEE UPDATED STATUS                        │
├─────────────────────────────────────────────────────────────┤
│ • Real-time listeners update UI                            │
│ • Employee A sees swap result                              │
│ • Employee B sees updated shift assignments                │
│ • Both see activity log entries                            │
└─────────────────────────────────────────────────────────────┘
```

### Code Implementation

**1. Create Swap Request (EmployeeDashboard.tsx)**

```typescript
const handleSwapConfirm = async (targetEmployeeId: string, targetEmployeeName: string) => {
  if (!selectedShift) return;

  try {
    const fromShortId = user.name.split(' ')[0].toLowerCase();
    const toShortId = targetEmployeeName.split(' ')[0].toLowerCase();

    // Create swap request
    await addSwapRequest({
      fromEmployeeId: fromShortId,
      fromEmployeeName: user.name,
      toEmployeeId: toShortId,
      toEmployeeName: targetEmployeeName,
      shiftId: selectedShift.id,
      shift: selectedShift,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Log activity
    await addActivityLog({
      type: 'swap_requested',
      description: `${user.name} requested to swap ${selectedShift.type} shift on ${new Date(selectedShift.date).toLocaleDateString()}`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    toast({
      title: "Swap Request Sent",
      description: `Your swap request has been sent to ${targetEmployeeName}.`,
    });
  } catch (error) {
    console.error('Error creating swap request:', error);
    toast({
      title: "Error",
      description: "Failed to send swap request.",
      variant: "destructive",
    });
  }
};
```

**2. Subscribe to Swap Requests (EmployeeDashboard.tsx)**

```typescript
useEffect(() => {
  // ✅ CRITICAL: Use short employee ID, not Firebase ID
  const shortEmployeeId = user.name.split(' ')[0].toLowerCase();
  
  const unsubscribeSwaps = subscribeToSwapRequests(shortEmployeeId, (requests) => {
    setSwapRequests(requests);  // Now shows all pending swaps for this employee
  });

  return () => unsubscribeSwaps();
}, [user.name]);
```

**3. Accept/Decline Swap (EmployeeDashboard.tsx)**

```typescript
const handleSwapResponse = async (requestId: string, accept: boolean) => {
  try {
    const request = swapRequests.find(r => r.id === requestId);
    if (!request) return;

    // If accepting, transfer shift ownership
    if (accept && request.shift) {
      await updateShift(request.shift.id, {
        employeeId: request.toEmployeeId,  // "sarah"
        employeeName: request.toEmployeeName,
      });
    }

    // Update swap status
    await updateSwapRequest(requestId, {
      status: accept ? 'accepted' : 'declined',
    });

    // Log activity
    await addActivityLog({
      type: accept ? 'swap_accepted' : 'swap_declined',
      description: `${user.name} ${accept ? 'accepted' : 'declined'} swap request from ${request.fromEmployeeName}`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    toast({
      title: accept ? "Swap Accepted" : "Swap Declined",
      description: accept
        ? "Shifts have been swapped successfully!"
        : "The swap request has been declined.",
    });
  } catch (error) {
    console.error('Error responding to swap:', error);
    toast({
      title: "Error",
      description: "Failed to respond to swap request.",
      variant: "destructive",
    });
  }
};
```

---

## Error Handling & Validation

### Key Validations

```typescript
// 1. Validate employee has shift on requested date
const hasShiftOnDate = shifts.find(s => s.date === selectedDate);
if (!hasShiftOnDate) {
  throw new Error('Employee does not have a shift on this date');
}

// 2. Validate short ID format
const isValidShortId = /^[a-z]+$/.test(employeeId);
if (!isValidShortId) {
  throw new Error('Invalid employee ID format');
}

// 3. Validate both employees exist
const fromExists = employees.find(e => e.name.split(' ')[0].toLowerCase() === fromId);
const toExists = employees.find(e => e.name.split(' ')[0].toLowerCase() === toId);
if (!fromExists || !toExists) {
  throw new Error('One or both employees not found');
}

// 4. Validate no duplicate swap request
const existingSwap = swaps.find(s => 
  s.fromEmployeeId === fromId && 
  s.toEmployeeId === toId && 
  s.status === 'pending'
);
if (existingSwap) {
  throw new Error('Swap request already pending');
}
```

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Swaps not appearing | Using Firebase ID instead of short ID in query | Use `user.name.split(' ')[0].toLowerCase()` |
| Shift not transferring | Wrong field being updated | Update `employeeId` with short ID |
| Multiple notifications | Listener not unsubscribed | Clean up listener in useEffect cleanup |
| Data inconsistency | Mixed ID formats in database | Use diagnostic tool to clean and validate |

---

## Database Rules (Recommended)

For production, implement Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.id;
    }

    // Shifts collection
    match /shifts/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }

    // Swap Requests
    match /swapRequests/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                       request.resource.data.fromEmployeeId != null &&
                       request.resource.data.toEmployeeId != null;
      allow update: if request.auth != null;
    }

    // Activity Logs
    match /activityLogs/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

---

## Summary

### Key Takeaways

✅ **Shifts**: Simple documents with employee short IDs, dates, and times  
✅ **Swaps**: Links shifts between employees using short IDs for consistency  
✅ **Real-time**: Listeners automatically update UI when data changes  
✅ **Format**: Critical to use short employee IDs everywhere  
✅ **Validation**: Check data consistency with diagnostic tools  

### Testing

Use the Diagnostic page to verify:
- ✅ "Inspect Data" - See all collections
- ✅ "Test Swaps" - Validate ID consistency
- ✅ "Swap Feature Test" - Full end-to-end verification

### Maintenance

Regular checks:
- Monitor activity logs for errors
- Verify employee ID format consistency
- Clean swap requests if format issues occur
- Test swap workflow monthly

---

## References

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Real-time Listeners](https://firebase.google.com/docs/firestore/query-data/listen)
- [Transactions & Batch Writes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
