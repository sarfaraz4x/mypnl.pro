
import { useState, useEffect } from 'react';
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

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const { hasReachedLimit, refreshUsageCount } = useUsageLimit();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTabChange = (tab: string) => {
    // If trying to access upload page and limit is reached, redirect to pricing
    if (tab === 'upload' && hasReachedLimit) {
      setActiveTab('pricing');
      return;
    }
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (!session || !user) {
    // Professional, creative landing page (inline for now)
    return (
      <div className="font-sans min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white dark:text-white transition-colors duration-300 flex flex-col">
        {/* Theme Toggle */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <span className="text-xs text-slate-400">Light</span>
          {/* Simple theme toggle */}
          <button
            aria-label="Toggle theme"
            className="w-10 h-6 bg-slate-700 rounded-full flex items-center px-1 focus:outline-none"
            onClick={() => {
              document.documentElement.classList.toggle('dark');
            }}
          >
            <span className="block w-4 h-4 bg-white rounded-full shadow transform transition-transform dark:translate-x-4" />
          </button>
          <span className="text-xs text-slate-400">Dark</span>
        </div>

        {/* Hero Section */}
        <section className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 px-6 md:px-16 py-20 md:py-32 relative z-10">
          {/* Left: Headline and subheadline */}
          <div className="flex-1 flex flex-col gap-6 max-w-xl items-start justify-center md:items-start md:justify-center text-left">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
              Your <span className="text-blue-500">Trading</span> Dashboard, <span className="text-green-400">Reimagined</span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-300 mb-8 max-w-xl">
              Analyze, reflect, and improve. All your trades, insights, and performance in one beautiful, secure place.
            </p>
            <ul className="flex flex-wrap gap-3 mb-2">
              <li className="inline-flex items-center gap-2 bg-slate-800/70 px-3 py-1 rounded-full text-sm text-slate-200"><svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg> Secure & Private</li>
              <li className="inline-flex items-center gap-2 bg-slate-800/70 px-3 py-1 rounded-full text-sm text-slate-200"><svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> Real-time Insights</li>
            </ul>
          </div>
          {/* Right: Auth section */}
          <div className="flex-1 flex items-center justify-center w-full max-w-md md:justify-end md:items-center">
            <Auth />
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
        <section className="w-full max-w-6xl mx-auto px-6 py-16">
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
            <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
            <span className="font-bold text-lg text-white">MyPnL</span>
          </div>
          <div className="flex gap-6 text-slate-400 text-sm">
            <a href="#" className="hover:text-blue-400 transition">Privacy</a>
            <a href="#" className="hover:text-blue-400 transition">Terms</a>
            <a href="#" className="hover:text-blue-400 transition">Contact</a>
          </div>
          <div className="flex gap-4">
            <a href="#" aria-label="Twitter" className="hover:text-blue-400 transition"><svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0022.4.36a9.09 9.09 0 01-2.88 1.1A4.52 4.52 0 0016.11 0c-2.5 0-4.52 2.02-4.52 4.52 0 .35.04.7.11 1.03C7.69 5.4 4.07 3.7 1.64 1.15c-.38.65-.6 1.4-.6 2.2 0 1.52.77 2.86 1.94 3.65A4.48 4.48 0 01.96 6v.06c0 2.13 1.52 3.9 3.54 4.3-.37.1-.76.16-1.16.16-.28 0-.55-.03-.81-.08.55 1.7 2.16 2.94 4.07 2.97A9.05 9.05 0 010 19.54a12.8 12.8 0 006.92 2.03c8.3 0 12.85-6.88 12.85-12.85 0-.2 0-.39-.01-.58A9.22 9.22 0 0023 3z" /></svg></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-blue-400 transition"><svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg></a>
          </div>
          <div className="text-xs text-slate-500 mt-2 md:mt-0">© {new Date().getFullYear()} MyPnL. All rights reserved.</div>
        </footer>
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
          <UploadTrade onTradeAdded={refreshUsageCount} />
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
