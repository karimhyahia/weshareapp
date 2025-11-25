import React, { useState } from 'react';
import { Layout, Mail, Lock, ArrowRight, User, ArrowLeft, Github } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { supabase } from '../supabase';

interface AuthProps {
   mode: 'login' | 'signup';
   onNavigate: (page: 'login' | 'signup') => void;
   onSuccess: () => void;
   onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ mode, onNavigate, onSuccess, onBack }) => {
   const { t } = useLanguage();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [name, setName] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
         if (mode === 'signup') {
            const { data, error } = await supabase.auth.signUp({
               email,
               password,
               options: {
                  data: {
                     full_name: name,
                  },
               },
            });

            if (error) throw error;

            console.log('Signup response:', data);

            // If email confirmation is disabled, user is auto-confirmed
            if (data.user && data.session) {
               // User is auto-confirmed and logged in
               console.log('User auto-confirmed, redirecting to app');
               onSuccess();
            } else {
               // Email confirmation required
               alert('Please check your email to confirm your account.');
               onNavigate('login');
            }
         } else {
            const { data, error } = await supabase.auth.signInWithPassword({
               email,
               password,
            });

            if (error) {
               console.error('Login error:', error);
               throw error;
            }

            console.log('Login successful:', data);
            onSuccess();
         }
      } catch (err: any) {
         console.error('Auth error:', err);

         // Better error messages
         if (err.message?.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
         } else if (err.message?.includes('Email not confirmed')) {
            setError('Please confirm your email address first.');
         } else {
            setError(err.message || 'Authentication failed. Please try again.');
         }
      } finally {
         setLoading(false);
      }
   };

   const handleSocialLogin = async (provider: 'google' | 'github') => {
      try {
         const { error } = await supabase.auth.signInWithOAuth({
            provider,
         });
         if (error) throw error;
      } catch (err: any) {
         console.error('Social login error:', err);
         setError(err.message || 'An error occurred');
      }
   };

   return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
         {/* Header */}
         <div className="p-6">
            <button
               onClick={onBack}
               className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
               <ArrowLeft size={16} /> {t('common.backToHome')}
            </button>
         </div>

         <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
               <div className="p-8">
                  <div className="flex justify-center mb-8">
                     <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Layout size={24} />
                     </div>
                  </div>

                  <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
                     {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
                  </h2>
                  <p className="text-center text-slate-500 text-sm mb-8">
                     {mode === 'login'
                        ? t('auth.loginDesc')
                        : t('auth.signupDesc')}
                  </p>

                  {error && (
                     <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                        {error}
                     </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                     {mode === 'signup' && (
                        <div>
                           <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">{t('auth.fullName')}</label>
                           <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input
                                 type="text"
                                 required
                                 className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none text-sm transition-all"
                                 placeholder="Jane Doe"
                                 value={name}
                                 onChange={(e) => setName(e.target.value)}
                              />
                           </div>
                        </div>
                     )}

                     <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">{t('auth.email')}</label>
                        <div className="relative">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                           <input
                              type="email"
                              required
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none text-sm transition-all"
                              placeholder="you@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                           />
                        </div>
                     </div>

                     <div>
                        <div className="flex justify-between items-center mb-1.5">
                           <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{t('auth.password')}</label>
                           {mode === 'login' && (
                              <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Forgot?</a>
                           )}
                        </div>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                           <input
                              type="password"
                              required
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none text-sm transition-all"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                           />
                        </div>
                     </div>

                     <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
                     >
                        {loading ? t('auth.processing') : (mode === 'login' ? t('auth.signIn') : t('auth.createAccount'))}
                        {!loading && <ArrowRight size={18} />}
                     </button>
                  </form>

                  <div className="relative my-8">
                     <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                     <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">{t('auth.orContinue')}</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        Google
                     </button>
                     <button onClick={() => handleSocialLogin('github')} className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
                        <Github size={20} />
                        GitHub
                     </button>
                  </div>

                  <div className="mt-8 text-center text-sm">
                     <span className="text-slate-500">
                        {mode === 'login' ? t('auth.noAccount') + " " : t('auth.hasAccount') + " "}
                     </span>
                     <button
                        onClick={() => onNavigate(mode === 'login' ? 'signup' : 'login')}
                        className="font-bold text-slate-900 hover:underline"
                     >
                        {mode === 'login' ? t('auth.createAccount') : t('auth.signIn')}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};
