
export enum FontType {
  SANS = 'font-sans',
  SERIF = 'font-serif',
  MONO = 'font-mono',
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string; // key for the icon map
}

export interface Theme {
  id: string;
  name: string;
  gradient: string;
  textColor: string;
  accentColor: string;
  glassColor: string;
}

export interface ProfileData {
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  voiceIntroUrl?: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface Review {
  author: string;
  rating: string;
  text: string;
}

export interface Attribution {
  source: string;
  uri: string;
}

export interface BusinessSettings {
  query: string;
  url?: string;
  showReviews: boolean;
  reviews: Review[];
  attributions: Attribution[];
}

export interface CompanyData {
  name: string;
  logoUrl: string;
  enabled: boolean;
}

export interface FeaturedVideo {
  url: string;
  title: string;
  enabled: boolean;
}

export interface AnalyticsStats {
  views: number;
  clicks: number;
  saves: number;
  ctr: number;
  history: number[]; // Array of daily views for the chart
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
}

export interface ContactFormSettings {
  enabled: boolean;
  title: string;
  email: string;
}

export interface CardData {
  id: string;
  internalName: string;
  slug?: string; // Unique URL slug 
  updatedAt?: string; // ISO string
  profile: ProfileData;
  company: CompanyData;
  links: SocialLink[];
  services: Service[];
  projects: Project[];
  video: FeaturedVideo;
  business: BusinessSettings;
  contactForm: ContactFormSettings; // New
  analytics: AnalyticsStats;
  collectedContacts: ContactSubmission[];
  themeId: string;
  customThemeColor?: string;
  font: FontType;
  qrColor: string;
  showQrLogo: boolean;
  enableMotion: boolean;
}

export type Tab = 'editor' | 'preview';
export type ViewMode = 'dashboard' | 'editor';

// Subscription Types
export type SubscriptionTierId = 'free' | 'pro' | 'business';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface SubscriptionTier {
  id: SubscriptionTierId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  features: Record<string, boolean>;
  limits: {
    maxCards: number;
    maxLinks: number;
    analyticsDays: number;
    qrScansMonthly: number;
    storageGb?: number;
    teamMembers?: number;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  tierId: SubscriptionTierId;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}

export interface UserSubscription {
  subscriptionId: string;
  tierId: SubscriptionTierId;
  tierName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  features: Record<string, boolean>;
  limits: SubscriptionTier['limits'];
}

export interface PaymentHistory {
  id: string;
  userId: string;
  subscriptionId?: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  description?: string;
  createdAt: string;
}
