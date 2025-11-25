import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout as LayoutIcon, Share2, Smartphone, Monitor, ArrowLeft, Check, LogOut } from 'lucide-react';
import { CardData, Tab, ViewMode } from './types';
import { INITIAL_DATA } from './constants';
import { Button } from './components/ui/Button';
import { EditorPanel } from './components/EditorPanel';
import { CardPreview } from './components/CardPreview';
import { WebPreview } from './components/WebPreview';
import { Dashboard } from './components/Dashboard';
import { ShareModal } from './components/ShareModal';
import { supabase } from './supabase';

interface AppProps {
    onLogout?: () => void;
}

import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';

const DashboardLayout: React.FC<AppProps> = ({ onLogout }) => {
    const navigate = useNavigate();
    const [searchParams] = useState(() => new URLSearchParams(window.location.search));

    // State
    const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
    const [sites, setSites] = useState<CardData[]>([]);
    const [currentSiteId, setCurrentSiteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<{ name: string, email: string, avatar: string } | null>(null);
    const [checkoutMessage, setCheckoutMessage] = useState<{type: 'success' | 'cancelled', show: boolean}>({ type: 'success', show: false });

    // Delete Modal State
    const [siteToDelete, setSiteToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Editor specific state (only relevant when viewMode === 'editor')
    const [activeTab, setActiveTab] = useState<Tab>('editor');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [saving, setSaving] = useState(false);

    // Derived state
    const currentSite = sites.find(s => s.id === currentSiteId) || INITIAL_DATA;

    // Fetch sites on mount
    useEffect(() => {
        fetchSites();
    }, []);

    // Handle checkout success/cancel
    useEffect(() => {
        const checkoutStatus = searchParams.get('checkout');
        if (checkoutStatus === 'success') {
            setCheckoutMessage({ type: 'success', show: true });
            // Refresh subscription data after successful payment
            setTimeout(() => {
                window.location.href = '/app'; // Reload to fetch updated subscription
            }, 3000);
        } else if (checkoutStatus === 'cancelled') {
            setCheckoutMessage({ type: 'cancelled', show: true });
            setTimeout(() => {
                setCheckoutMessage(prev => ({ ...prev, show: false }));
            }, 5000);
        }
    }, [searchParams]);

    const fetchSites = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // If no user, we might be in a demo mode or need to redirect to login
                // For now, let's just show empty or handle it gracefully
                console.log('No user logged in');
                setLoading(false);
                return;
            }

            // Fetch user profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setUserProfile({
                    name: profileData.full_name || user.user_metadata?.full_name || '',
                    email: profileData.email || user.email || '',
                    avatar: profileData.avatar_url || user.user_metadata?.avatar_url || ''
                });
            } else {
                // Fallback if no profile row exists yet
                setUserProfile({
                    name: user.user_metadata?.full_name || '',
                    email: user.email || '',
                    avatar: user.user_metadata?.avatar_url || ''
                });
            }

            const { data, error } = await supabase
                .from('sites')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;

            if (data) {
                if (data.length === 0) {
                    navigate('/onboarding');
                    return;
                }
                const parsedSites: CardData[] = data.map(item => ({
                    ...item.data,
                    id: item.id, // Ensure ID matches the database ID
                    internalName: item.internal_name,
                    slug: item.slug // Load the slug
                }));
                setSites(parsedSites);
            }
        } catch (error) {
            console.error('Error fetching sites:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleEditSite = (id: string) => {
        setCurrentSiteId(id);
        setViewMode('editor');
    };

    const handleCreateSite = async () => {
        if (sites.length >= 1) {
            alert("You can only have one site.");
            return;
        }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('You must be logged in to create a site');
                return;
            }

            const newSiteData: CardData = {
                ...INITIAL_DATA,
                id: 'temp-id', // Will be replaced by DB ID
                internalName: 'New Untitled Site',
                profile: { ...INITIAL_DATA.profile, name: 'Your Name' }
            };

            // Generate a base slug from the name
            const baseSlug = newSiteData.internalName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

            const { data, error } = await supabase
                .from('sites')
                .insert([
                    {
                        user_id: user.id,
                        internal_name: newSiteData.internalName,
                        slug: uniqueSlug,
                        data: { ...newSiteData, slug: uniqueSlug }
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const createdSite: CardData = {
                    ...data.data,
                    id: data.id,
                    internalName: data.internal_name,
                    slug: data.slug
                };
                setSites([createdSite, ...sites]);
                setCurrentSiteId(createdSite.id);
                setViewMode('editor');
            }
        } catch (error) {
            console.error('Error creating site:', error);
            alert('Failed to create site');
        }
    };

    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleUpdateSite = async (updatedData: CardData) => {
        // Check if name changed
        const newName = updatedData.profile.name || 'Untitled Site';
        if (updatedData.internalName !== newName) {
            updatedData.internalName = newName;
            // Regenerate slug
            const baseSlug = newName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            updatedData.slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
        }

        // Optimistic update
        setSites(prevSites => prevSites.map(site => site.id === updatedData.id ? updatedData : site));

        // Debounce save
        setSaving(true);
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveSite(updatedData);
        }, 1000);
    };

    const saveSite = async (siteData: CardData) => {
        try {
            const { error } = await supabase
                .from('sites')
                .update({
                    internal_name: siteData.internalName,
                    slug: siteData.slug, // Update slug if it changed
                    data: siteData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', siteData.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving site:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSite = (id: string) => {
        // Open the confirmation modal instead of window.confirm
        setSiteToDelete(id);
    };

    const confirmDeleteSite = async () => {
        if (!siteToDelete) return;

        try {
            setIsDeleting(true);
            const { error } = await supabase
                .from('sites')
                .delete()
                .eq('id', siteToDelete);

            if (error) throw error;

            setSites(prev => prev.filter(s => s.id !== siteToDelete));
            setSiteToDelete(null);
        } catch (error) {
            console.error('Error deleting site:', error);
            alert('Failed to delete site');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDuplicateSite = async (id: string) => {
        const site = sites.find(s => s.id === id);
        if (site) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const newSiteData = {
                    ...site,
                    id: 'temp-id',
                    internalName: `${site.internalName} (Copy)`,
                    profile: { ...site.profile, name: `${site.profile.name} (Copy)` }
                };

                const { data, error } = await supabase
                    .from('sites')
                    .insert([
                        {
                            user_id: user.id,
                            internal_name: newSiteData.internalName,
                            slug: `${newSiteData.slug}-copy-${Math.random().toString(36).substring(2, 5)}`, // Unique slug for copy
                            data: newSiteData
                        }
                    ])
                    .select()
                    .single();

                if (error) throw error;

                if (data) {
                    const duplicatedSite: CardData = {
                        ...data.data,
                        id: data.id,
                        internalName: data.internal_name,
                        slug: data.slug
                    };
                    setSites(prev => [duplicatedSite, ...prev]);
                }
            } catch (error) {
                console.error('Error duplicating site:', error);
                alert('Failed to duplicate site');
            }
        }
    };

    const handleBackToDashboard = () => {
        setViewMode('dashboard');
        setCurrentSiteId(null);
        fetchSites(); // Refresh data when returning to dashboard
    };

    const toggleTab = (tab: Tab) => setActiveTab(tab);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    // Render Dashboard View
    if (viewMode === 'dashboard') {
        return (
            <div className="min-h-screen font-sans text-slate-900 relative">
                {/* Checkout Success/Cancel Message */}
                {checkoutMessage.show && (
                    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4 ${
                        checkoutMessage.type === 'success'
                            ? 'bg-green-50 border-green-500 text-green-800'
                            : 'bg-yellow-50 border-yellow-500 text-yellow-800'
                    } border-2 rounded-xl p-4 shadow-lg`}>
                        <div className="flex items-center gap-3">
                            {checkoutMessage.type === 'success' ? (
                                <>
                                    <Check className="shrink-0" size={24} />
                                    <div>
                                        <div className="font-bold">Payment Successful! 🎉</div>
                                        <div className="text-sm">Your lifetime access has been activated. Refreshing...</div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="shrink-0 w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold">!</div>
                                    <div>
                                        <div className="font-bold">Payment Cancelled</div>
                                        <div className="text-sm">No worries! You can upgrade anytime.</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <Dashboard
                    sites={sites}
                    onEdit={handleEditSite}
                    onCreate={handleCreateSite}
                    onDelete={handleDeleteSite}
                    onDuplicate={handleDuplicateSite}
                    onUpdate={handleUpdateSite}
                    onLogout={onLogout}
                    userProfile={userProfile}
                />

                <DeleteConfirmationModal
                    isOpen={!!siteToDelete}
                    onClose={() => setSiteToDelete(null)}
                    onConfirm={confirmDeleteSite}
                    isDeleting={isDeleting}
                    itemName={sites.find(s => s.id === siteToDelete)?.internalName}
                />
            </div>
        );
    }

    // Render Editor View
    return (
        <div className="min-h-screen flex flex-col h-screen bg-slate-50 font-sans overflow-hidden selection:bg-blue-100 selection:text-blue-900">

            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBackToDashboard}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                    <div className="flex items-center gap-2 text-slate-900">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                            <LayoutIcon size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm leading-tight">{currentSite.internalName}</span>
                            <span className="text-[10px] text-slate-400 leading-tight">Editing</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Mobile Tabs Toggle */}
                    <div className="flex md:hidden bg-slate-100 p-1 rounded-lg mr-2">
                        <button
                            onClick={() => toggleTab('editor')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'editor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => toggleTab('preview')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            Preview
                        </button>
                    </div>

                    <div className="hidden md:flex items-center gap-2 mr-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            {saving ? (
                                <span className="animate-pulse">Saving...</span>
                            ) : (
                                <>
                                    <Check size={12} className="text-green-500" /> Saved
                                </>
                            )}
                        </span>
                    </div>

                    <Button
                        size="sm"
                        icon={<Share2 size={16} />}
                        onClick={() => setIsShareModalOpen(true)}
                        className="shadow-lg shadow-slate-200/50"
                    >
                        Share
                    </Button>
                </div>
            </header>

            {/* Main Layout */}
            <main className="flex-1 flex overflow-hidden relative">

                {/* Left Panel - Editor */}
                <div className={`
            flex-1 max-w-2xl border-r border-slate-200 bg-white z-10
            absolute inset-0 md:static md:block transition-transform duration-300
            ${activeTab === 'editor' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
                    <div className="h-full p-4 md:p-6 lg:p-8 bg-slate-50/50">
                        <EditorPanel data={currentSite} onChange={handleUpdateSite} />
                    </div>
                </div>

                {/* Right Panel - Preview */}
                <div className={`
            flex-1 bg-slate-100 relative flex flex-col items-center p-4
            absolute inset-0 md:static md:flex transition-transform duration-300
            ${activeTab === 'preview' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
                    {/* Background Decoration */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] opacity-40"></div>
                    </div>

                    <div className="relative z-10 w-full h-full flex flex-col gap-4">

                        {/* Preview Header Controls */}
                        <div className="flex justify-center shrink-0">
                            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex gap-1">
                                <button
                                    onClick={() => setPreviewMode('mobile')}
                                    className={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Mobile View"
                                >
                                    <Smartphone size={20} />
                                </button>
                                <button
                                    onClick={() => setPreviewMode('desktop')}
                                    className={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Desktop View"
                                >
                                    <Monitor size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex items-center justify-center overflow-hidden pb-4">
                            {previewMode === 'mobile' ? (
                                <CardPreview data={currentSite} className="shadow-2xl shadow-slate-400/20" />
                            ) : (
                                <div className="w-full h-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-fade-in">
                                    {/* Browser Toolbar Simulation */}
                                    <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-4 shrink-0">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                                            <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                                        </div>
                                        <div className="flex-1 max-w-lg mx-auto bg-white border border-slate-200 h-6 rounded-md flex items-center justify-center">
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <LayoutIcon size={10} /> weshare.site/u/{currentSite.profile.name.replace(/\s+/g, '').toLowerCase()}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Web Preview Content */}
                                    <div className="flex-1 overflow-hidden relative bg-white">
                                        <WebPreview data={currentSite} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                data={currentSite}
                onUpdate={handleUpdateSite}
            />
        </div>
    );
};

export { DashboardLayout };
