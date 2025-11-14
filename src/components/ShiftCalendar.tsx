import { Shift } from '@/types/shift';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight } from 'lucide-react';

interface ShiftCalendarProps {
  shifts: Shift[];
  dateRange: string[];
  onSwapRequest?: (shift: Shift) => void;
  isManager?: boolean;
}

const shiftColors = {
  day: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  afternoon: 'bg-orange-100 text-orange-800 border-orange-200',
  night: 'bg-purple-100 text-purple-800 border-purple-200',
};

export const ShiftCalendar = ({ shifts, dateRange, onSwapRequest, isManager }: ShiftCalendarProps) => {
  const getShiftForDate = (date: string) => {
    return shifts.find(s => s.date === date);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {dateRange.map((date) => {
        const shift = getShiftForDate(date);
        const dateInfo = formatDate(date);

        return (
          <Card
            key={date}
            className={`p-4 relative transition-all hover:shadow-lg ${
              shift ? 'border-l-4' : 'border-dashed'
            } ${
              shift?.type === 'day' ? 'border-l-yellow-400' :
              shift?.type === 'afternoon' ? 'border-l-orange-400' :
              shift?.type === 'night' ? 'border-l-purple-400' : ''
            }`}
          >
            <div className="text-center space-y-2">
              <div className="text-xs text-muted-foreground font-medium">
                {dateInfo.weekday}
              </div>
              <div className="text-2xl font-bold">{dateInfo.day}</div>
              <div className="text-xs text-muted-foreground">{dateInfo.month}</div>

              {shift ? (
                <div className="space-y-2 mt-3">
                  <Badge
                    variant="outline"
                    className={`w-full justify-center text-xs font-medium ${shiftColors[shift.type]}`}
                  >
                    {shift.type.charAt(0).toUpperCase() + shift.type.slice(1)}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {shift.startTime} - {shift.endTime}
                  </div>
                  {!isManager && onSwapRequest && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full h-7 text-xs"
                      onClick={() => onSwapRequest(shift)}
                    >
                      <ArrowLeftRight className="w-3 h-3 mr-1" />
                      Swap
                    </Button>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-xs text-muted-foreground">Off</div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
