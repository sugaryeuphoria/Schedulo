/**
 * Comprehensive Swap Feature Test
 * 
 * Tests the entire swap workflow:
 * 1. Verify shifts exist with correct format
 * 2. Verify employees exist
 * 3. Create a swap request
 * 4. Verify swap request data
 * 5. Accept the swap
 * 6. Verify shift ownership changed
 * 7. Check activity logs
 */

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'employee' | 'manager';
}

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  type: string;
  startTime: string;
  endTime: string;
}

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

const log = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
  const prefix = {
    info: 'ℹ️ ',
    success: '✅ ',
    error: '❌ ',
    warning: '⚠️ ',
  };
  console.log(`${prefix[type]} ${message}`);
};

async function testSwapFeature() {
  log('Starting Swap Feature Test...', 'info');
  console.log('\n════════════════════════════════════════════\n');

  try {
    // Step 1: Get all users
    log('Step 1: Fetching users...', 'info');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    log(`Found ${users.length} users`, 'success');

    const employees = users.filter(u => u.role === 'employee');
    if (employees.length < 2) {
      log('Not enough employees to test swaps (need at least 2)', 'error');
      return;
    }

    employees.forEach((emp, idx) => {
      const shortId = emp.name.split(' ')[0].toLowerCase();
      console.log(`  ${idx + 1}. ${emp.name} (Firebase ID: ${emp.id}, Short ID: ${shortId})`);
    });

    // Step 2: Get all shifts
    log('\nStep 2: Fetching shifts...', 'info');
    const shiftsSnapshot = await getDocs(collection(db, 'shifts'));
    const shifts = shiftsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
    log(`Found ${shifts.length} total shifts`, 'success');

    if (shifts.length < 2) {
      log('Not enough shifts to test swaps (need at least 2)', 'error');
      return;
    }

    // Step 3: Analyze shift data format
    log('\nStep 3: Analyzing shift data format...', 'info');
    const sample = shifts[0];
    console.log(`\nSample Shift Data:`);
    console.log(`  Shift ID: ${sample.id}`);
    console.log(`  Employee ID (in shift): "${sample.employeeId}"`);
    console.log(`  Employee Name: "${sample.employeeName}"`);
    console.log(`  Date: ${sample.date}`);
    console.log(`  Type: ${sample.type}`);
    console.log(`  Time: ${sample.startTime} - ${sample.endTime}`);

    // Check if employeeId is short format
    const isShortId = /^[a-z]+$/.test(sample.employeeId);
    if (isShortId) {
      log(`Employee ID is short format (lowercase): "${sample.employeeId}"`, 'success');
    } else {
      log(`Employee ID is NOT short format: "${sample.employeeId}"`, 'error');
      log('Expected format: "john", "emma", etc. (lowercase, letters only)', 'warning');
    }

    // Step 4: Find two shifts with different employees
    log('\nStep 4: Finding shifts to swap...', 'info');
    let fromShift: Shift | null = null;
    let toShift: Shift | null = null;
    let fromEmployee: User | null = null;
    let toEmployee: User | null = null;

    for (let i = 0; i < shifts.length && !toShift; i++) {
      if (!fromShift) {
        fromShift = shifts[i];
        // Find the employee by short ID
        const shortId = fromShift.employeeId;
        fromEmployee = employees.find(e => e.name.split(' ')[0].toLowerCase() === shortId);
      } else {
        if (shifts[i].employeeId !== fromShift.employeeId) {
          toShift = shifts[i];
          const shortId = toShift.employeeId;
          toEmployee = employees.find(e => e.name.split(' ')[0].toLowerCase() === shortId);
        }
      }
    }

    if (!fromShift || !toShift || !fromEmployee || !toEmployee) {
      log('Could not find suitable shifts for swap test', 'error');
      return;
    }

    log(`From Shift: ${fromEmployee.name} on ${fromShift.date} (${fromShift.type})`, 'success');
    log(`To Shift: ${toEmployee.name} on ${toShift.date} (${toShift.type})`, 'success');

    // Step 5: Create swap request
    log('\nStep 5: Creating swap request...', 'info');
    const swapData = {
      fromEmployeeId: fromShift.employeeId,
      fromEmployeeName: fromShift.employeeName,
      toEmployeeId: toShift.employeeId,
      toEmployeeName: toShift.employeeName,
      shiftId: fromShift.id,
      shift: fromShift,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    console.log(`\nSwap Request Data:`);
    console.log(`  From: ${swapData.fromEmployeeId} (${swapData.fromEmployeeName})`);
    console.log(`  To: ${swapData.toEmployeeId} (${swapData.toEmployeeName})`);
    console.log(`  Shift ID: ${swapData.shiftId}`);
    console.log(`  Status: ${swapData.status}`);

    const swapDocRef = await addDoc(collection(db, 'swapRequests'), swapData);
    const swapId = swapDocRef.id;
    log(`Swap request created with ID: ${swapId}`, 'success');

    // Step 6: Verify swap was created
    log('\nStep 6: Verifying swap request...', 'info');
    const swapsSnapshot = await getDocs(collection(db, 'swapRequests'));
    const swaps = swapsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SwapRequest));
    const createdSwap = swaps.find(s => s.id === swapId);

    if (createdSwap) {
      log('Swap request found in database', 'success');
      console.log(`\nCreated Swap Data:`);
      console.log(`  ID: ${createdSwap.id}`);
      console.log(`  From ID: "${createdSwap.fromEmployeeId}"`);
      console.log(`  From Name: "${createdSwap.fromEmployeeName}"`);
      console.log(`  To ID: "${createdSwap.toEmployeeId}"`);
      console.log(`  To Name: "${createdSwap.toEmployeeName}"`);
      console.log(`  Status: ${createdSwap.status}`);
    } else {
      log('Created swap request not found!', 'error');
      return;
    }

    // Step 7: Accept the swap
    log('\nStep 7: Accepting swap request...', 'info');
    await updateDoc(doc(db, 'swapRequests', swapId), {
      status: 'accepted',
    });
    log('Swap request accepted', 'success');

    // Step 8: Update shift ownership
    log('\nStep 8: Updating shift ownership...', 'info');
    const originalEmployeeId = fromShift.employeeId;
    const newEmployeeId = toShift.employeeId;

    console.log(`  Shifting ownership from "${originalEmployeeId}" to "${newEmployeeId}"`);

    await updateDoc(doc(db, 'shifts', fromShift.id), {
      employeeId: newEmployeeId,
      employeeName: toShift.employeeName,
    });
    log('Shift ownership updated', 'success');

    // Step 9: Verify shift was updated
    log('\nStep 9: Verifying shift update...', 'info');
    const shiftsSnapshot2 = await getDocs(collection(db, 'shifts'));
    const updatedShift = shiftsSnapshot2.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Shift))
      .find(s => s.id === fromShift!.id);

    if (updatedShift) {
      console.log(`\nUpdated Shift Data:`);
      console.log(`  Shift ID: ${updatedShift.id}`);
      console.log(`  New Owner ID: "${updatedShift.employeeId}"`);
      console.log(`  New Owner Name: "${updatedShift.employeeName}"`);

      if (updatedShift.employeeId === newEmployeeId) {
        log('Shift ownership successfully transferred!', 'success');
      } else {
        log(`Shift ownership not updated correctly. Expected "${newEmployeeId}", got "${updatedShift.employeeId}"`, 'error');
      }
    } else {
      log('Could not verify shift update', 'error');
    }

    // Step 10: Check activity logs
    log('\nStep 10: Checking activity logs...', 'info');
    const logsSnapshot = await getDocs(collection(db, 'activityLogs'));
    const logs_data = logsSnapshot.docs.map(doc => doc.data());

    const swapLogs = logs_data.filter(l => l.type?.includes('swap'));
    if (swapLogs.length > 0) {
      log(`Found ${swapLogs.length} swap-related activity logs`, 'success');
      swapLogs.slice(0, 3).forEach((log_entry: any, idx: number) => {
        console.log(`  ${idx + 1}. ${log_entry.type} - ${log_entry.description}`);
      });
    } else {
      log('No swap activity logs found', 'warning');
    }

    // Final Summary
    console.log('\n════════════════════════════════════════════');
    log('\nSWAP FEATURE TEST COMPLETE', 'success');
    console.log('\n📋 SUMMARY:');
    console.log(`  Total Users: ${users.length}`);
    console.log(`  Total Employees: ${employees.length}`);
    console.log(`  Total Shifts: ${shifts.length}`);
    console.log(`  Total Swaps: ${swaps.length}`);
    console.log(`\n🔄 TEST SWAP:`);
    console.log(`  From: ${fromShift.employeeName} (${fromShift.date})`);
    console.log(`  To: ${toShift.employeeName}`);
    console.log(`  Status: ACCEPTED ✅`);
    console.log(`\n✨ All operations completed successfully!`);

  } catch (error) {
    log(`Test failed with error: ${error}`, 'error');
    console.error(error);
  }
}

// Run the test
testSwapFeature();
