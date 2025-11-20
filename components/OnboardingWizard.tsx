import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { supabase, uploadImage } from '../supabase';
import { CardData } from '../types';
import { INITIAL_DATA } from '../constants';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { ImageCropper } from './ui/ImageCropper';
import { useLanguage } from '../LanguageContext';
import { Wand2, Loader2, Sparkles, ArrowRight, Check, Upload, User } from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isGeneratingBio, setIsGeneratingBio] = useState(false);

    // Image Upload State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [tempProfileImage, setTempProfileImage] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDraggingFile, setIsDraggingFile] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        jobTitle: '',
        companyName: '',
        phone: '',
        email: '',
        bio: '',
    });

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        try {
            const res = await fetch(croppedImage);
            const blob = await res.blob();
            const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
            const publicUrl = await uploadImage(file, 'profiles');
            setAvatarUrl(publicUrl);
        } catch (error) {
            console.error("Failed to upload profile image", error);
            setAvatarUrl(croppedImage); // Fallback
        }
        setCropModalOpen(false);
        setTempProfileImage(null);
    };

    const generateAiBio = async () => {
        setIsGeneratingBio(true);
        try {
            const isGerman = language === 'de';
            const prompt = `You are a professional personal branding expert. 
            Task: Write a professional bio for a digital business card based on the following details.
            
            Name: "${formData.fullName}"
            Job Title: "${formData.jobTitle}"
            Company: "${formData.companyName}"
            Input Bio/Keywords: "${formData.bio}"
            
            Target Language: ${isGerman ? 'German' : 'English'}
            Length: Concise, 2-3 sentences (under 300 characters).
            Tone: Professional, engaging, and confident.`;

            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            const text = response.text;
            if (text) {
                handleChange('bio', text.trim());
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            alert("Error generating AI bio. Please check your API key.");
        } finally {
            setIsGeneratingBio(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const newSiteData: CardData = {
                ...INITIAL_DATA,
                id: 'temp-id',
                internalName: `${formData.fullName}'s Site`,
                profile: {
                    ...INITIAL_DATA.profile,
                    name: formData.fullName,
                    title: formData.jobTitle,
                    bio: formData.bio,
                    phone: formData.phone,
                    avatarUrl: avatarUrl || INITIAL_DATA.profile.avatarUrl
                },
                company: {
                    ...INITIAL_DATA.company,
                    name: formData.companyName,
                    enabled: !!formData.companyName
                },
                contactForm: {
                    ...INITIAL_DATA.contactForm,
                    email: formData.email,
                    enabled: !!formData.email
                }
            };

            // Generate slug
            const baseSlug = formData.fullName.toLowerCase().replace(/[^a-z0-9]/g, '-');
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

            // Update user profile with collected name and email
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: formData.fullName,
                    email: formData.email,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                });

            if (profileError) {
                console.error("Error updating profile:", profileError);
                // Continue anyway as site creation is the main goal
            }

            navigate('/app');
        } catch (error) {
            console.error("Error creating site:", error);
            alert("Failed to create site. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">

                {/* Left Side - Visual/Info */}
                <div className="bg-slate-900 p-8 text-white md:w-1/3 flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-6">
                            <Sparkles size={20} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
                        <p className="text-slate-400 text-sm">Let's set up your digital business card in just a few steps.</p>
                    </div>

                    <div className="space-y-4 mt-8">
                        <div className={`flex items-center gap-3 text-sm ${step >= 1 ? 'text-white' : 'text-slate-600'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 1 ? 'bg-white text-slate-900 border-white' : 'border-slate-600'}`}>1</div>
                            <span>Basic Info</span>
                        </div>
                        <div className={`flex items-center gap-3 text-sm ${step >= 2 ? 'text-white' : 'text-slate-600'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 2 ? 'bg-white text-slate-900 border-white' : 'border-slate-600'}`}>2</div>
                            <span>Profile Photo</span>
                        </div>
                        <div className={`flex items-center gap-3 text-sm ${step >= 3 ? 'text-white' : 'text-slate-600'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 3 ? 'bg-white text-slate-900 border-white' : 'border-slate-600'}`}>3</div>
                            <span>Details & Bio</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="p-8 md:w-2/3">
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Who are you?</h3>
                            <Input
                                label="Full Name"
                                placeholder="e.g. Alex Rivera"
                                value={formData.fullName}
                                onChange={(e) => handleChange('fullName', e.target.value)}
                            />
                            <Input
                                label="Job Title"
                                placeholder="e.g. Product Designer"
                                value={formData.jobTitle}
                                onChange={(e) => handleChange('jobTitle', e.target.value)}
                            />
                            <Input
                                label="Company Name"
                                placeholder="e.g. Acme Corp"
                                value={formData.companyName}
                                onChange={(e) => handleChange('companyName', e.target.value)}
                            />
                            <div className="pt-4 flex justify-end">
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!formData.fullName || !formData.jobTitle}
                                    icon={<ArrowRight size={16} />}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Add a Photo</h3>
                            <p className="text-sm text-slate-500 mb-4">Upload a professional photo for your card. You can skip this step.</p>

                            <div
                                className={`
                                    relative w-full h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all cursor-pointer group overflow-hidden
                                    ${isDraggingFile ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}
                                `}
                                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                                onDragLeave={(e) => { e.preventDefault(); setIsDraggingFile(false); }}
                                onDrop={handleFileDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                                {avatarUrl ? (
                                    <div className="relative w-full h-full">
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-contain p-4" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white font-medium">Click to Replace</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-400 group-hover:scale-110 transition-transform">
                                            <User size={32} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 mb-1">Click to upload</p>
                                        <p className="text-xs text-slate-500">or drag and drop</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-between items-center">
                                <button onClick={() => setStep(3)} className="text-sm text-slate-500 hover:text-slate-900 font-medium">
                                    Skip for now
                                </button>
                                <div className="flex gap-3">
                                    <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                                    <Button onClick={() => setStep(3)} icon={<ArrowRight size={16} />}>Next</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Contact & Bio</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Phone"
                                    placeholder="+1 555..."
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                />
                                <Input
                                    label="Email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                />
                            </div>

                            <div className="relative">
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Short Bio</label>
                                    <button
                                        onClick={generateAiBio}
                                        disabled={isGeneratingBio}
                                        className="text-xs flex items-center gap-1 text-purple-600 font-medium hover:text-purple-700 transition-colors disabled:opacity-50"
                                    >
                                        {isGeneratingBio ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Rewrite
                                    </button>
                                </div>
                                <TextArea
                                    value={formData.bio}
                                    onChange={(e) => handleChange('bio', e.target.value)}
                                    rows={4}
                                    placeholder="Tell us a bit about yourself..."
                                />
                            </div>

                            <div className="pt-4 flex justify-between">
                                <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    icon={loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                >
                                    {loading ? 'Creating...' : 'Finish Setup'}
                                </Button>
                            </div>
                        </div>
                    )}
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
        </div>
    );
};
