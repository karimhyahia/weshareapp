
import { Theme, FontType, CardData } from './types';
import { Github, Linkedin, Twitter, Instagram, Mail, Globe, Facebook, Youtube } from 'lucide-react';

export const THEMES: Theme[] = [
  {
    id: 'ocean',
    name: 'Ocean',
    gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    textColor: 'text-white',
    accentColor: 'bg-white/20 hover:bg-white/30',
    glassColor: 'bg-white/10',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    gradient: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
    textColor: 'text-gray-100',
    accentColor: 'bg-purple-500/30 hover:bg-purple-500/50',
    glassColor: 'bg-black/30',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    gradient: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-600',
    textColor: 'text-white',
    accentColor: 'bg-white/20 hover:bg-white/30',
    glassColor: 'bg-white/10',
  },
  {
    id: 'forest',
    name: 'Forest',
    gradient: 'bg-gradient-to-br from-emerald-500 to-teal-800',
    textColor: 'text-emerald-50',
    accentColor: 'bg-emerald-900/20 hover:bg-emerald-900/30',
    glassColor: 'bg-emerald-950/10',
  },
];

// Helper to adjust color brightness for gradients
export const adjustColor = (color: string, amount: number) => {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

// Simple contrast checker to determine text color
export const getContrastColor = (hexcolor: string) => {
  hexcolor = hexcolor.replace("#", "");
  var r = parseInt(hexcolor.substr(0, 2), 16);
  var g = parseInt(hexcolor.substr(2, 2), 16);
  var b = parseInt(hexcolor.substr(4, 2), 16);
  var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'text-slate-900' : 'text-white';
}

export const getYoutubeEmbedUrl = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

export const AVAILABLE_FONTS = [
  { id: FontType.SANS, label: 'Modern (Sans)' },
  { id: FontType.SERIF, label: 'Elegant (Serif)' },
  { id: FontType.MONO, label: 'Tech (Mono)' },
];

export const ICON_MAP: Record<string, any> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  mail: Mail,
  website: Globe,
  facebook: Facebook,
  youtube: Youtube,
};

export const AI_BIO_SUGGESTIONS = [
  "Creative visionary crafting digital experiences that merge aesthetics with functionality. Passionate about building user-centric solutions.",
  "Full-stack innovator with a knack for solving complex problems. dedicated to clean code, scalable architecture, and continuous learning.",
  "Digital artisan bridging the gap between design and engineering. Transforming bold ideas into interactive reality.",
  "Strategic thinker helping brands navigate the digital landscape. Focused on growth, engagement, and impactful storytelling.",
  "Tech enthusiast and product evangelist. turning coffee into code and chaotic ideas into structured success.",
];

export const INITIAL_DATA: CardData = {
  id: '1',
  internalName: 'Personal Profile',
  profile: {
    name: 'Alex Rivera',
    title: 'Product Designer',
    bio: 'Crafting intuitive digital experiences. Based in San Francisco, working worldwide.',
    avatarUrl: 'https://picsum.photos/200/200',
    phone: '+1 (555) 123-4567',
    mobile: '+1 (555) 987-6543',
    whatsapp: '15551234567',
  },
  company: {
    name: 'Arks Group',
    logoUrl: 'https://ui-avatars.com/api/?name=AG&background=0f172a&color=fff&size=128&bold=true',
    enabled: true,
  },
  links: [
    { id: '1', platform: 'Portfolio', url: 'https://example.com', icon: 'website' },
    { id: '2', platform: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin' },
  ],
  services: [
    { id: '1', title: 'UI/UX Design', description: 'Creating intuitive and visually appealing digital interfaces.' },
    { id: '2', title: 'Frontend Dev', description: 'Building responsive and interactive web applications.' },
    { id: '3', title: 'Consulting', description: 'Strategic advice for your digital product roadmap.' },
  ],
  projects: [
    {
      id: '1',
      title: 'E-Commerce Redesign',
      description: 'A complete overhaul of the shopping experience.',
      imageUrl: 'https://picsum.photos/seed/project1/400/300'
    },
    {
      id: '2',
      title: 'Finance App',
      description: 'Mobile banking application for Gen Z.',
      imageUrl: 'https://picsum.photos/seed/project2/400/300'
    }
  ],
  video: {
    enabled: true,
    title: 'Showreel 2024',
    url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ' // Demo generic video
  },
  business: {
    query: '',
    url: '',
    showReviews: false,
    reviews: [],
    attributions: [],
  },
  contactForm: {
    enabled: false,
    title: 'Send me a message',
    email: '',
  },
  analytics: {
    views: 1243,
    clicks: 456,
    saves: 89,
    ctr: 36.7,
    history: [45, 52, 49, 60, 85, 92, 110]
  },
  collectedContacts: [],
  themeId: 'ocean',
  font: FontType.SANS,
  qrColor: '#0f172a',
  showQrLogo: true,
  enableMotion: true,
};

export const MOCK_SITES: CardData[] = [
  INITIAL_DATA,
  {
    ...INITIAL_DATA,
    id: '2',
    internalName: 'Work Card - Corporate',
    profile: { ...INITIAL_DATA.profile, name: 'Alex Rivera', title: 'VP of Design' },
    themeId: 'midnight',
    links: [],
    services: [],
    projects: [],
    analytics: {
      views: 892,
      clicks: 120,
      saves: 34,
      ctr: 13.4,
      history: [12, 15, 20, 18, 25, 30, 28]
    }
  },
  {
    ...INITIAL_DATA,
    id: '3',
    internalName: 'Freelance Portfolio',
    profile: { ...INITIAL_DATA.profile, name: 'Alex.Design', title: 'Freelance UI Expert' },
    themeId: 'sunset',
    qrColor: '#db2777',
    analytics: {
      views: 3450,
      clicks: 1200,
      saves: 450,
      ctr: 34.7,
      history: [100, 120, 150, 130, 180, 200, 250]
    }
  }
];
