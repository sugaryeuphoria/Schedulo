import { useState, useEffect } from 'react';
import { User, Shift, ActivityLog, ShiftType } from '@/types/shift';
import { getShifts, getUsers, getActivityLogs, addShift, deleteShift, updateShift, subscribeToShifts, subscribeToActivityLogs, addActivityLog } from '@/lib/firebaseService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CreateShiftModal } from '@/components/CreateShiftModal';
import { StoreScheduleCalendar } from '@/components/StoreScheduleCalendar';
import { AvailabilityHeatMap } from '@/components/AvailabilityHeatMap';
import { ShiftDistributionGraphs } from '@/components/ShiftDistributionGraphs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Plus, Users, Calendar, Activity, TrendingUp } from 'lucide-react';

interface ManagerDashboardProps {
  user: User;
  onLogout: () => void;
}

export const ManagerDashboard = ({ user, onLogout }: ManagerDashboardProps) => {
  const { toast } = useToast();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  // Map short IDs (john, sarah) to actual user IDs for filtering
  const [shortIdToUserIdMap, setShortIdToUserIdMap] = useState<Record<string, string>>({});

  // Generate date range dynamically based on shifts, or use default range
  const getDateRange = () => {
    if (shifts.length === 0) {
      // Default: November 14-30, 2024 (to match availability data)
      return Array.from({ length: 17 }, (_, i) => {
        const date = new Date(2024, 10, 14 + i);
        return date.toISOString().split('T')[0];
      });
    }

    // Get min and max dates from shifts
    const dates = shifts.map(s => new Date(s.date).getTime()).sort((a, b) => a - b);
    const minDate = new Date(dates[0]);
    const maxDate = new Date(dates[dates.length - 1]);

    // Generate range from min to max date (inclusive)
    const range: string[] = [];
    const currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      range.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return range;
  };

  const dateRange = getDateRange();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allShifts, allUsers, logs] = await Promise.all([
          getShifts(),
          getUsers(),
          getActivityLogs(),
        ]);
        setShifts(allShifts);
        const employeeList = allUsers.filter(u => u.role === 'employee');
        setEmployees(employeeList);
        setActivityLogs(logs);

        // Build mapping from shift employeeIds (short names like 'john') to user IDs
        const mapping: Record<string, string> = {};
        employeeList.forEach(emp => {
          // Extract short name from employeeName (John Smith -> john)
          const shortName = emp.name.split(' ')[0].toLowerCase();
          mapping[shortName] = emp.id;
        });
        setShortIdToUserIdMap(mapping);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        });
      }
    };

    loadData();

    // Real-time listener for shifts
    const unsubscribeShifts = subscribeToShifts((allShifts) => {
      setShifts(allShifts);
    });

    // Real-time listener for activity logs
    const unsubscribeLogs = subscribeToActivityLogs((logs) => {
      setActivityLogs(logs);
    });

    return () => {
      unsubscribeShifts();
      unsubscribeLogs();
    };
  }, []);

  const handleCreateShift = async (shiftData: {
    employeeId: string;
    employeeName: string;
    date: string;
    type: ShiftType;
    startTime: string;
    endTime: string;
  }) => {
    try {
      await addShift(shiftData);

      await addActivityLog({
        type: 'shift_created',
        description: `New ${shiftData.type} shift assigned to ${shiftData.employeeName} on ${new Date(shiftData.date).toLocaleDateString()}`,
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Shift Created",
        description: `Successfully assigned shift to ${shiftData.employeeName}`,
      });
    } catch (error) {
      console.error('Error creating shift:', error);
      toast({
        title: "Error",
        description: "Failed to create shift.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      const shift = shifts.find(s => s.id === shiftId);
      await deleteShift(shiftId);

      if (shift) {
        await addActivityLog({
          type: 'shift_deleted',
          description: `Deleted ${shift.type} shift for ${shift.employeeName} on ${new Date(shift.date).toLocaleDateString()}`,
          userId: user.id,
          userName: user.name,
          timestamp: new Date().toISOString(),
        });
      }

      toast({
        title: "Shift Deleted",
        description: "Shift has been removed from the schedule.",
      });
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast({
        title: "Error",
        description: "Failed to delete shift.",
        variant: "destructive",
      });
    }
  };

  const handleAddShift = (employeeId: string, date: string) => {
    setSelectedEmployee(employeeId);
    setSelectedDate(date);
    setCreateModalOpen(true);
  };

  const handleDragStart = (shift: Shift) => {
    setDraggedShift(shift);
  };

  const handleDrop = async (employeeId: string, date: string) => {
    if (!draggedShift) return;

    try {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) return;

      // Convert Firebase user ID to short employee ID (e.g., "John Smith" -> "john")
      const shortId = employee.name.split(' ')[0].toLowerCase();

      // Update the shift with new employee and date
      await updateShift(draggedShift.id, {
        employeeId: shortId,  // ✅ Use short ID to match shift storage format
        employeeName: employee.name,
        date: date,
      });

      await addActivityLog({
        type: 'shift_updated',
        description: `Moved ${draggedShift.type} shift from ${draggedShift.employeeName} to ${employee.name} on ${new Date(date).toLocaleDateString()}`,
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Shift Moved",
        description: `Shift successfully moved to ${employee.name}`,
      });

      setDraggedShift(null);
    } catch (error) {
      console.error('Error moving shift:', error);
      toast({
        title: "Error",
        description: "Failed to move shift.",
        variant: "destructive",
      });
      setDraggedShift(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const getEmployeeShiftCount = (employeeId: string) => {
    return shifts.filter(s => s.employeeId === employeeId).length;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const shiftTypeStats = {
    day: shifts.filter(s => s.type === 'day').length,
    afternoon: shifts.filter(s => s.type === 'afternoon').length,
    night: shifts.filter(s => s.type === 'night').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Schedulo Manager</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Shifts</p>
                <p className="text-2xl font-bold">{shifts.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recent Activity</p>
                <p className="text-2xl font-bold">{activityLogs.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coverage</p>
                <p className="text-2xl font-bold">98%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="calendar">Store Calendar</TabsTrigger>
            <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="shifts">Shifts</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          {/* Store Calendar View */}
          <TabsContent value="calendar" className="space-y-6">
            <StoreScheduleCalendar
              shifts={shifts}
              employees={employees}
              dateRange={dateRange}
              employeeIdMap={shortIdToUserIdMap}
              onDeleteShift={handleDeleteShift}
              onAddShift={handleAddShift}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          </TabsContent>

          {/* Heat Map View */}
          <TabsContent value="heatmap" className="space-y-6">
            <AvailabilityHeatMap
              employees={employees}
              shifts={shifts}
              dateRange={dateRange}
            />
          </TabsContent>

          {/* Analytics View */}
          <TabsContent value="analytics" className="space-y-6">
            <ShiftDistributionGraphs
              shifts={shifts}
              employees={employees}
              dateRange={dateRange}
            />
          </TabsContent>

          <TabsContent value="employees">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Employee Overview</h3>
                <Button 
                  size="sm"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Shift
                </Button>
              </div>

              <div className="space-y-3">
                {employees.map((employee) => (
                  <Card key={employee.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-medium text-primary">
                            {employee.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Shifts</p>
                          <p className="font-semibold">{getEmployeeShiftCount(employee.id)}</p>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="shifts">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">All Shifts</h3>
                <Button 
                  size="sm"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Shift
                </Button>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {shifts.map((shift) => (
                    <Card key={shift.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge
                            variant="outline"
                            className={
                              shift.type === 'day'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                : shift.type === 'afternoon'
                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                : 'bg-purple-100 text-purple-800 border-purple-200'
                            }
                          >
                            {shift.type}
                          </Badge>
                          <div>
                            <p className="font-medium">{shift.employeeName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(shift.date).toLocaleDateString()} • {shift.startTime} -{' '}
                              {shift.endTime}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteShift(shift.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Activity Log</h3>

              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex gap-4 pb-4 border-b last:border-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">{log.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{log.userName}</span>
                          <span>•</span>
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Shift Modal */}
      <CreateShiftModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setSelectedEmployee(null);
          setSelectedDate(null);
        }}
        employees={employees}
        onConfirm={handleCreateShift}
        preSelectedEmployeeId={selectedEmployee || undefined}
        preSelectedDate={selectedDate || undefined}
      />
    </div>
  );
};
