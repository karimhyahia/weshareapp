# ⚠️ KORRIGIERTE STRIPE KONFIGURATION

## 🔑 Deine korrigierten Keys:

### Frontend (.env.local)
```bash
VITE_SUPABASE_URL=deine_supabase_url_hier
VITE_SUPABASE_ANON_KEY=dein_anon_key_hier
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SXJSi2EeXK7mLiFi0Y9sJlvLiAgsIewbpXYaUBGvoht3ziaLeaUFOPUx8NyPYL1Y7xKKbUg5uBXlNSe4odSftU400wjPN1gx4
```

### Backend (Supabase Secrets)

**WICHTIG:** Du brauchst noch 2 Dinge:

#### 1. Secret Key holen:
```bash
# Gehe zu: https://dashboard.stripe.com/test/apikeys
# Klicke "Reveal" beim Secret Key (startet mit sk_test_)
# Dann:
supabase secrets set STRIPE_SECRET_KEY=sk_test_DEIN_ECHTER_SECRET_KEY_HIER
```

#### 2. Price IDs holen:

Gehe zu [Stripe Products](https://dashboard.stripe.com/test/products) und hole die **Price IDs**:

**Pro LTD Product:**
- Produkt öffnen
- Unter "Pricing" findest du: `price_xxxxx` ← DIESE ID brauchst du

**Business LTD Product:**
- Produkt öffnen
- Unter "Pricing" findest du: `price_yyyyy` ← DIESE ID brauchst du

---

## 📝 So trägst du die Price IDs ein:

Öffne `subscriptionUtils.ts` und ändere:

```typescript
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    priceLifetime: 0,
    stripePriceId: undefined,
    // ...
  },
  {
    id: 'pro',
    name: 'Pro LTD',
    priceLifetime: 89,
    stripePriceId: 'price_HIER_DEINE_PRO_PRICE_ID',  // ← Ersetzen!
    features: {
      // ...
    },
  },
  {
    id: 'business',
    name: 'Business LTD',
    priceLifetime: 249,
    stripePriceId: 'price_HIER_DEINE_BUSINESS_PRICE_ID',  // ← Ersetzen!
    features: {
      // ...
    },
  },
];
```

---

## 🎯 Schritt-für-Schritt Checklist:

### ✅ Schritt 1: Price IDs finden

1. [ ] Öffne https://dashboard.stripe.com/test/products
2. [ ] Klicke auf "Pro LTD" Produkt
3. [ ] Scrolle zu "Pricing" Section
4. [ ] Kopiere die Price ID (startet mit `price_`)
5. [ ] Wiederhole für "Business LTD"

**Wo steht die Price ID?**
```
In Stripe Dashboard unter Product Details:

Pricing
├─ One-time payment
   ├─ €89.00 EUR
   └─ API ID: price_1O2P3Q4R5S6T7U8V  ← DAS!
```

### ✅ Schritt 2: Secret Key finden

1. [ ] Öffne https://dashboard.stripe.com/test/apikeys
2. [ ] Klicke **"Reveal test key"** beim Secret Key
3. [ ] Kopiere den Key (startet mit `sk_test_`)

### ✅ Schritt 3: Keys eintragen

**Frontend (.env.local):**
```bash
# Diese Datei in deinem Projekt root erstellen
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SXJSi2EeXK7mLiFi0Y9sJlvLiAgsIewbpXYaUBGvoht3ziaLeaUFOPUx8NyPYL1Y7xKKbUg5uBXlNSe4odSftU400wjPN1gx4
```

**Backend (Terminal Commands):**
```bash
# Ersetze sk_test_XXXXX mit deinem echten Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_DEIN_ECHTER_SECRET_KEY

# Webhook Secret kommt später (nach Webhook Setup)
# supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Code (subscriptionUtils.ts):**
```typescript
stripePriceId: 'price_DEINE_PRO_PRICE_ID',    // Zeile 33
stripePriceId: 'price_DEINE_BUSINESS_PRICE_ID', // Zeile 57
```

---

## 🚨 Häufige Fehler vermeiden:

### ❌ FALSCH:
```typescript
stripePriceId: 'prod_TUI3aWZSZ7AGRG',  // Product ID - funktioniert NICHT!
```

### ✅ RICHTIG:
```typescript
stripePriceId: 'price_1O2P3Q4R5S6T7U8V',  // Price ID - funktioniert!
```

---

### ❌ FALSCH:
```bash
supabase secrets set STRIPE_SECRET_KEY=pk_test_xxx  # Publishable Key!
```

### ✅ RICHTIG:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx  # Secret Key!
```

---

## 📸 Screenshots als Hilfe:

**Wo finde ich die Price ID?**

1. Dashboard → Products → Dein Produkt anklicken
2. Runterscrollen zu "Pricing"
3. Da siehst du: "API ID: price_xxxxx" ← DAS!

**Wo finde ich den Secret Key?**

1. Dashboard → Developers → API Keys
2. Bei "Secret key" → "Reveal test key" klicken
3. Key startet mit `sk_test_` ← DAS!

---

## 🔄 Nächste Schritte:

1. **Price IDs holen** (siehe oben)
2. **Secret Key holen** (siehe oben)
3. **Beide in Code eintragen**
4. **Migrations ausführen** (falls noch nicht gemacht)
5. **Edge Functions deployen**
6. **Dann Webhook einrichten**

---

## 💡 Brauchst du Hilfe?

Wenn du die Price IDs gefunden hast, sag mir Bescheid und ich helfe dir beim Eintragen!

Schick mir einfach:
```
Pro Price ID: price_xxxxx
Business Price ID: price_yyyyy
Secret Key: sk_test_xxxxx
```

Dann mache ich den Rest für dich! 🚀
