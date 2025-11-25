# CLAUDE.md - WeShare App Development Guide

> **Last Updated**: November 25, 2025
>
> This document provides comprehensive guidance for AI assistants working on the WeShare codebase. It covers architecture, conventions, workflows, and best practices.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Architecture](#project-architecture)
4. [Directory Structure](#directory-structure)
5. [Key Conventions](#key-conventions)
6. [Database Schema](#database-schema)
7. [Development Workflow](#development-workflow)
8. [Component Patterns](#component-patterns)
9. [State Management](#state-management)
10. [API & Backend](#api--backend)
11. [Styling Guidelines](#styling-guidelines)
12. [Testing & Quality](#testing--quality)
13. [Common Tasks](#common-tasks)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

**WeShare** is a modern digital business card platform that allows users to create, customize, and share professional digital identities. It replaces traditional paper business cards with dynamic, always-up-to-date digital profiles.

### Core Features
- **Digital Business Cards**: Customizable cards with themes, fonts, and colors
- **Profile Management**: Avatar, bio, title, contact information, voice intros
- **Social Links**: Multi-platform social media integration
- **Services & Projects**: Showcase offerings and portfolio items
- **Analytics**: Track views, clicks, CTR, and engagement
- **Contact Forms**: Collect leads and submissions
- **QR Codes**: Generate scannable QR codes for easy sharing
- **Public Profiles**: Shareable URLs (`/u/:username`)
- **Multi-language Support**: i18n with English and Arabic

### Project Goals
- Fast, responsive user experience
- Clean, modern UI with glassmorphism design
- Secure authentication and data privacy
- Real-time analytics and insights
- Eco-friendly alternative to paper cards

---

## Tech Stack

### Frontend
- **Framework**: React 18.2 (with TypeScript)
- **Build Tool**: Vite 5.0
- **Routing**: React Router DOM v7.9
- **Styling**: TailwindCSS 4.1 with PostCSS
- **Icons**: Lucide React 0.292
- **QR Codes**: react-qr-code 2.0

### Backend
- **BaaS**: Supabase 2.83
  - PostgreSQL database
  - Authentication (magic link, email/password)
  - Row Level Security (RLS)
  - Storage (image uploads)
  - Edge Functions (Deno)
- **Email**: Resend API (via Supabase Edge Function)

### AI Integration
- **Google Gemini**: @google/genai 1.30 (for AI-powered features)

### Development Tools
- **TypeScript**: 5.2 (strict mode)
- **Node.js**: Required for development
- **dotenv**: Environment variable management

---

## Project Architecture

### Application Flow

```
User → Landing/Auth → Dashboard → Editor/Preview → Public Profile
                          ↓
                    Supabase Backend
                          ↓
                [Database, Auth, Storage, Functions]
```

### Key Architectural Patterns

1. **Component-Based Architecture**: Modular React components with clear responsibilities
2. **Container/Presentation Pattern**: Smart containers (Dashboard) and dumb presentational components
3. **Context API**: Used for language/internationalization (`LanguageContext`)
4. **Client-Side Routing**: React Router handles all navigation
5. **Backend-as-a-Service**: Supabase manages all backend concerns
6. **Row Level Security**: Database-level security policies protect user data

### Security Model

- **Authentication**: Supabase Auth handles user sessions
- **Authorization**: RLS policies enforce data access rules
- **Data Privacy**: Users can only access their own sites
- **Public Access**: Controlled via secure RPC function (`get_site_by_slug`)
- **Image Uploads**: Scoped to authenticated users via Supabase Storage

---

## Directory Structure

```
/home/user/weshareapp/
├── components/              # React components
│   ├── ui/                 # Reusable UI components (Button, Input, ImageCropper)
│   ├── Auth.tsx            # Authentication forms
│   ├── Dashboard.tsx       # Main dashboard view
│   ├── EditorPanel.tsx     # Card editor interface
│   ├── CardPreview.tsx     # Live card preview
│   ├── PublicProfile.tsx   # Public-facing profile page
│   ├── LandingPage.tsx     # Marketing landing page
│   ├── FeaturesPage.tsx    # Features showcase
│   ├── HowItWorksPage.tsx  # How it works page
│   ├── PricingPage.tsx     # Pricing information
│   ├── OnboardingWizard.tsx # First-time user onboarding
│   ├── ShareModal.tsx      # Sharing options modal
│   ├── DeleteConfirmationModal.tsx
│   ├── LanguageSwitcher.tsx
│   └── WebPreview.tsx      # Mobile/desktop preview
│
├── supabase/               # Supabase configuration
│   └── functions/          # Edge Functions
│       └── send-email/     # Email sending function (Resend API)
│           └── index.ts
│
├── migrations/             # Database migrations
│   ├── 001_enforce_single_site.sql
│   ├── 002_add_email_to_profiles.sql
│   ├── 003_fix_rls_leak.sql
│   └── 004_add_analytics.sql
│
├── Main.tsx               # Main app component with routing
├── DashboardLayout.tsx    # Dashboard layout wrapper
├── LanguageContext.tsx    # i18n context provider
├── index.tsx              # App entry point
├── index.html             # HTML template
├── index.css              # Global styles
├── types.ts               # TypeScript type definitions
├── constants.ts           # App constants (themes, icons, initial data)
├── translations.ts        # i18n translations (en, ar)
├── supabase.ts            # Supabase client & utilities
├── schema.sql             # Complete database schema
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── postcss.config.js      # PostCSS configuration
├── package.json           # Dependencies & scripts
├── .gitignore             # Git ignore rules
└── README.md              # Basic project README
```

### Important Files

- **types.ts**: All TypeScript interfaces and enums (CardData, ProfileData, Theme, etc.)
- **constants.ts**: Themes, fonts, icons, AI suggestions, mock data
- **translations.ts**: All user-facing text for i18n
- **schema.sql**: Complete database schema (single source of truth)
- **supabase.ts**: Supabase client initialization and helper functions

---

## Key Conventions

### File Naming
- **Components**: PascalCase (e.g., `DashboardLayout.tsx`, `CardPreview.tsx`)
- **Utilities**: camelCase (e.g., `supabase.ts`, `constants.ts`)
- **Types**: PascalCase for interfaces/types, contained in `types.ts`
- **Migrations**: Sequential numbering (`001_description.sql`)

### Code Style
- **TypeScript**: Strict mode enabled, all files should be typed
- **Imports**: Absolute imports using `@/*` path alias (configured in tsconfig)
- **React**: Functional components with hooks (no class components)
- **Props**: Define interfaces for all component props
- **Exports**: Named exports for components, default export for pages

### TypeScript Patterns
```typescript
// Component Props Interface
interface ComponentProps {
  data: CardData;
  onSave: (data: CardData) => void;
  isLoading?: boolean; // Optional props marked with ?
}

// Functional Component with TypeScript
export const Component: React.FC<ComponentProps> = ({ data, onSave, isLoading = false }) => {
  // Component logic
};

// Type Imports
import { CardData, ProfileData } from '../types';
```

### React Patterns
```typescript
// State Management
const [data, setData] = useState<CardData>(initialData);

// Effects
useEffect(() => {
  // Side effects
  return () => {
    // Cleanup
  };
}, [dependencies]);

// Event Handlers
const handleSave = async () => {
  try {
    // Async operations
  } catch (error) {
    console.error('Error:', error);
  }
};

// Conditional Rendering
{isLoading ? <Spinner /> : <Content />}
```

---

## Database Schema

### Tables

#### `profiles`
User account information (one-to-one with `auth.users`)
- `id` (uuid, PK, FK to auth.users)
- `updated_at` (timestamp)
- `username` (text, unique)
- `full_name` (text)
- `avatar_url` (text)
- `website` (text)
- `email` (text)

#### `sites`
Digital business cards (one per user enforced via UNIQUE constraint)
- `id` (uuid, PK)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `user_id` (uuid, FK to auth.users, **UNIQUE**)
- `internal_name` (text)
- `slug` (text, unique) - URL identifier
- `data` (jsonb) - Complete CardData object

**Important**: The `user_id` UNIQUE constraint enforces ONE site per user.

#### `analytics_events`
Tracking events for analytics
- `id` (uuid, PK)
- `created_at` (timestamp)
- `site_id` (uuid, FK to sites)
- `type` (text) - 'view', 'click', 'contact'
- `data` (jsonb)

#### `contact_submissions`
Contact form submissions
- `id` (uuid, PK)
- `created_at` (timestamp)
- `site_id` (uuid, FK to sites)
- `name` (text)
- `email` (text)
- `phone` (text)
- `message` (text)
- `data` (jsonb)

### Row Level Security (RLS) Policies

**Profiles**:
- Public read access (all profiles viewable)
- Users can insert/update their own profile

**Sites**:
- Users can CRUD their own sites only
- Public access via `get_site_by_slug()` RPC function (bypasses RLS safely)

**Analytics Events**:
- Public can insert (for tracking)
- Site owners can view events for their sites

**Contact Submissions**:
- Public can insert (for contact forms)
- Site owners can view submissions for their sites

### Database Functions

**`get_site_by_slug(slug_input text)`**
- Security definer function to fetch public sites by slug
- Bypasses RLS for safe public access
- Used by PublicProfile component

**`handle_new_user()`**
- Trigger function on auth.users insert
- Automatically creates profile entry for new users

### Migrations

Migrations are located in `/migrations` and should be run in order:
1. `001_enforce_single_site.sql` - Single site per user constraint
2. `002_add_email_to_profiles.sql` - Add email field
3. `003_fix_rls_leak.sql` - Security fix for RLS policies
4. `004_add_analytics.sql` - Analytics and contacts tables

---

## Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Set environment variables in .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

**Required**:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

**Optional**:
- `GEMINI_API_KEY`: For AI-powered features

**Note**: All Vite env vars must be prefixed with `VITE_` to be exposed to the client.

### Git Workflow

```bash
# Current branch
git status

# Create feature branch
git checkout -b feature/feature-name

# Commit changes
git add .
git commit -m "feat: descriptive message"

# Push to remote
git push -u origin feature/feature-name
```

**Commit Message Conventions**:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `style:` Formatting changes
- `docs:` Documentation updates
- `test:` Test additions/updates
- `chore:` Maintenance tasks

### Database Management

```bash
# Run migrations (via Supabase Dashboard SQL Editor)
# Copy contents of migration files and execute in order

# Or use Supabase CLI (if configured)
supabase migration up
```

---

## Component Patterns

### Component Structure

```typescript
import React, { useState, useEffect } from 'react';
import { ComponentProps } from '../types';
import { useLanguage } from '../LanguageContext';
import { Button } from './ui/Button';

interface Props {
  data: ComponentProps;
  onSave: (data: ComponentProps) => void;
}

export const Component: React.FC<Props> = ({ data, onSave }) => {
  const { t } = useLanguage();
  const [localState, setLocalState] = useState(data);

  useEffect(() => {
    // Side effects
  }, []);

  const handleAction = () => {
    // Business logic
    onSave(localState);
  };

  return (
    <div className="container">
      <h1>{t('component.title')}</h1>
      <Button onClick={handleAction}>{t('common.save')}</Button>
    </div>
  );
};
```

### Common Component Props Patterns

**Data & Callbacks**:
```typescript
interface ComponentProps {
  data: CardData;                    // Data to display/edit
  onUpdate: (data: CardData) => void; // Update callback
  onDelete?: () => void;             // Optional delete callback
  isLoading?: boolean;               // Loading state
  error?: string;                    // Error message
}
```

**Navigation Props**:
```typescript
interface PageProps {
  onNavigate: (page: PageState) => void;
  onBack?: () => void;
}
```

### UI Component Library

**Button** (`components/ui/Button.tsx`):
```typescript
<Button variant="primary | secondary | danger" onClick={handleClick}>
  Click Me
</Button>
```

**Input** (`components/ui/Input.tsx`):
```typescript
<Input
  label="Field Label"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Enter value..."
  error={errorMessage}
/>
```

**ImageCropper** (`components/ui/ImageCropper.tsx`):
```typescript
<ImageCropper
  onCropComplete={(blob) => handleUpload(blob)}
  aspectRatio={1}
/>
```

---

## State Management

### Local Component State

Use `useState` for component-local state:
```typescript
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState<FormData>(initialData);
```

### Context API

**LanguageContext** (`LanguageContext.tsx`):
```typescript
import { useLanguage } from '../LanguageContext';

const Component = () => {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div>
      <h1>{t('landing.heroTitle')}</h1>
      <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
        Toggle Language
      </button>
    </div>
  );
};
```

### Supabase State

**Authentication State**:
```typescript
useEffect(() => {
  // Check initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    // Handle session
  });

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      // Handle auth state change
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

**Data Fetching**:
```typescript
const [sites, setSites] = useState<CardData[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchSites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('user_id', user.id);

    if (data) setSites(data.map(site => site.data));
    setLoading(false);
  };

  fetchSites();
}, []);
```

---

## API & Backend

### Supabase Client

The Supabase client is initialized in `supabase.ts`:
```typescript
import { supabase } from './supabase';
```

### Authentication

```typescript
// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
});

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Magic Link
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
});

// Sign Out
await supabase.auth.signOut();

// Get Current User
const { data: { user } } = await supabase.auth.getUser();
```

### Database Operations

**Insert**:
```typescript
const { data, error } = await supabase
  .from('sites')
  .insert({
    user_id: userId,
    internal_name: 'My Site',
    slug: 'my-site',
    data: cardData,
  })
  .select()
  .single();
```

**Update**:
```typescript
const { data, error } = await supabase
  .from('sites')
  .update({ data: updatedCardData })
  .eq('id', siteId)
  .select()
  .single();
```

**Query**:
```typescript
const { data, error } = await supabase
  .from('sites')
  .select('*')
  .eq('user_id', userId)
  .single();
```

**RPC Function**:
```typescript
const { data, error } = await supabase
  .rpc('get_site_by_slug', { slug_input: 'username' });
```

### Image Upload

```typescript
import { uploadImage } from './supabase';

const handleUpload = async (file: File) => {
  try {
    const url = await uploadImage(file, 'avatars');
    // Use url
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Analytics Tracking

```typescript
// Track page view
await supabase
  .from('analytics_events')
  .insert({
    site_id: siteId,
    type: 'view',
    data: { userAgent: navigator.userAgent },
  });

// Track click
await supabase
  .from('analytics_events')
  .insert({
    site_id: siteId,
    type: 'click',
    data: { linkId: 'link-1' },
  });
```

### Contact Form Submission

```typescript
await supabase
  .from('contact_submissions')
  .insert({
    site_id: siteId,
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    message: formData.message,
  });
```

### Edge Functions

**Send Email** (`supabase/functions/send-email/index.ts`):
```typescript
// Client-side call
const response = await supabase.functions.invoke('send-email', {
  body: {
    to: 'recipient@example.com',
    subject: 'Contact Form Submission',
    html: '<p>Email content</p>',
    replyTo: 'user@example.com',
  },
});
```

**Note**: Edge Functions are not automatically imported in frontend builds. The tsconfig excludes `supabase/` directory to prevent build errors.

---

## Styling Guidelines

### TailwindCSS Conventions

**Layout**:
```typescript
<div className="min-h-screen flex flex-col items-center justify-center">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Content */}
  </div>
</div>
```

**Responsive Design**:
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

**Glassmorphism** (signature WeShare style):
```typescript
<div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl">
  {/* Glass morphism card */}
</div>
```

**Theme-Based Styling**:
```typescript
// Themes are defined in constants.ts
const theme = THEMES.find(t => t.id === themeId);

<div className={`${theme.gradient} ${theme.textColor}`}>
  <button className={theme.accentColor}>Click</button>
</div>
```

**Custom Theme Colors**:
```typescript
// When user selects custom color
<div
  style={{
    background: `linear-gradient(135deg, ${customColor}, ${adjustColor(customColor, -40)})`
  }}
>
  {/* Custom gradient */}
</div>
```

**Font Types**:
```typescript
import { FontType } from './types';

<div className={cardData.font}>
  {/* Applies font-sans, font-serif, or font-mono */}
</div>
```

### CSS Custom Properties

Global styles are in `index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom scrollbar styles, animations, etc. */
```

---

## Testing & Quality

### Type Safety

- All components should have proper TypeScript types
- Use interfaces from `types.ts`
- Avoid `any` type unless absolutely necessary
- Enable strict mode in TypeScript

### Error Handling

```typescript
try {
  const result = await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  // Show user-friendly error message
  setError('Something went wrong. Please try again.');
}
```

### Console Logging

- Use `console.log()` for development debugging
- Use `console.error()` for errors
- Use `console.warn()` for warnings
- Remove or comment out logs before production

### Validation

**Client-Side Validation**:
```typescript
const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateSlug = (slug: string) => {
  return /^[a-z0-9-]+$/.test(slug);
};
```

**Server-Side Validation**:
- Database constraints (UNIQUE, NOT NULL)
- RLS policies
- Edge function validation

---

## Common Tasks

### Adding a New Component

1. Create file in `components/` directory:
```typescript
// components/NewComponent.tsx
import React from 'react';

interface NewComponentProps {
  data: string;
}

export const NewComponent: React.FC<NewComponentProps> = ({ data }) => {
  return <div>{data}</div>;
};
```

2. Import and use in parent component:
```typescript
import { NewComponent } from './components/NewComponent';

<NewComponent data="Hello" />
```

### Adding a New Route

1. Update `Main.tsx`:
```typescript
<Route path="/new-page" element={<NewPage />} />
```

2. Add navigation:
```typescript
navigate('/new-page');
// or
<Link to="/new-page">New Page</Link>
```

### Adding a Database Column

1. Create migration in `migrations/`:
```sql
-- migrations/005_add_new_column.sql
ALTER TABLE sites ADD COLUMN new_field text;
```

2. Run migration in Supabase Dashboard

3. Update TypeScript types in `types.ts`:
```typescript
export interface CardData {
  // ... existing fields
  newField?: string;
}
```

### Adding a Translation

1. Update `translations.ts`:
```typescript
export const translations = {
  en: {
    newSection: {
      title: "New Title",
      description: "New Description",
    },
  },
  ar: {
    newSection: {
      title: "عنوان جديد",
      description: "وصف جديد",
    },
  },
};
```

2. Use in component:
```typescript
const { t } = useLanguage();
<h1>{t('newSection.title')}</h1>
```

### Adding a New Theme

1. Update `constants.ts`:
```typescript
export const THEMES: Theme[] = [
  // ... existing themes
  {
    id: 'newtheme',
    name: 'New Theme',
    gradient: 'bg-gradient-to-br from-purple-500 to-pink-600',
    textColor: 'text-white',
    accentColor: 'bg-white/20 hover:bg-white/30',
    glassColor: 'bg-white/10',
  },
];
```

### Debugging Supabase RLS Issues

1. Check RLS policies in Supabase Dashboard
2. Test queries with authenticated user in SQL Editor:
```sql
-- Simulate authenticated user context
SET LOCAL jwt.claims.sub = 'user-uuid-here';
SELECT * FROM sites WHERE user_id = 'user-uuid-here';
```
3. Check browser console for auth errors
4. Verify user is authenticated: `supabase.auth.getUser()`

---

## Troubleshooting

### Common Issues

**Build Errors: "Cannot find module 'supabase/functions/...'**
- Solution: The `tsconfig.json` excludes `supabase/` directory by design
- Edge functions are not part of the frontend build
- Check `tsconfig.json` exclude array

**Authentication Not Persisting**
- Check browser localStorage for Supabase auth tokens
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check Supabase Dashboard for auth settings

**RLS Policy Blocking Queries**
- Verify user is authenticated: `supabase.auth.getUser()`
- Check RLS policies in Supabase Dashboard
- Use `get_site_by_slug()` RPC for public access

**Image Upload Failing**
- Verify Supabase Storage bucket 'images' exists
- Check storage policies allow authenticated uploads
- Ensure file size is within limits

**Translations Not Showing**
- Verify translation key exists in `translations.ts`
- Check language context is provided: `<LanguageProvider>`
- Use `t()` function from `useLanguage()` hook

**Vite Build Failing**
- Clear `.vite` cache: `rm -rf node_modules/.vite`
- Reinstall dependencies: `npm install`
- Check TypeScript errors: `tsc --noEmit`

**Supabase Edge Function Not Working**
- Check function logs in Supabase Dashboard
- Verify environment variables are set (e.g., `RESEND_API_KEY`)
- Test function directly in Dashboard before calling from client

---

## Best Practices for AI Assistants

### Do's ✅

1. **Read Before Writing**: Always read existing files before modifying
2. **Maintain Consistency**: Follow existing patterns and conventions
3. **Type Everything**: Use TypeScript types from `types.ts`
4. **Use Translations**: Never hardcode user-facing text, use `t()` function
5. **Test Locally**: Suggest running `npm run dev` to test changes
6. **Respect RLS**: Design database operations with RLS policies in mind
7. **Handle Errors**: Always wrap async operations in try-catch
8. **Document Changes**: Add comments for complex logic
9. **Validate Input**: Always validate user input on client and server
10. **Optimize Images**: Suggest image compression for uploads

### Don'ts ❌

1. **Don't Hardcode URLs**: Use environment variables
2. **Don't Skip Types**: Avoid using `any` type
3. **Don't Ignore Errors**: Always handle errors gracefully
4. **Don't Bypass RLS**: Don't suggest disabling RLS policies
5. **Don't Commit Secrets**: Never commit API keys or credentials
6. **Don't Break Migrations**: Never modify existing migration files
7. **Don't Over-Engineer**: Keep solutions simple and focused
8. **Don't Ignore Edge Cases**: Consider loading, error, and empty states
9. **Don't Forget Cleanup**: Always clean up subscriptions and listeners
10. **Don't Mix Concerns**: Keep components focused on single responsibility

### Code Review Checklist

Before suggesting code changes, verify:

- [ ] TypeScript types are correct and complete
- [ ] Component follows established patterns
- [ ] Error handling is implemented
- [ ] Translations are used for user-facing text
- [ ] Responsive design works on mobile/desktop
- [ ] RLS policies are respected
- [ ] Authentication state is checked
- [ ] Loading states are handled
- [ ] Accessibility considerations (ARIA labels, keyboard nav)
- [ ] No console errors or warnings

---

## Additional Resources

### Key Documentation Links
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)

### Project-Specific Resources
- **schema.sql**: Complete database schema reference
- **types.ts**: All TypeScript type definitions
- **constants.ts**: Themes, icons, and default data
- **translations.ts**: Complete i18n translations
- **README.md**: Basic setup instructions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-25 | Initial CLAUDE.md creation with comprehensive documentation |

---

## Feedback & Updates

This document should be updated whenever:
- New features are added
- Architecture changes are made
- New conventions are established
- Common issues are discovered
- Dependencies are upgraded

When making updates, increment the version number and add an entry to the Version History table.

---

**End of CLAUDE.md**
