/**
 * DIAGNOSTIC 02: Shifts Collection Inspector
 * Purpose: Inspect the shifts collection to understand structure, relationships, and data distribution
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export async function diagnoseShiftsCollection() {
  console.log('\n========== DIAGNOSTIC 02: SHIFTS COLLECTION ==========');
  
  try {
    const shiftsRef = collection(db, 'shifts');
    const snapshot = await getDocs(shiftsRef);
    
    console.log(`\n📊 Total Documents: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('⚠️  Shifts collection is EMPTY');
      return;
    }
    
    // Analyze structure of first few documents
    const sampleSize = Math.min(5, snapshot.size);
    console.log(`\n📋 Sample of first ${sampleSize} documents:\n`);
    
    let docIndex = 0;
    const allData: any[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      allData.push({ id: doc.id, ...data });
      
      if (docIndex < sampleSize) {
        console.log(`--- Shift Document #${docIndex + 1} ---`);
        console.log(`ID: ${doc.id}`);
        console.log(`Fields: ${Object.keys(data).join(', ')}`);
        console.log(`Data:`, JSON.stringify(data, null, 2));
        console.log();
      }
      docIndex++;
    });
    
    // Analyze data types and field consistency
    console.log('🔬 Field Analysis:');
    const fieldTypes: Record<string, Set<string>> = {};
    allData.forEach((doc) => {
      Object.entries(doc).forEach(([key, value]) => {
        if (!fieldTypes[key]) fieldTypes[key] = new Set();
        fieldTypes[key].add(typeof value);
      });
    });
    
    Object.entries(fieldTypes).forEach(([field, types]) => {
      console.log(`- ${field}: ${Array.from(types).join(', ')}`);
    });
    
    // Group shifts by date range
    console.log('\n📅 Shifts by Date:');
    const dateMap = new Map<string, number>();
    allData.forEach((shift) => {
      const date = shift.date;
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    
    const sortedDates = Array.from(dateMap.entries()).sort();
    sortedDates.forEach(([date, count]) => {
      console.log(`- ${date}: ${count} shifts`);
    });
    
    // Group shifts by employee
    console.log('\n👤 Shifts by Employee:');
    const employeeMap = new Map<string, { count: number; name: string; id: string }>();
    allData.forEach((shift) => {
      const empId = shift.employeeId;
      const empName = shift.employeeName || 'Unknown';
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, { count: 0, name: empName, id: empId });
      }
      const emp = employeeMap.get(empId)!;
      emp.count++;
    });
    
    Array.from(employeeMap.values()).forEach((emp) => {
      console.log(`- ${emp.name} (ID: ${emp.id}): ${emp.count} shifts`);
    });
    
    // Group by shift type
    console.log('\n🔄 Shifts by Type:');
    const typeMap = new Map<string, number>();
    allData.forEach((shift) => {
      const type = shift.type;
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });
    
    typeMap.forEach((count, type) => {
      console.log(`- ${type}: ${count} shifts`);
    });
    
    // Check for missing fields
    console.log('\n⚠️  Missing Fields Check:');
    const requiredFields = ['employeeId', 'employeeName', 'date', 'type', 'startTime', 'endTime'];
    const missingCount = new Map<string, number>();
    
    allData.forEach((shift) => {
      requiredFields.forEach((field) => {
        if (!(field in shift) || shift[field] === undefined || shift[field] === null) {
          missingCount.set(field, (missingCount.get(field) || 0) + 1);
        }
      });
    });
    
    if (missingCount.size === 0) {
      console.log('✅ All required fields present in all documents');
    } else {
      missingCount.forEach((count, field) => {
        console.log(`- ${field}: missing in ${count} documents`);
      });
    }
    
    console.log('\n✅ Shifts collection diagnosed successfully\n');
  } catch (error) {
    console.error('❌ Error diagnosing shifts collection:', error);
  }
}

// Run if executed directly
if (typeof window === 'undefined') {
  diagnoseShiftsCollection().catch(console.error);
}
