import { useState } from 'react';
import { Shift, User } from '@/types/shift';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoreScheduleCalendarProps {
  shifts: Shift[];
  employees: User[];
  dateRange: string[];
  employeeIdMap?: Record<string, string>; // Maps short IDs (john) to actual user IDs
  onShiftClick?: (shift: Shift) => void;
  onDeleteShift?: (shiftId: string) => void;
  onAddShift?: (employeeId: string, date: string) => void;
  onDragStart?: (shift: Shift) => void;
  onDrop?: (employeeId: string, date: string) => void;
}

const shiftTypeColors = {
  day: 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200',
  afternoon: 'bg-orange-100 border-orange-300 text-orange-900 hover:bg-orange-200',
  night: 'bg-indigo-100 border-indigo-300 text-indigo-900 hover:bg-indigo-200',
};

const shiftTypeBadgeColors = {
  day: 'bg-amber-500 text-white',
  afternoon: 'bg-orange-500 text-white',
  night: 'bg-indigo-500 text-white',
};

export const StoreScheduleCalendar = ({
  shifts,
  employees,
  dateRange,
  employeeIdMap = {},
  onShiftClick,
  onDeleteShift,
  onAddShift,
  onDragStart,
  onDrop,
}: StoreScheduleCalendarProps) => {
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(0);
  
  const daysPerView = 7;
  const visibleDates = dateRange.slice(currentWeekStart, currentWeekStart + daysPerView);

  const getShiftsForEmployeeAndDate = (employeeId: string, date: string) => {
    // Get shifts that match the date
    const dateShifts = shifts.filter(s => s.date === date);
    
    // Find employee by long ID
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return [];
    
    // Extract short name from employee name (John Smith -> john)
    const shortName = employee.name.split(' ')[0].toLowerCase();
    
    // Match shifts by short name in employeeId field
    return dateShifts.filter(s => s.employeeId === shortName || s.employeeId === employeeId);
  };

  const getConflictsForDate = (date: string) => {
    const dateShifts = shifts.filter(s => s.date === date);
    const conflicts: string[] = [];
    
    // Check for employees with multiple shifts
    const employeeShiftCount = dateShifts.reduce((acc, shift) => {
      acc[shift.employeeId] = (acc[shift.employeeId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(employeeShiftCount).forEach(([empId, count]) => {
      if (count > 1) {
        const emp = employees.find(e => e.id === empId);
        conflicts.push(`${emp?.name || 'Unknown'} has multiple shifts`);
      }
    });

    return conflicts;
  };

  const getTotalShiftsForDate = (date: string) => {
    return shifts.filter(s => s.date === date).length;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  };

  const handleDragStart = (shift: Shift, e: React.DragEvent) => {
    setDraggedShift(shift);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) onDragStart(shift);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (employeeId: string, date: string, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedShift && onDrop) {
      onDrop(employeeId, date);
    }
    setDraggedShift(null);
  };

  const handlePreviousWeek = () => {
    if (currentWeekStart > 0) {
      setCurrentWeekStart(Math.max(0, currentWeekStart - daysPerView));
    }
  };

  const handleNextWeek = () => {
    if (currentWeekStart + daysPerView < dateRange.length) {
      setCurrentWeekStart(currentWeekStart + daysPerView);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Store Schedule</h2>
              <p className="text-sm text-muted-foreground">
                {visibleDates.length > 0 && formatDate(visibleDates[0]).fullDate} - {' '}
                {visibleDates.length > 0 && formatDate(visibleDates[visibleDates.length - 1]).fullDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousWeek}
              disabled={currentWeekStart === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              disabled={currentWeekStart + daysPerView >= dateRange.length}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Badge className={shiftTypeBadgeColors.day}>Day</Badge>
            <span className="text-xs text-muted-foreground">6:00 AM - 2:00 PM</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={shiftTypeBadgeColors.afternoon}>Afternoon</Badge>
            <span className="text-xs text-muted-foreground">2:00 PM - 10:00 PM</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={shiftTypeBadgeColors.night}>Night</Badge>
            <span className="text-xs text-muted-foreground">10:00 PM - 6:00 AM</span>
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <ScrollArea className="h-[600px]">
          <div className="min-w-[1000px]">
            {/* Date Headers */}
            <div className="grid grid-cols-[200px_repeat(7,minmax(140px,1fr))] border-b bg-muted/30 sticky top-0 z-10">
              <div className="p-4 font-semibold border-r bg-background">
                <div className="flex items-center gap-2">
                  <span>Employees</span>
                  <Badge variant="outline" className="text-xs">{employees.length}</Badge>
                </div>
              </div>
              {visibleDates.map((date) => {
                const dateInfo = formatDate(date);
                const conflicts = getConflictsForDate(date);
                const totalShifts = getTotalShiftsForDate(date);
                
                return (
                  <div key={date} className="p-4 border-r bg-background">
                    <div className="text-center space-y-1">
                      <div className="text-xs text-muted-foreground">{dateInfo.weekday}</div>
                      <div className="text-sm font-semibold">
                        {dateInfo.month} {dateInfo.day}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-xs">
                          {totalShifts} shifts
                        </Badge>
                        {conflicts.length > 0 && (
                          <AlertTriangle className="w-3 h-3 text-destructive" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Employee Rows */}
            {employees.map((employee) => {
              // Extract short name from employee name for matching with shift employeeIds
              const shortName = employee.name.split(' ')[0].toLowerCase();
              const employeeShifts = shifts.filter(s => s.employeeId === shortName || s.employeeId === employee.id);
              
              return (
                <div
                  key={employee.id}
                  className="grid grid-cols-[200px_repeat(7,minmax(140px,1fr))] border-b hover:bg-muted/10 transition-colors"
                >
                  {/* Employee Info */}
                  <div className="p-4 border-r bg-muted/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">
                          {employee.name.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{employee.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {employeeShifts.length} shifts
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shift Cells */}
                  {visibleDates.map((date) => {
                    const cellShifts = getShiftsForEmployeeAndDate(employee.id, date);
                    
                    return (
                      <div
                        key={`${employee.id}-${date}`}
                        className="p-2 border-r min-h-[100px] relative"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(employee.id, date, e)}
                      >
                        <div className="space-y-1">
                          {cellShifts.length === 0 ? (
                            <button
                              onClick={() => onAddShift && onAddShift(employee.id, date)}
                              className="w-full h-16 rounded-md border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center group"
                            >
                              <Plus className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </button>
                          ) : (
                            cellShifts.map((shift) => (
                              <div
                                key={shift.id}
                                draggable
                                onDragStart={(e) => handleDragStart(shift, e)}
                                className={cn(
                                  'p-2 rounded-md border-2 cursor-move transition-all group relative',
                                  shiftTypeColors[shift.type],
                                  draggedShift?.id === shift.id && 'opacity-50'
                                )}
                                onClick={() => onShiftClick && onShiftClick(shift)}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex-1 min-w-0">
                                    <Badge 
                                      className={cn('text-[10px] px-1 py-0', shiftTypeBadgeColors[shift.type])}
                                    >
                                      {shift.type}
                                    </Badge>
                                    <div className="text-xs font-medium mt-1 truncate">
                                      {shift.startTime} - {shift.endTime}
                                    </div>
                                  </div>
                                  {onDeleteShift && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteShift(shift.id);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/20 rounded"
                                    >
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Shifts</div>
          <div className="text-2xl font-bold">{shifts.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg per Employee</div>
          <div className="text-2xl font-bold">
            {employees.length > 0 ? (shifts.length / employees.length).toFixed(1) : 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Coverage Rate</div>
          <div className="text-2xl font-bold">
            {((shifts.length / (employees.length * dateRange.length)) * 100).toFixed(0)}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Conflicts</div>
          <div className="text-2xl font-bold text-destructive">
            {dateRange.reduce((count, date) => count + getConflictsForDate(date).length, 0)}
          </div>
        </Card>
      </div>
    </div>
  );
};
