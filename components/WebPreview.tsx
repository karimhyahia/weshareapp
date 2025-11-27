
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CardData } from '../types';
import { THEMES, ICON_MAP, adjustColor, getYoutubeEmbedUrl } from '../constants';
import { ExternalLink, MapPin, Star, ArrowRight, Layout, Phone, Smartphone, MessageCircle, Mail, X, Send, Loader2, Check } from 'lucide-react';
import { getUserSubscription } from '../subscriptionUtils';

interface WebPreviewProps {
    data: CardData;
}

export const WebPreview: React.FC<WebPreviewProps> = ({ data }) => {
    const [isPro, setIsPro] = useState(false);

    const presetTheme = THEMES.find(t => t.id === data.themeId) || THEMES[0];

    // Determine styles for web view
    const gradientStyle = data.customThemeColor
        ? { background: `linear-gradient(135deg, ${data.customThemeColor} 0%, ${adjustColor(data.customThemeColor, -40)} 100%)` }
        : {};

    const gradientClass = data.customThemeColor ? '' : presetTheme.gradient;

    // For text clips in hero
    const textGradientStyle = data.customThemeColor
        ? {
            background: `linear-gradient(to right, ${data.customThemeColor}, ${adjustColor(data.customThemeColor, -40)})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
        }
        : {};

    const textGradientClass = data.customThemeColor ? 'text-transparent bg-clip-text' : `text-transparent bg-clip-text bg-gradient-to-r ${presetTheme.gradient.replace('bg-', '')}`;

    const getIcon = (iconKey: string) => {
        const IconComponent = ICON_MAP[iconKey] || ExternalLink;
        return <IconComponent size={18} />;
    };

    const videoEmbedUrl = isPro && data.video?.enabled && data.video?.url ? getYoutubeEmbedUrl(data.video.url) : null;

    // Analytics & State
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactFormState, setContactFormState] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactMessage, setContactMessage] = useState('');

    // Check subscription tier
    useEffect(() => {
        const checkSubscription = async () => {
            const subscription = await getUserSubscription();
            if (subscription && subscription.tierId !== 'free') {
                setIsPro(true);
            }
        };
        checkSubscription();
    }, []);

    useEffect(() => {
        // Track View
        const trackView = async () => {
            try {
                await supabase.from('analytics_events').insert({
                    site_id: data.id,
                    type: 'view',
                    data: { referrer: document.referrer }
                });
            } catch (e) {
                console.error("Failed to track view", e);
            }
        };
        trackView();
    }, [data.id]);

    const trackClick = async (linkId: string, platform: string, url: string) => {
        try {
            await supabase.from('analytics_events').insert({
                site_id: data.id,
                type: 'click',
                data: { link_id: linkId, platform, url }
            });
        } catch (e) {
            console.error("Failed to track click", e);
        }
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setContactFormState('sending');

        try {
            // 1. Save submission
            const { error } = await supabase.from('contact_submissions').insert({
                site_id: data.id,
                name: contactName,
                email: contactEmail,
                message: contactMessage,
                data: { source: 'web_preview' }
            });

            if (error) throw error;

            // 2. Track event
            await supabase.from('analytics_events').insert({
                site_id: data.id,
                type: 'contact',
                data: { source: 'web_preview' }
            });

            // 3. Send Email via Edge Function
            await supabase.functions.invoke('send-email', {
                body: {
                    to: 'info.mediaonearth@gmail.com', // Updated to match Resend verified email
                    subject: `New Contact from ${data.profile.name}'s Website`,
                    html: `
                      <h2>New Contact Request</h2>
                      <p><strong>Name:</strong> ${contactName}</p>
                      <p><strong>Email:</strong> ${contactEmail}</p>
                      <p><strong>Message:</strong><br/>${contactMessage}</p>
                    `,
                    replyTo: contactEmail
                }
            });

            setContactFormState('sent');
            setContactName('');
            setContactEmail('');
            setContactMessage('');

            setTimeout(() => {
                setShowContactModal(false);
                setContactFormState('idle');
            }, 2000);

        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message. Please try again.");
            setContactFormState('idle');
        }
    };

    return (
        <div className={`w-full h-full overflow-y-auto custom-scrollbar relative ${data.font} text-slate-800`}>
            {/* Background Gradient */}
            <div className={`fixed inset-0 ${gradientClass} opacity-10 pointer-events-none`} style={gradientStyle}></div>
            <div className="fixed inset-0 bg-white/80 backdrop-blur-3xl pointer-events-none"></div>

            {/* Navbar */}
            <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/40 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {data.company?.enabled && data.company.logoUrl && (
                            <img src={data.company.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                        )}
                        <span className="font-bold text-xl tracking-tight text-slate-900">
                            {data.company?.enabled ? data.company.name : data.profile.name}
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        {(data.services || []).length > 0 && (
                            <a href="#services" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Services</a>
                        )}
                        {(data.projects || []).length > 0 && (
                            <a href="#projects" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Projects</a>
                        )}
                        {isPro && (
                            <button
                                onClick={() => setShowContactModal(true)}
                                className={`px-5 py-2 rounded-full text-sm font-medium text-white shadow-lg hover:opacity-90 transition-all ${gradientClass}`}
                                style={gradientStyle}
                            >
                                Contact Me
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 space-y-24">

                {/* Hero Section */}
                <section className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-20 min-h-[60vh]">
                    <div className="flex-1 space-y-8 text-center md:text-left animate-fade-in">
                        <div className="space-y-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600`}>
                                {data.profile.title}
                            </span>
                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
                                Hi, I'm <br />
                                <span className={textGradientClass} style={textGradientStyle}>
                                    {data.profile.name}
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto md:mx-0">
                                {data.profile.bio}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            {data.profile.phone && (
                                <a href={`tel:${data.profile.phone}`} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all hover:scale-105">
                                    <Phone size={18} /> Call Now
                                </a>
                            )}
                            {data.links.slice(0, 2).map(link => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => trackClick(link.id, link.platform, link.url)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all hover:scale-105"
                                >
                                    {getIcon(link.icon)} {link.platform}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="relative w-64 h-64 md:w-96 md:h-96 flex-shrink-0 animate-blob">
                        <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 ${gradientClass}`} style={gradientStyle}></div>
                        <img
                            src={data.profile.avatarUrl}
                            alt={data.profile.name}
                            className="relative w-full h-full object-cover rounded-[2rem] rotate-3 shadow-2xl border-4 border-white transform hover:rotate-0 transition-all duration-500"
                        />
                    </div>
                </section>

                {/* Featured Video Section */}
                {videoEmbedUrl && (
                    <section className="max-w-4xl mx-auto w-full">
                        <div className="text-center mb-8 space-y-2">
                            <h2 className="text-3xl font-bold text-slate-900">{data.video.title || 'Featured Video'}</h2>
                        </div>
                        <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-black">
                            <iframe
                                src={videoEmbedUrl}
                                title="Featured Video"
                                className="w-full h-full"
                                allowFullScreen
                                frameBorder="0"
                            ></iframe>
                        </div>
                    </section>
                )}

                {/* Services Section */}
                {(data.services || []).length > 0 && (
                    <section id="services" className="space-y-10">
                        <div className="text-center max-w-2xl mx-auto space-y-2">
                            <h2 className="text-3xl font-bold text-slate-900">My Services</h2>
                            <p className="text-slate-500">Professional solutions tailored to your needs.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {data.services.map((service, i) => (
                                <div
                                    key={service.id}
                                    className="group p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div
                                        className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg ${gradientClass}`}
                                        style={gradientStyle}
                                    >
                                        <span className="font-bold text-xl">{i + 1}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{service.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Projects Section */}
                {(data.projects || []).length > 0 && (
                    <section id="projects" className="space-y-10">
                        <div className="flex items-end justify-between">
                            <div className="max-w-2xl space-y-2">
                                <h2 className="text-3xl font-bold text-slate-900">Featured Projects</h2>
                                <p className="text-slate-500">A selection of my recent work.</p>
                            </div>
                            <button className="hidden md:flex items-center gap-2 text-slate-900 font-medium hover:gap-3 transition-all">
                                View All <ArrowRight size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {data.projects.map((project) => (
                                <div key={project.id} className="group relative overflow-hidden rounded-3xl bg-slate-900 aspect-video md:aspect-[4/3] shadow-lg">
                                    {project.imageUrl ? (
                                        <img src={project.imageUrl} alt={project.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className={`absolute inset-0 ${gradientClass} opacity-50`} style={gradientStyle}></div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <h3 className="text-2xl font-bold mb-2">{project.title}</h3>
                                        <p className="text-slate-200 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">{project.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Reviews & Contact Grid */}
                <section className={`grid gap-8 ${isPro && data.business?.reviews.length > 0 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Reviews */}
                    {isPro && data.business?.reviews.length > 0 && (
                        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 -mr-20 -mt-20 ${gradientClass}`} style={gradientStyle}></div>
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-2 text-white/60">
                                    <MapPin size={16} />
                                    <span className="text-sm font-medium uppercase tracking-wider">Verified Reviews</span>
                                </div>

                                <div className="space-y-6">
                                    <div className="text-2xl font-medium leading-relaxed">
                                        "{data.business.reviews[0].text}"
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                                            {data.business.reviews[0].author.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold">{data.business.reviews[0].author}</div>
                                            <div className="flex text-yellow-400 gap-0.5">
                                                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Contact */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-8 md:p-10 flex flex-col justify-center space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">Let's work together</h3>
                            <p className="text-slate-500 mt-2">Get in touch for opportunities or collaborations.</p>
                        </div>
                        <div className="space-y-4">
                            {data.profile.mobile && (
                                <a href={`tel:${data.profile.mobile}`} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                                    <div className="flex items-center gap-3 text-slate-900 font-medium">
                                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 group-hover:text-slate-900"><Smartphone size={16} /></div>
                                        {data.profile.mobile}
                                    </div>
                                    <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-900 -translate-x-2 group-hover:translate-x-0 transition-transform" />
                                </a>
                            )}
                            <a href="mailto:hello@example.com" className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                                <div className="flex items-center gap-3 text-slate-900 font-medium">
                                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 group-hover:text-slate-900"><Mail size={16} /></div>
                                    Email Me
                                </div>
                                <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-900 -translate-x-2 group-hover:translate-x-0 transition-transform" />
                            </a>
                            {data.profile.whatsapp && (
                                <a href={`https://wa.me/${data.profile.whatsapp}`} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                                    <div className="flex items-center gap-3 text-slate-900 font-medium">
                                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 group-hover:text-slate-900"><MessageCircle size={16} /></div>
                                        WhatsApp
                                    </div>
                                    <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-900 -translate-x-2 group-hover:translate-x-0 transition-transform" />
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                <footer className="border-t border-slate-100 pt-12 pb-8 text-center">
                    <div className="flex justify-center gap-6 mb-8">
                        {data.links.map(link => (
                            <a
                                key={link.id}
                                href={link.url}
                                onClick={() => trackClick(link.id, link.platform, link.url)}
                                className="text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                {getIcon(link.icon)}
                            </a>
                        ))}
                    </div>
                    <p className="text-slate-400 text-sm">
                        © {new Date().getFullYear()} {data.profile.name}. Built with WeShare.Site
                    </p>
                </footer>

            </main>

            {/* Contact Modal */}
            {
                showContactModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                            <button
                                onClick={() => setShowContactModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className={`p-6 text-white ${gradientClass}`} style={gradientStyle}>
                                <h3 className="text-xl font-bold">Get in Touch</h3>
                                <p className="text-white/80 text-sm mt-1">Send me a message and I'll get back to you.</p>
                            </div>

                            <div className="p-6">
                                {contactFormState === 'sent' ? (
                                    <div className="py-8 text-center">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Check size={32} />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-900">Message Sent!</h4>
                                        <p className="text-slate-500 mt-2">Thank you for reaching out.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleContactSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={contactName}
                                                onChange={(e) => setContactName(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                                placeholder="Your Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email</label>
                                            <input
                                                required
                                                type="email"
                                                value={contactEmail}
                                                onChange={(e) => setContactEmail(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Message</label>
                                            <textarea
                                                required
                                                rows={4}
                                                value={contactMessage}
                                                onChange={(e) => setContactMessage(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none"
                                                placeholder="How can I help you?"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={contactFormState === 'sending'}
                                            className={`w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 ${gradientClass}`}
                                            style={gradientStyle}
                                        >
                                            {contactFormState === 'sending' ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <>Send Message <Send size={18} /></>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
};
