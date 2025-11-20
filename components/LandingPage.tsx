import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowRight, Check, Star, Layout, Zap, Shield, Globe, ChevronRight, Play, 
  Smartphone, BarChart3, Share2, Palette, Quote, Plus, Minus, X as XIcon 
} from 'lucide-react';
import { CardPreview } from './CardPreview';
import { INITIAL_DATA } from '../constants';
import { Button } from './ui/Button';
import { PageState } from '../Main';
import { useLanguage } from '../LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

// Hook for scroll animations
const useIntersectionObserver = (options = {}) => {
  const elementsRef = useRef<Array<HTMLElement | null>>([]);
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
          observer.unobserve(entry.target);
        }
      });
    }, options);

    elementsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (el: HTMLElement | null) => {
    if (el && !elementsRef.current.includes(el)) {
      elementsRef.current.push(el);
    }
  };
};

interface LandingPageProps {
  onNavigate: (page: PageState) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const observe = useIntersectionObserver({ threshold: 0.1 });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      
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
            <button onClick={() => onNavigate('features')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{t('nav.features')}</button>
            <button onClick={() => onNavigate('how-it-works')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{t('nav.howItWorks')}</button>
            <button onClick={() => onNavigate('pricing')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{t('nav.pricing')}</button>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button 
              onClick={() => onNavigate('login')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
            >
              {t('nav.login')}
            </button>
            <button 
              onClick={() => onNavigate('signup')}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              {t('nav.getStarted')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-200/40 blur-3xl animate-blob"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-200/40 blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="text-center lg:text-left space-y-8 opacity-0 translate-y-10 transition-all duration-700 ease-out animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              v2.0 is now live
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              {t('landing.heroTitle')}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t('landing.heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
               <button 
                 onClick={() => onNavigate('signup')}
                 className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-all hover:shadow-xl hover:-translate-y-1 flex items-center gap-2"
               >
                 {t('landing.createFree')} <ArrowRight size={18} />
               </button>
               <button 
                  onClick={() => setIsVideoPlaying(true)}
                  className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-all flex items-center gap-2 group"
               >
                 <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                   <Play size={12} fill="currentColor" />
                 </div>
                 {t('landing.watchDemo')}
               </button>
            </div>
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500">
               <div className="flex -space-x-2">
                 {[1,2,3,4].map(i => (
                   <img key={i} src={`https://ui-avatars.com/api/?name=User+${i}&background=random`} className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
                 ))}
               </div>
               <div className="flex flex-col">
                 <div className="flex text-yellow-400 gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                 </div>
                 <span>{t('landing.lovedBy')}</span>
               </div>
            </div>
          </div>

          <div className="relative perspective-1000 hidden lg:flex justify-center items-center opacity-0 translate-y-10 transition-all duration-700 delay-200 ease-out animate-fade-in">
             {/* Floating Cards Visual */}
             <div className="relative z-10 transform rotate-y-[-12deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out cursor-pointer">
                <CardPreview data={INITIAL_DATA} className="shadow-2xl shadow-blue-900/20" />
                
                {/* Floating Badge */}
                <div className="absolute -right-12 top-1/4 bg-white p-4 rounded-2xl shadow-xl animate-bounce-slow">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                          <Zap size={20} fill="currentColor" />
                       </div>
                       <div>
                          <div className="text-xs text-slate-500 font-medium">Conversion Rate</div>
                          <div className="text-lg font-bold text-slate-900">+34%</div>
                       </div>
                    </div>
                </div>
             </div>
             
             {/* Background Elements */}
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl transform scale-150 -z-10"></div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
           <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-6">{t('landing.trustedBy')}</p>
           <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {['Acme Corp', 'Global Bank', 'TechStart', 'Future Ventures', 'BlueWave'].map((brand, i) => (
                 <div key={i} className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-800 rounded-md"></div> {brand}
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* Problem vs Solution */}
      <section className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                  <div ref={observe} className="opacity-0 translate-y-10 transition-all duration-700 ease-out">
                      <h2 className="text-3xl font-bold text-slate-900 mb-6">{t('landing.problemTitle')}</h2>
                      <p className="text-lg text-slate-600 mb-8">
                          {t('landing.problemDesc')}
                      </p>
                      <div className="space-y-4">
                          <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-800">
                              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                  <XIcon size={20} />
                              </div>
                              <div>
                                  <span className="font-bold block">{t('landing.problem1Title')}</span>
                                  <span className="text-sm opacity-80">{t('landing.problem1Desc')}</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-800">
                              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                  <XIcon size={20} />
                              </div>
                              <div>
                                  <span className="font-bold block">{t('landing.problem2Title')}</span>
                                  <span className="text-sm opacity-80">{t('landing.problem2Desc')}</span>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div ref={observe} className="opacity-0 translate-y-10 transition-all duration-700 ease-out delay-200">
                      <h2 className="text-3xl font-bold text-slate-900 mb-6">{t('landing.solutionTitle')}</h2>
                      <p className="text-lg text-slate-600 mb-8">
                          {t('landing.solutionDesc')}
                      </p>
                      <div className="space-y-4">
                          <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-xl text-green-800">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                  <Check size={20} />
                              </div>
                              <div>
                                  <span className="font-bold block">{t('landing.solution1Title')}</span>
                                  <span className="text-sm opacity-80">{t('landing.solution1Desc')}</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-xl text-green-800">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                  <Check size={20} />
                              </div>
                              <div>
                                  <span className="font-bold block">{t('landing.solution2Title')}</span>
                                  <span className="text-sm opacity-80">{t('landing.solution2Desc')}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Feature Deep Dive 1: Design */}
      <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1" ref={observe}>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                      <Palette size={24} />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">{t('landing.designTitle')}</h2>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                      {t('landing.designDesc')}
                  </p>
                  <ul className="space-y-4">
                      {['Holographic 3D Tilt Effects', 'Custom Color Gradients', 'Dark & Light Mode Support', 'Animated Elements'].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                  <Check size={14} />
                              </div>
                              {item}
                          </li>
                      ))}
                  </ul>
              </div>
              <div className="order-1 lg:order-2 relative" ref={observe}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl transform scale-90"></div>
                  <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                      <img 
                        src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop" 
                        alt="Editor Interface" 
                        className="rounded-2xl w-full h-auto"
                      />
                      <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-100 shadow-lg flex items-center justify-between">
                          <span className="font-medium text-slate-900">Editing Profile</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Live Preview</span>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Feature Deep Dive 2: Analytics */}
      <section className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative" ref={observe}>
                  <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-800 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
                      <div className="relative z-10">
                          <div className="flex justify-between items-end mb-8">
                              <div>
                                  <div className="text-slate-400 text-sm font-medium mb-1">Total Views</div>
                                  <div className="text-4xl font-bold text-white">14,205</div>
                              </div>
                              <div className="text-green-400 text-sm font-bold flex items-center gap-1">
                                  <Zap size={14} /> +24% this week
                              </div>
                          </div>
                          <div className="flex items-end gap-2 h-48">
                              {[35, 45, 40, 60, 75, 65, 85].map((h, i) => (
                                  <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm opacity-80 hover:opacity-100 transition-all" style={{ height: `${h}%` }}></div>
                              ))}
                          </div>
                      </div>
                  </div>
                  {/* Floating Stat Card */}
                  <div className="absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-xl border border-slate-100 animate-bounce-slow z-20">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                              <Smartphone size={20} />
                          </div>
                          <div>
                              <div className="text-xs text-slate-500 font-medium">Lead Source</div>
                              <div className="font-bold text-slate-900">QR Scan</div>
                          </div>
                      </div>
                  </div>
              </div>
              <div ref={observe}>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                      <BarChart3 size={24} />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">{t('landing.analyticsTitle')}</h2>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                      {t('landing.analyticsDesc')}
                  </p>
                  <ul className="space-y-4">
                      {['Real-time View Tracking', 'Click-Through Rate (CTR)', 'Geographic Data', 'Device Breakdown'].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                  <Check size={14} />
                              </div>
                              {item}
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
           <div className="text-center max-w-3xl mx-auto mb-16" ref={observe}>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">{t('landing.featuresTitle')}</h2>
              <p className="text-lg text-slate-600">Packed with power features for modern professionals.</p>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Layout, title: "Drag & Drop Builder", desc: "Customize your card in real-time with our intuitive editor." },
                { icon: Globe, title: "Custom Domains", desc: "Connect your own domain for a fully branded experience." },
                { icon: Zap, title: "Instant Sharing", desc: "Share via QR code, link, or NFC. Works on any device." },
                { icon: Star, title: "Verified Reviews", desc: "Display your best Google Reviews to build trust." },
                { icon: Shield, title: "Enterprise Security", desc: "Bank-grade encryption and GDPR compliance." },
                { icon: Check, title: "Lead Capture", desc: "Collect contact info and export it directly to your CRM." },
              ].map((feature, i) => (
                 <div key={i} ref={observe} className="opacity-0 translate-y-10 transition-all duration-700 ease-out p-8 rounded-3xl bg-white border border-slate-100 hover:shadow-xl hover:-translate-y-1 group">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                       <feature.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 bg-slate-900 text-white" id="pricing">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('pricing.title')}</h2>
                  <p className="text-xl text-slate-400 mb-8">{t('pricing.subtitle')}</p>
                  
                  {/* Billing Toggle */}
                  <div className="flex items-center justify-center gap-4">
                     <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>{t('pricing.monthly')}</span>
                     <button 
                        onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-slate-700'}`}
                     >
                         <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                     </button>
                     <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-400'}`}>
                         {t('pricing.yearly')} <span className="text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded-full ml-1 font-bold">{t('pricing.save20')}</span>
                     </span>
                 </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8 items-start">
                  {/* Starter */}
                  <div className="bg-white text-slate-900 p-8 rounded-3xl">
                      <div className="mb-6">
                          <h3 className="text-lg font-bold">{t('pricing.starter')}</h3>
                          <div className="text-4xl font-bold mt-4">€0</div>
                          <p className="text-slate-500 mt-2 text-sm">{t('pricing.foreverFree')}</p>
                      </div>
                      <ul className="space-y-4 text-sm mb-8">
                          <li className="flex gap-3"><Check size={18} className="text-green-500" /> 1 Digital Card</li>
                          <li className="flex gap-3"><Check size={18} className="text-green-500" /> Basic Analytics</li>
                          <li className="flex gap-3"><Check size={18} className="text-green-500" /> Standard Themes</li>
                      </ul>
                      <button onClick={() => onNavigate('signup')} className="w-full py-3 rounded-xl border-2 border-slate-200 font-bold hover:border-slate-900 transition-colors">{t('nav.getStarted')}</button>
                  </div>

                  {/* Pro */}
                  <div className="bg-blue-600 text-white p-8 rounded-3xl relative transform lg:-translate-y-4 shadow-2xl">
                      <div className="absolute top-0 right-0 bg-yellow-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                      <div className="mb-6">
                          <h3 className="text-lg font-bold">{t('pricing.pro')}</h3>
                          <div className="text-4xl font-bold mt-4">
                              €{billingCycle === 'yearly' ? '12' : '15'}
                              <span className="text-lg opacity-70 font-normal text-sm">/mo</span>
                          </div>
                          <p className="opacity-80 mt-2 text-sm">{t('pricing.forPros')}</p>
                      </div>
                      <ul className="space-y-4 text-sm mb-8">
                          <li className="flex gap-3"><Check size={18} className="text-white" /> 5 Digital Cards</li>
                          <li className="flex gap-3"><Check size={18} className="text-white" /> Advanced Analytics</li>
                          <li className="flex gap-3"><Check size={18} className="text-white" /> Custom Domain</li>
                          <li className="flex gap-3"><Check size={18} className="text-white" /> No Branding</li>
                      </ul>
                      <button onClick={() => onNavigate('signup')} className="w-full py-3 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 transition-colors">{t('pricing.startTrial')}</button>
                  </div>

                  {/* Business */}
                  <div className="bg-white text-slate-900 p-8 rounded-3xl">
                      <div className="mb-6">
                          <h3 className="text-lg font-bold">{t('pricing.business')}</h3>
                          <div className="text-4xl font-bold mt-4">
                              €{billingCycle === 'yearly' ? '5' : '7'}
                              <span className="text-lg text-slate-500 font-normal text-sm">{t('pricing.userMo')}</span>
                          </div>
                          <p className="text-slate-500 mt-2 text-sm">{t('pricing.forTeams')}</p>
                      </div>
                      <ul className="space-y-4 text-sm mb-8">
                          <li className="flex gap-3"><Check size={18} className="text-green-500" /> 25+ Digital Cards</li>
                          <li className="flex gap-3"><Check size={18} className="text-green-500" /> Team Dashboard</li>
                          <li className="flex gap-3"><Check size={18} className="text-green-500" /> Central Billing</li>
                          <li className="flex gap-3"><Check size={18} className="text-green-500" /> Priority Support</li>
                      </ul>
                      <button onClick={() => onNavigate('signup')} className="w-full py-3 rounded-xl border-2 border-slate-200 font-bold hover:border-slate-900 transition-colors">{t('pricing.contactSales')}</button>
                  </div>
              </div>
          </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Frequently Asked Questions</h2>
              <div className="space-y-4">
                  {[
                      { q: "How does sharing work?", a: "You can share your card via your unique URL, a QR code (which we generate for you), or by saving it to your Apple/Google Wallet. You can also write the link to an NFC tag." },
                      { q: "Can I connect my own domain?", a: "Yes! On the Pro plan and above, you can connect a custom domain (like meet.yourname.com) so your card is fully branded to you." },
                      { q: "Is there a free trial for Pro?", a: "Absolutely. You can try all Pro features for 14 days, no credit card required." },
                      { q: "Can I manage cards for my employees?", a: "Yes, our Business plan offers a centralized dashboard where you can create, edit, and manage cards for your entire team from one place." },
                      { q: "What happens if I cancel?", a: "If you cancel, your cards will remain active until the end of your billing period. After that, they will revert to the Free plan features." }
                  ].map((faq, i) => (
                      <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden">
                          <button 
                            onClick={() => toggleFaq(i)}
                            className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-slate-50 transition-colors"
                          >
                              <span className="font-bold text-slate-900">{faq.q}</span>
                              {openFaqIndex === i ? <Minus size={20} className="text-slate-400" /> : <Plus size={20} className="text-slate-400" />}
                          </button>
                          {openFaqIndex === i && (
                              <div className="px-6 pb-6 bg-white text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                                  {faq.a}
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-slate-50 px-6">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-[3rem] p-12 md:p-20 text-center text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-extrabold mb-6">{t('landing.ctaTitle')}</h2>
                  <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                      {t('landing.ctaDesc')}
                  </p>
                  <button 
                    onClick={() => onNavigate('signup')}
                    className="px-10 py-5 bg-white text-blue-600 rounded-full font-bold text-xl hover:bg-blue-50 transition-all shadow-xl hover:scale-105"
                  >
                      {t('landing.ctaButton')}
                  </button>
                  <p className="mt-6 text-sm text-blue-200 opacity-80">No credit card required • Cancel anytime</p>
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

      {/* Video Modal Overlay */}
      {isVideoPlaying && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
           <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              <button 
                onClick={() => setIsVideoPlaying(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-colors"
              >
                 <XIcon className="rotate-45" size={24} />
              </button>
              <iframe 
                 width="100%" 
                 height="100%" 
                 src="https://www.youtube.com/embed/LXb3EKWsInQ?autoplay=1" 
                 title="Demo Video" 
                 frameBorder="0" 
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                 allowFullScreen
              ></iframe>
           </div>
        </div>
      )}
    </div>
  );
};