export type ShiftType = 'day' | 'afternoon' | 'night';

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
}

export interface SwapRequest {
  id: string;
  fromEmployeeId: string;
  fromEmployeeName: string;
  toEmployeeId: string;
  toEmployeeName: string;
  shiftId: string;
  shift: Shift;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Conflict {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  shifts: Shift[];
  type: 'double-booking' | 'overlap';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'employee' | 'manager';
}

export interface ActivityLog {
  id: string;
  type: 'shift_created' | 'shift_updated' | 'shift_deleted' | 'swap_requested' | 'swap_accepted' | 'swap_declined';
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: any;
}

export interface DayAvailability {
  date: string;                              // ISO date (YYYY-MM-DD)
  availableHours: 0 | 8 | 16 | 24;         // Random availability for that day
}

export interface Availability {
  id: string;
  employeeId: string;
  employeeName: string;
  availabilityList: DayAvailability[];      // List of availability for each day
  lastUpdated: string;
}
