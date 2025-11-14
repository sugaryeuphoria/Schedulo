import { Conflict, SwapRequest } from '@/types/shift';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConflictsSidebarProps {
  conflicts: Conflict[];
  swapRequests: SwapRequest[];
  onSwapResponse?: (requestId: string, accept: boolean) => void;
  isManager?: boolean;
}

export const ConflictsSidebar = ({ conflicts, swapRequests, onSwapResponse, isManager }: ConflictsSidebarProps) => {
  return (
    <Card className="h-full p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          Notifications
        </h2>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {/* Conflicts */}
            {conflicts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Conflicts</h3>
                {conflicts.map((conflict) => (
                  <Card key={conflict.id} className="p-4 border-l-4 border-l-destructive bg-destructive/5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{conflict.type === 'double-booking' ? 'Double Booking' : 'Overlap'}</p>
                        <p className="text-xs text-muted-foreground">
                          {conflict.employeeName} on {new Date(conflict.date).toLocaleDateString()}
                        </p>
                        <div className="pt-2 space-y-1">
                          {conflict.shifts.map((shift, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {shift.type}: {shift.startTime} - {shift.endTime}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Swap Requests */}
            {swapRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Swap Requests</h3>
                {swapRequests.map((request) => (
                  <Card key={request.id} className="p-4 border-l-4 border-l-warning bg-warning/5">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            {request.fromEmployeeName} → {request.toEmployeeName}
                          </p>
                          {request.shift ? (
                            <>
                              <p className="text-xs text-muted-foreground">
                                {request.shift.type} shift on {new Date(request.shift.date).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {request.shift.startTime} - {request.shift.endTime}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">Shift details loading...</p>
                          )}
                        </div>
                      </div>

                      {request.status === 'pending' && !isManager && onSwapResponse && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs border-success/50 hover:bg-success/10"
                            onClick={() => onSwapResponse(request.id, true)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs border-destructive/50 hover:bg-destructive/10"
                            onClick={() => onSwapResponse(request.id, false)}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}

                      {request.status !== 'pending' && (
                        <Badge
                          variant={request.status === 'accepted' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {request.status}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {conflicts.length === 0 && swapRequests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};
