/**
 * DIAGNOSTIC 03: Swap Requests Collection Inspector
 * Purpose: Understand swap request structure and data relationships
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function diagnoseSwapRequestsCollection() {
  console.log('\n========== DIAGNOSTIC 03: SWAP REQUESTS COLLECTION ==========');
  
  try {
    const swapRef = collection(db, 'swapRequests');
    const snapshot = await getDocs(swapRef);
    
    console.log(`\n📊 Total Documents: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('⚠️  Swap Requests collection is EMPTY');
      console.log('(This is normal if no swaps have been requested yet)');
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
        console.log(`--- Swap Request Document #${docIndex + 1} ---`);
        console.log(`ID: ${doc.id}`);
        console.log(`Fields: ${Object.keys(data).join(', ')}`);
        console.log(`Data:`, JSON.stringify(data, null, 2));
        console.log();
      }
      docIndex++;
    });
    
    // Analyze by status
    console.log('📊 Swap Requests by Status:');
    const statusMap = new Map<string, number>();
    allData.forEach((swap) => {
      const status = swap.status || 'unknown';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    
    statusMap.forEach((count, status) => {
      console.log(`- ${status}: ${count}`);
    });
    
    // Check field consistency
    console.log('\n🔬 Field Analysis:');
    const fieldTypes: Record<string, Set<string>> = {};
    allData.forEach((swap) => {
      Object.entries(swap).forEach(([key, value]) => {
        if (!fieldTypes[key]) fieldTypes[key] = new Set();
        fieldTypes[key].add(typeof value);
      });
    });
    
    Object.entries(fieldTypes).forEach(([field, types]) => {
      console.log(`- ${field}: ${Array.from(types).join(', ')}`);
    });
    
    console.log('\n✅ Swap Requests collection diagnosed successfully\n');
  } catch (error) {
    console.error('❌ Error diagnosing swap requests collection:', error);
  }
}

// Run if executed directly
if (typeof window === 'undefined') {
  diagnoseSwapRequestsCollection().catch(console.error);
}
