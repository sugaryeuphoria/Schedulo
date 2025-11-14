import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeftRight, AlertCircle, LayoutDashboard, ChevronRight, ChevronLeft } from 'lucide-react';

const tutorialSteps = [
  {
    title: 'View Your Schedule',
    icon: Calendar,
    description: 'Your personal shift calendar shows all your assigned shifts for the period. Each shift is color-coded by type: Day (yellow), Afternoon (orange), and Night (purple).',
  },
  {
    title: 'Request Shift Swaps',
    icon: ArrowLeftRight,
    description: 'Need to swap a shift? Click the "Swap" button on any shift card and select a colleague. They\'ll receive a notification and can accept or decline your request.',
  },
  {
    title: 'Manage Conflicts',
    icon: AlertCircle,
    description: 'The notifications sidebar alerts you to any scheduling conflicts or pending swap requests. Respond promptly to keep the schedule running smoothly.',
  },
  {
    title: 'Manager Dashboard',
    icon: LayoutDashboard,
    description: 'Managers have access to team-wide views, can create and modify shifts, track all activity, and resolve scheduling conflicts across the entire team.',
  },
];

export const TutorialStepper = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-accent flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-8 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome to Schedulo</h1>
          <p className="text-muted-foreground">Let's walk through the key features</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2">
          {tutorialSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStep ? 'w-12 bg-primary' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6 py-8">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-10 h-10 text-primary" />
            </div>
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold">{step.title}</h2>
            <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
              {step.description}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentStep + 1} of {tutorialSteps.length}
          </span>

          {currentStep === tutorialSteps.length - 1 ? (
            <Button onClick={() => window.location.href = '/'} className="gap-2">
              Get Started
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={nextStep} className="gap-2">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
