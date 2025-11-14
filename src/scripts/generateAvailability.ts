import { getShifts, getUsers, generateAvailabilityData } from '@/lib/firebaseService';

/**
 * Generate availability data for all employees
 * Creates a list of daily availability (0, 8, 16, or 24 hours) for Nov 14-30
 * Stores in the 'availability' Firestore collection with one document per employee
 */
export const runAvailabilityGeneration = async (): Promise<{
  success: boolean;
  message: string;
  data?: any[];
  error?: string;
}> => {
  try {
    console.log('🔄 Loading shifts and users...');
    const [shifts, users] = await Promise.all([getShifts(), getUsers()]);

    console.log(`📊 Found ${shifts.length} shifts and ${users.length} users`);

    console.log('⏳ Generating availability data for Nov 14-30...');
    const availabilityRecords = await generateAvailabilityData(shifts, users);

    console.log('✅ Availability data generated successfully!');
    console.log(`📦 Generated ${availabilityRecords.length} employee records (with daily lists)\n`);

    // Log details for each employee
    availabilityRecords.forEach(record => {
      const totalHours = record.availabilityList.reduce((sum: number, day: any) => sum + day.availableHours, 0);
      const avgHours = (totalHours / record.availabilityList.length).toFixed(1);

      // Count distribution
      const dist = { 0: 0, 8: 0, 16: 0, 24: 0 };
      record.availabilityList.forEach((day: any) => {
        dist[day.availableHours as keyof typeof dist]++;
      });

      console.log(`  👤 ${record.employeeName}:`);
      console.log(`     Days with 0h: ${dist[0]}, 8h: ${dist[8]}, 16h: ${dist[16]}, 24h: ${dist[24]}`);
      console.log(`     Total Hours: ${totalHours}/408, Avg: ${avgHours}h/day\n`);
    });

    return {
      success: true,
      message: `Successfully generated availability data for ${availabilityRecords.length} employees (17 days each)`,
      data: availabilityRecords,
    };
  } catch (error: any) {
    console.error('❌ Error generating availability data:', error);
    return {
      success: false,
      message: 'Failed to generate availability data',
      error: error.message,
    };
  }
};
