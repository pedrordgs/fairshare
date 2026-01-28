import React from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription } from '@components';
import MoneyIcon from '@assets/icons/money-icon.svg';
import GroupsIcon from '@assets/icons/groups-icon.svg';
import CheckIcon from '@assets/icons/check-icon.svg';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(163, 140, 111, 0.1) 35px, rgba(163, 140, 111, 0.1) 70px)`,
        }} />
      </div>
      
      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-primary-100 z-10">
        <div className="container-max">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <h1 className="text-2xl font-bold text-gradient">FairShare</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="hidden sm:inline-flex">Log In</Button>
              <Button>Sign Up</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Hero Content */}
        <section className="section-padding container-max">
          <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
            {/* Left Column - Text */}
            <div className="space-y-8 fade-in">
              <div className="space-y-4">
                <p className="text-accent-600 font-semibold tracking-wide uppercase text-sm">
                  Expense Splitting, Reimagined
                </p>
                <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
                  Split 
                  <span className="block text-gradient">Fairly</span>
                </h1>
              </div>
              
              <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
                The elegant way to track shared expenses and settle up with friends, roommates, and travel companions. 
                No more awkward money conversations, just transparent fairness.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="text-lg shadow-lg hover:shadow-xl">
                  Get Started Free
                </Button>
                <Button variant="secondary" size="lg" className="text-lg">
                  See How It Works
                </Button>
              </div>
              
              <div className="flex items-center space-x-6 pt-8 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                  <span>Free for up to 10 members</span>
                </div>
              </div>
            </div>
            
            {/* Right Column - Visual */}
            <div className="relative slide-up stagger-2">
              <div className="relative z-10">
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-primary-100">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Weekend Trip</h3>
                      <span className="text-accent-600 font-bold">$847.50</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white text-sm font-bold">A</div>
                          <span className="font-medium">Alex</span>
                        </div>
                        <span className="text-slate-600">Owes $212.50</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">S</div>
                          <span className="font-medium">Sarah</span>
                        </div>
                        <span className="text-green-600 font-medium">Gets back $425.00</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm font-bold">M</div>
                          <span className="font-medium">Mike</span>
                        </div>
                        <span className="text-slate-600">Owes $212.50</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-primary-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Settled by</span>
                        <span className="font-medium text-slate-900">Dec 15, 2024</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent-100 rounded-full opacity-60 animate-pulse-slow"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary-100 rounded-full opacity-40 animate-pulse-slow" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section-padding bg-gradient-to-b from-transparent to-primary-50/50">
          <div className="container-max">
            <div className="text-center mb-16 slide-up">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Designed for 
                <span className="text-gradient"> Modern Life</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Everything you need to split expenses fairly, beautifully designed for the way you live today.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              <div className="slide-up stagger-1">
                <Card className="card-elevated h-full">
                  <CardHeader>
                    <div className="w-16 h-16 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl flex items-center justify-center mb-6">
                      <img src={MoneyIcon} alt="Money tracking" className="w-8 h-8 text-accent-600" />
                    </div>
                    <CardTitle className="text-2xl mb-3">Effortless Tracking</CardTitle>
                    <CardDescription className="text-lg leading-relaxed">
                      Add expenses in seconds with smart categorization. See who owes what in real-time with beautiful visualizations.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <div className="slide-up stagger-2">
                <Card className="card-elevated h-full">
                  <CardHeader>
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mb-6">
                      <img src={GroupsIcon} alt="Smart groups" className="w-8 h-8 text-primary-600" />
                    </div>
                    <CardTitle className="text-2xl mb-3">Smart Groups</CardTitle>
                    <CardDescription className="text-lg leading-relaxed">
                      Create groups for trips, households, or events. Invite members seamlessly and start splitting costs together.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <div className="slide-up stagger-3">
                <Card className="card-elevated h-full">
                  <CardHeader>
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-6">
                      <img src={CheckIcon} alt="Clear settlements" className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl mb-3">Clear Settlements</CardTitle>
                    <CardDescription className="text-lg leading-relaxed">
                      See exactly who owes whom and track repayments. Settle up confidently with everyone on the same page.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding">
          <div className="container-max">
            <div className="bg-gradient-to-br from-accent-500 to-primary-600 rounded-3xl p-12 lg:p-16 text-center text-white relative overflow-hidden slide-up">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10 space-y-6">
                <h2 className="text-4xl lg:text-5xl font-bold">
                  Ready to simplify your shared expenses?
                </h2>
                <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto">
                  Join thousands who've transformed their expense splitting from stressful to seamless.
                </p>
                <div className="pt-8">
                  <Button size="lg" className="bg-white text-accent-600 hover:bg-gray-50 text-lg shadow-xl hover:shadow-2xl">
                    Start Your First Group
                  </Button>
                </div>
                <div className="flex items-center justify-center space-x-8 pt-8 text-white/80 text-sm">
                  <div className="flex items-center space-x-2">
                    <span>✓</span>
                    <span>Free forever for small groups</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>✓</span>
                    <span>No hidden fees</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>✓</span>
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white section-padding">
        <div className="container-max">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <h3 className="text-xl font-bold">FairShare</h3>
            </div>
            <p className="text-slate-400">
              © 2024 FairShare. Built with care for fair expense splitting.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};