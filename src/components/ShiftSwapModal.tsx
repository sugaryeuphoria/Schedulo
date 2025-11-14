import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shift, User } from '@/types/shift';
import { Calendar, Clock, User as UserIcon, CheckCircle } from 'lucide-react';

interface ShiftSwapModalProps {
  open: boolean;
  onClose: () => void;
  shift: Shift | null;
  employees: User[];
  currentUserId: string;
  onConfirm: (targetEmployeeId: string, targetEmployeeName: string) => void;
}

export const ShiftSwapModal = ({ 
  open, 
  onClose, 
  shift, 
  employees,
  currentUserId,
  onConfirm 
}: ShiftSwapModalProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  if (!shift) return null;

  const availableEmployees = employees.filter(e => e.id !== currentUserId);

  const handleConfirm = () => {
    if (selectedEmployee) {
      onConfirm(selectedEmployee.id, selectedEmployee.name);
      setSelectedEmployee(null);
      onClose();
    }
  };

  const shiftTypeColor = 
    shift.type === 'day' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
    shift.type === 'afternoon' ? 'bg-orange-100 text-orange-800 border-orange-200' :
    'bg-purple-100 text-purple-800 border-purple-200';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Request Shift Swap</DialogTitle>
          <DialogDescription>
            Select an employee to request a shift swap with
          </DialogDescription>
        </DialogHeader>

        {/* Shift Details */}
        <Card className="p-4 bg-secondary/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`${shiftTypeColor} text-sm`}>
                {shift.type.charAt(0).toUpperCase() + shift.type.slice(1)} Shift
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{new Date(shift.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{shift.startTime} - {shift.endTime}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Employee Selection */}
        <div className="flex-1 overflow-hidden">
          <h3 className="text-sm font-medium mb-3">Select Employee</h3>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {availableEmployees.map((employee) => (
                <Card
                  key={employee.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedEmployee?.id === employee.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-secondary/50'
                  }`}
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                      </div>
                    </div>
                    {selectedEmployee?.id === employee.id && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedEmployee}
          >
            Send Swap Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
