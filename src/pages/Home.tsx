import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Zap, 
  BarChart3, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: 'Smart Shift Scheduling',
      description: 'Intelligent shift management with drag-and-drop scheduling and balanced distribution across your team.',
      color: 'text-blue-600'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Employees can request shift swaps and communicate directly with colleagues for seamless coordination.',
      color: 'text-purple-600'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Comprehensive dashboards with interactive charts showing shift distribution, trends, and team metrics.',
      color: 'text-green-600'
    },
    {
      icon: Zap,
      title: 'Instant Sync',
      description: 'Real-time updates across all devices - changes appear instantly without page refresh.',
      color: 'text-yellow-600'
    },
    {
      icon: Clock,
      title: 'Availability Tracking',
      description: 'Heat maps and availability calendars showing employee workload distribution at a glance.',
      color: 'text-red-600'
    },
    {
      icon: CheckCircle,
      title: 'Conflict Detection',
      description: 'Automatic warnings for overlapping shifts and scheduling conflicts with quick resolution tools.',
      color: 'text-emerald-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-orange-50 text-slate-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <header className="relative z-10 border-b border-slate-200 backdrop-blur-sm bg-white/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Schedulo
            </h1>
          </div>
          <Button
            onClick={() => navigate('/auth')}
            variant="outline"
            className="border-slate-300 hover:bg-slate-100 text-slate-900"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main heading */}
          <div className="space-y-4">
            <div className="inline-block">
              <span className="px-4 py-2 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-700 text-sm font-medium">
                ✨ Modern Shift Management
              </span>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold leading-tight">
              Manage Shifts with{' '}
              <span className="bg-gradient-to-r from-yellow-600 via-orange-600 to-purple-600 bg-clip-text text-transparent">
                Confidence
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto">
              Schedulo is a comprehensive shift management platform that empowers managers and employees to collaborate seamlessly.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-lg h-14 px-8 group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => navigate('/tutorial')}
              size="lg"
              variant="outline"
              className="border-slate-300 hover:bg-slate-100 text-slate-900 text-lg h-14 px-8"
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-12 mt-8 border-t border-slate-300">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-yellow-600">80+</div>
              <p className="text-sm text-slate-600">Shifts Managed</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-600">8</div>
              <p className="text-sm text-slate-600">Team Members</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-600">100%</div>
              <p className="text-sm text-slate-600">Real-time Sync</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
            Powerful Features for{' '}
            <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Teams
            </span>
          </h3>
          <p className="text-slate-700 text-lg max-w-2xl mx-auto">
            Everything you need to manage shifts efficiently and keep your team organized.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="bg-white/70 border-slate-200 hover:border-slate-400 hover:bg-white transition-all duration-300 p-6 group cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-slate-600 group-hover:text-slate-700 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h3 className="text-4xl font-bold leading-tight text-slate-900">
              Why Choose{' '}
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Schedulo?
              </span>
            </h3>

            <div className="space-y-6">
              {[
                {
                  title: 'For Managers',
                  points: [
                    'Drag-and-drop shift scheduling',
                    'Real-time analytics and reporting',
                    'Automated conflict detection',
                    'Complete audit trail'
                  ]
                },
                {
                  title: 'For Employees',
                  points: [
                    'Easy shift swap requests',
                    'Mobile-friendly interface',
                    'Real-time notifications',
                    'Quick shift management'
                  ]
                }
              ].map((section, idx) => (
                <div key={idx}>
                  <h4 className="text-lg font-semibold text-orange-600 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {section.title}
                  </h4>
                  <ul className="space-y-2">
                    {section.points.map((point, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-2xl opacity-30 blur-2xl"></div>
            <Card className="relative bg-white border-slate-200 shadow-lg p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Shift Calendar</div>
                    <div className="text-lg font-semibold text-slate-900">Visual Overview</div>
                  </div>
                </div>

                <div className="h-40 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-slate-200 flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="w-16 h-16 text-yellow-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Interactive calendar view</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Day Shift', color: 'bg-yellow-100 text-yellow-800' },
                    { label: 'Afternoon', color: 'bg-orange-100 text-orange-800' },
                    { label: 'Night', color: 'bg-purple-100 text-purple-800' }
                  ].map((type) => (
                    <div
                      key={type.label}
                      className={`px-3 py-2 rounded-lg ${type.color} text-center text-sm font-medium`}
                    >
                      {type.label}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <Card className="relative overflow-hidden bg-gradient-to-r from-yellow-200/40 to-orange-200/40 border-yellow-300 p-12 md:p-16">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
          </div>

          <div className="relative text-center space-y-6">
            <h3 className="text-4xl md:text-5xl font-bold text-slate-900">
              Ready to Transform Your Shift Management?
            </h3>
            <p className="text-xl text-slate-700 max-w-2xl mx-auto">
              Join teams that are already using Schedulo to streamline their shift operations and improve employee satisfaction.
            </p>

            <div className="pt-6">
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-lg h-14 px-12 group"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </Card>
      </section>

    </div>
  );
};

export default Home;
