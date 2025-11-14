import { Shift, User } from '@/types/shift';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface ShiftDistributionGraphsProps {
  shifts: Shift[];
  employees: User[];
  dateRange: string[];
}

const SHIFT_TYPE_COLORS = {
  day: '#f59e0b',
  afternoon: '#f97316', 
  night: '#6366f1',
};

export const ShiftDistributionGraphs = ({ shifts, employees, dateRange }: ShiftDistributionGraphsProps) => {
  // Shift Type Distribution
  const shiftTypeData = [
    { name: 'Day Shifts', value: shifts.filter(s => s.type === 'day').length, color: SHIFT_TYPE_COLORS.day },
    { name: 'Afternoon Shifts', value: shifts.filter(s => s.type === 'afternoon').length, color: SHIFT_TYPE_COLORS.afternoon },
    { name: 'Night Shifts', value: shifts.filter(s => s.type === 'night').length, color: SHIFT_TYPE_COLORS.night },
  ];

  // Shifts per Employee - USE SHORT IDs FROM SHIFTS, NOT FIREBASE IDs
  const employeeShiftData = employees.map(emp => {
    const shortName = emp.name.split(' ')[0].toLowerCase();
    return {
      name: emp.name.split(' ')[0],
      shifts: shifts.filter(s => s.employeeId === shortName).length,
      Day: shifts.filter(s => s.employeeId === shortName && s.type === 'day').length,
      Afternoon: shifts.filter(s => s.employeeId === shortName && s.type === 'afternoon').length,
      Night: shifts.filter(s => s.employeeId === shortName && s.type === 'night').length,
    };
  }).sort((a, b) => b.shifts - a.shifts);

  // Log employee data for debugging
  console.log('Employee Shift Data:', employeeShiftData);
  console.log('Total shifts being charted:', employeeShiftData.reduce((sum, e) => sum + e.shifts, 0));

  // Shifts per Day
  const dailyShiftData = dateRange.map(date => {
    const dateObj = new Date(date);
    const dayShifts = shifts.filter(s => s.date === date);
    
    return {
      date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date,
      total: dayShifts.length,
      day: dayShifts.filter(s => s.type === 'day').length,
      afternoon: dayShifts.filter(s => s.type === 'afternoon').length,
      night: dayShifts.filter(s => s.type === 'night').length,
    };
  });

  // Weekly trend data
  const weeklyData: { week: string; total: number; employees: number }[] = [];
  for (let i = 0; i < dateRange.length; i += 7) {
    const weekDates = dateRange.slice(i, i + 7);
    const weekShifts = shifts.filter(s => weekDates.includes(s.date));
    const uniqueEmployees = new Set(weekShifts.map(s => s.employeeId)).size;
    
    weeklyData.push({
      week: `Week ${Math.floor(i / 7) + 1}`,
      total: weekShifts.length,
      employees: uniqueEmployees,
    });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const totalShifts = shifts.length;
  const avgPerEmployee = employees.length > 0 ? (totalShifts / employees.length).toFixed(1) : '0';
  const avgPerDay = dateRange.length > 0 ? (totalShifts / dateRange.length).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Shifts</div>
              <div className="text-2xl font-bold">{totalShifts}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Avg / Employee</div>
              <div className="text-2xl font-bold">{avgPerEmployee}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Avg / Day</div>
              <div className="text-2xl font-bold">{avgPerDay}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Active Days</div>
              <div className="text-2xl font-bold">{dateRange.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <Card className="p-6">
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily">Daily Distribution</TabsTrigger>
            <TabsTrigger value="employee">By Employee</TabsTrigger>
            <TabsTrigger value="type">Shift Types</TabsTrigger>
            <TabsTrigger value="trend">Weekly Trend</TabsTrigger>
          </TabsList>

          {/* Daily Distribution */}
          <TabsContent value="daily" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Daily Shift Distribution</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Number of shifts scheduled per day, broken down by shift type
              </p>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dailyShiftData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="day" name="Day" fill={SHIFT_TYPE_COLORS.day} stackId="a" />
                <Bar dataKey="afternoon" name="Afternoon" fill={SHIFT_TYPE_COLORS.afternoon} stackId="a" />
                <Bar dataKey="night" name="Night" fill={SHIFT_TYPE_COLORS.night} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* By Employee */}
          <TabsContent value="employee" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Shifts by Employee</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Total shifts assigned to each employee with breakdown by type
              </p>
            </div>
            {employeeShiftData.length === 0 ? (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                <p>No shift data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={employeeShiftData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Day" fill={SHIFT_TYPE_COLORS.day} stackId="a" />
                  <Bar dataKey="Afternoon" fill={SHIFT_TYPE_COLORS.afternoon} stackId="a" />
                  <Bar dataKey="Night" fill={SHIFT_TYPE_COLORS.night} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          {/* Shift Types */}
          <TabsContent value="type" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Shift Type Distribution</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Overall breakdown of shifts by type
              </p>
            </div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={shiftTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {shiftTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              {shiftTypeData.map((item) => (
                <div key={item.name} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="text-xs text-muted-foreground">
                    {totalShifts > 0 ? ((item.value / totalShifts) * 100).toFixed(1) : 0}% of total
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Weekly Trend */}
          <TabsContent value="trend" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Weekly Trend Analysis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Shift volume and employee participation over time
              </p>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total Shifts" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="employees" name="Active Employees" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
