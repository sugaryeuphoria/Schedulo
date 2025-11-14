/**
 * Clean Swap Requests Database
 * 
 * This script deletes all swap requests and provides a clean slate.
 * 
 * PROPER DATA MANAGEMENT PLAN:
 * =============================
 * 1. Swap Requests MUST use short employee IDs (matching shifts)
 *    - Extract from user name: "John Smith" → "john"
 *    - Store consistently across all swap request fields
 * 
 * 2. When creating swap requests:
 *    - Always use short employee IDs (fromEmployeeId, toEmployeeId)
 *    - Validate that both employees have shifts on the requested date
 *    - Store employee names for display purposes
 * 
 * 3. Validation checks:
 *    - Employee must exist in shifts collection
 *    - Employee must have a shift on the swap date
 *    - Both from and to employees must be valid
 * 
 * 4. Data consistency:
 *    - Run the diagnostic "Test Swaps" after creating new swaps
 *    - All employee IDs must match between shifts and swaps
 */

import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SwapRequest {
  id: string;
  fromEmployeeId: string;
  fromEmployeeName: string;
  toEmployeeId: string;
  toEmployeeName: string;
  shiftId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

/**
 * Get all swap requests
 */
async function getAllSwapRequests(): Promise<SwapRequest[]> {
  const swapsSnapshot = await getDocs(collection(db, 'swapRequests'));
  return swapsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as SwapRequest));
}

/**
 * Delete a single swap request
 */
async function deleteSwapRequest(swapId: string): Promise<{ success: boolean; message: string }> {
  try {
    await deleteDoc(doc(db, 'swapRequests', swapId));
    return {
      success: true,
      message: `✅ Deleted swap request: ${swapId}`
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Error deleting swap ${swapId}: ${error}`
    };
  }
}

/**
 * Delete all swap requests
 */
export async function deleteAllSwapRequests(): Promise<void> {
  console.log('🗑️  Deleting all swap requests for clean slate...\n');

  try {
    // Get all swap requests
    console.log('Step 1: Getting all swap requests...');
    const swapRequests = await getAllSwapRequests();
    console.log(`✅ Found ${swapRequests.length} swap requests to delete\n`);

    if (swapRequests.length === 0) {
      console.log('ℹ️  No swap requests to delete. Database is already clean.');
      return;
    }

    // Display what will be deleted
    console.log('Swap requests to be deleted:');
    swapRequests.forEach((swap, idx) => {
      console.log(`${idx + 1}. ${swap.fromEmployeeName} → ${swap.toEmployeeName} (${swap.status})`);
    });
    console.log('');

    // Delete each swap request
    console.log('Step 2: Deleting all swap requests...\n');
    let deletedCount = 0;
    let errorCount = 0;

    for (const swap of swapRequests) {
      const result = await deleteSwapRequest(swap.id);
      console.log(result.message);

      if (result.success) {
        deletedCount++;
      } else {
        errorCount++;
      }
    }

    console.log('\n========== DELETION SUMMARY ==========');
    console.log(`✅ Deleted: ${deletedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total: ${swapRequests.length}`);

    console.log('\n✅ Clean slate complete!');
    console.log('\n📋 NEXT STEPS - Data Management Guidelines:');
    console.log('═══════════════════════════════════════════');
    console.log('\n1. EMPLOYEE ID FORMAT:');
    console.log('   Use short IDs consistently: "john", "emma", "rachel" (lowercase)');
    console.log('   Extract from user name: "John Smith" → "john"');
    console.log('   Apply to ALL swap request fields: fromEmployeeId, toEmployeeId');

    console.log('\n2. WHEN CREATING SWAP REQUESTS:');
    console.log('   - Use short employee IDs (not Firebase document IDs)');
    console.log('   - Validate employee exists in shifts collection');
    console.log('   - Check employee has shift on the swap date');
    console.log('   - Verify both employees are valid before saving');

    console.log('\n3. DATA VALIDATION:');
    console.log('   - Run "Test Swaps" in Diagnostic page after creating swaps');
    console.log('   - All employee IDs must match between shifts and swaps');
    console.log('   - No mismatches should appear in test results');

    console.log('\n4. VERIFICATION:');
    console.log('   - Use Diagnostic page → "Inspect Data" to view all swaps');
    console.log('   - Use Diagnostic page → "Test Swaps" to validate employee IDs');
    console.log('   - Fix any issues immediately if mismatches are found');

    console.log('\n✨ Database is ready for properly formatted swap requests!\n');
  } catch (error) {
    console.error('❌ Error during deletion:', error);
  }
}

// Run if this is the main module
if (typeof window === 'undefined') {
  deleteAllSwapRequests();
}

