# Clean Slate - Data Management Plan for Swap Requests

## Overview

The swap request functionality has been reset to establish a clean database with proper data management practices. This document outlines the correct approach going forward.

## Problem That Was Fixed

Previously, swap requests were storing Firebase user document IDs instead of the short employee IDs used in shifts, causing validation mismatches:

```
❌ Before (Broken):
- Shifts use: "john", "emma", "rachel"
- Swaps use: "U8qG4fNEydUbNFcw4QxE", "ONSUuZdP0NDhlnGVKFkq"
- Result: Validation failures, inconsistent data
```

## Solution: Clean Slate

All swap requests have been deleted. The database is now ready for properly formatted swap requests.

## Correct Data Format

### Employee ID Convention

**Always use short employee IDs** (extracted from user first name):

```
User Full Name        → Short Employee ID
─────────────────────────────────────────
John Smith            → "john"
Emma Wilson           → "emma"
Rachel Taylor         → "rachel"
Mike Davis            → "mike"
Sarah Johnson         → "sarah"
David Lee             → "david"
Jessica Martinez      → "jessica"
Alex Brown            → "alex"
```

### SwapRequest Model Structure

```typescript
interface SwapRequest {
  id: string;                    // Firestore document ID
  fromEmployeeId: string;        // ✅ MUST be short ID: "john"
  fromEmployeeName: string;      // Full name: "John Smith" (for UI)
  toEmployeeId: string;          // ✅ MUST be short ID: "emma"
  toEmployeeName: string;        // Full name: "Emma Wilson" (for UI)
  shiftId: string;               // ID of the shift being swapped
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;             // ISO timestamp
}
```

## Implementation Checklist

### When Creating Swap Requests

1. **Extract Short ID**
   ```typescript
   const extractShortId = (fullName: string): string => {
     return fullName.split(' ')[0].toLowerCase();
   };
   ```

2. **Validate Employee Exists**
   - Check that employee has an entry in shifts collection
   - Verify employee ID matches short employee ID format

3. **Validate Date/Shift**
   - Confirm employee has a shift on the requested date
   - Verify shift exists before creating swap request

4. **Store Correctly**
   ```typescript
   const swapRequest = {
     fromEmployeeId: 'john',      // ✅ Correct
     fromEmployeeName: 'John Smith',
     toEmployeeId: 'emma',        // ✅ Correct
     toEmployeeName: 'Emma Wilson',
     // ... other fields
   };
   ```

### Validation Rules

Before saving any swap request, verify:

```typescript
// ✅ DO validate
- fromEmployeeId exists in shifts
- toEmployeeId exists in shifts
- Both are lowercase, single-word IDs
- Employee names are properly capitalized
- Shift date is valid

// ❌ DON'T allow
- Firebase document IDs in employee ID fields
- Mixed ID formats (some short, some Firebase)
- Uppercase employee IDs
- Empty or null employee IDs
```

## Testing & Verification

### Use the Diagnostic Page

1. **After creating swap requests:**
   - Go to `/diagnostic`
   - Click "Inspect Data" tab
   - Verify swap requests show short employee IDs

2. **Validate consistency:**
   - Click "Test Swaps" tab
   - Run "Run Swap Tests"
   - Should show: "✅ All employee IDs in swap requests match shift employee IDs"
   - No mismatches should appear

### Expected Output Example

```
========== ANALYSIS ==========
Unique employeeIds in Shifts: alex, david, emma, jessica, john, mike, rachel, sarah

Unique fromEmployeeIds in Swaps: john, mike, rachel
Unique toEmployeeIds in Swaps: emma, sarah, david

✅ All employee IDs in swap requests match shift employee IDs
```

## Code Example: Creating a Swap Request

```typescript
import { addSwapRequest, getShiftsByEmployee } from '@/lib/firebaseService';

async function createSwapRequest(
  fromEmployeeName: string,
  toEmployeeName: string,
  shiftDate: string
) {
  // Extract short IDs
  const fromId = fromEmployeeName.split(' ')[0].toLowerCase();
  const toId = toEmployeeName.split(' ')[0].toLowerCase();

  // Validate both employees have shifts on the date
  const [fromShifts, toShifts] = await Promise.all([
    getShiftsByEmployee(fromId),
    getShiftsByEmployee(toId),
  ]);

  const fromShift = fromShifts.find(s => s.date === shiftDate);
  const toShift = toShifts.find(s => s.date === shiftDate);

  if (!fromShift || !toShift) {
    throw new Error('One or both employees do not have shifts on this date');
  }

  // Create swap request
  return addSwapRequest({
    fromEmployeeId: fromId,           // ✅ Short ID
    fromEmployeeName: fromEmployeeName,
    toEmployeeId: toId,               // ✅ Short ID
    toEmployeeName: toEmployeeName,
    shiftId: fromShift.id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
}
```

## Troubleshooting

### Issue: Swap test shows mismatches

**Cause:** Swap request has Firebase ID instead of short ID

**Solution:**
1. Check the actual swap request data in Firestore
2. Verify `fromEmployeeId` and `toEmployeeId` are short IDs
3. Delete and recreate the swap request with correct format

### Issue: Employee not found

**Cause:** Employee ID doesn't match any shift employee

**Solution:**
1. Run "Inspect Data" on Diagnostic page
2. Note the exact employee IDs used in shifts
3. Use those same IDs when creating swap requests
4. Ensure correct spelling and lowercase format

### Issue: ID format inconsistency

**Cause:** Mix of Firebase IDs and short IDs in database

**Solution:**
1. Use the "Clean Swaps" option in Diagnostic page to delete all swaps
2. Implement validation in swap creation code
3. Test thoroughly with "Test Swaps" before deploying

## Firebase Rules & Security

Consider adding Firestore rules to enforce data consistency:

```javascript
// rules.firestore
match /swapRequests/{document=**} {
  // Validate employee IDs are lowercase single words
  allow write: if 
    request.resource.data.fromEmployeeId.matches('^[a-z]+$') &&
    request.resource.data.toEmployeeId.matches('^[a-z]+$');
}
```

## Summary

✅ **Do:**
- Use short employee IDs consistently
- Validate before saving
- Test with diagnostic tools
- Extract IDs from user names
- Keep data normalized

❌ **Don't:**
- Mix Firebase IDs with short IDs
- Store uppercase employee IDs
- Skip validation
- Create orphaned swap requests
- Use different formats across collections

**Result:** Clean, consistent data that works reliably across your entire application.
