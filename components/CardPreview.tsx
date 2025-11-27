
import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { CardData, Theme, ContactSubmission } from '../types';
import { THEMES, ICON_MAP, adjustColor, getContrastColor, getYoutubeEmbedUrl } from '../constants';
import { ExternalLink, Share2, Layout, ChevronDown, ChevronUp, Star, MapPin, Play, Pause, UserPlus, Contact, Phone, Smartphone, MessageCircle, Video, Send, ArrowRight, Mail, Loader2, Check } from 'lucide-react';
import { supabase } from '../supabase';
import { getUserSubscription } from '../subscriptionUtils';

interface CardPreviewProps {
    data: CardData;
    className?: string;
    onCollectContact?: (contact: ContactSubmission) => void;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ data, className = '', onCollectContact }) => {
    const presetTheme = THEMES.find(t => t.id === data.themeId) || THEMES[0];

    // Determine active styles based on custom color or preset
    const bgStyle = data.customThemeColor
        ? { background: `linear-gradient(135deg, ${data.customThemeColor} 0%, ${adjustColor(data.customThemeColor, -40)} 100%)` }
        : {};

    const themeClass = data.customThemeColor ? '' : presetTheme.gradient;
    const textColorClass = data.customThemeColor ? getContrastColor(data.customThemeColor) : presetTheme.textColor;

    const isLightTheme = textColorClass === 'text-slate-900';

    // Dynamic contrast-based styles
    const glassClass = data.customThemeColor
        ? (isLightTheme ? 'bg-slate-900/5' : 'bg-white/10')
        : presetTheme.glassColor;

    const borderColorClass = isLightTheme ? 'border-slate-900/10' : 'border-white/10';

    const actionButtonClass = isLightTheme
        ? 'bg-slate-900/5 hover:bg-slate-900/10 border-slate-900/10 text-slate-900'
        : 'bg-white/10 hover:bg-white/20 border-white/10 text-white';

    const primaryButtonClass = isLightTheme
        ? 'bg-slate-900 text-white shadow-lg'
        : 'bg-white text-slate-900 shadow-lg';

    const [showAllServices, setShowAllServices] = useState(false);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [showBranding, setShowBranding] = useState(true); // Show branding by default for Free tier

    // Exchange Contact Form State
    const [exchangeName, setExchangeName] = useState('');
    const [exchangeEmail, setExchangeEmail] = useState('');
    const [exchangePhone, setExchangePhone] = useState('');

    // Contact Form State
    const [contactFormState, setContactFormState] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactMessage, setContactMessage] = useState('');

    const cardRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPro, setIsPro] = useState(false);

    // Check subscription to determine features availability
    useEffect(() => {
        const checkSubscription = async () => {
            const subscription = await getUserSubscription();
            // Hide branding for Pro and Business users (show only for Free tier)
            if (subscription && subscription.tierId !== 'free') {
                setShowBranding(false);
                setIsPro(true);
            }
        };
        checkSubscription();
    }, []);

    const getIcon = (iconKey: string) => {
        const IconComponent = ICON_MAP[iconKey] || ExternalLink;
        return <IconComponent size={18} />;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!data.enableMotion || !cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        setRotation({ x: rotateX, y: rotateY });
        setGlowPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
    };

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 0 });
    };

    const toggleAudio = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSaveContact = () => {
        const vcard = `BEGIN:VCARD
VERSION:3.0
N:${data.profile.name};;;;
FN:${data.profile.name}
TITLE:${data.profile.title}
ORG:${data.company?.name || ''}
NOTE:${data.profile.bio}
URL:${data.links[0]?.url || ''}
${data.profile.phone ? `TEL;TYPE=WORK,VOICE:${data.profile.phone}` : ''}
${data.profile.mobile ? `TEL;TYPE=CELL,VOICE:${data.profile.mobile}` : ''}
${data.profile.whatsapp ? `X-SOCIALPROFILE;type=whatsapp:https://wa.me/${data.profile.whatsapp}` : ''}
END:VCARD`;

        const blob = new Blob([vcard], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.profile.name.replace(/\s+/g, '_')}.vcf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExchangeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onCollectContact) {
            onCollectContact({
                id: Date.now().toString(),
                name: exchangeName,
                email: exchangeEmail,
                phone: exchangePhone,
                date: new Date().toISOString().split('T')[0]
            });
        }
        setShowExchangeModal(false);
        setExchangeName('');
        setExchangeEmail('');
        setExchangePhone('');
        alert("Info sent!");
    };

    const handleContactFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setContactFormState('sending');

        try {
            // 1. Save to Database (already handled by parent or separate logic if needed, but here we just send email for now as per request)
            // Ideally, we should also save to `contact_submissions` table here if not already done.
            // The current implementation in WebPreview does both. CardPreview seems to lack the direct DB insertion logic in the previous snippet, 
            // but the user asked for "mailing feature". I will add the email sending part.

            // 2. Send Email via Edge Function
            const { error } = await supabase.functions.invoke('send-email', {
                body: {
                    to: 'info.mediaonearth@gmail.com', // Updated to match Resend verified email
                    subject: `New Contact from ${data.profile.name}'s Card`,
                    html: `
                    <h2>New Contact Request</h2>
                    <p><strong>Name:</strong> ${contactName}</p>
                    <p><strong>Email:</strong> ${contactEmail}</p>
                    <p><strong>Message:</strong><br/>${contactMessage}</p>
                  `,
                    replyTo: contactEmail
                }
            });

            if (error) throw error;

            setContactFormState('sent');
            setContactName('');
            setContactEmail('');
            setContactMessage('');

            setTimeout(() => setContactFormState('idle'), 3000);
        } catch (err) {
            console.error('Error sending email:', err);
            alert('Failed to send message. Please try again.');
            setContactFormState('idle');
        }
    };

    const services = data.services || [];
    const visibleServices = showAllServices ? services : services.slice(0, 2);
    const hasMoreServices = services.length > 2;

    const projects = data.projects || [];

    const reviews = data.business?.reviews || [];
    const showReviews = isPro && data.business?.showReviews && reviews.length > 0;

    const hasContactQuickActions = data.profile.phone || data.profile.mobile || data.profile.whatsapp;

    const videoEmbedUrl = isPro && data.video?.enabled && data.video?.url ? getYoutubeEmbedUrl(data.video.url) : null;

    return (
        <div
            className="perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                ref={cardRef}
                className={`relative mx-auto w-full max-w-[340px] aspect-[9/16] rounded-[2.5rem] shadow-2xl overflow-hidden border-[8px] border-slate-900 bg-slate-900 transition-transform ease-out duration-100 ${className}`}
                style={{
                    transform: data.enableMotion ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` : 'none',
                    transformStyle: 'preserve-3d',
                }}
            >
                <div className="absolute top-0 left-0 right-0 h-6 bg-black/20 z-30 flex justify-between px-6 items-center">
                    <span className="text-[10px] text-white font-medium">9:41</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full bg-white/20"></div>
                        <div className="w-3 h-3 rounded-full bg-white/20"></div>
                    </div>
                </div>

                {data.enableMotion && (
                    <div
                        className="absolute inset-0 z-20 pointer-events-none opacity-40 mix-blend-overlay transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`
                        }}
                    ></div>
                )}

                <div className={`absolute inset-0 ${themeClass} transition-all duration-500`} style={bgStyle}>
                    <div className={`absolute top-[-20%] left-[-20%] w-64 h-64 rounded-full blur-3xl animate-blob ${isLightTheme ? 'bg-slate-900/5' : 'bg-white/10'}`}></div>
                    <div className={`absolute bottom-[-20%] right-[-20%] w-64 h-64 rounded-full blur-3xl animate-blob animation-delay-2000 ${isLightTheme ? 'bg-slate-900/5' : 'bg-white/10'}`}></div>
                </div>

                {data.company?.enabled && (
                    <div className="absolute top-10 right-4 bg-white rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2 z-20 animate-fade-in transform translate-z-10" style={{ transform: 'translateZ(20px)' }}>
                        {data.company.logoUrl && (
                            <img src={data.company.logoUrl} alt="Logo" className="w-5 h-5 rounded-full object-cover" />
                        )}
                        {data.company.name && (
                            <span className="font-bold text-slate-900 text-[10px] tracking-wide">{data.company.name}</span>
                        )}
                    </div>
                )}

                <div className={`relative h-full flex flex-col overflow-y-auto no-scrollbar pt-14 pb-8 px-6 z-10 ${data.font} ${textColorClass}`} style={{ transform: 'translateZ(0px)' }}>

                    <div className="flex flex-col items-center text-center animate-fade-in mt-6">
                        <div className="relative mb-6 group transform transition-transform hover:scale-105 duration-300" style={{ transform: 'translateZ(30px)' }}>
                            <div className={`absolute -inset-0.5 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500 ${isLightTheme ? 'bg-slate-900' : 'bg-white'}`}></div>
                            <img
                                src={data.profile.avatarUrl}
                                alt={data.profile.name}
                                className={`relative w-28 h-28 rounded-full object-cover border-4 shadow-xl ${isLightTheme ? 'border-slate-900/10' : 'border-white/20'}`}
                            />
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight mb-1 shadow-sm" style={{ transform: 'translateZ(20px)' }}>
                            {data.profile.name || 'Your Name'}
                        </h1>
                        <p className={`text-sm font-medium opacity-90 mb-4`}>
                            {data.profile.title || 'Job Title'}
                        </p>

                        {isPro && data.profile.voiceIntroUrl && (
                            <div className="mb-6 w-full max-w-[200px] animate-fade-in">
                                <audio ref={audioRef} src={data.profile.voiceIntroUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                                <button
                                    onClick={toggleAudio}
                                    className={`
                            w-full flex items-center gap-3 p-2 rounded-full backdrop-blur-md border transition-all duration-200
                            ${isLightTheme
                                            ? (isPlaying ? 'bg-slate-900/10 border-slate-900/20' : 'bg-slate-900/5 border-slate-900/10 hover:bg-slate-900/10')
                                            : (isPlaying ? 'bg-white/30 border-white/40' : 'bg-white/10 border-white/20 hover:bg-white/20')
                                        }
                        `}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isLightTheme ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                                        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                                    </div>
                                    <div className="flex-1 flex items-center gap-0.5 h-4 overflow-hidden">
                                        {[...Array(12)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-1 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''} ${isLightTheme ? 'bg-slate-900' : 'bg-white'}`}
                                                style={{
                                                    height: isPlaying ? `${Math.random() * 100}%` : '30%',
                                                    animationDelay: `${i * 0.1}s`
                                                }}
                                            ></div>
                                        ))}
                                    </div>
                                </button>
                            </div>
                        )}

                        <p className="text-sm leading-relaxed opacity-80 max-w-[260px] mb-6">
                            {data.profile.bio || 'Your professional bio goes here.'}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mb-6 w-full">
                            <button
                                onClick={handleSaveContact}
                                className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:scale-105 hover:shadow-xl transition-all flex items-center justify-center gap-2 ${primaryButtonClass}`}
                            >
                                <UserPlus size={14} /> Save
                            </button>
                            <button
                                onClick={() => setShowExchangeModal(true)}
                                className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:scale-105 hover:shadow-xl transition-all flex items-center justify-center gap-2 backdrop-blur-md border ${glassClass} ${borderColorClass}`}
                            >
                                <ArrowRight size={14} /> Exchange
                            </button>
                        </div>

                        {hasContactQuickActions && (
                            <div className="flex items-center justify-center gap-4 mb-8">
                                {data.profile.phone && (
                                    <a
                                        href={`tel:${data.profile.phone}`}
                                        className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all hover:scale-110 shadow-sm ${actionButtonClass}`}
                                        title="Call Office"
                                    >
                                        <Phone size={18} />
                                    </a>
                                )}
                                {data.profile.mobile && (
                                    <a
                                        href={`tel:${data.profile.mobile}`}
                                        className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all hover:scale-110 shadow-sm ${actionButtonClass}`}
                                        title="Call Mobile"
                                    >
                                        <Smartphone size={18} />
                                    </a>
                                )}
                                {data.profile.whatsapp && (
                                    <a
                                        href={`https://wa.me/${data.profile.whatsapp}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all hover:scale-110 shadow-sm ${actionButtonClass}`}
                                        title="WhatsApp"
                                    >
                                        <MessageCircle size={18} />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Featured Video */}
                    {videoEmbedUrl && (
                        <div className="mb-8 animate-fade-in w-full">
                            <div className={`rounded-2xl overflow-hidden shadow-lg border ${borderColorClass} bg-black/10 aspect-video`}>
                                <iframe
                                    src={videoEmbedUrl}
                                    title="Featured Video"
                                    className="w-full h-full"
                                    allowFullScreen
                                    frameBorder="0"
                                ></iframe>
                            </div>
                        </div>
                    )}

                    {services.length > 0 && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-3 text-center">Services</h3>
                            <div className="space-y-3">
                                {visibleServices.map((service) => (
                                    <div
                                        key={service.id}
                                        className={`
                                p-4 rounded-xl backdrop-blur-sm border
                                ${glassClass} ${borderColorClass}
                            `}
                                    >
                                        <h4 className="font-bold text-sm mb-1">{service.title}</h4>
                                        <p className="text-xs opacity-80 leading-relaxed">{service.description}</p>
                                    </div>
                                ))}
                            </div>

                            {hasMoreServices && (
                                <button
                                    onClick={() => setShowAllServices(!showAllServices)}
                                    className="w-full mt-2 py-2 flex items-center justify-center gap-1 text-xs font-medium opacity-70 hover:opacity-100 transition-opacity"
                                >
                                    {showAllServices ? (
                                        <>Show Less <ChevronUp size={12} /></>
                                    ) : (
                                        <>Show {services.length - 2} More <ChevronDown size={12} /></>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {projects.length > 0 && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-3 text-center">Featured Projects</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {projects.map((project) => (
                                    <div
                                        key={project.id}
                                        className={`
                                rounded-xl backdrop-blur-sm border overflow-hidden
                                ${glassClass} ${borderColorClass}
                            `}
                                    >
                                        {project.imageUrl && (
                                            <div className="w-full h-32 bg-black/20">
                                                <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="p-3">
                                            <h4 className="font-bold text-sm mb-1">{project.title}</h4>
                                            <p className="text-xs opacity-80 leading-relaxed line-clamp-2">{project.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {showReviews && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-3 text-center flex items-center justify-center gap-1">
                                <MapPin size={10} /> Verified Reviews
                            </h3>
                            <div className="space-y-3">
                                {reviews.map((review, index) => (
                                    <div key={index} className={`p-3 rounded-xl backdrop-blur-sm border ${glassClass} ${borderColorClass}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold">{review.author}</span>
                                            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${isLightTheme ? 'bg-slate-900/10' : 'bg-white/20'}`}>
                                                <span className="text-[10px] font-bold">{review.rating}</span>
                                                <Star size={8} fill="currentColor" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] opacity-80 leading-snug line-clamp-3 italic">
                                            "{review.text}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {data.business.attributions.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-2 mt-2">
                                    {data.business.attributions.map((attr, idx) => (
                                        <a
                                            key={idx}
                                            href={attr.uri}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[9px] opacity-60 hover:opacity-100 hover:underline transition-opacity"
                                        >
                                            Source: {attr.source}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="w-full flex flex-col gap-3 flex-1 mb-6">
                        {data.links.map((link) => (
                            <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`
                flex items-center justify-between w-full px-4 py-3.5 rounded-xl
                backdrop-blur-md transition-all duration-300
                ${glassClass} ${borderColorClass}
                hover:scale-[1.02] ${isLightTheme ? 'hover:bg-slate-900/10' : 'hover:bg-white/20'}
                active:scale-95
              `}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`p-1.5 rounded-lg ${isLightTheme ? 'bg-slate-900/10' : 'bg-white/10'}`}>
                                        {getIcon(link.icon)}
                                    </span>
                                    <span className="font-medium text-sm">{link.platform}</span>
                                </div>
                                <Share2 size={14} className="opacity-50" />
                            </a>
                        ))}
                    </div>

                    {/* Contact Form */}
                    {isPro && data.contactForm?.enabled && (
                        <div className="mb-8 animate-fade-in w-full">
                            <div className={`p-5 rounded-2xl backdrop-blur-md border ${glassClass} ${borderColorClass}`}>
                                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                    <Mail size={14} /> {data.contactForm.title || "Get in Touch"}
                                </h3>

                                {contactFormState === 'sent' ? (
                                    <div className="py-8 text-center">
                                        <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 ${isLightTheme ? 'bg-green-100 text-green-600' : 'bg-green-500/20 text-green-400'}`}>
                                            <Check size={20} />
                                        </div>
                                        <p className="font-medium text-sm">Message Sent!</p>
                                        <p className="text-xs opacity-70 mt-1">Thanks for reaching out.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleContactFormSubmit} className="space-y-3">
                                        <input
                                            required
                                            type="text"
                                            placeholder="Your Name"
                                            value={contactName}
                                            onChange={(e) => setContactName(e.target.value)}
                                            className={`w-full px-3 py-2.5 rounded-xl text-xs outline-none transition-all placeholder:opacity-60 ${isLightTheme ? 'bg-slate-900/5 focus:bg-slate-900/10' : 'bg-white/10 focus:bg-white/20'} ${textColorClass}`}
                                        />
                                        <input
                                            required
                                            type="email"
                                            placeholder="Your Email"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            className={`w-full px-3 py-2.5 rounded-xl text-xs outline-none transition-all placeholder:opacity-60 ${isLightTheme ? 'bg-slate-900/5 focus:bg-slate-900/10' : 'bg-white/10 focus:bg-white/20'} ${textColorClass}`}
                                        />
                                        <textarea
                                            required
                                            rows={3}
                                            placeholder="How can I help you?"
                                            value={contactMessage}
                                            onChange={(e) => setContactMessage(e.target.value)}
                                            className={`w-full px-3 py-2.5 rounded-xl text-xs outline-none transition-all placeholder:opacity-60 resize-none ${isLightTheme ? 'bg-slate-900/5 focus:bg-slate-900/10' : 'bg-white/10 focus:bg-white/20'} ${textColorClass}`}
                                        />
                                        <button
                                            type="submit"
                                            disabled={contactFormState === 'sending'}
                                            className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${primaryButtonClass} ${contactFormState === 'sending' ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                                        >
                                            {contactFormState === 'sending' ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <>Send Message <Send size={12} /></>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-auto flex justify-center animate-fade-in pb-4">
                        <div className="p-3 bg-white rounded-2xl shadow-lg relative group">
                            <div className="relative">
                                <QRCode
                                    value={`https://weshare.site/u/${data.profile.name.replace(/\s+/g, '').toLowerCase()}`}
                                    size={100}
                                    style={{ height: "auto", maxWidth: "100%", width: "100px" }}
                                    viewBox={`0 0 256 256`}
                                    fgColor={data.qrColor}
                                    level="H"
                                />
                                {data.showQrLogo && (
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-md p-0.5 flex items-center justify-center shadow-sm border border-slate-100">
                                        {data.company.logoUrl ? (
                                            <img
                                                src={data.company.logoUrl}
                                                alt="Logo"
                                                className="w-full h-full object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded flex items-center justify-center text-white" style={{ backgroundColor: data.qrColor }}>
                                                <Layout size={14} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {showBranding && (
                        <div className="mt-6 pt-4 border-t border-white/10 text-center">
                            <span className="text-[10px] opacity-50 uppercase tracking-widest">WeShare.Site</span>
                        </div>
                    )}
                </div>

                {/* Exchange Contact Modal Overlay */}
                {showExchangeModal && (
                    <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-6 flex items-center justify-center animate-fade-in">
                        <div className="bg-white rounded-2xl w-full p-6 shadow-2xl relative">
                            <button
                                onClick={() => setShowExchangeModal(false)}
                                className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600"
                            >
                                <Share2 size={16} />
                            </button>

                            <div className="text-center mb-5">
                                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3 text-white shadow-lg">
                                    <Send size={20} />
                                </div>
                                <h3 className="text-slate-900 font-bold">Let's Connect!</h3>
                                <p className="text-slate-500 text-xs mt-1">Share your details with {data.profile.name}</p>
                            </div>

                            <form className="space-y-3" onSubmit={handleExchangeSubmit}>
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    required
                                    value={exchangeName}
                                    onChange={(e) => setExchangeName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                />
                                <input
                                    type="email"
                                    placeholder="Your Email"
                                    required
                                    value={exchangeEmail}
                                    onChange={(e) => setExchangeEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                />
                                <input
                                    type="tel"
                                    placeholder="Your Phone"
                                    value={exchangePhone}
                                    onChange={(e) => setExchangePhone(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                />

                                <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors mt-2">
                                    Send My Info
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
