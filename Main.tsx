import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { LandingPage } from './components/LandingPage';
import { Auth } from './components/Auth';
import { FeaturesPage } from './components/FeaturesPage';
import { HowItWorksPage } from './components/HowItWorksPage';
import { PricingPage } from './components/PricingPage';
import { PublicProfile } from './components/PublicProfile';
import { supabase } from './supabase';
import { OnboardingWizard } from './components/OnboardingWizard';

export type PageState = 'landing' | 'features' | 'how-it-works' | 'pricing' | 'login' | 'signup';

export const Main: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // If user is logged in and on a public page (except public profile), redirect to app
                // We check if the path starts with /u/ to allow viewing public profiles while logged in
                if (['/', '/login', '/signup'].includes(location.pathname) && !location.pathname.startsWith('/u/')) {
                    navigate('/app');
                }
            }
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                if (['/', '/login', '/signup'].includes(location.pathname) && !location.pathname.startsWith('/u/')) {
                    navigate('/app');
                }
            } else {
                // If user logs out, redirect to landing
                if (location.pathname.startsWith('/app')) {
                    navigate('/');
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate, location.pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<LandingPage onNavigate={(page) => navigate(page === 'landing' ? '/' : `/${page}`)} />} />
            <Route path="/features" element={<FeaturesPage onNavigate={(page) => navigate(page === 'landing' ? '/' : `/${page}`)} />} />
            <Route path="/how-it-works" element={<HowItWorksPage onNavigate={(page) => navigate(page === 'landing' ? '/' : `/${page}`)} />} />
            <Route path="/pricing" element={<PricingPage onNavigate={(page) => navigate(page === 'landing' ? '/' : `/${page}`)} />} />

            <Route path="/login" element={
                <Auth
                    mode="login"
                    onNavigate={(page) => navigate(`/${page}`)}
                    onSuccess={() => navigate('/app')}
                    onBack={() => navigate('/')}
                />
            } />
            <Route path="/signup" element={
                <Auth
                    mode="signup"
                    onNavigate={(page) => navigate(`/${page}`)}
                    onSuccess={() => navigate('/app')}
                    onBack={() => navigate('/')}
                />
            } />

            <Route path="/app" element={<DashboardLayout onLogout={async () => { await supabase.auth.signOut(); navigate('/'); }} />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />
            <Route path="/u/:username" element={<PublicProfile />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
