
import React, { useState } from 'react';
import { Layout, Check, X as XIcon, HelpCircle } from 'lucide-react';
import { PageState } from '../Main';

interface PricingPageProps {
  onNavigate: (page: PageState) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Layout size={18} />
            </div>
            <span className="font-bold text-xl tracking-tight">WeShare</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => onNavigate('features')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</button>
            <button onClick={() => onNavigate('how-it-works')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How it Works</button>
            <button onClick={() => onNavigate('pricing')} className="text-sm font-bold text-slate-900">Pricing</button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('login')} className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden sm:block">Log in</button>
            <button onClick={() => onNavigate('signup')} className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-16 text-center px-6">
         <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
             Simple, transparent pricing.
         </h1>
         <p className="text-xl text-slate-600 mb-10">
             Choose the plan that's right for you.
         </p>
         
         {/* Toggle */}
         <div className="flex items-center justify-center gap-4 mb-12">
             <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
             <button 
                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${billingCycle === 'yearly' ? 'bg-slate-900' : 'bg-slate-300'}`}
             >
                 <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`}></div>
             </button>
             <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
                 Yearly <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full ml-1 font-bold">SAVE 20%</span>
             </span>
         </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
         <div className="grid lg:grid-cols-3 gap-8 items-start">
             {/* Free Plan */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Starter</h3>
                    <div className="text-4xl font-bold text-slate-900 mt-4">€0</div>
                    <p className="text-slate-500 mt-2 text-sm">Forever free.</p>
                </div>
                <button onClick={() => onNavigate('signup')} className="w-full py-3 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-all mb-8">
                    Get Started
                </button>
                <ul className="space-y-4 text-sm">
                    <li className="flex items-start gap-3"><Check size={18} className="text-green-500 shrink-0" /> 1 Digital Card</li>
                    <li className="flex items-start gap-3"><Check size={18} className="text-green-500 shrink-0" /> Basic Analytics (7 days)</li>
                    <li className="flex items-start gap-3"><Check size={18} className="text-green-500 shrink-0" /> Standard Themes</li>
                    <li className="flex items-start gap-3"><Check size={18} className="text-green-500 shrink-0" /> QR Code Sharing</li>
                    <li className="flex items-start gap-3 text-slate-400"><XIcon size={18} className="shrink-0" /> Custom Domain</li>
                    <li className="flex items-start gap-3 text-slate-400"><XIcon size={18} className="shrink-0" /> Lead Collection</li>
                </ul>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 relative transform md:-translate-y-4">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white">Pro</h3>
                    <div className="text-4xl font-bold text-white mt-4">
                        €{billingCycle === 'yearly' ? '12' : '15'}
                        <span className="text-lg text-slate-400 font-normal">/mo</span>
                    </div>
                    <p className="text-slate-400 mt-2 text-sm">Billed {billingCycle}.</p>
                </div>
                <button onClick={() => onNavigate('signup')} className="w-full py-3 rounded-xl bg-white text-slate-900 font-bold hover:bg-blue-50 transition-all mb-8">
                    Start Pro Trial
                </button>
                <ul className="space-y-4 text-sm text-slate-300">
                    <li className="flex items-start gap-3"><Check size={18} className="text-blue-400 shrink-0" /> 5 Digital Cards</li>
                    <li className="flex items-start gap-3"><Check size={18} className="text-blue-400 shrink-0" /> Advanced Analytics (Unlimited)</li>
                    <li className="flex items-start gap-3"><Check size={18} className="text-blue-400 shrink-0" /> Custom Domains</li>
                    <li className="flex items-start gap-3"><Check size={18} className="text-blue-400 shrink-0" /> Lead Collection Forms</li>
                    <li className="flex items-start gap-3"><Check size={18} className="text-blue-400 shrink-0" /> Remove WeShare Branding</li>
                    <li className="flex items-start gap-3"><Check size={18} className="text-blue-400 shrink-0" /> Priority Support</li>
                </ul>
            </div>

            {/* Business Plan */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Business</h3>
                    <div className="text-4xl font-bold text-slate-900 mt-4">
                        €{billingCycle === 'yearly' ? '5' : '7'}
                        <span className="text-lg text-slate-400 font-normal">/user/mo</span>
                    </div>
                    <p className="text-slate-500 mt-2 text-sm">For growing teams.</p>
                </div>
                <button onClick={() => onNavigate('signup')} className="w-full py-3 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-all mb-8">
                    Get Started
                </button>
                <ul className="space-y-4 text-sm">
                    <li className="flex items-start gap-3"><Check size={18} className="text-green-500 shrink-0" /> 25 Digital Cards</li>
                    <li className="flex items-start gap-3"><Check size={18} className="text-green-500 shrink-0" /> Team Management</li>
                    <li className="flex items-start gap-3"><Check size={18} className="text-green-500 shrink-0" /> Centralized Billing</li>
                    <li className="flex items-start gap-3"><Check size={18} className="text-green-500 shrink-0" /> All Pro Features</li>
                    <li className="flex items-start gap-3"><Check size={18} className="text-green-500 shrink-0" /> Bulk Creation Tools</li>
                </ul>
            </div>
         </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-slate-50 px-6">
          <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Detailed Feature Comparison</h2>
              <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 text-sm text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                              <th className="p-4 text-slate-500 font-medium w-1/3">Features</th>
                              <th className="p-4 text-slate-900 font-bold w-1/5 text-center">Starter</th>
                              <th className="p-4 text-blue-600 font-bold w-1/5 text-center">Pro</th>
                              <th className="p-4 text-slate-900 font-bold w-1/5 text-center">Business</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {[
                              { name: "Number of Cards", free: "1", pro: "5", biz: "25" },
                              { name: "Unlimited Updates", free: true, pro: true, biz: true },
                              { name: "Analytics History", free: "7 Days", pro: "Unlimited", biz: "Unlimited" },
                              { name: "Custom QR Codes", free: true, pro: true, biz: true },
                              { name: "Custom Domain", free: false, pro: true, biz: true },
                              { name: "Remove Branding", free: false, pro: true, biz: true },
                              { name: "Lead Collection", free: false, pro: true, biz: true },
                              { name: "Google Reviews", free: false, pro: true, biz: true },
                              { name: "Team Admin Panel", free: false, pro: false, biz: true },
                          ].map((row, i) => (
                              <tr key={i}>
                                  <td className="p-4 font-medium text-slate-700">{row.name}</td>
                                  <td className="p-4 text-center">
                                      {typeof row.free === 'boolean' ? (row.free ? <Check size={16} className="mx-auto text-green-500" /> : <XIcon size={16} className="mx-auto text-slate-300" />) : row.free}
                                  </td>
                                  <td className="p-4 text-center bg-blue-50/30">
                                      {typeof row.pro === 'boolean' ? (row.pro ? <Check size={16} className="mx-auto text-blue-500" /> : <XIcon size={16} className="mx-auto text-slate-300" />) : row.pro}
                                  </td>
                                  <td className="p-4 text-center">
                                      {typeof row.biz === 'boolean' ? (row.biz ? <Check size={16} className="mx-auto text-green-500" /> : <XIcon size={16} className="mx-auto text-slate-300" />) : row.biz}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 border-t border-slate-100">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center text-white">
                <Layout size={14} />
              </div>
              <span className="font-bold text-lg tracking-tight">WeShare</span>
            </div>
            <div className="text-slate-500 text-sm">
               © {new Date().getFullYear()} WeShare.Site. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm font-medium text-slate-600">
               <a href="#" className="hover:text-slate-900">Privacy</a>
               <a href="#" className="hover:text-slate-900">Terms</a>
               <a href="#" className="hover:text-slate-900">Contact</a>
            </div>
         </div>
      </footer>
    </div>
  );
};
