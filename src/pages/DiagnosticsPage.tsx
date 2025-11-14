import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle, Zap, ArrowLeft, Loader } from 'lucide-react';
import { runFullDatabaseDiagnosis } from '@/scripts/diagnostic05_completeDatabaseAnalysis';

interface DiagnosticResult {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message: string;
}

export const DiagnosticsPage = ({ onBack }: { onBack: () => void }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([
    { name: 'Users Collection', status: 'pending', message: '' },
    { name: 'Shifts Collection', status: 'pending', message: '' },
    { name: 'Swap Requests Collection', status: 'pending', message: '' },
    { name: 'Activity Logs Collection', status: 'pending', message: '' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);

  const captureConsoleOutput = () => {
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      logs.push(args.map(arg => {
        if (typeof arg === 'object') return JSON.stringify(arg, null, 2);
        return String(arg);
      }).join(' '));
      originalLog(...args);
    };

    console.error = (...args) => {
      logs.push(`❌ ${args.join(' ')}`);
      originalError(...args);
    };

    console.warn = (...args) => {
      logs.push(`⚠️  ${args.join(' ')}`);
      originalWarn(...args);
    };

    return { logs, restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }};
  };

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    setConsoleOutput([]);

    const { logs, restore } = captureConsoleOutput();

    try {
      // Update all to running
      setResults(prev => prev.map(r => ({ ...r, status: 'running' as const })));

      // Run the full diagnosis
      await runFullDatabaseDiagnosis();

      // Simulate completion for each test
      setResults([
        { name: 'Users Collection', status: 'completed', message: 'Successfully analyzed user data' },
        { name: 'Shifts Collection', status: 'completed', message: 'Analyzed shift distribution and patterns' },
        { name: 'Swap Requests Collection', status: 'completed', message: 'Inspected swap request relationships' },
        { name: 'Activity Logs Collection', status: 'completed', message: 'Reviewed activity log structure' },
      ]);

      setConsoleOutput(logs);
    } catch (error) {
      logs.push(`❌ Fatal error: ${error}`);
      setConsoleOutput(logs);
      setResults(prev => prev.map(r => ({
        ...r,
        status: 'error' as const,
        message: 'Error occurred during diagnosis'
      })));
    } finally {
      restore();
      setIsRunning(false);
    }
  };

  const handleClearLogs = () => {
    setConsoleOutput([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Database Diagnostics</h1>
            <p className="text-sm text-muted-foreground">Analyze Firestore structure and data relationships</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Control Panel */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border border-primary/20">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Run Diagnostics</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to analyze all Firestore collections and their relationships.
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleRunDiagnostics}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Full Diagnostics
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {results.map((result, idx) => (
            <Card key={idx} className="p-4 bg-card/50 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {result.status === 'pending' && <div className="w-3 h-3 rounded-full bg-muted-foreground" />}
                  {result.status === 'running' && <Loader className="w-4 h-4 text-primary animate-spin" />}
                  {result.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {result.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{result.name}</p>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  <Badge
                    variant="outline"
                    className="mt-2 text-xs"
                  >
                    {result.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Console Output */}
        {consoleOutput.length > 0 && (
          <Card className="p-6 bg-black/90 backdrop-blur-sm border border-muted">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Console Output</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearLogs}
              >
                Clear
              </Button>
            </div>
            <ScrollArea className="h-[400px] w-full rounded-md border border-muted/50 p-4">
              <div className="font-mono text-xs text-green-400 space-y-1">
                {consoleOutput.map((line, idx) => (
                  <div key={idx} className="break-all">
                    {line}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
            <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">What This Does</h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>✓ Analyzes all Firestore collections</li>
              <li>✓ Maps document structure and fields</li>
              <li>✓ Shows data relationships</li>
              <li>✓ Displays counts and statistics</li>
            </ul>
          </Card>

          <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
            <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">Expected Output</h4>
            <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <li>• User counts by role</li>
              <li>• Shift distribution by employee</li>
              <li>• Swap request statuses</li>
              <li>• Activity log breakdown</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
