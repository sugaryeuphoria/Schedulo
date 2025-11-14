/**
 * DIAGNOSTIC 01: Users Collection Inspector
 * Purpose: Inspect the users collection to understand user structure, fields, and data types
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function diagnoseUsersCollection() {
  console.log('\n========== DIAGNOSTIC 01: USERS COLLECTION ==========');
  
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    console.log(`\n📊 Total Documents: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('⚠️  Users collection is EMPTY');
      return;
    }
    
    // Analyze structure of first few documents
    const sampleSize = Math.min(3, snapshot.size);
    console.log(`\n📋 Sample of first ${sampleSize} documents:\n`);
    
    let docIndex = 0;
    snapshot.forEach((doc) => {
      if (docIndex < sampleSize) {
        console.log(`--- User Document #${docIndex + 1} ---`);
        console.log(`ID: ${doc.id}`);
        const data = doc.data();
        console.log(`Fields: ${Object.keys(data).join(', ')}`);
        console.log(`Data:`, JSON.stringify(data, null, 2));
        console.log();
      }
      docIndex++;
    });
    
    // Get manager users specifically
    console.log('\n🔍 Manager Users:');
    const managerQuery = query(usersRef, where('role', '==', 'manager'));
    const managerSnapshot = await getDocs(managerQuery);
    console.log(`Count: ${managerSnapshot.size}`);
    managerSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- ${data.name} (${data.email}) [ID: ${doc.id}]`);
    });
    
    // Get employee users
    console.log('\n👥 Employee Users:');
    const employeeQuery = query(usersRef, where('role', '==', 'employee'));
    const employeeSnapshot = await getDocs(employeeQuery);
    console.log(`Count: ${employeeSnapshot.size}`);
    employeeSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- ${data.name} (${data.email}) [ID: ${doc.id}]`);
    });
    
    console.log('\n✅ Users collection diagnosed successfully\n');
  } catch (error) {
    console.error('❌ Error diagnosing users collection:', error);
  }
}

// Run if executed directly
if (typeof window === 'undefined') {
  diagnoseUsersCollection().catch(console.error);
}
