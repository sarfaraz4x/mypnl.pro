
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sparkles, Instagram } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import Auth from './Auth';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import UploadTrade from '@/components/UploadTrade';
import TradeJournal from '@/components/TradeJournal';
import Settings from '@/components/Settings';
import Pricing from '@/components/Pricing';
import UsageLimitModal from '@/components/UsageLimitModal';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LegalInfo from '@/components/LegalInfo';
import AnalyticsIllustration from '@/components/AnalyticsIllustration';
import Navbar from '@/components/Navbar';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const { hasReachedLimit } = useUsageLimit();
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Loading timeout reached, forcing load');
      setLoading(false);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Reset modal states when tab changes
  useEffect(() => {
    setIsLegalModalOpen(false);
  }, [activeTab]);

  // Function to set auth mode and scroll to auth section
  const handleAuthNav = useCallback((mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setTimeout(() => {
      document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    // If trying to access upload page and limit is reached, redirect to pricing
    if (tab === 'upload' && hasReachedLimit) {
      setActiveTab('pricing');
      return;
    }
    
    setActiveTab(tab);
  }, [hasReachedLimit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    // Professional, creative landing page (inline for now)
    return (
      <div className="font-sans min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white dark:text-white transition-colors duration-300 flex flex-col">
        {/* Navbar */}
        <Navbar onAuthNav={handleAuthNav} />

        {/* Hero Section */}
                                <section className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-20 md:py-24 relative z-10 mt-16">
          {/* Left: Headline and subheadline */}
                              <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 flex flex-col gap-6 max-w-xl items-start justify-center text-left">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
              Turn Your <span className="text-blue-500">Trading</span> Screenshots into <span className="text-green-400">Smart Insights</span> in a Second.
            </h1>
                        <p className="text-lg md:text-2xl text-slate-300 mb-6 max-w-xl">
              No more manual logging. Just upload and let AI do the math — profits, patterns, and performance tracked automatically.
            </p>
                                    <ul className="flex flex-wrap gap-3 mb-2">
              <li className="inline-flex items-center gap-2 bg-slate-800/70 px-3 py-1 rounded-full text-sm text-slate-200"><svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg> Secure & Private</li>
              <li className="inline-flex items-center gap-2 bg-slate-800/70 px-3 py-1 rounded-full text-sm text-slate-200"><svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> Real-time Insights</li>
              <li className="inline-flex items-center gap-2 bg-slate-800/70 px-3 py-1 rounded-full text-sm text-slate-200"><Sparkles className="h-5 w-5 text-purple-400" /> AI Featured</li>
            </ul>
            </div>
            <div className="flex-1 flex items-center justify-center w-full max-w-md md:justify-end" id="auth-section">
              <Auth mode={authMode} onModeChange={setAuthMode} />
            </div>
          </div>
          {/* Illustration section */}
                              <div className="w-full max-w-7xl flex items-center justify-center">
            <AnalyticsIllustration />
          </div>

                    <div className="w-full max-w-4xl text-center mt-4">
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed italic">
              Every elite trader journals. Why? Because <span className="text-blue-400 font-medium">consistency</span> isn't built on memory—it's built on <span className="text-green-400 font-medium">data</span>.
              <br />
              <span className="text-blue-400 font-semibold">My</span><span className="text-green-400 font-semibold">PnL</span> helps you uncover your patterns, fix your blind spots, and turn every trade into a learning moment.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: 'Upload', color: 'text-blue-500', title: 'Auto-Analyze Screenshots', desc: 'Upload MT4/MT5 screenshots for instant trade analysis.' },
            { icon: 'BarChart2', color: 'text-green-500', title: 'Track PnL & Strategy', desc: 'Monitor trades, PnL, strategy, and notes.' },
            { icon: 'Brain', color: 'text-purple-500', title: 'AI-Powered Insights', desc: 'Get smart feedback on your trading patterns.' },
            { icon: 'FileText', color: 'text-yellow-500', title: 'Export Journals', desc: 'Download your journal as PDF anytime.' },
          ].map((f, i) => (
            <div key={i} className="bg-slate-800/80 rounded-2xl shadow-md border-0 flex flex-col items-center p-6 gap-4">
              <div className={`bg-slate-900 rounded-full p-3 mb-2 shadow ${f.color}`}>
                {/* Lucide icon inline */}
                <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {f.icon === 'Upload' && <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4v12" />}
                  {f.icon === 'BarChart2' && <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>}
                  {f.icon === 'Brain' && <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
                  {f.icon === 'FileText' && <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>}
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-slate-300 text-sm text-center">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Call to Action Text */}
        <div className="text-center max-w-3xl mx-auto px-6 pb-16">
          <p className="text-2xl font-semibold text-slate-200 leading-relaxed">
            If you’re not journaling your trades, you’re leaving profits on the table.
          </p>
          <p className="text-lg text-slate-400 mt-4">
            Level up your trading mindset—start documenting, analyzing, and improving with MyPnL.
          </p>
        </div>

        {/* About Section */}
        <section id="about" className="w-full max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-8 text-white text-center">About MyPnL</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-white mb-4">Built for Traders, by Traders</h3>
              <p className="text-lg text-slate-300 leading-relaxed">
                MyPnL was created to solve a simple problem: most traders don't journal their trades consistently. 
                We've built an AI-powered platform that makes trade journaling effortless and insightful.
              </p>
              <p className="text-lg text-slate-300 leading-relaxed">
                Our mission is to help traders build better habits, identify patterns, and improve their performance 
                through data-driven insights and automated analysis.
              </p>
              <div className="flex items-center space-x-4 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-slate-300">Secure & Private</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-300">AI-Powered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-slate-300">Real-time</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/80 rounded-2xl p-8">
              <h4 className="text-xl font-semibold text-white mb-4">Why Choose MyPnL?</h4>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-slate-300">Instant screenshot analysis with AI</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-slate-300">Comprehensive PnL tracking</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-slate-300">Pattern recognition and insights</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-slate-300">Export reports in multiple formats</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-slate-300">Mobile-friendly interface</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="w-full max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold mb-8 text-white text-center">What Traders Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Rahul S.', role: 'Intraday Trader', quote: 'I never tracked my trades properly until now. This made me consistent.', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
              { name: 'Maya T.', role: 'Forex Trader', quote: 'The screenshot upload & auto-journal feature is genius!', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
              { name: 'Alex P.', role: 'Swing Trader', quote: 'Clean, fast, and the AI insights are actually useful.', avatar: 'https://randomuser.me/api/portraits/men/65.jpg' },
            ].map((t, i) => (
              <div key={i} className="bg-slate-800/80 rounded-2xl shadow-md border-0 flex flex-col items-center p-8 gap-4">
                <img src={t.avatar} alt={t.name} className="rounded-full w-16 h-16 object-cover mb-2 border-2 border-blue-500" />
                <p className="text-slate-200 text-center italic mb-2">“{t.quote}”</p>
                <div className="flex flex-col items-center">
                  <span className="font-semibold text-white">{t.name}</span>
                  <span className="text-xs text-slate-400">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Pricing Section (duplicated for landing) */}
        <section id="pricing" className="w-full max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold mb-8 text-white text-center">Pricing Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Plan */}
            <div className="bg-slate-800 border-slate-700 relative rounded-2xl shadow-md flex flex-col items-center p-8 gap-4">
              <h3 className="text-xl font-semibold text-white mb-2">Free</h3>
              <div className="flex items-center justify-center space-x-2 mb-1">
                <span className="text-3xl font-bold text-white">₹0</span>
                <span className="text-slate-400">/forever</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">10 screenshot uploads</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">Basic analytics</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">CSV export</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">Trade journal</span></li>
              </ul>
              <button className="w-full bg-slate-600 text-slate-400 font-semibold py-2 rounded-lg cursor-not-allowed">Current Plan</button>
            </div>
            {/* Monthly Pro Plan (Most Popular) */}
            <div className="bg-slate-800 border-slate-700 relative rounded-2xl shadow-md flex flex-col items-center p-8 gap-4 ring-2 ring-green-500 scale-105">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-600 text-white px-3 py-1 rounded-full flex items-center"><svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" /></svg>Most Popular</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Monthly Pro</h3>
              <div className="flex items-center justify-center space-x-2 mb-1">
                <span className="text-3xl font-bold text-white">₹99</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">Unlimited screenshots</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">Advanced analytics</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">PDF reports</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">AI insights</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">Priority support</span></li>
              </ul>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition">Upgrade Now</button>
            </div>
            {/* Yearly Pro Plan */}
            <div className="bg-slate-800 border-slate-700 relative rounded-2xl shadow-md flex flex-col items-center p-8 gap-4">
              <h3 className="text-xl font-semibold text-white mb-2">Yearly Pro</h3>
              <div className="flex items-center justify-center space-x-2 mb-1">
                <span className="text-3xl font-bold text-white">₹999</span>
                <span className="text-slate-400">/year</span>
                <span className="text-sm text-slate-400 line-through ml-2">₹1,188</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">Everything in Monthly</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">2 months free</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">Advanced filters</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">Custom strategies</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">Export history</span></li>
              </ul>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">Best Value</button>
            </div>
            {/* Lifetime Plan */}
            <div className="bg-slate-800 border-slate-700 relative rounded-2xl shadow-md flex flex-col items-center p-8 gap-4">
              <h3 className="text-xl font-semibold text-white mb-2">Lifetime</h3>
              <div className="flex items-center justify-center space-x-2 mb-1">
                <span className="text-3xl font-bold text-white">₹4,999</span>
                <span className="text-slate-400">/once</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">Everything included</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">Lifetime access</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">Future updates</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">Premium support</span></li>
                <li className="flex items-center text-sm"><svg className="h-4 w-4 text-green-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg><span className="text-slate-300">No recurring fees</span></li>
              </ul>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">One-time Payment</button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-slate-900/90 py-8 px-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MyPnL Logo" className="h-8 w-auto" />
            <span className="font-bold text-lg text-white">My PnL</span>
          </div>
                    <div className="flex gap-6 text-slate-400 text-sm">
            <button onClick={() => setIsLegalModalOpen(true)} className="hover:text-blue-400 transition">Privacy & Terms</button>
            <button onClick={() => setIsLegalModalOpen(true)} className="hover:text-blue-400 transition">Contact</button>
          </div>
          <div className="flex gap-4">
            <a href="#" aria-label="Twitter" className="hover:text-blue-400 transition"><svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0022.4.36a9.09 9.09 0 01-2.88 1.1A4.52 4.52 0 0016.11 0c-2.5 0-4.52 2.02-4.52 4.52 0 .35.04.7.11 1.03C7.69 5.4 4.07 3.7 1.64 1.15c-.38.65-.6 1.4-.6 2.2 0 1.52.77 2.86 1.94 3.65A4.48 4.48 0 01.96 6v.06c0 2.13 1.52 3.9 3.54 4.3-.37.1-.76.16-1.16.16-.28 0-.55-.03-.81-.08.55 1.7 2.16 2.94 4.07 2.97A9.05 9.05 0 010 19.54a12.8 12.8 0 006.92 2.03c8.3 0 12.85-6.88 12.85-12.85 0-.2 0-.39-.01-.58A9.22 9.22 0 0023 3z" /></svg></a>
                        <a href="#" aria-label="LinkedIn" className="hover:text-blue-400 transition"><svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg></a>
            <a href="https://www.instagram.com/trading__4x" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-blue-400 transition"><Instagram className="h-5 w-5" /></a>
          </div>
          <div className="text-xs text-slate-500 mt-2 md:mt-0">© {new Date().getFullYear()} MyPnL. All rights reserved.</div>
                </footer>

        <Dialog open={isLegalModalOpen} onOpenChange={setIsLegalModalOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Legal Information</DialogTitle>
            </DialogHeader>
            <div className="max-h-[80vh] overflow-y-auto pr-4">
              <LegalInfo />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return hasReachedLimit ? (
          <UsageLimitModal onUpgrade={() => setActiveTab('pricing')} />
        ) : (
                          <UploadTrade />
        );
      case 'journal':
        return <TradeJournal />;
      case 'settings':
        return <Settings />;
      case 'pricing':
        return <Pricing />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderContent()}
    </Layout>
  );
};

export default Index;
