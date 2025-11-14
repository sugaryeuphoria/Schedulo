import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, ShiftType } from '@/types/shift';

interface CreateShiftModalProps {
  open: boolean;
  onClose: () => void;
  employees: User[];
  onConfirm: (shiftData: {
    employeeId: string;
    employeeName: string;
    date: string;
    type: ShiftType;
    startTime: string;
    endTime: string;
  }) => void;
  preSelectedEmployeeId?: string;
  preSelectedDate?: string;
}

export const CreateShiftModal = ({ 
  open, 
  onClose, 
  employees, 
  onConfirm,
  preSelectedEmployeeId,
  preSelectedDate 
}: CreateShiftModalProps) => {
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<ShiftType>('day');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');

  // Set pre-selected values when modal opens
  useEffect(() => {
    if (open) {
      if (preSelectedEmployeeId) setEmployeeId(preSelectedEmployeeId);
      if (preSelectedDate) setDate(preSelectedDate);
    }
  }, [open, preSelectedEmployeeId, preSelectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = employees.find(e => e.id === employeeId);
    if (employee && date) {
      // Convert Firebase user ID to short employee ID (e.g., "John Smith" -> "john")
      const shortId = employee.name.split(' ')[0].toLowerCase();
      
      onConfirm({
        employeeId: shortId,  // ✅ Use short ID to match shift storage format
        employeeName: employee.name,
        date,
        type,
        startTime,
        endTime,
      });
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setEmployeeId('');
    setDate('');
    setType('day');
    setStartTime('08:00');
    setEndTime('16:00');
  };

  const handleTypeChange = (newType: ShiftType) => {
    setType(newType);
    // Auto-set times based on shift type
    if (newType === 'day') {
      setStartTime('08:00');
      setEndTime('16:00');
    } else if (newType === 'afternoon') {
      setStartTime('16:00');
      setEndTime('00:00');
    } else {
      setStartTime('00:00');
      setEndTime('08:00');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Shift</DialogTitle>
          <DialogDescription>
            Assign a shift to an employee
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Shift Type</Label>
            <Select value={type} onValueChange={(val) => handleTypeChange(val as ShiftType)} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day Shift</SelectItem>
                <SelectItem value="afternoon">Afternoon Shift</SelectItem>
                <SelectItem value="night">Night Shift</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Shift</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
