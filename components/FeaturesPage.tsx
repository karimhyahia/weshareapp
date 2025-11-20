
import React from 'react';
import { Layout, Zap, Globe, PieChart, Users, Lock, Smartphone, Palette, Share2, Check, ArrowRight, Shield } from 'lucide-react';
import { PageState } from '../Main';
import { Button } from './ui/Button';

interface FeaturesPageProps {
  onNavigate: (page: PageState) => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigate }) => {
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
            <button onClick={() => onNavigate('features')} className="text-sm font-bold text-slate-900">Features</button>
            <button onClick={() => onNavigate('how-it-works')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How it Works</button>
            <button onClick={() => onNavigate('pricing')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('login')} className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden sm:block">Log in</button>
            <button onClick={() => onNavigate('signup')} className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
           <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
             Tools built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">growth.</span>
           </h1>
           <p className="text-xl text-slate-600 max-w-2xl mx-auto">
             Explore the complete suite of features designed to help you make a better impression and close more deals.
           </p>
        </div>
      </section>

      {/* Feature Sections */}
      <div className="space-y-24 py-24">
         
         {/* Design */}
         <section className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
               <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                  <Palette size={24} />
               </div>
               <h2 className="text-3xl md:text-4xl font-bold mb-6">Stunning Design, <br/>Zero Effort.</h2>
               <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Our glassmorphism design engine automatically ensures your card looks professional on any device. Choose from premium presets or customize every pixel.
               </p>
               <ul className="space-y-4">
                  {['Holographic 3D Tilt Effects', 'Custom Color Gradients', 'Dark & Light Mode Support', 'Animated Elements'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                         <Check size={20} className="text-green-500" /> {item}
                      </li>
                  ))}
               </ul>
            </div>
            <div className="order-1 lg:order-2 relative">
               <div className="aspect-square bg-gradient-to-tr from-blue-100 to-purple-100 rounded-3xl overflow-hidden border border-slate-200 shadow-xl flex items-center justify-center">
                   {/* Abstract representation of editor */}
                   <div className="w-3/4 h-3/4 bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
                      <div className="w-full h-8 bg-slate-100 rounded-lg"></div>
                      <div className="flex gap-4">
                         <div className="w-1/3 h-32 bg-blue-50 rounded-lg border border-blue-100"></div>
                         <div className="w-2/3 space-y-4">
                            <div className="w-full h-4 bg-slate-100 rounded"></div>
                            <div className="w-3/4 h-4 bg-slate-100 rounded"></div>
                            <div className="w-full h-12 bg-slate-900 rounded-lg mt-auto"></div>
                         </div>
                      </div>
                   </div>
               </div>
            </div>
         </section>

         {/* Analytics */}
         <section className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
                <div className="aspect-video bg-slate-900 rounded-3xl shadow-2xl p-8 flex items-end">
                    <div className="w-full flex items-end justify-between gap-2 h-48">
                        {[30, 50, 45, 70, 60, 85, 90].map((h, i) => (
                            <div key={i} className="w-full bg-gradient-to-t from-blue-600 to-purple-500 rounded-t-md opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                    <div className="absolute top-8 left-8">
                        <div className="text-slate-400 text-sm uppercase tracking-widest font-bold mb-1">Total Views</div>
                        <div className="text-4xl font-bold text-white">12,453</div>
                    </div>
                </div>
            </div>
            <div>
               <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                  <PieChart size={24} />
               </div>
               <h2 className="text-3xl md:text-4xl font-bold mb-6">Analytics that <br/>drive decisions.</h2>
               <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Stop guessing. See exactly who views your card, which links they click, and where your traffic is coming from.
               </p>
               <ul className="space-y-4">
                  {['Real-time View Tracking', 'Click-Through Rate (CTR)', 'Geographic Data', 'Device Breakdown'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                         <Check size={20} className="text-green-500" /> {item}
                      </li>
                  ))}
               </ul>
            </div>
         </section>

         {/* Sharing */}
         <section className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
               <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                  <Share2 size={24} />
               </div>
               <h2 className="text-3xl md:text-4xl font-bold mb-6">Share anywhere, <br/>connect everywhere.</h2>
               <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  WeShare gives you multiple ways to share your card. From QR codes to NFC integration, we've got you covered.
               </p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                       <div className="font-bold text-slate-900 mb-1">Custom QR Codes</div>
                       <p className="text-sm text-slate-500">Add your logo and brand colors.</p>
                   </div>
                   <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                       <div className="font-bold text-slate-900 mb-1">Apple Wallet</div>
                       <p className="text-sm text-slate-500">Add your card to iPhone wallet.</p>
                   </div>
                   <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                       <div className="font-bold text-slate-900 mb-1">Email Signatures</div>
                       <p className="text-sm text-slate-500">Professional HTML signatures.</p>
                   </div>
                   <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                       <div className="font-bold text-slate-900 mb-1">NFC Compatible</div>
                       <p className="text-sm text-slate-500">Write URL to any NFC tag.</p>
                   </div>
               </div>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
                 <div className="relative w-64 h-64 bg-white p-4 rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                     <div className="w-full h-full border-4 border-slate-900 rounded-xl flex items-center justify-center">
                         {/* QR Code Placeholder Visual */}
                         <div className="w-40 h-40 bg-slate-900 flex items-center justify-center text-white">
                             <Zap size={40} />
                         </div>
                     </div>
                 </div>
            </div>
         </section>
      </div>

      {/* CTA */}
      <section className="py-24 bg-slate-900 text-white text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to upgrade your network?</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              Join thousands of professionals who trust WeShare for their digital identity.
          </p>
          <button 
            onClick={() => onNavigate('signup')}
            className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-blue-50 transition-all"
          >
              Get Started for Free
          </button>
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
