
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardData, ContactSubmission, UserSubscription } from '../types';
import { CardPreview } from './CardPreview';
import {
    LayoutGrid, Users, PieChart, Settings, Plus, Search, Filter,
    MoreHorizontal, Edit, Eye, Share2, ArrowUpRight, Signal, SlidersHorizontal,
    Download, Mail, Phone, Calendar, ChevronRight, ArrowDownToLine,
    CreditCard, Lock, Bell, Shield, LogOut, CheckCircle2, Upload, Copy, Trash2, User
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ShareModal } from './ShareModal';
import { useLanguage } from '../LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

import { ImageCropper } from './ui/ImageCropper';
import { uploadImage, supabase } from '../supabase';
import { SubscriptionManager } from './SubscriptionManager';
import { getUserSubscription } from '../subscriptionUtils';

interface DashboardProps {
    sites: CardData[];
    onEdit: (id: string) => void;
    onCreate: () => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onUpdate: (site: CardData) => void;
    onLogout?: () => void;
    userProfile?: { name: string, email: string, avatar: string } | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ sites, onEdit, onCreate, onDelete, onDuplicate, onUpdate, onLogout, userProfile }) => {
    const { t } = useLanguage();
    const [activeView, setActiveView] = useState<'links' | 'contacts' | 'analytics' | 'settings'>('links');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [sharingSite, setSharingSite] = useState<CardData | null>(null);

    // Initialize with props or defaults, but update when props change
    const [userEmail, setUserEmail] = useState(userProfile?.email || '');
    const [userName, setUserName] = useState(userProfile?.name || '');
    const [userAvatar, setUserAvatar] = useState(userProfile?.avatar || '');

    // Subscription State
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);

    // Analytics & Contacts State
    const [analyticsData, setAnalyticsData] = useState({ views: 0, clicks: 0, ctr: 0 });
    const [siteStats, setSiteStats] = useState<Record<string, { views: number, clicks: number, ctr: number }>>({});
    const [realContacts, setRealContacts] = useState<any[]>([]);

    // Fetch Data on View Change
    React.useEffect(() => {
        const fetchData = async () => {
            if (sites.length === 0) return;
            const siteIds = sites.map(s => s.id);

            // Always fetch analytics events for all sites to populate cards and aggregate data
            const { data: events } = await supabase
                .from('analytics_events')
                .select('site_id, type')
                .in('site_id', siteIds);

            if (events) {
                // Calculate per-site stats
                const stats: Record<string, { views: number, clicks: number, ctr: number }> = {};
                siteIds.forEach(id => {
                    stats[id] = { views: 0, clicks: 0, ctr: 0 };
                });

                events.forEach(event => {
                    if (stats[event.site_id]) {
                        if (event.type === 'view') stats[event.site_id].views++;
                        if (event.type === 'click') stats[event.site_id].clicks++;
                    }
                });

                // Calculate CTR for each site
                Object.keys(stats).forEach(id => {
                    const s = stats[id];
                    s.ctr = s.views > 0 ? parseFloat(((s.clicks / s.views) * 100).toFixed(1)) : 0;
                });

                setSiteStats(stats);

                // If in analytics view, aggregate these stats
                if (activeView === 'analytics') {
                    const totalViews = Object.values(stats).reduce((acc, s) => acc + s.views, 0);
                    const totalClicks = Object.values(stats).reduce((acc, s) => acc + s.clicks, 0);
                    const avgCtr = Object.values(stats).length > 0 ?
                        parseFloat((Object.values(stats).reduce((acc, s) => acc + s.ctr, 0) / Object.values(stats).length).toFixed(1)) : 0;
                    setAnalyticsData({ views: totalViews, clicks: totalClicks, ctr: avgCtr });
                }
            }

            if (activeView === 'contacts') {
                const { data: contacts } = await supabase
                    .from('contact_submissions')
                    .select('*')
                    .in('site_id', siteIds)
                    .order('created_at', { ascending: false });

                if (contacts) {
                    setRealContacts(contacts);
                }
            }
        };
        fetchData();
    }, [activeView, sites]);

    // Fetch user subscription
    React.useEffect(() => {
        const loadSubscription = async () => {
            const sub = await getUserSubscription();
            setSubscription(sub);
        };
        loadSubscription();
    }, []);

    // Image Upload State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [tempProfileImage, setTempProfileImage] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Update local state when prop changes (e.g. after fetch)
    React.useEffect(() => {
        if (userProfile) {
            setUserEmail(userProfile.email);
            setUserName(userProfile.name);
            setUserAvatar(userProfile.avatar);
        }
    }, [userProfile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setTempProfileImage(reader.result);
                    setCropModalOpen(true);
                }
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSaveCrop = async (croppedImage: string) => {
        try {
            const res = await fetch(croppedImage);
            const blob = await res.blob();
            const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
            const publicUrl = await uploadImage(file, 'profiles');
            setUserAvatar(publicUrl);
        } catch (error) {
            console.error("Failed to upload profile image", error);
            setUserAvatar(croppedImage); // Fallback
        }
        setCropModalOpen(false);
        setTempProfileImage(null);
    };


    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
    const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'draft'>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);

    // --- Aggregated Data Helpers ---
    // Merge legacy contacts with new DB contacts
    const legacyContacts = sites.flatMap(site =>
        (site.collectedContacts || []).map(contact => ({
            ...contact,
            source: site.internalName,
            type: 'legacy'
        }))
    );

    const dbContacts = realContacts.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        date: c.created_at,
        source: sites.find(s => s.id === c.site_id)?.internalName || 'Unknown',
        type: 'form'
    }));

    const allContacts = [...dbContacts, ...legacyContacts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Use fetched analytics if available, else fallback (or show 0)
    // We use the state `analyticsData` when in analytics view.
    // For the small cards in "Links" view, we still rely on `site.analytics` which might be stale unless we update it.
    // For now, let's update the "Analytics" view variables.

    const displayViews = activeView === 'analytics' ? analyticsData.views : 0;
    const displayClicks = activeView === 'analytics' ? analyticsData.clicks : 0;
    const displayCtr = activeView === 'analytics' ? analyticsData.ctr : 0;

    // --- Filter & Sort Logic ---
    const filteredSites = sites
        .filter(site => {
            const matchesSearch = site.internalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                site.profile.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterStatus === 'all' ? true :
                filterStatus === 'live' ? true : false; // Assuming all are live for now as we don't have a draft status in data yet
            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            if (sortOrder === 'newest') return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(); // Fallback if updatedAt missing
            if (sortOrder === 'oldest') return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
            if (sortOrder === 'name') return (a.profile.name || a.internalName).localeCompare(b.profile.name || b.internalName);
            return 0;
        });

    // Close menu when clicking outside
    const handleMenuToggle = (id: string) => {
        if (openMenuId === id) {
            setOpenMenuId(null);
        } else {
            setOpenMenuId(id);
        }
    };

    const navigate = useNavigate();

    const handleUpgrade = () => {
        navigate('/upgrade');
    };

    const handleSaveProfile = async () => {
        try {
            const { data: { user } } = await import('../supabase').then(m => m.supabase.auth.getUser());
            if (!user) return;

            const { error } = await import('../supabase').then(m => m.supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: userName,
                    email: userEmail,
                    avatar_url: userAvatar,
                    updated_at: new Date().toISOString()
                }));

            if (error) throw error;
            alert("Profile saved!");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile.");
        }
    };


    return (
        <div className="flex h-screen bg-[#F3F4F6] font-sans text-slate-900">
            {/* Dropdown Backdrop */}
            {(openMenuId || showFilterMenu || showSortMenu) && (
                <div className="fixed inset-0 z-10" onClick={() => {
                    setOpenMenuId(null);
                    setShowFilterMenu(false);
                    setShowSortMenu(false);
                }}></div>
            )}

            {/* Sidebar (Desktop) */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 hidden md:flex">
                <div className="p-6 flex items-center gap-2 border-b border-slate-100">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-md">
                        <LayoutGrid size={18} />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-900">WeShare</span>
                </div>

                <div className="p-4 space-y-1 flex-1 overflow-y-auto">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Main</div>
                    <nav className="space-y-0.5">
                        <button
                            onClick={() => setActiveView('links')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${activeView === 'links' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <LayoutGrid size={18} /> {t('dashboard.myLinks')}
                        </button>
                        <button
                            onClick={() => setActiveView('contacts')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${activeView === 'contacts' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <Users size={18} /> {t('dashboard.contacts')}
                            {allContacts.length > 0 && (
                                <span className="ml-auto bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{allContacts.length}</span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveView('analytics')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${activeView === 'analytics' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <PieChart size={18} /> {t('dashboard.analytics')}
                        </button>
                    </nav>

                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6">{t('dashboard.system')}</div>
                    <nav className="space-y-0.5">
                        <button
                            onClick={() => setActiveView('settings')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${activeView === 'settings' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <Settings size={18} /> {t('dashboard.settings')}
                        </button>
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-100">
                    {/* Only show upgrade prompt for free users */}
                    {subscription?.tierId === 'free' && (
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white shadow-lg">
                            <h4 className="font-bold text-sm mb-1">{t('dashboard.upgrade')}</h4>
                            <p className="text-xs opacity-70 mb-3">{t('dashboard.upgradeDesc')}</p>
                            <button
                                onClick={handleUpgrade}
                                className="w-full py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors"
                            >
                                {t('dashboard.viewPlans')}
                            </button>
                        </div>
                    )}

                    <div
                        className="flex items-center gap-3 mt-4 px-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                        onClick={() => setActiveView('settings')}
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 overflow-hidden">
                            <img src={userProfile?.avatar || `https://ui-avatars.com/api/?name=${userName.replace(' ', '+')}&background=random`} alt="User" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
                            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-slate-900">
                            {activeView === 'links' && t('dashboard.myLinks')}
                            {activeView === 'contacts' && t('dashboard.contacts')}
                            {activeView === 'analytics' && t('dashboard.analytics')}
                            {activeView === 'settings' && t('dashboard.settings')}
                        </h1>
                        {activeView === 'links' && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium hidden sm:inline-block">{filteredSites.length} Sites</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        {activeView === 'links' && (
                            <>
                                <div className="hidden md:flex relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={t('common.search')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none w-64 transition-all focus:w-72"
                                    />
                                </div>
                                {sites.length === 0 && (
                                    <Button onClick={onCreate} size="sm" icon={<Plus size={16} />}>{t('dashboard.createNew')}</Button>
                                )}
                            </>
                        )}
                        {activeView === 'contacts' && (
                            <Button variant="outline" size="sm" icon={<ArrowDownToLine size={16} />}>{t('dashboard.exportCsv')}</Button>
                        )}
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">

                    {/* LINKS VIEW */}
                    {activeView === 'links' && (
                        <>
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2 relative">
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                                            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium shadow-sm transition-colors ${filterStatus !== 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <Filter size={14} /> {t('common.filter')}
                                        </button>
                                        {showFilterMenu && (
                                            <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-fade-in">
                                                <button onClick={() => { setFilterStatus('all'); setShowFilterMenu(false); }} className={`w-full px-4 py-2 text-left text-xs font-medium hover:bg-slate-50 ${filterStatus === 'all' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}>All Sites</button>
                                                <button onClick={() => { setFilterStatus('live'); setShowFilterMenu(false); }} className={`w-full px-4 py-2 text-left text-xs font-medium hover:bg-slate-50 ${filterStatus === 'live' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}>Live</button>
                                                <button onClick={() => { setFilterStatus('draft'); setShowFilterMenu(false); }} className={`w-full px-4 py-2 text-left text-xs font-medium hover:bg-slate-50 ${filterStatus === 'draft' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}>Drafts</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={() => setShowSortMenu(!showSortMenu)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm"
                                        >
                                            <SlidersHorizontal size={14} /> {t('common.sort')}
                                        </button>
                                        {showSortMenu && (
                                            <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-fade-in">
                                                <button onClick={() => { setSortOrder('newest'); setShowSortMenu(false); }} className={`w-full px-4 py-2 text-left text-xs font-medium hover:bg-slate-50 ${sortOrder === 'newest' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}>Newest First</button>
                                                <button onClick={() => { setSortOrder('oldest'); setShowSortMenu(false); }} className={`w-full px-4 py-2 text-left text-xs font-medium hover:bg-slate-50 ${sortOrder === 'oldest' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}>Oldest First</button>
                                                <button onClick={() => { setSortOrder('name'); setShowSortMenu(false); }} className={`w-full px-4 py-2 text-left text-xs font-medium hover:bg-slate-50 ${sortOrder === 'name' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}>Name (A-Z)</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {/* Create New Card Placeholder */}
                                {sites.length === 0 && (
                                    <button
                                        onClick={onCreate}
                                        className="group relative aspect-[9/16] md:aspect-auto md:h-[420px] rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-4 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                                            <Plus size={32} />
                                        </div>
                                        <span className="font-medium text-slate-500 group-hover:text-blue-600">{t('dashboard.createNewCard')}</span>
                                    </button>
                                )}

                                {/* Site Cards */}
                                {filteredSites.map((site) => (
                                    <div
                                        key={site.id}
                                        className={`
                                    bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-[420px] relative
                                    ${openMenuId === site.id ? 'z-20 ring-2 ring-slate-900 ring-offset-2' : 'z-0'}
                                `}
                                    >
                                        <div className="flex-1 bg-slate-100 relative overflow-hidden group cursor-pointer rounded-t-3xl" onClick={() => onEdit(site.id)}>
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="transform scale-[0.45] origin-center">
                                                    <CardPreview data={site} className="pointer-events-none shadow-none" />
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <div className="bg-white px-4 py-2 rounded-full shadow-lg text-sm font-bold text-slate-900">
                                                    {t('dashboard.editSite')}
                                                </div>
                                            </div>
                                            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur px-2 py-1 rounded-full shadow-sm border border-white/50">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">{t('dashboard.live')}</span>
                                            </div>
                                        </div>

                                        <div className="p-4 border-t border-slate-100 bg-white z-10 rounded-b-3xl">
                                            <div className="flex justify-between items-start mb-3 relative">
                                                <div className="overflow-hidden">
                                                    <h3 className="font-bold text-slate-900 truncate pr-2" title={site.internalName}>{site.internalName}</h3>
                                                    <a href={`#`} className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 mt-0.5 truncate">
                                                        weshare.site/u/{site.profile.name.replace(/\s+/g, '').toLowerCase()} <ArrowUpRight size={10} />
                                                    </a>
                                                </div>
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMenuToggle(site.id); }}
                                                        className="text-slate-400 hover:text-slate-600 p-1 shrink-0 rounded-full hover:bg-slate-100 transition-colors"
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {openMenuId === site.id && (
                                                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fade-in origin-top-right">
                                                            {/* Duplicate removed as per single site limit */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    console.log('Delete button clicked for site:', site.id);
                                                                    // Close menu first, then trigger delete confirmation after a short delay
                                                                    // This prevents UI conflicts with the blocking window.confirm
                                                                    setOpenMenuId(null);
                                                                    setTimeout(() => onDelete(site.id), 50);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-slate-50"
                                                            >
                                                                <Trash2 size={14} /> {t('common.delete')}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => onEdit(site.id)}
                                                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-medium transition-colors border border-slate-100"
                                                >
                                                    <Edit size={14} /> {t('common.edit')}
                                                </button>
                                                <button
                                                    onClick={() => setActiveView('analytics')}
                                                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-medium transition-colors border border-slate-100"
                                                >
                                                    <PieChart size={14} /> {t('dashboard.stats')}
                                                </button>
                                                <button
                                                    onClick={() => setSharingSite(site)}
                                                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-medium transition-colors border border-slate-100"
                                                >
                                                    <Share2 size={14} /> {t('dashboard.share')}
                                                </button>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-4 text-xs text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <Eye size={12} /> {siteStats[site.id]?.views || 0}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Signal size={12} /> {siteStats[site.id]?.ctr || 0}% CTR
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* CONTACTS VIEW */}
                    {activeView === 'contacts' && (
                        <div className="animate-fade-in max-w-6xl mx-auto">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                {allContacts.length === 0 ? (
                                    <div className="p-12 text-center flex flex-col items-center">
                                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-6 relative">
                                            <Users size={40} />
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                                <Plus size={16} className="text-green-500" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Start Collecting Leads</h3>
                                        <p className="text-slate-500 max-w-md mb-8">
                                            Your digital card is a powerful lead generation tool.
                                            Turn visitors into connections by enabling the contact form.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full mb-8 text-left">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-blue-600 mb-3">
                                                    <Edit size={16} />
                                                </div>
                                                <h4 className="font-bold text-slate-900 text-sm mb-1">1. Enable Form</h4>
                                                <p className="text-xs text-slate-500">Go to the editor and toggle on the "Contact Form" feature.</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-purple-600 mb-3">
                                                    <Share2 size={16} />
                                                </div>
                                                <h4 className="font-bold text-slate-900 text-sm mb-1">2. Share Card</h4>
                                                <p className="text-xs text-slate-500">Share your unique link via QR code, social media, or email.</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-green-600 mb-3">
                                                    <ArrowDownToLine size={16} />
                                                </div>
                                                <h4 className="font-bold text-slate-900 text-sm mb-1">3. Get Leads</h4>
                                                <p className="text-xs text-slate-500">New contacts will automatically appear in this list.</p>
                                            </div>
                                        </div>

                                        {sites.length > 0 && (
                                            <Button onClick={() => onEdit(sites[0].id)} icon={<Edit size={16} />}>
                                                Go to Editor
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-700">Contact Info</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-700 hidden md:table-cell">Source</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-700 hidden sm:table-cell">Date</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {allContacts.map((contact) => (
                                                    <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                                                                    {contact.name.charAt(0)}
                                                                </div>
                                                                <span className="font-medium text-slate-900">{contact.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2 text-slate-600">
                                                                    <Mail size={12} /> {contact.email}
                                                                </div>
                                                                {contact.phone && (
                                                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                                        <Phone size={12} /> {contact.phone}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 hidden md:table-cell">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                                {contact.source}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 hidden sm:table-cell text-slate-500">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={14} />
                                                                {new Date(contact.date).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50">
                                                                <MoreHorizontal size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ANALYTICS VIEW */}
                    {activeView === 'analytics' && (
                        <div className="animate-fade-in max-w-6xl mx-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-2">
                                        <Eye size={16} /> {t('dashboard.totalViews')}
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900">{displayViews.toLocaleString()}</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-2">
                                        <Download size={16} /> {t('dashboard.totalClicks')}
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900">{displayClicks.toLocaleString()}</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-2">
                                        <Signal size={16} /> {t('dashboard.avgCtr')}
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900">{displayCtr}%</div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center h-64 text-center">
                                <div className="bg-slate-50 p-4 rounded-full mb-4">
                                    <PieChart size={32} className="text-slate-400" />
                                </div>
                                <h3 className="font-bold text-slate-900">Detailed Analytics Coming Soon</h3>
                                <p className="text-slate-500 text-sm mt-1">We are building more charts for you.</p>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS VIEW */}
                    {activeView === 'settings' && (
                        <div className="animate-fade-in max-w-4xl mx-auto pb-20">
                            <div className="space-y-6">

                                {/* Profile Section */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-slate-100">
                                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <User size={18} /> General Profile
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1">Manage your personal information.</p>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                <img src={userAvatar || `https://ui-avatars.com/api/?name=${userName.replace(' ', '+')}&background=random&size=128`} alt="Avatar" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Upload size={20} className="text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>{t('editor.upload')}</Button>
                                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                                                <p className="text-xs text-slate-400 mt-2">Recommended: Square JPG, PNG. Max 2MB.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label={t('editor.fullName')} value={userName} onChange={(e) => setUserName(e.target.value)} />
                                            <Input label={t('auth.email')} value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button size="sm" onClick={handleSaveProfile}>{t('common.save')}</Button>
                                        </div>
                                    </div>
                                </div>

                                {cropModalOpen && tempProfileImage && (
                                    <ImageCropper
                                        imageSrc={tempProfileImage}
                                        onCancel={() => {
                                            setCropModalOpen(false);
                                            setTempProfileImage(null);
                                        }}
                                        onSave={handleSaveCrop}
                                    />
                                )}

                                {/* Subscription Section */}
                                <SubscriptionManager onUpgrade={handleUpgrade} />

                                {/* Security Section */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-slate-100">
                                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <Lock size={18} /> Security
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1">Password and security settings.</p>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <Input label="New Password" type="password" placeholder="••••••••" />
                                        <div className="flex justify-end">
                                            <Button size="sm" variant="outline">Update Password</Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-red-50 rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-red-100">
                                        <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                            <Shield size={18} /> Account Actions
                                        </h2>
                                    </div>
                                    <div className="p-6 flex items-center justify-between">
                                        <div className="text-sm text-red-700">
                                            <strong>Log Out</strong>
                                            <p className="opacity-80">Sign out of your session.</p>
                                        </div>
                                        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300" onClick={onLogout}>
                                            <LogOut size={16} className="mr-2" /> {t('common.logOut')}
                                        </Button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                </div>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
                    <div className="flex justify-around items-center h-16 px-2">
                        <button
                            onClick={() => setActiveView('links')}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeView === 'links' ? 'text-slate-900' : 'text-slate-400'}`}
                        >
                            <LayoutGrid size={20} strokeWidth={activeView === 'links' ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{t('dashboard.myLinks')}</span>
                        </button>
                        <button
                            onClick={() => setActiveView('contacts')}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeView === 'contacts' ? 'text-slate-900' : 'text-slate-400'}`}
                        >
                            <div className="relative">
                                <Users size={20} strokeWidth={activeView === 'contacts' ? 2.5 : 2} />
                                {allContacts.length > 0 && (
                                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-blue-600 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white">
                                        {allContacts.length}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium">{t('dashboard.contacts')}</span>
                        </button>
                        <button
                            onClick={() => setActiveView('analytics')}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeView === 'analytics' ? 'text-slate-900' : 'text-slate-400'}`}
                        >
                            <PieChart size={20} strokeWidth={activeView === 'analytics' ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{t('dashboard.analytics')}</span>
                        </button>
                        <button
                            onClick={() => setActiveView('settings')}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeView === 'settings' ? 'text-slate-900' : 'text-slate-400'}`}
                        >
                            <Settings size={20} strokeWidth={activeView === 'settings' ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{t('dashboard.settings')}</span>
                        </button>
                    </div>
                </nav>

            </main >

            {/* Share Modal for Dashboard */}
            {
                sharingSite && (
                    <ShareModal
                        isOpen={!!sharingSite}
                        onClose={() => setSharingSite(null)}
                        data={sharingSite}
                        onUpdate={onUpdate}
                    />
                )
            }
        </div >
    );
};
