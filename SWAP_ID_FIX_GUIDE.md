# Swap Request Employee ID Mismatch - Analysis & Solution

## Problem Overview

Your database has a mismatch between how employee IDs are stored in two different collections:

- **Shifts**: Use short employee IDs (e.g., `"john"`, `"emma"`, `"rachel"`)
- **Swap Requests**: Use Firebase user document IDs (e.g., `"U8qG4fNEydUbNFcw4QxE"`)

This causes validation failures when checking if swap request employees have actual shifts.

## Root Cause

The swap requests were created with Firebase user IDs instead of the short employee IDs. This happened because:
1. Users are stored with Firebase document IDs in the `users` collection
2. When swap requests are created, they likely use the authenticated user's Firebase ID
3. However, shifts use short employee IDs extracted from user names

## Mismatches Found

```
Unique employeeIds in Shifts: rachel, mike, john, alex, emma, david, jessica, sarah

Unique fromEmployeeIds in Swaps: sarah, U8qG4fNEydUbNFcw4QxE, john, ONSUuZdP0NDhlnGVKFkq, emma, ofIK2pptOZPaGFTdN4GY

Unique toEmployeeIds in Swaps: emma, 29XMcrLdcbhKmChT7v3h, sarah, G9sJCPbO8IdLIomGP8Hi, rachel, jessica, ljjAuQzD76UWv5OYzu6q, U8qG4fNEydUbNFcw4QxE

⚠️  Mismatched fromEmployeeIds: U8qG4fNEydUbNFcw4QxE, ONSUuZdP0NDhlnGVKFkq, ofIK2pptOZPaGFTdN4GY
⚠️  Mismatched toEmployeeIds: 29XMcrLdcbhKmChT7v3h, G9sJCPbO8IdLIomGP8Hi, ljjAuQzD76UWv5OYzu6q, U8qG4fNEydUbNFcw4QxE
```

## Firebase User ID to Short ID Mapping

```
U8qG4fNEydUbNFcw4QxE  → john
ONSUuZdP0NDhlnGVKFkq  → mike
ofIK2pptOZPaGFTdN4GY  → alex
29XMcrLdcbhKmChT7v3h  → sarah
G9sJCPbO8IdLIomGP8Hi  → emma
ljjAuQzD76UWv5OYzu6q  → david
1kUvgormlDWtmxtS2kkn  → jessica
cBx5lrwirptLBh3fZWbT  → rachel
```

## Solution

A new "Fix Swap IDs" tab has been added to the Diagnostic page (`/diagnostic`) that:

1. **Maps Firebase User IDs to Short Employee IDs**
   - Extracts first name from user's full name
   - Converts to lowercase (e.g., "John Smith" → "john")

2. **Updates All Swap Requests**
   - Iterates through all swap requests
   - Replaces Firebase IDs with short employee IDs
   - Also updates the employee names for consistency

3. **Provides Progress Feedback**
   - Shows which swaps were fixed
   - Reports any errors or skipped swaps
   - Displays a summary with count of fixes

## How to Use

1. Go to the Diagnostic page: `/diagnostic`
2. Click the **"Fix Swap IDs"** tab
3. Click **"Fix All Swap IDs"** button
4. Wait for the operation to complete
5. Run **"Test Swaps"** tab to verify all IDs now match

## Files Modified/Created

### New Files
- `/src/scripts/fixSwapRequestIds.ts` - Standalone script version (for reference)

### Modified Files
- `/src/pages/Diagnostic.tsx` - Added "Fix Swap IDs" tab with:
  - `handleFixSwapIds()` function
  - New tab button and content
  - Updated state management

## Future Prevention

To prevent this issue in the future:
1. Always use short employee IDs consistently across all collections
2. Normalize employee ID format when creating swap requests
3. Add validation in swap request creation to verify employee IDs match shifts
4. Add a pre-swap validation check in the UI
