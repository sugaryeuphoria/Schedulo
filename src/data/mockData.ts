import { Shift, User, SwapRequest, Conflict, ActivityLog } from '@/types/shift';

export const mockUsers: User[] = [
  { id: 'john', email: 'john@schedulo.com', name: 'John Smith', role: 'employee' },
  { id: 'sarah', email: 'sarah@schedulo.com', name: 'Sarah Johnson', role: 'employee' },
  { id: 'mike', email: 'mike@schedulo.com', name: 'Mike Davis', role: 'employee' },
  { id: 'emma', email: 'emma@schedulo.com', name: 'Emma Wilson', role: 'employee' },
  { id: 'alex', email: 'alex@schedulo.com', name: 'Alex Brown', role: 'employee' },
  { id: 'jessica', email: 'jessica@schedulo.com', name: 'Jessica Martinez', role: 'employee' },
  { id: 'david', email: 'david@schedulo.com', name: 'David Lee', role: 'employee' },
  { id: 'rachel', email: 'rachel@schedulo.com', name: 'Rachel Taylor', role: 'employee' },
  { id: 'manager', email: 'manager@schedulo.com', name: 'Alex Manager', role: 'manager' },
];

// Generate 240 shifts for Nov 15-30 (16 days) with 15 shifts per day (all 8 employees + manager handling shifts)
const generateShifts = (): Shift[] => {
  const shifts: Shift[] = [];
  const employees = mockUsers.filter(u => u.role === 'employee');
  const startDate = new Date(2024, 10, 15); // Nov 15, 2024
  const endDate = new Date(2024, 10, 30);  // Nov 30, 2024
  const shiftTypes: Array<'day' | 'afternoon' | 'night'> = ['day', 'afternoon', 'night'];
  const timeSlots = {
    day: { startTime: '08:00', endTime: '16:00' },
    afternoon: { startTime: '16:00', endTime: '00:00' },
    night: { startTime: '00:00', endTime: '08:00' },
  };

  let shiftId = 1;
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const date = d.toISOString().split('T')[0];
    
    // Create 15 shifts per day (8 employees + extra shifts for some)
    // Distribute: day (5 shifts), afternoon (5 shifts), night (5 shifts)
    let shiftTypeIndex = 0;
    for (let i = 0; i < 15; i++) {
      const shiftType = shiftTypes[shiftTypeIndex % 3];
      const employee = employees[i % employees.length];
      const times = timeSlots[shiftType];
      
      shifts.push({
        id: `s${shiftId}`,
        employeeId: employee.id,
        employeeName: employee.name,
        date,
        type: shiftType,
        startTime: times.startTime,
        endTime: times.endTime,
      });
      
      shiftTypeIndex++;
      shiftId++;
    }
  }
  
  return shifts;
};

export const mockShifts: Shift[] = generateShifts();

export const mockSwapRequests: SwapRequest[] = [
  {
    id: 'swap1',
    fromEmployeeId: 'john',
    fromEmployeeName: 'John Smith',
    toEmployeeId: 'sarah',
    toEmployeeName: 'Sarah Johnson',
    shiftId: 's1',
    shift: mockShifts.find(s => s.id === 's1')!,
    status: 'pending',
    createdAt: '2024-11-10T10:00:00Z',
  },
  {
    id: 'swap2',
    fromEmployeeId: 'mike',
    fromEmployeeName: 'Mike Davis',
    toEmployeeId: 'emma',
    toEmployeeName: 'Emma Wilson',
    shiftId: 's17',
    shift: mockShifts.find(s => s.id === 's17')!,
    status: 'accepted',
    createdAt: '2024-11-10T11:30:00Z',
  },
];

export const mockConflicts: Conflict[] = [];

export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'log1',
    type: 'swap_requested',
    description: 'John Smith requested to swap day shift on Nov 15',
    userId: 'john',
    userName: 'John Smith',
    timestamp: '2024-11-10T10:00:00Z',
  },
  {
    id: 'log2',
    type: 'shift_created',
    description: 'New day shift assigned to Mike Davis on Nov 16',
    userId: 'manager',
    userName: 'Alex Manager',
    timestamp: '2024-11-09T14:30:00Z',
  },
  {
    id: 'log3',
    type: 'shift_updated',
    description: 'Emma Wilson shift time updated for Nov 18',
    userId: 'manager',
    userName: 'Alex Manager',
    timestamp: '2024-11-08T09:15:00Z',
  },
  {
    id: 'log4',
    type: 'swap_accepted',
    description: 'Mike Davis accepted swap request from Emma Wilson',
    userId: 'mike',
    userName: 'Mike Davis',
    timestamp: '2024-11-10T14:00:00Z',
  },
];

// Hard-coded credentials for testing (all 8 employees + manager)
export const testCredentials = {
  employees: [
    { email: 'john@schedulo.com', name: 'John Smith', password: 'password123' },
    { email: 'sarah@schedulo.com', name: 'Sarah Johnson', password: 'password123' },
    { email: 'mike@schedulo.com', name: 'Mike Davis', password: 'password123' },
    { email: 'emma@schedulo.com', name: 'Emma Wilson', password: 'password123' },
    { email: 'alex@schedulo.com', name: 'Alex Brown', password: 'password123' },
    { email: 'jessica@schedulo.com', name: 'Jessica Martinez', password: 'password123' },
    { email: 'david@schedulo.com', name: 'David Lee', password: 'password123' },
    { email: 'rachel@schedulo.com', name: 'Rachel Taylor', password: 'password123' },
  ],
  manager: { email: 'manager@schedulo.com', name: 'Alex Manager', password: 'admin123' },
};
