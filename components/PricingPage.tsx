import React from 'react';
import { Layout, Check, X as XIcon, Sparkles, Crown, Zap } from 'lucide-react';
import { PageState } from '../Main';
import { useLanguage } from '../LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface PricingPageProps {
  onNavigate: (page: PageState) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 font-sans text-slate-900">
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
            <button onClick={() => onNavigate('pricing')} className="text-sm font-bold text-slate-900">{t('nav.pricing')}</button>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button onClick={() => onNavigate('login')} className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden sm:block">{t('nav.login')}</button>
            <button onClick={() => onNavigate('signup')} className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all">{t('nav.getStarted')}</button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-16 text-center px-6">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
          <Sparkles size={18} />
          {t('pricing.limitedOffer')}
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
          {t('pricing.payOnce')} <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t('pricing.useForever')}</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          {t('pricing.noSubscriptions')}
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="relative rounded-3xl p-8 bg-white border-2 border-slate-200 hover:border-slate-300 shadow-lg transition-all">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('pricing.free')}</h3>
              <p className="text-sm text-slate-600">{t('pricing.freeDesc')}</p>
            </div>

            <div className="mb-6">
              <div className="text-5xl font-bold text-slate-900">{t('pricing.freePrice')}</div>
            </div>

            <button
              onClick={() => onNavigate('signup')}
              className="w-full py-4 px-6 rounded-xl font-bold text-base transition-all mb-8 bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              {t('pricing.getStartedFree')}
            </button>

            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.oneCard')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.threeLinks')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.basicAnalytics')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.standardThemes')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.qrCode')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.qrScans')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.profileCustomization')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.twoServicesProjects')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <XIcon size={18} className="shrink-0 mt-0.5 opacity-40" />
                <span>{t('pricing.features.premiumThemes')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <XIcon size={18} className="shrink-0 mt-0.5 opacity-40" />
                <span>{t('pricing.features.customColorsFonts')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <XIcon size={18} className="shrink-0 mt-0.5 opacity-40" />
                <span>{t('pricing.features.removeBranding')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <XIcon size={18} className="shrink-0 mt-0.5 opacity-40" />
                <span>{t('pricing.features.contactForms')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <XIcon size={18} className="shrink-0 mt-0.5 opacity-40" />
                <span>{t('pricing.features.videoIntegration')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <XIcon size={18} className="shrink-0 mt-0.5 opacity-40" />
                <span>{t('pricing.features.advancedAnalytics')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <XIcon size={18} className="shrink-0 mt-0.5 opacity-40" />
                <span>{t('pricing.features.customDomain')}</span>
              </li>
            </ul>
          </div>

          {/* Pro LTD - Highlighted */}
          <div className="relative rounded-3xl p-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl transform lg:-translate-y-4 scale-105 transition-all">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
              {t('pricing.bestValue')}
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{t('pricing.pro')}</h3>
              <p className="text-sm text-blue-100">{t('pricing.proDesc')}</p>
            </div>

            <div className="mb-6">
              <div className="text-5xl font-bold">€89</div>
              <p className="text-sm mt-2 text-blue-100">{t('pricing.oneTimePayment')}</p>
            </div>

            <button
              onClick={() => onNavigate('signup')}
              className="w-full py-4 px-6 rounded-xl font-bold text-base transition-all mb-8 bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
            >
              {t('pricing.getProButton')}
            </button>

            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.fiveCards')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.unlimitedLinks')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.advancedAnalyticsForever')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.allThemes')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.customColorsFonts')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.removeBranding')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.contactFormsLead')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.servicesProjectsLimited')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.videoVoiceIntegration')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.customDomainSupport')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.unlimitedQrScans')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.prioritySupport')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.exportData')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span>{t('pricing.features.storage5gb')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm font-bold">
                <Check size={18} className="shrink-0 mt-0.5 text-blue-200" />
                <span className="flex items-center gap-1">
                  {t('pricing.features.lifetimeUpdates')}
                  <Sparkles size={14} className="inline" />
                </span>
              </li>
            </ul>
          </div>

          {/* Business LTD */}
          <div className="relative rounded-3xl p-8 bg-white border-2 border-slate-200 hover:border-slate-300 shadow-lg transition-all">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
              {t('pricing.unlimited')}
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('pricing.business')}</h3>
              <p className="text-sm text-slate-600">{t('pricing.businessDesc')}</p>
            </div>

            <div className="mb-6">
              <div className="text-5xl font-bold text-slate-900">€249</div>
              <p className="text-sm mt-2 text-slate-600">{t('pricing.oneTimePayment')}</p>
            </div>

            <button
              onClick={() => onNavigate('signup')}
              className="w-full py-4 px-6 rounded-xl font-bold text-base transition-all mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              {t('pricing.getBusinessButton')}
            </button>

            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.everythingPro')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700 font-bold">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span className="flex items-center gap-1">
                  {t('pricing.features.unlimitedSites')}
                  <Sparkles size={14} className="inline" />
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.unlimitedServicesProjects')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.teamManagement')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.apiAccess')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.whiteLabel')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.bulkOperations')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.dedicatedSupport')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span>{t('pricing.features.storage50gb')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700 font-bold">
                <Check size={18} className="shrink-0 mt-0.5 text-green-500" />
                <span className="flex items-center gap-1">
                  {t('pricing.features.lifetimeUpdates')}
                  <Sparkles size={14} className="inline" />
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why Lifetime Section */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-2 border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
            {t('pricing.whyLifetime')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap size={32} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{t('pricing.payOnceTitle')}</h3>
              <p className="text-slate-600 text-sm">
                {t('pricing.payOnceDesc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown size={32} className="text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{t('pricing.futureUpdatesTitle')}</h3>
              <p className="text-slate-600 text-sm">
                {t('pricing.futureUpdatesDesc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-green-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{t('pricing.riskFreeTitle')}</h3>
              <p className="text-slate-600 text-sm">
                {t('pricing.riskFreeDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
          {t('pricing.faqTitle')}
        </h2>
        <div className="space-y-4">
          {[
            { q: t('pricing.faq.q1'), a: t('pricing.faq.a1') },
            { q: t('pricing.faq.q2'), a: t('pricing.faq.a2') },
            { q: t('pricing.faq.q3'), a: t('pricing.faq.a3') },
            { q: t('pricing.faq.q4'), a: t('pricing.faq.a4') },
          ].map((faq, index) => (
            <details key={index} className="bg-white rounded-xl p-6 border-2 border-slate-200">
              <summary className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors">
                {faq.q}
              </summary>
              <p className="text-slate-600 mt-3">
                {faq.a}
              </p>
            </details>
          ))}
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
