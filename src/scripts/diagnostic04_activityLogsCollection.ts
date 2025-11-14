/**
 * DIAGNOSTIC 04: Activity Logs Collection Inspector
 * Purpose: Understand activity log structure and data relationships
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export async function diagnoseActivityLogsCollection() {
  console.log('\n========== DIAGNOSTIC 04: ACTIVITY LOGS COLLECTION ==========');
  
  try {
    const logsRef = collection(db, 'activityLogs');
    const snapshot = await getDocs(logsRef);
    
    console.log(`\n📊 Total Documents: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('⚠️  Activity Logs collection is EMPTY');
      console.log('(This is normal if this is a fresh database)');
      return;
    }
    
    // Analyze structure
    const sampleSize = Math.min(5, snapshot.size);
    console.log(`\n📋 Sample of first ${sampleSize} documents:\n`);
    
    let docIndex = 0;
    const allData: any[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      allData.push({ id: doc.id, ...data });
      
      if (docIndex < sampleSize) {
        console.log(`--- Activity Log Document #${docIndex + 1} ---`);
        console.log(`ID: ${doc.id}`);
        console.log(`Fields: ${Object.keys(data).join(', ')}`);
        console.log(`Data:`, JSON.stringify(data, null, 2));
        console.log();
      }
      docIndex++;
    });
    
    // Analyze by activity type
    console.log('📊 Activity Logs by Type:');
    const typeMap = new Map<string, number>();
    allData.forEach((log) => {
      const type = log.type || 'unknown';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });
    
    typeMap.forEach((count, type) => {
      console.log(`- ${type}: ${count}`);
    });
    
    // Check field consistency
    console.log('\n🔬 Field Analysis:');
    const fieldTypes: Record<string, Set<string>> = {};
    allData.forEach((log) => {
      Object.entries(log).forEach(([key, value]) => {
        if (!fieldTypes[key]) fieldTypes[key] = new Set();
        fieldTypes[key].add(typeof value);
      });
    });
    
    Object.entries(fieldTypes).forEach(([field, types]) => {
      console.log(`- ${field}: ${Array.from(types).join(', ')}`);
    });
    
    console.log('\n✅ Activity Logs collection diagnosed successfully\n');
  } catch (error) {
    console.error('❌ Error diagnosing activity logs collection:', error);
  }
}

// Run if executed directly
if (typeof window === 'undefined') {
  diagnoseActivityLogsCollection().catch(console.error);
}
