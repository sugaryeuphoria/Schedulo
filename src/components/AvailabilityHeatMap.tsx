import { useState, useEffect } from 'react';
import { User, Shift, Availability } from '@/types/shift';
import { getAvailability } from '@/lib/firebaseService';
import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailabilityHeatMapProps {
  employees: User[];
  shifts: Shift[];
  dateRange: string[];
}

export const AvailabilityHeatMap = ({ employees, shifts, dateRange }: AvailabilityHeatMapProps) => {
  const [availabilityData, setAvailabilityData] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const data = await getAvailability();
        console.log('🔍 Loaded availability data:', data);
        console.log('📊 Available employees:', data.map(a => a.employeeId));
        setAvailabilityData(data);
      } catch (error) {
        console.error('Error loading availability data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, []);

  const getAvailabilityForEmployeeAndDate = (employeeName: string, date: string) => {
    const shortId = employeeName.split(' ')[0].toLowerCase();
    const employeeAvailability = availabilityData.find(a => a.employeeId === shortId);
    
    if (!employeeAvailability) return undefined;
    
    return employeeAvailability.availabilityList.find(day => day.date === date);
  };

  const getAvailabilityColor = (availableHours: number | undefined) => {
    if (availableHours === undefined) {
      return 'bg-gray-50 hover:bg-gray-100 border-gray-200';
    }
    if (availableHours === 0) {
      return 'bg-red-600 hover:bg-red-700 text-white border-red-700';
    } else if (availableHours === 8) {
      return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600';
    } else if (availableHours === 16) {
      return 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 border-yellow-500';
    } else {
      // 24 hours
      return 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700';
    }
  };

  const getAvailabilityLabel = (hours: number | undefined) => {
    if (hours === undefined) return '-';
    if (hours === 0) return '0h';
    if (hours === 8) return '8h';
    if (hours === 16) return '16h';
    return '24h';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading availability data...</p>
        </div>
      </Card>
    );
  }

  // Calculate total days across all employees
  const totalDays = availabilityData.reduce((sum, emp) => sum + emp.availabilityList.length, 0);
  const avgHours = totalDays > 0 
    ? (availabilityData.reduce((sum, emp) => 
        sum + emp.availabilityList.reduce((s, day) => s + day.availableHours, 0), 0) / totalDays
      ).toFixed(1)
    : '0';

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Employee Availability Heat Map</h3>
              <p className="text-sm text-muted-foreground">
                Bi-weekly payweek availability (Nov 14-30, 2024)
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground mr-2">Availability:</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-red-600" />
                <span className="text-xs">0h</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-orange-500" />
                <span className="text-xs">8h</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-yellow-400" />
                <span className="text-xs">16h</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-emerald-600" />
                <span className="text-xs">24h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heat Map Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Date Headers */}
            <div className="flex gap-1 mb-2 ml-40">
              {dateRange.map((date) => {
                const dateInfo = formatDate(date);
                return (
                  <div key={date} className="w-10 text-center">
                    <div className="text-[10px] text-muted-foreground">{dateInfo.weekday}</div>
                    <div className="text-xs font-medium">{dateInfo.day}</div>
                  </div>
                );
              })}
            </div>

            {/* Employee Rows */}
            {employees.map((employee) => {
              const employeeFirstName = employee.name.split(' ')[0].toLowerCase();
              const employeeAvailability = availabilityData.find(
                a => a.employeeId === employeeFirstName
              );

              console.log(`Looking for ${employeeFirstName}:`, employeeAvailability ? '✅ Found' : '❌ Not found');

              return (
                <div key={employee.id} className="flex items-center gap-1 mb-1">
                  {/* Employee Label */}
                  <div className="w-40 pr-2 flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-medium text-primary">
                        {employee.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-medium truncate">{employee.name}</span>
                  </div>

                  {/* Heat Map Cells */}
                  <div className="flex gap-1">
                    {dateRange.map((date) => {
                      const dayAvailability = getAvailabilityForEmployeeAndDate(employee.name, date);
                      const hours = dayAvailability?.availableHours;

                      return (
                        <div
                          key={`${employee.id}-${date}`}
                          className={cn(
                            'w-10 h-10 rounded transition-all cursor-pointer border font-bold text-xs flex items-center justify-center',
                            getAvailabilityColor(hours)
                          )}
                          title={`${employee.name} - ${formatDate(date).month} ${formatDate(date).day}: ${getAvailabilityLabel(hours)}`}
                        >
                          {getAvailabilityLabel(hours)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{employees.length}</div>
            <div className="text-xs text-muted-foreground">Total Employees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{dateRange.length}</div>
            <div className="text-xs text-muted-foreground">Days (Nov 14-30)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {totalDays}
            </div>
            <div className="text-xs text-muted-foreground">Total Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {avgHours}
            </div>
            <div className="text-xs text-muted-foreground">Avg Hours/Day</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
