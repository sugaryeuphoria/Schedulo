import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader, Eye, RefreshCw, Bug, Wrench, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUsers, getShifts, getSwapRequests, getActivityLogs, deleteShift, addShift, updateSwapRequest, generateAvailabilityData, getAvailability } from '@/lib/firebaseService';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateBalancedShifts, summarizeShiftDistribution } from '@/lib/shiftGenerator';

const Diagnostic = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'inspect' | 'test' | 'clean' | 'swap-test' | 'availability' | 'shifts-by-employee'>('generate');

  const captureConsoleOutput = () => {
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      logs.push(args.map(arg => {
        if (typeof arg === 'object') return JSON.stringify(arg, null, 2);
        return String(arg);
      }).join(' '));
      originalLog(...args);
    };

    console.error = (...args) => {
      logs.push(`❌ ${args.join(' ')}`);
      originalError(...args);
    };

    console.warn = (...args) => {
      logs.push(`⚠️  ${args.join(' ')}`);
      originalWarn(...args);
    };

    return { logs, restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }};
  };

  const handleGenerateAndSeed = async () => {
    setIsGenerating(true);
    setConsoleOutput([]);

    const { logs, restore } = captureConsoleOutput();

    try {
      logs.push('🚀 Starting shift schedule generation and seeding...\n');

      // Step 1: Delete all existing shifts
      logs.push('📋 Step 1: Deleting existing shifts from Firestore...');
      const existingShifts = await getShifts();
      logs.push(`   Found ${existingShifts.length} existing shifts`);

      let deletedCount = 0;
      for (const shift of existingShifts) {
        try {
          await deleteShift(shift.id);
          deletedCount++;
        } catch (error) {
          logs.push(`   ⚠️  Failed to delete shift ${shift.id}: ${error}`);
        }
      }
      logs.push(`   ✅ Deleted ${deletedCount}/${existingShifts.length} shifts\n`);

      // Step 2: Generate new shifts with proper distribution
      logs.push('🔄 Step 2: Generating new balanced shift schedule...');
      const startDate = '2024-11-15';
      const endDate = '2024-11-30';
      const generatedShifts = generateBalancedShifts(startDate, endDate);
      logs.push(`   ✅ Generated ${generatedShifts.length} shifts\n`);

      // Add summary
      const summary = summarizeShiftDistribution(generatedShifts);
      logs.push(summary);

      // Step 3: Seed new shifts to Firestore
      logs.push('\n💾 Step 3: Seeding generated shifts to Firestore...');
      let seedCount = 0;
      for (const shift of generatedShifts) {
        try {
          await addShift({
            employeeId: shift.employeeId,
            employeeName: shift.employeeName,
            date: shift.date,
            type: shift.type,
            startTime: shift.startTime,
            endTime: shift.endTime,
          });
          seedCount++;
        } catch (error) {
          logs.push(`   ⚠️  Failed to add shift: ${error}`);
        }
      }
      logs.push(`   ✅ Successfully seeded ${seedCount}/${generatedShifts.length} shifts\n`);

      logs.push('✅ Shift schedule generation and seeding completed successfully!');
      logs.push('\n📌 Next steps:');
      logs.push('  1. Go to Login page (/auth)');
      logs.push('  2. Login with manager account (manager@schedulo.com / admin123)');
      logs.push('  3. View the Store Calendar tab to see the new shifts');

      setConsoleOutput(logs);
    } catch (error) {
      logs.push(`\n❌ Fatal error: ${error}`);
      setConsoleOutput(logs);
    } finally {
      restore();
      setIsGenerating(false);
    }
  };

  const handleInspectData = async () => {
    setIsInspecting(true);
    setConsoleOutput([]);

    const logs: string[] = [];
    logs.push('🔍 Inspecting Firebase Data...\n');

    try {
      const [users, shifts, swaps, logs_data] = await Promise.all([
        getUsers(),
        getShifts(),
        getSwapRequests(),
        getActivityLogs(),
      ]);

      logs.push(`========== USERS (${users.length} documents) ==========\n`);
      users.forEach((user, idx) => {
        logs.push(`${idx + 1}. ID: ${user.id} | Name: ${user.name} | Role: ${user.role}`);
      });

      logs.push(`\n========== SHIFTS (${shifts.length} documents) ==========\n`);
      logs.push('Sample of first 20 shifts:\n');
      shifts.slice(0, 20).forEach((shift, idx) => {
        logs.push(`${idx + 1}. ${shift.date} | ${shift.employeeName} | ${shift.type} (${shift.startTime}-${shift.endTime})`);
      });

      logs.push(`\nTotal shifts: ${shifts.length}`);
      logs.push(`\nShifts grouped by date:`);
      const shiftsByDate: Record<string, number> = {};
      shifts.forEach(s => {
        shiftsByDate[s.date] = (shiftsByDate[s.date] || 0) + 1;
      });
      Object.entries(shiftsByDate).forEach(([date, count]) => {
        logs.push(`  ${date}: ${count} shifts`);
      });

      logs.push(`\nShifts grouped by employeeId:`);
      const shiftsByEmployee: Record<string, number> = {};
      shifts.forEach(s => {
        shiftsByEmployee[s.employeeId] = (shiftsByEmployee[s.employeeId] || 0) + 1;
      });
      Object.entries(shiftsByEmployee).forEach(([empId, count]) => {
        logs.push(`  ${empId}: ${count} shifts`);
      });

      logs.push(`\n========== SWAP REQUESTS (${swaps.length} documents) ==========`);
      logs.push(`========== ACTIVITY LOGS (${logs_data.length} documents) ==========`);

      logs.push('\n✅ Data inspection complete!');
      setConsoleOutput(logs);
    } catch (error) {
      logs.push(`❌ Error inspecting data: ${error}`);
      setConsoleOutput(logs);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleTestSwapRequests = async () => {
    setIsTesting(true);
    setConsoleOutput([]);

    const logs: string[] = [];
    logs.push('🔍 Testing Swap Request Data Structure...\n');

    try {
      const [users, shifts, swaps] = await Promise.all([
        getUsers(),
        getShifts(),
        getSwapRequests(),
      ]);

      logs.push(`========== USER DATA ==========\n`);
      logs.push(`Total Users: ${users.length}\n`);
      users.forEach((user, idx) => {
        logs.push(`${idx + 1}. ${user.name}`);
        logs.push(`   ID (from Firebase): ${user.id}`);
        logs.push(`   Short ID (extracted): ${user.name.split(' ')[0].toLowerCase()}`);
        logs.push(`   Role: ${user.role}`);
        logs.push('');
      });

      logs.push(`\n========== SHIFTS DATA SAMPLE ==========\n`);
      logs.push(`Total Shifts: ${shifts.length}\n`);
      logs.push('First 5 shifts structure:\n');
      shifts.slice(0, 5).forEach((shift, idx) => {
        logs.push(`${idx + 1}. Shift ID: ${shift.id}`);
        logs.push(`   employeeId (stored): "${shift.employeeId}"`);
        logs.push(`   employeeName: ${shift.employeeName}`);
        logs.push(`   date: ${shift.date}`);
        logs.push('');
      });

      logs.push(`\n========== SWAP REQUESTS DATA ==========\n`);
      logs.push(`Total Swap Requests: ${swaps.length}\n`);
      if (swaps.length === 0) {
        logs.push('⚠️  No swap requests found in database');
      } else {
        logs.push('All swap requests structure:\n');
        swaps.forEach((swap, idx) => {
          logs.push(`${idx + 1}. Swap Request ID: ${swap.id}`);
          logs.push(`   fromEmployeeId (stored): "${swap.fromEmployeeId}"`);
          logs.push(`   fromEmployeeName: ${swap.fromEmployeeName}`);
          logs.push(`   toEmployeeId (stored): "${swap.toEmployeeId}"`);
          logs.push(`   toEmployeeName: ${swap.toEmployeeName}`);
          logs.push(`   shiftId: ${swap.shiftId}`);
          logs.push(`   status: ${swap.status}`);
          logs.push(`   shift.employeeId: ${swap.shift?.employeeId || 'N/A'}`);
          logs.push('');
        });
      }

      logs.push(`\n========== ANALYSIS ==========\n`);
      
      // Check if employeeIds are consistent
      const shiftEmployeeIds = new Set(shifts.map(s => s.employeeId));
      logs.push(`Unique employeeIds in Shifts: ${Array.from(shiftEmployeeIds).join(', ')}`);
      logs.push('');

      if (swaps.length > 0) {
        const swapFromIds = new Set(swaps.map(s => s.fromEmployeeId));
        const swapToIds = new Set(swaps.map(s => s.toEmployeeId));
        logs.push(`Unique fromEmployeeIds in Swaps: ${Array.from(swapFromIds).join(', ')}`);
        logs.push(`Unique toEmployeeIds in Swaps: ${Array.from(swapToIds).join(', ')}`);
        logs.push('');

        // Check for mismatches
        const mismatchedFrom = Array.from(swapFromIds).filter(id => !shiftEmployeeIds.has(id));
        const mismatchedTo = Array.from(swapToIds).filter(id => !shiftEmployeeIds.has(id));

        if (mismatchedFrom.length > 0) {
          logs.push(`⚠️  MISMATCH: fromEmployeeIds not in Shifts: ${mismatchedFrom.join(', ')}`);
        }
        if (mismatchedTo.length > 0) {
          logs.push(`⚠️  MISMATCH: toEmployeeIds not in Shifts: ${mismatchedTo.join(', ')}`);
        }
        if (mismatchedFrom.length === 0 && mismatchedTo.length === 0) {
          logs.push(`✅ All employee IDs in swap requests match shift employee IDs`);
        }
      }

      logs.push('\n✅ Swap request diagnostics complete!');
      setConsoleOutput(logs);
    } catch (error) {
      logs.push(`❌ Error testing swap requests: ${error}`);
      setConsoleOutput(logs);
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearLogs = () => {
    setConsoleOutput([]);
  };

  const handleGenerateAvailability = async () => {
    setIsFixing(true);
    setConsoleOutput([]);

    const logs: string[] = [];
    logs.push('🎲 Generating random availability data for all employees...\n');

    try {
      const [shifts, users] = await Promise.all([getShifts(), getUsers()]);
      
      logs.push(`📊 Step 1: Data Load Complete`);
      logs.push(`  Total Shifts: ${shifts.length}`);
      logs.push(`  Total Users: ${users.length}`);
      logs.push(`  Employees: ${users.filter(u => u.role === 'employee').length}\n`);

      logs.push('🗑️  Step 2: Deleting existing availability records...');
      try {
        const existingAvailability = await getAvailability();
        logs.push(`  Found ${existingAvailability.length} existing employee records`);
        logs.push(`  (Each employee has a list of daily availability)\n`);
      } catch (e) {
        logs.push(`  No existing records or error checking: ${e}\n`);
      }

      logs.push('🎲 Step 3: Generating random availability (0, 8, 16, 24 hours) for Nov 14-30...');
      const availabilityRecords = await generateAvailabilityData(shifts, users);
      logs.push(`✅ Generated ${availabilityRecords.length} employee records\n`);

      logs.push('Step 4: Verifying data in Firebase...');
      const savedData = await getAvailability();
      logs.push(`✅ Verified ${savedData.length} employee records saved in Firestore\n`);

      if (savedData.length === 0) {
        logs.push('⚠️  WARNING: No data found in Firestore after save!');
        logs.push('This may indicate a Firebase permission issue.\n');
      }

      logs.push('========== AVAILABILITY DATA BY EMPLOYEE ==========\n');
      
      const hoursMap = { 0: '❌ Fully Booked', 8: '⚠️  Limited', 16: '✓ Moderate', 24: '✅ Fully Available' };
      
      (savedData.length > 0 ? savedData : availabilityRecords).forEach((record: any) => {
        logs.push(`\n👤 ${record.employeeName}:`);
        logs.push(`   Total Days: ${record.availabilityList.length}`);
        
        // Count distribution
        const dist = { 0: 0, 8: 0, 16: 0, 24: 0 };
        let totalHours = 0;
        
        record.availabilityList.forEach((day: any) => {
          dist[day.availableHours as keyof typeof dist]++;
          totalHours += day.availableHours;
        });
        
        logs.push(`   0h (Fully Booked): ${dist[0]} days`);
        logs.push(`   8h (Limited): ${dist[8]} days`);
        logs.push(`   16h (Moderate): ${dist[16]} days`);
        logs.push(`   24h (Fully Available): ${dist[24]} days`);
        logs.push(`   Total Available Hours: ${totalHours} / ${record.availabilityList.length * 24}`);
        logs.push(`   Average Hours/Day: ${(totalHours / record.availabilityList.length).toFixed(1)}`);
        logs.push(`   Last Updated: ${new Date(record.lastUpdated).toLocaleString()}`);
      });

      // Summary statistics across all employees
      const dataToUse = savedData.length > 0 ? savedData : availabilityRecords;
      let totalRecords = 0;
      let totalAvailableHours = 0;
      const dayDistribution = { 0: 0, 8: 0, 16: 0, 24: 0 };

      dataToUse.forEach((emp: any) => {
        totalRecords += emp.availabilityList.length;
        emp.availabilityList.forEach((day: any) => {
          totalAvailableHours += day.availableHours;
          dayDistribution[day.availableHours as keyof typeof dayDistribution]++;
        });
      });

      logs.push('\n\n========== SUMMARY STATISTICS ==========\n');
      logs.push(`Total Employees: ${dataToUse.length}`);
      logs.push(`Total Days Tracked: 17 (Nov 14-30, 2024)`);
      logs.push(`Total Daily Records: ${totalRecords}`);
      logs.push(`Total Available Hours: ${totalAvailableHours} / ${totalRecords * 24}`);
      logs.push(`\nAvailability Distribution (across all days):`);
      logs.push(`  0h (Fully Booked): ${dayDistribution[0]} days`);
      logs.push(`  8h (Limited): ${dayDistribution[8]} days`);
      logs.push(`  16h (Moderate): ${dayDistribution[16]} days`);
      logs.push(`  24h (Fully Available): ${dayDistribution[24]} days`);
      logs.push(`\nAverage Hours/Day (across all records): ${(totalAvailableHours / totalRecords).toFixed(1)}\n`);

      logs.push('✅ Availability data saved to Firebase!');
      logs.push('📍 Structure: Each employee has one document with a list of daily availability');
      logs.push('\n✨ Go to Manager Dashboard → Heat Map tab to see the calendar view!');

      setConsoleOutput(logs);
    } catch (error: any) {
      logs.push(`❌ Error generating availability: ${error.message}`);
      logs.push(`Stack: ${error.stack}`);
      setConsoleOutput(logs);
      console.error('Detailed error:', error);
    } finally {
      setIsFixing(false);
    }
  };

  const handleDeleteAllSwaps = async () => {
    setIsFixing(true);
    setConsoleOutput([]);

    const logs: string[] = [];
    logs.push('🗑️  Deleting all swap requests for clean slate...\n');

    try {
      // Get all swap requests
      const swaps = await getSwapRequests();
      logs.push(`Step 1: Found ${swaps.length} swap requests to delete\n`);

      if (swaps.length === 0) {
        logs.push('ℹ️  No swap requests to delete. Database is already clean.');
        setConsoleOutput(logs);
        setIsFixing(false);
        return;
      }

      // Display what will be deleted
      logs.push('Swap requests to be deleted:');
      swaps.forEach((swap, idx) => {
        logs.push(`${idx + 1}. ${swap.fromEmployeeName} → ${swap.toEmployeeName} (${swap.status})`);
      });
      logs.push('');

      // Delete each swap request
      logs.push('Step 2: Deleting all swap requests...\n');
      let deletedCount = 0;
      let errorCount = 0;

      for (const swap of swaps) {
        try {
          await deleteDoc(doc(db, 'swapRequests', swap.id));
          logs.push(`✅ Deleted: ${swap.fromEmployeeName} → ${swap.toEmployeeName}`);
          deletedCount++;
        } catch (error) {
          logs.push(`❌ Error deleting swap ${swap.id}: ${error}`);
          errorCount++;
        }
      }

      logs.push('\n========== DELETION SUMMARY ==========');
      logs.push(`✅ Deleted: ${deletedCount}`);
      logs.push(`❌ Errors: ${errorCount}`);
      logs.push(`📊 Total: ${swaps.length}`);

      logs.push('\n✅ Clean slate complete!');
      logs.push('\n📋 NEXT STEPS - Data Management Guidelines:');
      logs.push('═══════════════════════════════════════════');
      logs.push('\n1. EMPLOYEE ID FORMAT:');
      logs.push('   Use short IDs consistently: "john", "emma", "rachel" (lowercase)');
      logs.push('   Extract from user name: "John Smith" → "john"');
      logs.push('   Apply to ALL swap request fields: fromEmployeeId, toEmployeeId');

      logs.push('\n2. WHEN CREATING SWAP REQUESTS:');
      logs.push('   - Use short employee IDs (not Firebase document IDs)');
      logs.push('   - Validate employee exists in shifts collection');
      logs.push('   - Check employee has shift on the swap date');
      logs.push('   - Verify both employees are valid before saving');

      logs.push('\n3. DATA VALIDATION:');
      logs.push('   - Run "Test Swaps" in Diagnostic page after creating swaps');
      logs.push('   - All employee IDs must match between shifts and swaps');
      logs.push('   - No mismatches should appear in test results');

      logs.push('\n4. VERIFICATION:');
      logs.push('   - Use Diagnostic page → "Inspect Data" to view all swaps');
      logs.push('   - Use Diagnostic page → "Test Swaps" to validate employee IDs');
      logs.push('   - Fix any issues immediately if mismatches are found');

      logs.push('\n✨ Database is ready for properly formatted swap requests!\n');

      setConsoleOutput(logs);
    } catch (error) {
      logs.push(`❌ Error during deletion: ${error}`);
      setConsoleOutput(logs);
    } finally {
      setIsFixing(false);
    }
  };

  const handleTestSwapFeature = async () => {
    setTesting(true);
    setConsoleOutput([]);

    const logs: string[] = [];
    logs.push('🔄 Running Comprehensive Swap Feature Test...\n');

    try {
      const [users, shifts, swapsData] = await Promise.all([
        getUsers(),
        getShifts(),
        getSwapRequests(),
      ]);

      const employees = users.filter(u => u.role === 'employee');

      logs.push(`Step 1: User & Shift Analysis`);
      logs.push(`  Total Users: ${users.length}`);
      logs.push(`  Total Employees: ${employees.length}`);
      logs.push(`  Total Shifts: ${shifts.length}`);
      logs.push(`  Total Swaps: ${swapsData.length}\n`);

      if (employees.length < 2) {
        logs.push('❌ Not enough employees to test swaps (need at least 2)');
        setConsoleOutput(logs);
        setTesting(false);
        return;
      }

      if (shifts.length < 2) {
        logs.push('❌ Not enough shifts to test swaps (need at least 2)');
        setConsoleOutput(logs);
        setTesting(false);
        return;
      }

      // Analyze first shift format
      const firstShift = shifts[0];
      logs.push(`Step 2: Shift Data Format Check`);
      logs.push(`  Sample Shift ID: ${firstShift.id}`);
      logs.push(`  Employee ID: "${firstShift.employeeId}"`);
      logs.push(`  Employee Name: "${firstShift.employeeName}"`);
      logs.push(`  Date: ${firstShift.date}`);
      logs.push(`  Type: ${firstShift.type}`);

      const isShortId = /^[a-z]+$/.test(firstShift.employeeId);
      logs.push(`  ID Format: ${isShortId ? '✅ Short ID (correct)' : '❌ NOT short ID (incorrect)'}\n`);

      if (!isShortId) {
        logs.push(`⚠️  WARNING: Shift uses Firebase ID format instead of short ID`);
        logs.push(`  Expected: "john", "emma", etc.`);
        logs.push(`  Got: "${firstShift.employeeId}"\n`);
      }

      // Find swaps and check their format
      logs.push(`Step 3: Swap Request Format Check`);
      if (swapsData.length > 0) {
        swapsData.slice(0, 3).forEach((swap, idx) => {
          logs.push(`\n  Swap ${idx + 1}:`);
          logs.push(`    From ID: "${swap.fromEmployeeId}" (${swap.fromEmployeeName})`);
          logs.push(`    To ID: "${swap.toEmployeeId}" (${swap.toEmployeeName})`);
          logs.push(`    Status: ${swap.status}`);

          const fromIsShort = /^[a-z]+$/.test(swap.fromEmployeeId);
          const toIsShort = /^[a-z]+$/.test(swap.toEmployeeId);

          if (!fromIsShort || !toIsShort) {
            logs.push(`    ⚠️  Format Issue: Using Firebase IDs instead of short IDs`);
          } else {
            logs.push(`    ✅ Using correct short ID format`);
          }
        });
        logs.push('');
      } else {
        logs.push('  ℹ️  No swap requests in database\n');
      }

      // Verify consistency
      logs.push(`Step 4: Data Consistency Check`);
      const shiftEmployeeIds = new Set(shifts.map(s => s.employeeId));
      logs.push(`  Unique employee IDs in shifts: ${Array.from(shiftEmployeeIds).sort().join(', ')}`);

      if (swapsData.length > 0) {
        const swapFromIds = new Set(swapsData.map(s => s.fromEmployeeId));
        const swapToIds = new Set(swapsData.map(s => s.toEmployeeId));
        const allSwapIds = new Set([...swapFromIds, ...swapToIds]);

        logs.push(`  Unique employee IDs in swaps: ${Array.from(allSwapIds).sort().join(', ')}`);

        const mismatches = Array.from(allSwapIds).filter(id => !shiftEmployeeIds.has(id));
        if (mismatches.length > 0) {
          logs.push(`\n  ❌ MISMATCHES FOUND: ${mismatches.join(', ')}`);
          logs.push(`  These swap IDs are not in shifts!`);
        } else {
          logs.push(`\n  ✅ All swap employee IDs match shift employee IDs`);
        }
      }

      logs.push('\n════════════════════════════════════════════');
      logs.push('✅ Swap Feature Test Complete');
      logs.push('\n💡 Next Steps:');
      logs.push('  1. Review the output above');
      logs.push('  2. If using Firebase IDs: Use "Clean Swaps" to delete bad data');
      logs.push('  3. If all short IDs: Feature should work properly');
      logs.push('  4. Test swap creation in Employee Dashboard');

      setConsoleOutput(logs);
    } catch (error) {
      logs.push(`❌ Test failed: ${error}`);
      setConsoleOutput(logs);
    } finally {
      setTesting(false);
    }
  };

  const handleCheckShiftsByEmployee = async () => {
    setIsInspecting(true);
    setConsoleOutput([]);

    const { logs, restore } = captureConsoleOutput();

    try {
      logs.push('📊 Analyzing Shifts by Employee...\n');

      const [shifts, users] = await Promise.all([getShifts(), getUsers()]);

      logs.push(`Step 1: Data Load`);
      logs.push(`  Total Shifts: ${shifts.length}`);
      logs.push(`  Total Users: ${users.length}`);
      logs.push(`  Total Employees: ${users.filter(u => u.role === 'employee').length}\n`);

      const employees = users.filter(u => u.role === 'employee');

      if (shifts.length === 0) {
        logs.push('⚠️  WARNING: No shifts found in database!');
        logs.push('Run "Generate & Seed" tab first to create shifts.\n');
        setConsoleOutput(logs);
        restore();
        return;
      }

      logs.push('========== SHIFTS BY EMPLOYEE ==========\n');

      // Build mapping from short name to employee
      const employeeByShortName = new Map<string, any>();
      employees.forEach(emp => {
        const shortName = emp.name.split(' ')[0].toLowerCase();
        employeeByShortName.set(shortName, emp);
      });

      // Group shifts by employee using SHORT IDs
      const shiftsGroupedByEmployee = new Map<string, any[]>();
      shifts.forEach(shift => {
        if (!shiftsGroupedByEmployee.has(shift.employeeId)) {
          shiftsGroupedByEmployee.set(shift.employeeId, []);
        }
        shiftsGroupedByEmployee.get(shift.employeeId)!.push(shift);
      });

      // Sort by number of shifts (descending)
      const sortedEntries = Array.from(shiftsGroupedByEmployee.entries())
        .sort((a, b) => b[1].length - a[1].length);

      sortedEntries.forEach(([shortId, empShifts]) => {
        const employee = employeeByShortName.get(shortId);
        if (!employee) {
          logs.push(`⚠️  Unknown employee ID: "${shortId}"\n`);
          return;
        }

        const breakdown = {
          day: empShifts.filter((s: any) => s.type === 'day').length,
          afternoon: empShifts.filter((s: any) => s.type === 'afternoon').length,
          night: empShifts.filter((s: any) => s.type === 'night').length,
        };

        logs.push(`👤 ${employee.name}`);
        logs.push(`   Short ID: "${shortId}"`);
        logs.push(`   ✅ Total Shifts: ${empShifts.length}`);
        logs.push(`      📅 Day: ${breakdown.day}  |  🌆 Afternoon: ${breakdown.afternoon}  |  🌙 Night: ${breakdown.night}`);
        logs.push('');
      });

      // Find employees with no shifts
      const employeesWithShifts = new Set(shiftsGroupedByEmployee.keys());
      const noShiftEmployees = employees.filter(
        e => !employeesWithShifts.has(e.name.split(' ')[0].toLowerCase())
      );

      if (noShiftEmployees.length > 0) {
        logs.push(`\n⚠️  EMPLOYEES WITH NO SHIFTS: ${noShiftEmployees.length}`);
        noShiftEmployees.forEach(emp => {
          const shortId = emp.name.split(' ')[0].toLowerCase();
          logs.push(`   ❌ ${emp.name} (Short ID: "${shortId}")`);
        });
        logs.push('');
      }

      // Summary stats
      const totalShifts = shifts.length;
      const avgPerEmployee = (totalShifts / employees.length).toFixed(1);
      const distribution = {
        day: shifts.filter(s => s.type === 'day').length,
        afternoon: shifts.filter(s => s.type === 'afternoon').length,
        night: shifts.filter(s => s.type === 'night').length,
      };

      logs.push('========== SUMMARY STATISTICS ==========\n');
      logs.push(`Total Shifts: ${totalShifts}`);
      logs.push(`Total Employees: ${employees.length}`);
      logs.push(`Average Shifts/Employee: ${avgPerEmployee}`);
      logs.push(`\nShift Type Breakdown:`);
      logs.push(`  📅 Day Shifts: ${distribution.day}`);
      logs.push(`  🌆 Afternoon Shifts: ${distribution.afternoon}`);
      logs.push(`  🌙 Night Shifts: ${distribution.night}`);

      logs.push('\n========== DATA QUALITY CHECK ==========\n');
      let hasIssues = false;

      if (noShiftEmployees.length === 0) {
        logs.push('✅ All employees have shifts assigned');
      } else {
        logs.push(`⚠️  ${noShiftEmployees.length} employees missing shifts - needs regeneration`);
        hasIssues = true;
      }

      // Check for duplicates
      const dupes = new Map<string, any[]>();
      shifts.forEach(shift => {
        const key = `${shift.date}-${shift.type}-${shift.employeeId}`;
        if (!dupes.has(key)) dupes.set(key, []);
        dupes.get(key)!.push(shift);
      });

      const dupesFound = Array.from(dupes.values()).filter(arr => arr.length > 1);
      if (dupesFound.length > 0) {
        logs.push(`\n❌ Duplicate Shifts Found: ${dupesFound.length}`);
        dupesFound.forEach(dupe => {
          logs.push(`     ${dupe[0].employeeName} on ${dupe[0].date}: ${dupe.length} entries`);
        });
        hasIssues = true;
      } else {
        logs.push('✅ No duplicate shifts found');
      }

      if (!hasIssues && noShiftEmployees.length === 0) {
        logs.push('\n🎉 All checks passed! Chart should display correctly.');
      }

      logs.push('\n💡 Next: Go to Manager Dashboard → Analytics → "By Employee" tab');

      setConsoleOutput(logs);
      restore();
    } catch (error: any) {
      logs.push(`❌ Error: ${error.message}`);
      setConsoleOutput(logs);
      restore();
    } finally {
      setIsInspecting(false);
    }
  };

  const setTesting = setIsTesting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Database Diagnostics & Setup</h1>
            <p className="text-sm text-muted-foreground">Generate balanced shifts, manage data, or inspect Firestore</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/auth')}>
            Go to Login
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Tab Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeTab === 'generate' ? 'default' : 'outline'}
            onClick={() => setActiveTab('generate')}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Generate & Seed
          </Button>
          <Button
            variant={activeTab === 'inspect' ? 'default' : 'outline'}
            onClick={() => setActiveTab('inspect')}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Inspect Data
          </Button>
          <Button
            variant={activeTab === 'test' ? 'default' : 'outline'}
            onClick={() => setActiveTab('test')}
            className="gap-2"
          >
            <Bug className="w-4 h-4" />
            Test Swaps
          </Button>
          <Button
            variant={activeTab === 'swap-test' ? 'default' : 'outline'}
            onClick={() => setActiveTab('swap-test')}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Swap Feature Test
          </Button>
          <Button
            variant={activeTab === 'clean' ? 'default' : 'outline'}
            onClick={() => setActiveTab('clean')}
            className="gap-2"
          >
            <Wrench className="w-4 h-4" />
            Clean Swaps
          </Button>
          <Button
            variant={activeTab === 'availability' ? 'default' : 'outline'}
            onClick={() => setActiveTab('availability')}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Generate Availability
          </Button>
          <Button
            variant={activeTab === 'shifts-by-employee' ? 'default' : 'outline'}
            onClick={() => setActiveTab('shifts-by-employee')}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Shifts by Employee
          </Button>
        </div>

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-success/20">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Generate Balanced Shift Schedule</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate a fair, random shift schedule that meets all constraints and delete existing shifts.
                  </p>
                </div>

                {/* Constraints Info */}
                <div className="grid md:grid-cols-2 gap-4 py-4 px-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                  <div>
                    <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">Daily Constraints</h3>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <li>✓ 2 employees on day shift (08:00-16:00)</li>
                      <li>✓ 2 employees on afternoon shift (16:00-00:00)</li>
                      <li>✓ 1 employee on night shift (00:00-08:00)</li>
                      <li>✓ 3 employees off</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">Employee Rules</h3>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <li>✓ Maximum 1 shift per employee per day</li>
                      <li>✓ Random fair distribution</li>
                      <li>✓ 8 employees total</li>
                      <li>✓ Date range: Nov 15-30, 2024 (16 days)</li>
                    </ul>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleGenerateAndSeed}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Generating & Seeding...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate & Seed Shifts
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
              <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">⚠️  Warning</h4>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                This will DELETE all existing shifts from Firestore and replace them with newly generated shifts. This action cannot be undone.
              </p>
            </Card>
          </>
        )}

        {/* Inspect Tab */}
        {activeTab === 'inspect' && (
          <>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-info/20">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Inspect Current Firebase Data</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    View all users, shifts, swaps, and activity logs in your Firestore database.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleInspectData}
                  disabled={isInspecting}
                  className="w-full"
                >
                  {isInspecting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Reading Data...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Inspect All Data
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </>
        )}

        {/* Test Swaps Tab */}
        {activeTab === 'test' && (
          <>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-warning/20">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Test Swap Request Integrity</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Validate that all swap requests have matching employee IDs in shifts.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleTestSwapRequests}
                  disabled={isTesting}
                  className="w-full"
                >
                  {isTesting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Testing Swaps...
                    </>
                  ) : (
                    <>
                      <Bug className="w-4 h-4 mr-2" />
                      Run Swap Tests
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </>
        )}

        {/* Swap Feature Test Tab */}
        {activeTab === 'swap-test' && (
          <>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-blue/20">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Comprehensive Swap Feature Test</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Run a full end-to-end test of the swap feature to identify any data or logic issues.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleTestSwapFeature}
                  disabled={isTesting}
                  className="w-full"
                >
                  {isTesting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Testing Feature...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Run Full Swap Test
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
              <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">ℹ️  What This Tests</h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>✓ Shift data format (employee IDs)</li>
                <li>✓ Swap request data format</li>
                <li>✓ Data consistency between shifts and swaps</li>
                <li>✓ Identification of format mismatches</li>
                <li>✓ Summary of potential issues</li>
              </ul>
            </Card>
          </>
        )}

        {/* Clean Swaps Tab */}
        {activeTab === 'clean' && (
          <>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-destructive/20">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Delete All Swap Requests</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Remove all swap requests and start with a clean slate. This ensures consistency when implementing proper data management.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleDeleteAllSwaps}
                  disabled={isFixing}
                  className="w-full bg-destructive hover:bg-destructive/90"
                >
                  {isFixing ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Wrench className="w-4 h-4 mr-2" />
                      Delete All Swap Requests
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
              <h4 className="font-semibold text-sm text-red-900 dark:text-red-100 mb-2">⚠️  Warning</h4>
              <p className="text-xs text-red-800 dark:text-red-200 mb-3">
                This will DELETE ALL swap requests from Firestore. This action cannot be undone. Use this to establish a clean database with proper data management practices.
              </p>
              <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-2 mt-4">✅ After Deletion</h4>
              <p className="text-xs text-green-800 dark:text-green-200">
                You'll receive detailed guidelines on proper employee ID formats and best practices for creating new swap requests with consistent data.
              </p>
            </Card>
          </>
        )}

        {/* Generate Availability Tab */}
        {activeTab === 'availability' && (
          <>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-emerald-200 dark:border-emerald-900/50">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Generate Random Availability Data</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate simulated availability data for all employees. Each employee receives a random availability value (0, 8, 16, or 24 hours) to represent their submitted availability.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 py-4 px-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <div>
                    <h3 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100 mb-2">Availability Options</h3>
                    <ul className="text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                      <li>✓ 0 hours = Fully Booked</li>
                      <li>✓ 8 hours = Limited</li>
                      <li>✓ 16 hours = Moderate</li>
                      <li>✓ 24 hours = Fully Available</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100 mb-2">What Gets Generated</h3>
                    <ul className="text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                      <li>✓ Random values for 8 employees</li>
                      <li>✓ Simulates direct employee input</li>
                      <li>✓ Stores in Firestore</li>
                      <li>✓ Updates heat map instantly</li>
                    </ul>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleGenerateAvailability}
                  disabled={isFixing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isFixing ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Random Availability
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
              <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">ℹ️  What This Does</h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-2">
                <li>✓ Creates random availability for each of 8 employees</li>
                <li>✓ Values are randomly chosen from: 0, 8, 16, 24 hours</li>
                <li>✓ Simulates employees submitting their availability</li>
                <li>✓ Stores data in 'availability' Firestore collection</li>
                <li>✓ Updates the Heat Map display in Manager Dashboard</li>
              </ul>
            </Card>
          </>
        )}

        {/* Shifts by Employee Tab */}
        {activeTab === 'shifts-by-employee' && (
          <>
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-blue-200 dark:border-blue-900/50">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Analyze Shifts by Employee</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check how shifts are distributed across employees. Helps identify if the "Shifts by Employee" bar chart has correct data.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 py-4 px-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                  <div>
                    <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">What This Checks</h3>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <li>✓ Total shifts per employee</li>
                      <li>✓ Breakdown by shift type (Day/Afternoon/Night)</li>
                      <li>✓ All scheduled dates</li>
                      <li>✓ Distribution statistics</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">Identifies Issues</h3>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <li>✓ Employees with no shifts</li>
                      <li>✓ Duplicate shift assignments</li>
                      <li>✓ Data inconsistencies</li>
                      <li>✓ Uneven distribution</li>
                    </ul>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleCheckShiftsByEmployee}
                  disabled={isInspecting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isInspecting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Check Shifts Distribution
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
              <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">💡 How to Use This</h4>
              <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-2">
                <li>1️⃣ Click "Check Shifts Distribution" to load and analyze shift data</li>
                <li>2️⃣ Review the output to see total shifts per employee</li>
                <li>3️⃣ Check for any data quality warnings or issues</li>
                <li>4️⃣ If distribution is uneven, regenerate shifts from "Generate & Seed" tab</li>
                <li>5️⃣ The bar chart should update once shifts are properly stored</li>
              </ul>
            </Card>
          </>
        )}

        {/* Console Output */}
        {consoleOutput.length > 0 && (
          <Card className="p-6 bg-black/90 backdrop-blur-sm border border-muted">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Output</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearLogs}
              >
                Clear
              </Button>
            </div>
            <ScrollArea className="h-[600px] w-full rounded-md border border-muted/50 p-4">
              <div className="font-mono text-xs text-green-400 space-y-1 whitespace-pre-wrap">
                {consoleOutput.map((line, idx) => (
                  <div key={idx} className="break-words">
                    {line}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Diagnostic;
