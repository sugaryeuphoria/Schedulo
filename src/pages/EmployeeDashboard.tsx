import { useState, useEffect } from 'react';
import { User, Shift, SwapRequest } from '@/types/shift';
import { getShiftsByEmployee, getUsers, addSwapRequest, updateSwapRequest, updateShift, subscribeToShifts, subscribeToSwapRequests, addActivityLog } from '@/lib/firebaseService';
import { ShiftCalendar } from '@/components/ShiftCalendar';
import { ConflictsSidebar } from '@/components/ConflictsSidebar';
import { ShiftSwapModal } from '@/components/ShiftSwapModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut, HelpCircle, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmployeeDashboardProps {
  user: User;
  onLogout: () => void;
}

export const EmployeeDashboard = ({ user, onLogout }: EmployeeDashboardProps) => {
  const { toast } = useToast();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Generate date range dynamically based on shifts
  const getDateRange = (shiftsData: Shift[]) => {
    if (shiftsData.length === 0) {
      // Default: November 15-30, 2024
      return Array.from({ length: 16 }, (_, i) => {
        const date = new Date(2024, 10, 15 + i);
        return date.toISOString().split('T')[0];
      });
    }

    // Get min and max dates from shifts
    const dates = shiftsData.map(s => new Date(s.date).getTime()).sort((a, b) => a - b);
    const minDate = new Date(dates[0]);
    const maxDate = new Date(dates[dates.length - 1]);

    // Generate range from min to max date, plus a few days buffer
    const range: string[] = [];
    const startDate = new Date(minDate);
    startDate.setDate(startDate.getDate() - 2);
    
    const endDate = new Date(maxDate);
    endDate.setDate(endDate.getDate() + 2);

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      range.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return range;
  };

  const [dateRange, setDateRange] = useState<string[]>(
    Array.from({ length: 16 }, (_, i) => {
      const date = new Date(2024, 10, 15 + i);
      return date.toISOString().split('T')[0];
    })
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        // Extract short name from user's full name for shift lookup
        // e.g., "John Smith" -> "john"
        const shortEmployeeId = user.name.split(' ')[0].toLowerCase();

        const [userShifts, allEmployees] = await Promise.all([
          getShiftsByEmployee(shortEmployeeId),
          getUsers(),
        ]);
        setShifts(userShifts);
        setDateRange(getDateRange(userShifts));
        setEmployees(allEmployees.filter(e => e.role === 'employee'));
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load data. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    loadData();

    // Real-time listeners
    const shortEmployeeId = user.name.split(' ')[0].toLowerCase();
    const unsubscribeShifts = subscribeToShifts((allShifts) => {
      setShifts(allShifts.filter(s => s.employeeId === shortEmployeeId));
    });

    const unsubscribeSwaps = subscribeToSwapRequests(shortEmployeeId, (requests) => {
      setSwapRequests(requests);
    });

    return () => {
      unsubscribeShifts();
      unsubscribeSwaps();
    };
  }, [user.id, user.name]);

  const handleSwapRequest = (shift: Shift) => {
    setSelectedShift(shift);
    setSwapModalOpen(true);
  };

  const handleSwapConfirm = async (targetEmployeeId: string, targetEmployeeName: string) => {
    if (!selectedShift) return;

    try {
      // Use short name for employee ID (matches how shifts store employeeId)
      const fromShortId = user.name.split(' ')[0].toLowerCase();
      const toShortId = targetEmployeeName.split(' ')[0].toLowerCase();

      await addSwapRequest({
        fromEmployeeId: fromShortId,
        fromEmployeeName: user.name,
        toEmployeeId: toShortId,
        toEmployeeName: targetEmployeeName,
        shiftId: selectedShift.id,
        shift: selectedShift,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      await addActivityLog({
        type: 'swap_requested',
        description: `${user.name} requested to swap ${selectedShift.type} shift on ${new Date(selectedShift.date).toLocaleDateString()}`,
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Swap Request Sent",
        description: `Your swap request has been sent to ${targetEmployeeName}.`,
      });
    } catch (error) {
      console.error('Error creating swap request:', error);
      toast({
        title: "Error",
        description: "Failed to send swap request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSwapResponse = async (requestId: string, accept: boolean) => {
    try {
      const request = swapRequests.find(r => r.id === requestId);
      if (!request) return;

      if (accept && request.shift) {
        // Simply update the shift to belong to the person who accepted it
        // The shift is currently owned by fromEmployeeId and should now belong to toEmployeeId
        await updateShift(request.shift.id, {
          employeeId: request.toEmployeeId,  // Short ID like "john"
          employeeName: request.toEmployeeName,
        });
      }

      // Update the swap request status
      await updateSwapRequest(requestId, {
        status: accept ? 'accepted' : 'declined',
      });

      // Add activity log
      await addActivityLog({
        type: accept ? 'swap_accepted' : 'swap_declined',
        description: `${user.name} ${accept ? 'accepted' : 'declined'} swap request from ${request.fromEmployeeName}`,
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: accept ? "Swap Accepted" : "Swap Declined",
        description: accept
          ? "Shifts have been swapped successfully!"
          : "The swap request has been declined.",
      });
    } catch (error) {
      console.error('Error responding to swap:', error);
      toast({
        title: "Error",
        description: "Failed to respond to swap request.",
        variant: "destructive",
      });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Schedulo</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/tutorial'}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Help
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Period</p>
                <p className="text-2xl font-bold">{shifts.length}</p>
                <p className="text-xs text-muted-foreground">shifts assigned</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Swaps</p>
                <p className="text-2xl font-bold">
                  {swapRequests.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-xs text-muted-foreground">requests waiting</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Shift</p>
                <p className="text-lg font-bold">
                  {shifts[0] ? new Date(shifts[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'None'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {shifts[0]?.type || 'scheduled'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Calendar Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Your Schedule</h2>
                <p className="text-muted-foreground">November 15 - 30, 2024</p>
              </div>
            </div>

            <ShiftCalendar
              shifts={shifts}
              dateRange={dateRange}
              onSwapRequest={handleSwapRequest}
            />
          </div>

          {/* Sidebar */}
          <div>
            <ConflictsSidebar
              conflicts={[]}
              swapRequests={swapRequests}
              onSwapResponse={handleSwapResponse}
            />
          </div>
        </div>
      </div>

      {/* Swap Modal */}
      <ShiftSwapModal
        open={swapModalOpen}
        onClose={() => {
          setSwapModalOpen(false);
          setSelectedShift(null);
        }}
        shift={selectedShift}
        employees={employees}
        currentUserId={user.id}
        onConfirm={handleSwapConfirm}
      />
    </div>
  );
};
