import { Shift, ShiftType } from '@/types/shift';

interface ShiftAssignment {
  employeeId: string;
  employeeName: string;
  type: ShiftType;
}

const EMPLOYEES = [
  { id: 'jessica', name: 'Jessica Martinez' },
  { id: 'sarah', name: 'Sarah Johnson' },
  { id: 'emma', name: 'Emma Wilson' },
  { id: 'mike', name: 'Mike Davis' },
  { id: 'john', name: 'John Smith' },
  { id: 'rachel', name: 'Rachel Taylor' },
  { id: 'david', name: 'David Lee' },
  { id: 'alex', name: 'Alex Brown' },
];

const SHIFT_TYPES: ShiftType[] = ['day', 'afternoon', 'night'];
const SHIFT_TIMES: Record<ShiftType, { start: string; end: string }> = {
  day: { start: '08:00', end: '16:00' },
  afternoon: { start: '16:00', end: '00:00' },
  night: { start: '00:00', end: '08:00' },
};

// Requirements per day:
// - 2 employees for day shift
// - 2 employees for afternoon shift
// - 1 employee for night shift
// - 3 employees off
// - Each employee gets at most 1 shift per day

export interface GeneratedShift extends Shift {
  // Extends Shift type
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate shift assignments for a single day
 */
function generateDayAssignments(): ShiftAssignment[] {
  const shuffled = shuffleArray(EMPLOYEES);
  const assignments: ShiftAssignment[] = [];

  // Assign 2 employees to day shift
  for (let i = 0; i < 2; i++) {
    assignments.push({
      employeeId: shuffled[i].id,
      employeeName: shuffled[i].name,
      type: 'day',
    });
  }

  // Assign 2 employees to afternoon shift
  for (let i = 2; i < 4; i++) {
    assignments.push({
      employeeId: shuffled[i].id,
      employeeName: shuffled[i].name,
      type: 'afternoon',
    });
  }

  // Assign 1 employee to night shift
  assignments.push({
    employeeId: shuffled[4].id,
    employeeName: shuffled[4].name,
    type: 'night',
  });

  // shuffled[5], shuffled[6], shuffled[7] are off
  return assignments;
}

/**
 * Generate shifts for a date range
 * Ensures fair distribution and randomness while following the constraints
 */
export function generateBalancedShifts(
  startDate: string,
  endDate: string
): GeneratedShift[] {
  const shifts: GeneratedShift[] = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let currentDate = new Date(start);
  
  while (currentDate <= end) {
    const dateString = currentDate.toISOString().split('T')[0];
    const dayAssignments = generateDayAssignments();

    // Create shift objects
    dayAssignments.forEach(assignment => {
      const shiftTimes = SHIFT_TIMES[assignment.type];
      const shift: GeneratedShift = {
        id: '', // Will be set by Firestore
        date: dateString,
        employeeId: assignment.employeeId,
        employeeName: assignment.employeeName,
        type: assignment.type,
        startTime: shiftTimes.start,
        endTime: shiftTimes.end,
      };
      shifts.push(shift);
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return shifts;
}

/**
 * Generate a summary of shift distribution
 */
export function summarizeShiftDistribution(shifts: GeneratedShift[]): string {
  let summary = `\n📊 SHIFT DISTRIBUTION SUMMARY\n`;
  summary += `${'='.repeat(50)}\n`;
  summary += `Total shifts generated: ${shifts.length}\n`;

  // Count shifts per employee
  const employeeShiftCount: Record<string, number> = {};
  const employeeShiftsByType: Record<string, Record<ShiftType, number>> = {};

  EMPLOYEES.forEach(emp => {
    employeeShiftCount[emp.name] = 0;
    employeeShiftsByType[emp.name] = { day: 0, afternoon: 0, night: 0 };
  });

  shifts.forEach(shift => {
    employeeShiftCount[shift.employeeName]++;
    employeeShiftsByType[shift.employeeName][shift.type]++;
  });

  // Display per employee
  summary += `\nShifts per employee:\n`;
  Object.entries(employeeShiftCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      const byType = employeeShiftsByType[name];
      summary += `  ${name}: ${count} total (Day: ${byType.day}, Afternoon: ${byType.afternoon}, Night: ${byType.night})\n`;
    });

  // Count shifts per type
  let dayCount = 0;
  let afternoonCount = 0;
  let nightCount = 0;

  shifts.forEach(shift => {
    if (shift.type === 'day') dayCount++;
    else if (shift.type === 'afternoon') afternoonCount++;
    else if (shift.type === 'night') nightCount++;
  });

  summary += `\nShifts by type:\n`;
  summary += `  Day shifts: ${dayCount}\n`;
  summary += `  Afternoon shifts: ${afternoonCount}\n`;
  summary += `  Night shifts: ${nightCount}\n`;

  // Validate constraints
  const dateGroups: Record<string, ShiftAssignment[]> = {};
  shifts.forEach(shift => {
    if (!dateGroups[shift.date]) dateGroups[shift.date] = [];
    dateGroups[shift.date].push({
      employeeId: shift.employeeId,
      employeeName: shift.employeeName,
      type: shift.type,
    });
  });

  summary += `\nConstraint validation:\n`;
  let constraintViolations = 0;
  Object.entries(dateGroups).forEach(([date, assignments]) => {
    const dayShifts = assignments.filter(a => a.type === 'day').length;
    const afternoonShifts = assignments.filter(a => a.type === 'afternoon').length;
    const nightShifts = assignments.filter(a => a.type === 'night').length;

    if (dayShifts !== 2 || afternoonShifts !== 2 || nightShifts !== 1) {
      summary += `  ⚠️  ${date}: Day=${dayShifts} (expected 2), Afternoon=${afternoonShifts} (expected 2), Night=${nightShifts} (expected 1)\n`;
      constraintViolations++;
    }
  });

  if (constraintViolations === 0) {
    summary += `  ✅ All daily constraints satisfied (2 day, 2 afternoon, 1 night per day)\n`;
  }

  summary += `${'='.repeat(50)}\n`;
  return summary;
}
