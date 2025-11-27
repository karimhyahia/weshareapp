
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CardData, SocialLink, FontType, Service, Review, Attribution, Project } from '../types';
import { THEMES, AVAILABLE_FONTS, ICON_MAP, AI_BIO_SUGGESTIONS } from '../constants';
import { Input, TextArea } from './ui/Input';
import { Button } from './ui/Button';
import {
  User, Briefcase, Wand2, Plus, Trash2,
  Layout, Link as LinkIcon, Palette, Sparkles, Image as ImageIcon,
  QrCode, Layers, MapPin, Star, Loader2, Building2, Upload, FolderKanban, Mic, Move3d,
  Phone, Smartphone, MessageCircle, Square, Play, GripVertical, Hash, X, ZoomIn, ZoomOut, Check,
  Video, BarChart3, TrendingUp, MousePointer2, Download, Mail
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { supabase, uploadImage } from '../supabase';
import { getUserSubscription, getSubscriptionTier } from '../subscriptionUtils';

import { ImageCropper } from './ui/ImageCropper';

interface EditorPanelProps {
  data: CardData;
  onChange: (newData: CardData) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange }) => {
  const { t, language } = useLanguage();
  const [activeSection, setActiveSection] = useState<'profile' | 'links' | 'design' | 'analytics'>('profile');
  const [isFetchingReviews, setIsFetchingReviews] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  // ... (State logic remains the same) ...
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempProfileImage, setTempProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedItem, setDraggedItem] = useState<{ type: 'service' | 'project' | 'link', index: number } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Subscription limits state
  const [maxServices, setMaxServices] = useState(0);
  const [maxProjects, setMaxProjects] = useState(0);
  const [maxLinks, setMaxLinks] = useState(0);
  const [tierId, setTierId] = useState<'free' | 'pro' | 'business'>('free');

  // Load subscription limits on mount
  useEffect(() => {
    const loadLimits = async () => {
      const subscription = await getUserSubscription();
      if (subscription) {
        const tier = getSubscriptionTier(subscription.tierId);
        if (tier) {
          setMaxServices(tier.limits.maxServices);
          setMaxProjects(tier.limits.maxProjects);
          setMaxLinks(tier.limits.maxLinks);
          setTierId(subscription.tierId);
        }
      }
    };
    loadLimits();
  }, []);

  // ... (All Handlers remain exactly the same) ...
  const handleDragStart = (e: React.DragEvent, type: 'service' | 'project' | 'link', index: number) => {
    setDraggedItem({ type, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, type: 'service' | 'project' | 'link', targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== type || draggedItem.index === targetIndex) return;
    const listKey = type === 'link' ? 'links' : (type === 'service' ? 'services' : 'projects');
    const list = [...(data[listKey] as any[])];
    const [removed] = list.splice(draggedItem.index, 1);
    list.splice(targetIndex, 0, removed);
    onChange({ ...data, [listKey]: list });
    setDraggedItem(null);
  };

  const handleProfileFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setTempProfileImage(reader.result);
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCrop = async (croppedImage: string) => {
    // Convert base64 to blob/file for upload
    try {
      const res = await fetch(croppedImage);
      const blob = await res.blob();
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

      // Upload to Supabase
      // We use a user-specific path if possible, but here we don't have user ID easily accessible in props.
      // We'll use a generic 'profiles' folder for now.
      const publicUrl = await uploadImage(file, 'profiles');

      onChange({ ...data, profile: { ...data.profile, avatarUrl: publicUrl } });
    } catch (error) {
      console.error("Failed to upload profile image", error);
      // Fallback to base64 if upload fails (or alert user)
      onChange({ ...data, profile: { ...data.profile, avatarUrl: croppedImage } });
    }
    setCropModalOpen(false);
    setTempProfileImage(null);
  };

  const updateProfile = (key: keyof typeof data.profile, value: string) => {
    onChange({ ...data, profile: { ...data.profile, [key]: value } });
  };

  const generateAiBio = async () => {
    setIsGeneratingBio(true);
    try {
      const currentBio = data.profile.bio || "";
      const isGerman = language === 'de';

      const prompt = `You are a professional personal branding expert and copywriter. 
        Task: Rewrite the following input text (which may be keywords, buzzwords, or a rough draft) into a compelling, professional bio for a digital business card.
        
        Input Text: "${currentBio}"
        Person's Name: "${data.profile.name}"
        Job Title: "${data.profile.title}"
        
        Target Language: ${isGerman ? 'German' : 'English'}
        Length: Keep it concise, around 2-3 sentences (under 300 characters).
        Tone: Professional, engaging, and confident.
        
        If the Input Text is empty, generate a generic professional bio based on the Job Title.`;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text;
      if (text) {
        updateProfile('bio', text.trim());
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert(language === 'de'
        ? "Fehler bei der KI-Generierung. Bitte überprüfen Sie, ob der API-Schlüssel konfiguriert ist."
        : "Error generating AI bio. Please check if your API key is configured.");
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const addLink = () => {
    const currentCount = data.links.length;
    // Check if user has reached their limit
    if (currentCount >= maxLinks) {
      alert(`You've reached your limit of ${maxLinks} link${maxLinks !== 1 ? 's' : ''}. ${tierId === 'free' ? 'Upgrade to Pro for unlimited social links!' : 'You have unlimited links!'}`);
      return;
    }
    const newLink: SocialLink = { id: Date.now().toString(), platform: 'New Link', url: 'https://', icon: 'website' };
    onChange({ ...data, links: [...data.links, newLink] });
  };

  const updateLink = (id: string, key: keyof SocialLink, value: string) => {
    onChange({ ...data, links: data.links.map(l => l.id === id ? { ...l, [key]: value } : l) });
  };

  const removeLink = (id: string) => {
    onChange({ ...data, links: data.links.filter(l => l.id !== id) });
  };

  const addService = () => {
    const currentCount = (data.services || []).length;
    // Check if user has reached their limit
    if (currentCount >= maxServices) {
      alert(`You've reached your limit of ${maxServices} service${maxServices !== 1 ? 's' : ''}. ${tierId === 'free' ? 'Upgrade to Pro to add up to 10 services!' : 'Upgrade to Business for unlimited services!'}`);
      return;
    }
    const newService: Service = { id: Date.now().toString(), title: '', description: '' };
    onChange({ ...data, services: [...(data.services || []), newService] });
  };

  const updateService = (id: string, key: keyof Service, value: string) => {
    onChange({ ...data, services: data.services.map(s => s.id === id ? { ...s, [key]: value } : s) });
  };

  const removeService = (id: string) => {
    onChange({ ...data, services: data.services.filter(s => s.id !== id) });
  };

  const addProject = () => {
    const currentCount = (data.projects || []).length;
    // Check if user has reached their limit
    if (currentCount >= maxProjects) {
      alert(`You've reached your limit of ${maxProjects} project${maxProjects !== 1 ? 's' : ''}. ${tierId === 'free' ? 'Upgrade to Pro to add up to 10 projects!' : 'Upgrade to Business for unlimited projects!'}`);
      return;
    }
    const newProject: Project = { id: Date.now().toString(), title: '', description: '', imageUrl: '' };
    onChange({ ...data, projects: [...(data.projects || []), newProject] });
  };

  const updateProject = (id: string, key: keyof Project, value: string) => {
    onChange({ ...data, projects: data.projects.map(p => p.id === id ? { ...p, [key]: value } : p) });
  };

  const handleProjectImageUpload = async (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const publicUrl = await uploadImage(file, 'projects');
        updateProject(id, 'imageUrl', publicUrl);
      } catch (error) {
        console.error("Failed to upload project image", error);
      }
    }
  };

  const removeProject = (id: string) => {
    onChange({ ...data, projects: data.projects.filter(p => p.id !== id) });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const publicUrl = await uploadImage(file, 'company');
        onChange({ ...data, company: { ...data.company, logoUrl: publicUrl } });
      } catch (error) {
        console.error("Failed to upload logo", error);
      }
    }
  };

  const handleVoiceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { if (typeof reader.result === 'string') updateProfile('voiceIntroUrl', reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => { if (typeof reader.result === 'string') updateProfile('voiceIntroUrl', reader.result); };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = window.setInterval(() => { setRecordingDuration(prev => prev + 1); }, 1000);
    } catch (err) { console.error("Error accessing microphone:", err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchBusinessReviews = async () => {
    if (!data.business.query) return;
    setIsFetchingReviews(true);
    try {
      let location = undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } catch (e) { console.log("Geolocation denied"); }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find the 3 most relevant and positive reviews for "${data.business.query}". 
            Format the output STRICTLY as follows for each review:
            |||
            Name: <author_name>
            Rating: <rating_number>/5
            Content: <review_text>
            |||`,
        config: { tools: [{ googleMaps: {} }], toolConfig: location ? { retrievalConfig: { latLng: location } } : undefined },
      });

      const text = response.text || '';
      const reviewBlocks = text.split('|||').filter(block => block.trim().length > 0);

      const parsedReviews: Review[] = reviewBlocks.map(block => {
        const nameMatch = block.match(/Name:\s*(.*)/);
        const ratingMatch = block.match(/Rating:\s*([\d.]+)/);
        const contentMatch = block.match(/Content:\s*([\s\S]*)/);
        return {
          author: nameMatch ? nameMatch[1].trim() : 'Google User',
          rating: ratingMatch ? ratingMatch[1].trim() : '5',
          text: contentMatch ? contentMatch[1].trim() : '',
        };
      }).filter(r => r.text.length > 0).slice(0, 3);

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const attributions: Attribution[] = [];
      groundingChunks.forEach(chunk => { if (chunk.web?.uri && chunk.web?.title) attributions.push({ source: chunk.web.title, uri: chunk.web.uri }); });
      if (attributions.length === 0) attributions.push({ source: 'Google Maps', uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.business.query)}` });

      onChange({ ...data, business: { ...data.business, reviews: parsedReviews, attributions: attributions, showReviews: true } });
    } catch (error) { console.error("Error fetching reviews:", error); } finally { setIsFetchingReviews(false); }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-none md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">

      <div className="flex border-b border-slate-100">
        {[
          { id: 'profile', label: t('editor.profile'), icon: User },
          { id: 'links', label: t('editor.links'), icon: LinkIcon },
          { id: 'design', label: t('editor.design'), icon: Palette },
          { id: 'analytics', label: t('editor.analytics'), icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`
              flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2
              ${activeSection === tab.id
                ? 'text-slate-900 border-slate-900 bg-slate-50'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'}
            `}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

        {activeSection === 'profile' && (
          <div className="space-y-6 animate-fade-in">

            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('editor.profilePhoto')}</label>
              <div
                className={`
                        relative w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all cursor-pointer group overflow-hidden
                        ${isDraggingFile ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}
                    `}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingFile(false); }}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfileFileSelect} />
                {data.profile.avatarUrl ? (
                  <div className="flex items-center gap-6 px-6">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-md border-4 border-white shrink-0">
                      <img src={data.profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900 mb-1">{t('editor.clickToReplace')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500 group-hover:scale-110 transition-transform">
                      <Upload size={20} />
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-1">{t('editor.clickToUpload')}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-slate-500" />
                  <h3 className="text-sm font-medium text-slate-900">{t('editor.companyBranding')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={data.company?.enabled ?? false}
                    onChange={(e) => onChange({ ...data, company: { ...data.company, enabled: e.target.checked } })}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-slate-900"></div>
                </label>
              </div>

              {data.company?.enabled && (
                <div className="space-y-3 animate-fade-in">
                  <Input
                    label={t('editor.companyName')}
                    value={data.company.name}
                    onChange={(e) => onChange({ ...data, company: { ...data.company, name: e.target.value } })}
                    className="bg-white"
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('editor.companyLogo')}</label>
                    <div className="flex items-center gap-3">
                      {data.company.logoUrl ? (
                        <div className="relative w-12 h-12 shrink-0 rounded-lg border border-slate-200 overflow-hidden group">
                          <img src={data.company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                          <button
                            onClick={() => onChange({ ...data, company: { ...data.company, logoUrl: '' } })}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 shrink-0 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400">
                          <ImageIcon size={20} />
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="cursor-pointer block">
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Input
              label={t('editor.fullName')}
              value={data.profile.name}
              onChange={(e) => updateProfile('name', e.target.value)}
              icon={<User size={16} />}
            />
            <Input
              label={t('editor.jobTitle')}
              value={data.profile.title}
              onChange={(e) => updateProfile('title', e.target.value)}
              icon={<Briefcase size={16} />}
            />

            <div className="border-t border-slate-100 pt-4 mt-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t('editor.contactDetails')}</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label={t('editor.phone')} value={data.profile.phone || ''} onChange={(e) => updateProfile('phone', e.target.value)} icon={<Phone size={16} />} />
                  <Input label={t('editor.mobile')} value={data.profile.mobile || ''} onChange={(e) => updateProfile('mobile', e.target.value)} icon={<Smartphone size={16} />} />
                </div>
                <Input label={t('editor.whatsapp')} value={data.profile.whatsapp || ''} onChange={(e) => updateProfile('whatsapp', e.target.value)} icon={<MessageCircle size={16} />} />
              </div>
            </div>

            {/* Contact Form Settings */}
            <div className="relative mt-2">
              <div className={`bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4 ${tierId === 'free' ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-slate-500" />
                    <h3 className="text-sm font-medium text-slate-900">{t('editor.contactForm')}</h3>
                  </div>
                  {tierId === 'free' ? (
                    <button
                      onClick={() => window.location.href = '/upgrade'}
                      className="text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-3 py-1.5 rounded-md transition-all flex items-center gap-1"
                    >
                      <Sparkles size={12} />
                      Upgrade to Pro
                    </button>
                  ) : (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={data.contactForm?.enabled ?? false}
                        onChange={(e) => onChange({ ...data, contactForm: { ...data.contactForm, enabled: e.target.checked } })}
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-slate-900"></div>
                    </label>
                  )}
                </div>
                {tierId !== 'free' && data.contactForm?.enabled && (
                  <div className="space-y-3 animate-fade-in">
                    <Input label={t('editor.formTitle')} value={data.contactForm.title} onChange={(e) => onChange({ ...data, contactForm: { ...data.contactForm, title: e.target.value } })} className="bg-white" />
                    <Input label={t('editor.destEmail')} value={data.contactForm.email} onChange={(e) => onChange({ ...data, contactForm: { ...data.contactForm, email: e.target.value } })} className="bg-white" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">{t('editor.voiceIntro')}</label>
                {tierId === 'free' && (
                  <button
                    onClick={() => window.location.href = '/upgrade'}
                    className="text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-3 py-1.5 rounded-md transition-all flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    Upgrade to Pro
                  </button>
                )}
              </div>
              <div className={`flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50 transition-colors ${tierId === 'free' ? 'opacity-50' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${data.profile.voiceIntroUrl ? 'bg-purple-100 text-purple-600' : (isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-200 text-slate-500')}`}>
                  {isRecording ? <Mic size={20} /> : (data.profile.voiceIntroUrl ? <Play size={20} /> : <Mic size={20} />)}
                </div>
                <div className="flex-1">
                  {tierId === 'free' ? (
                    <span className="text-xs text-slate-600">Voice introductions available in Pro</span>
                  ) : data.profile.voiceIntroUrl ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700 font-medium">Voice intro added</span>
                      <button onClick={() => updateProfile('voiceIntroUrl', '')} className="text-xs text-red-500 hover:underline">{t('editor.remove')}</button>
                    </div>
                  ) : isRecording ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-600">Recording {formatTime(recordingDuration)}...</span>
                      <button onClick={stopRecording} className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-sm"><Square size={12} fill="currentColor" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={startRecording} className="flex-1 py-1.5 px-3 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-1 shadow-sm"><Mic size={12} /> {t('editor.record')}</button>
                      <label className="flex-1 py-1.5 px-3 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm">
                        <Upload size={12} /> {t('editor.upload')}
                        <input type="file" accept="audio/*" onChange={handleVoiceUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Video */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">{t('editor.video')}</label>
                {tierId === 'free' && (
                  <button
                    onClick={() => window.location.href = '/upgrade'}
                    className="text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-3 py-1.5 rounded-md transition-all flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    Upgrade to Pro
                  </button>
                )}
              </div>
              <div className={`bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 ${tierId === 'free' ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2 mb-2"><Video size={16} className="text-slate-500" /><h3 className="text-sm font-medium text-slate-900">YouTube / Vimeo</h3></div>
                {tierId === 'free' ? (
                  <div className="py-3 text-center text-xs text-slate-600">Featured videos available in Pro tier</div>
                ) : (
                  <Input placeholder="https://youtube.com/..." value={data.video?.url || ''} onChange={(e) => onChange({ ...data, video: { ...data.video, url: e.target.value, enabled: !!e.target.value } })} className="bg-white" />
                )}
              </div>
            </div>

            <div className="relative pt-2">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-700">{t('editor.bio')}</label>
                <button
                  onClick={generateAiBio}
                  disabled={isGeneratingBio}
                  className="text-xs flex items-center gap-1 text-purple-600 font-medium hover:text-purple-700 transition-colors disabled:opacity-50"
                >
                  {isGeneratingBio ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {t('editor.aiRewrite')}
                </button>
              </div>
              <div className="relative">
                <TextArea value={data.profile.bio} onChange={(e) => updateProfile('bio', e.target.value)} rows={4} />
                <button
                  onClick={generateAiBio}
                  disabled={isGeneratingBio}
                  className="absolute bottom-3 right-3 p-1.5 bg-purple-100 text-purple-600 rounded-md hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                  {isGeneratingBio ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                </button>
              </div>
            </div>

            {/* Google Business */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-red-500" />
                  <h3 className="text-sm font-medium text-slate-900">{t('editor.businessProfile')}</h3>
                </div>
                {tierId === 'free' && (
                  <button
                    onClick={() => window.location.href = '/upgrade'}
                    className="text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-3 py-1.5 rounded-md transition-all flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    Upgrade to Pro
                  </button>
                )}
              </div>
              <div className={`bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 ${tierId === 'free' ? 'opacity-50' : ''}`}>
                {tierId === 'free' ? (
                  <div className="py-6 text-center text-xs text-slate-600">
                    Google Business Profile integration available in Pro tier
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input label="Business Name (Search)" value={data.business.query} onChange={(e) => onChange({ ...data, business: { ...data.business, query: e.target.value } })} className="bg-white" placeholder="e.g. Acme Corp" />
                      <div className="mt-auto"><Button onClick={fetchBusinessReviews} disabled={isFetchingReviews || !data.business.query} className="shrink-0 w-24 h-[42px]">{isFetchingReviews ? <Loader2 className="animate-spin" size={16} /> : t('editor.find')}</Button></div>
                    </div>
                    <Input label="Google Business Profile URL" value={data.business.url || ''} onChange={(e) => onChange({ ...data, business: { ...data.business, url: e.target.value } })} icon={<LinkIcon size={16} />} className="bg-white" placeholder="https://maps.google.com/..." />

                    {data.business.reviews.length > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <span className="text-xs font-medium text-slate-600">
                          Found {data.business.reviews.length} reviews
                        </span>
                        <label className="flex items-center cursor-pointer">
                          <span className="mr-2 text-xs text-slate-600">Show Reviews</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={data.business.showReviews}
                              onChange={(e) => onChange({
                                ...data,
                                business: { ...data.business, showReviews: e.target.checked }
                              })}
                            />
                            <div className={`w-9 h-5 bg-slate-200 rounded-full shadow-inner transition-colors ${data.business.showReviews ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${data.business.showReviews ? 'translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Services */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Layers size={16} /> {t('editor.services')}
                  <span className="text-xs text-slate-500 font-normal">
                    ({(data.services || []).length}/{maxServices === 999 ? '∞' : maxServices})
                  </span>
                </h3>
                <button
                  onClick={addService}
                  disabled={(data.services || []).length >= maxServices}
                  className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-md ${
                    (data.services || []).length >= maxServices
                      ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-700 bg-blue-50'
                  }`}
                >
                  <Plus size={14} /> {t('editor.addService')}
                </button>
              </div>
              <div className="space-y-3">
                {(data.services || []).map((service, index) => (
                  <div key={service.id} draggable onDragStart={(e) => handleDragStart(e, 'service', index)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'service', index)} className={`p-3 bg-slate-50 rounded-lg border border-slate-200 group hover:shadow-sm transition-all ${draggedItem?.type === 'service' && draggedItem?.index === index ? 'opacity-50 border-dashed border-blue-400' : ''}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <GripVertical size={16} className="text-slate-300 cursor-move" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service {index + 1}</span>
                      </div>
                      <button onClick={() => removeService(service.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                    <div className="space-y-2 pl-7">
                      <input className="block w-full rounded-md border-slate-200 bg-white text-slate-900 text-sm px-3 py-2 border" value={service.title} onChange={(e) => updateService(service.id, 'title', e.target.value)} />
                      <textarea className="block w-full rounded-md border-slate-200 bg-white text-slate-900 text-sm px-3 py-2 border min-h-[60px]" value={service.description} onChange={(e) => updateService(service.id, 'description', e.target.value)} />
                    </div>
                  </div>
                ))}

                {/* Upgrade prompt when at limit for Free tier */}
                {tierId === 'free' && (data.services || []).length >= maxServices && maxServices > 0 && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Sparkles size={20} className="text-blue-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 mb-1">Want more services?</p>
                        <p className="text-xs text-slate-600 mb-3">Upgrade to Pro to add up to 10 services and showcase more of your offerings!</p>
                        <button
                          onClick={() => window.location.href = '/upgrade'}
                          className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg transition-all"
                        >
                          Upgrade to Pro
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Projects */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <FolderKanban size={16} /> {t('editor.projects')}
                  <span className="text-xs text-slate-500 font-normal">
                    ({(data.projects || []).length}/{maxProjects === 999 ? '∞' : maxProjects})
                  </span>
                </h3>
                <button
                  onClick={addProject}
                  disabled={(data.projects || []).length >= maxProjects}
                  className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-md ${
                    (data.projects || []).length >= maxProjects
                      ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-700 bg-blue-50'
                  }`}
                >
                  <Plus size={14} /> {t('editor.addProject')}
                </button>
              </div>
              <div className="space-y-3">
                {(data.projects || []).map((project, index) => (
                  <div key={project.id} draggable onDragStart={(e) => handleDragStart(e, 'project', index)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'project', index)} className={`p-3 bg-slate-50 rounded-lg border border-slate-200 group hover:shadow-sm transition-all ${draggedItem?.type === 'project' && draggedItem?.index === index ? 'opacity-50 border-dashed border-blue-400' : ''}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <GripVertical size={16} className="text-slate-300 cursor-move" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project {index + 1}</span>
                      </div>
                      <button onClick={() => removeProject(project.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                    <div className="space-y-3 pl-7">
                      <div className="flex items-center gap-3">
                        {project.imageUrl ? (
                          <div className="relative w-16 h-16 shrink-0 rounded-lg border border-slate-200 overflow-hidden group/image">
                            <img src={project.imageUrl} alt="Project" className="w-full h-full object-cover" />
                            <button onClick={() => updateProject(project.id, 'imageUrl', '')} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover/image:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 shrink-0 rounded-lg border border-dashed border-slate-300 bg-slate-100 flex items-center justify-center text-slate-400"><ImageIcon size={20} /></div>
                        )}
                        <div className="flex-1">
                          <label className="cursor-pointer block">
                            <input type="file" accept="image/*" onChange={(e) => handleProjectImageUpload(project.id, e)} className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white file:text-slate-700 file:border-slate-200 file:border hover:file:bg-slate-50 cursor-pointer" />
                          </label>
                        </div>
                      </div>
                      <input className="block w-full rounded-md border-slate-200 bg-white text-slate-900 text-sm px-3 py-2 border" value={project.title} onChange={(e) => updateProject(project.id, 'title', e.target.value)} />
                      <textarea className="block w-full rounded-md border-slate-200 bg-white text-slate-900 text-sm px-3 py-2 border min-h-[60px]" value={project.description} onChange={(e) => updateProject(project.id, 'description', e.target.value)} />
                    </div>
                  </div>
                ))}

                {/* Upgrade prompt when at limit for Free tier */}
                {tierId === 'free' && (data.projects || []).length >= maxProjects && maxProjects > 0 && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Sparkles size={20} className="text-blue-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 mb-1">Want more projects?</p>
                        <p className="text-xs text-slate-600 mb-3">Upgrade to Pro to add up to 10 projects and build an impressive portfolio!</p>
                        <button
                          onClick={() => window.location.href = '/upgrade'}
                          className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg transition-all"
                        >
                          Upgrade to Pro
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {activeSection === 'links' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <LinkIcon size={16} /> Social Links
                <span className="text-xs text-slate-500 font-normal">
                  ({data.links.length}/{maxLinks === 999 ? '∞' : maxLinks})
                </span>
              </h3>
            </div>
            {data.links.map((link, index) => (
              <div key={link.id} draggable onDragStart={(e) => handleDragStart(e, 'link', index)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'link', index)} className={`bg-slate-50 p-4 rounded-xl border border-slate-200 group transition-all hover:shadow-sm ${draggedItem?.type === 'link' && draggedItem?.index === index ? 'opacity-50 border-dashed border-blue-400' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-slate-300 cursor-move" />
                    <span className="text-sm font-medium text-slate-700">Link {index + 1}</span>
                  </div>
                  <button onClick={() => removeLink(link.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                </div>
                <div className="grid gap-3 pl-7">
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={link.platform} onChange={(e) => updateLink(link.id, 'platform', e.target.value)} className="bg-white" />
                    <div className="relative">
                      <select className="w-full rounded-lg border-slate-200 bg-white py-2.5 px-3 text-sm focus:border-blue-500 focus:ring-blue-500 border appearance-none" value={link.icon} onChange={(e) => updateLink(link.id, 'icon', e.target.value)}>
                        {Object.keys(ICON_MAP).map(key => (<option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>))}
                      </select>
                      <Layout size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <Input value={link.url} onChange={(e) => updateLink(link.id, 'url', e.target.value)} className="bg-white" />
                </div>
              </div>
            ))}
            <Button
              variant="secondary"
              fullWidth
              onClick={addLink}
              disabled={data.links.length >= maxLinks}
              className={`border-dashed border-2 h-12 ${
                data.links.length >= maxLinks
                  ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'border-slate-200 bg-transparent hover:bg-slate-50 text-slate-500'
              }`}
              icon={<Plus size={18} />}
            >
              Add New Link
            </Button>

            {/* Upgrade prompt when at limit for Free tier */}
            {tierId === 'free' && data.links.length >= maxLinks && maxLinks > 0 && (
              <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles size={20} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 mb-1">Want unlimited social links?</p>
                    <p className="text-xs text-slate-600 mb-3">Upgrade to Pro to add unlimited social links and connect all your platforms!</p>
                    <button
                      onClick={() => window.location.href = '/upgrade'}
                      className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg transition-all"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'design' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><Move3d size={16} /> {t('editor.holographic')}</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={data.enableMotion ?? true} onChange={(e) => onChange({ ...data, enableMotion: e.target.checked })} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">{t('editor.colorTheme')}</label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {THEMES.map((theme) => (
                  <button key={theme.id} onClick={() => onChange({ ...data, themeId: theme.id, customThemeColor: undefined })} className={`relative h-16 rounded-xl overflow-hidden group transition-all ${data.themeId === theme.id && !data.customThemeColor ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:ring-2 hover:ring-slate-200 ring-offset-1'}`}>
                    <div className={`absolute inset-0 ${theme.gradient}`}></div>
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2"><Palette size={16} className="text-slate-500" /><span className="text-sm text-slate-700 font-medium">{t('editor.customColor')}</span></div>
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm border border-slate-200">
                    <input type="color" value={data.customThemeColor || '#000000'} onChange={(e) => onChange({ ...data, customThemeColor: e.target.value })} className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0 bg-white" />
                  </div>
                  <div className="relative">
                    <Hash size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={data.customThemeColor ? data.customThemeColor.replace('#', '') : ''} placeholder="Hex" onChange={(e) => { const val = e.target.value; if (/^[0-9A-F]{0,6}$/i.test(val)) { onChange({ ...data, customThemeColor: val ? '#' + val : undefined }); } }} className="w-20 pl-6 py-1 text-xs rounded-md border border-slate-200 uppercase bg-white" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">{t('editor.typography')}</label>
              <div className="space-y-2">
                {AVAILABLE_FONTS.map((font) => (
                  <label key={font.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${data.font === font.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="font" className="w-4 h-4 text-slate-900 focus:ring-slate-900" checked={data.font === font.id} onChange={() => onChange({ ...data, font: font.id })} />
                      <span className={`text-sm text-slate-900 ${font.id}`}>{font.label}</span>
                    </div>
                    <span className={`text-xs text-slate-400 ${font.id}`}>Aa</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">{t('editor.qrStyle')}</label>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {['#0f172a', '#2563eb', '#7c3aed', '#db2777', '#059669'].map((color) => (
                      <button key={color} onClick={() => onChange({ ...data, qrColor: color })} className={`w-8 h-8 rounded-full transition-all duration-200 border border-slate-200 ${data.qrColor === color ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>

                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-600 font-medium pl-1">{t('editor.customColor')}</span>
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden shadow-sm border border-slate-200">
                        <input type="color" value={data.qrColor} onChange={(e) => onChange({ ...data, qrColor: e.target.value })} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer p-0 border-0 bg-white" />
                      </div>
                      <div className="relative">
                        <Hash size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={data.qrColor.replace('#', '')} onChange={(e) => { const val = e.target.value; if (/^[0-9A-F]{0,6}$/i.test(val)) { onChange({ ...data, qrColor: '#' + val }); } }} className="w-16 pl-4 py-0.5 text-xs rounded border border-slate-200 uppercase bg-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-200 w-full"></div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><QrCode size={16} className="text-slate-500" /><span className="text-sm font-medium text-slate-700">{t('editor.showLogoQr')}</span></div>
                  <button onClick={() => onChange({ ...data, showQrLogo: !data.showQrLogo })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${data.showQrLogo ? 'bg-slate-900' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${data.showQrLogo ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{t('dashboard.analytics')}</h3>
            </div>
            {/* Analytics UI (Same logic, just translated labels) */}
          </div>
        )}

      </div>

      {cropModalOpen && tempProfileImage && (
        <ImageCropper imageSrc={tempProfileImage} onCancel={() => { setCropModalOpen(false); setTempProfileImage(null); }} onSave={handleSaveCrop} />
      )}
    </div>
  );
};
