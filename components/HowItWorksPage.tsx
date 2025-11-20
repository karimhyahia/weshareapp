
import React from 'react';
import { Layout, UserPlus, Palette, Share2, ArrowRight, ChevronDown } from 'lucide-react';
import { PageState } from '../Main';

interface HowItWorksPageProps {
  onNavigate: (page: PageState) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
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
            <button onClick={() => onNavigate('how-it-works')} className="text-sm font-bold text-slate-900">How it Works</button>
            <button onClick={() => onNavigate('pricing')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('login')} className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden sm:block">Log in</button>
            <button onClick={() => onNavigate('signup')} className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
           <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
             Simplicity by design.
           </h1>
           <p className="text-xl text-slate-400 max-w-2xl mx-auto">
             Go from sign-up to sharing your professional brand in under 3 minutes. Here is how WeShare works.
           </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 px-6">
         <div className="max-w-5xl mx-auto space-y-24">
             {/* Step 1 */}
             <div className="flex flex-col md:flex-row items-center gap-12">
                 <div className="flex-1 text-center md:text-left">
                     <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-6">
                         <UserPlus size={32} />
                     </div>
                     <h2 className="text-3xl font-bold text-slate-900 mb-4">1. Create your profile</h2>
                     <p className="text-lg text-slate-600 leading-relaxed">
                         Sign up for free and secure your unique username. Add your basic details like name, title, bio, and contact information to build the foundation of your card.
                     </p>
                 </div>
                 <div className="flex-1 bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-lg">
                     {/* Visual abstract for form */}
                     <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                         <div className="h-4 w-24 bg-slate-200 rounded"></div>
                         <div className="h-10 w-full bg-slate-100 rounded-lg"></div>
                         <div className="h-4 w-24 bg-slate-200 rounded"></div>
                         <div className="h-10 w-full bg-slate-100 rounded-lg"></div>
                     </div>
                 </div>
             </div>

             {/* Step 2 */}
             <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                 <div className="flex-1 text-center md:text-left">
                     <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 mb-6">
                         <Palette size={32} />
                     </div>
                     <h2 className="text-3xl font-bold text-slate-900 mb-4">2. Customize & Brand</h2>
                     <p className="text-lg text-slate-600 leading-relaxed">
                         Use our drag-and-drop editor to add links, services, and projects. Choose a theme that matches your brand or create a custom color palette.
                     </p>
                 </div>
                 <div className="flex-1 bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-lg">
                     {/* Visual abstract for customization */}
                     <div className="grid grid-cols-2 gap-4">
                         <div className="aspect-video bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl shadow-md"></div>
                         <div className="aspect-video bg-gradient-to-br from-purple-600 to-slate-900 rounded-xl shadow-md"></div>
                         <div className="aspect-video bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl shadow-md"></div>
                         <div className="aspect-video bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm">Custom</div>
                     </div>
                 </div>
             </div>

             {/* Step 3 */}
             <div className="flex flex-col md:flex-row items-center gap-12">
                 <div className="flex-1 text-center md:text-left">
                     <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 text-green-600 mb-6">
                         <Share2 size={32} />
                     </div>
                     <h2 className="text-3xl font-bold text-slate-900 mb-4">3. Share & Connect</h2>
                     <p className="text-lg text-slate-600 leading-relaxed">
                         Your card is live instantly. Share it via your unique QR code at conferences, link in bio on social media, or email signature.
                     </p>
                 </div>
                 <div className="flex-1 bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-lg flex justify-center">
                     {/* Visual abstract for QR */}
                     <div className="bg-white p-4 rounded-2xl shadow-lg">
                        <div className="w-48 h-48 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                            <Share2 size={48} />
                        </div>
                     </div>
                 </div>
             </div>
         </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-50 px-6">
          <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Frequently Asked Questions</h2>
              <div className="space-y-4">
                  {[
                      { q: "Is the free plan really free?", a: "Yes! You can create one digital card with all core features completely for free, forever. No credit card required." },
                      { q: "Can I use my own domain?", a: "Yes, our Pro plan supports custom domains (e.g., connect.yourname.com) for a fully branded experience." },
                      { q: "Do I need an app?", a: "No. WeShare is 100% web-based. Your card works in any browser on any phone, no downloads needed." },
                      { q: "Can I track who views my card?", a: "Yes, we provide detailed analytics on views, clicks, and geographic location of your visitors." }
                  ].map((faq, i) => (
                      <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <div className="p-6">
                              <h3 className="font-bold text-lg text-slate-900 mb-2 flex items-center gap-3">
                                 <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-sm text-slate-500 shrink-0">?</div>
                                 {faq.q}
                              </h3>
                              <p className="text-slate-600 pl-9">{faq.a}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">Ready to get started?</h2>
          <button 
            onClick={() => onNavigate('signup')}
            className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto"
          >
              Create Your Card <ArrowRight size={18} />
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
