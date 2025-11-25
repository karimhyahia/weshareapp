# 🚀 WeShare - Finale Setup Befehle

## ✅ Was bereits erledigt ist:

- ✅ Price IDs eingetragen in `subscriptionUtils.ts`
- ✅ `.env.local` erstellt mit Stripe Publishable Key
- ✅ Alle Dateien im Repository

---

## 📋 Was du JETZT machen musst:

### 1. Supabase URL & Keys eintragen

Öffne `.env.local` und ersetze:
```bash
VITE_SUPABASE_URL=your_supabase_url_here          # ← Deine Supabase URL
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here # ← Dein Anon Key
```

**Wo finde ich diese?**
- Gehe zu [Supabase Dashboard](https://app.supabase.com)
- Wähle dein Projekt
- Settings → API
- Kopiere "Project URL" und "anon public"

### 2. Dependencies installieren

```bash
npm install
```

### 3. Supabase Secrets setzen

**WICHTIG:** Führe diese Befehle im Terminal aus:

```bash
# Stripe Secret Key setzen (siehe Screenshot oben für deinen Key)
supabase secrets set STRIPE_SECRET_KEY=sk_test_DEIN_SECRET_KEY_HIER

# Supabase URL setzen (ersetze mit deiner URL)
supabase secrets set SUPABASE_URL=https://dein-project.supabase.co

# Supabase Service Role Key setzen (ersetze mit deinem Key)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=dein_service_role_key_hier
```

**Wo finde ich den Service Role Key?**
- Supabase Dashboard → Settings → API
- Unter "Project API keys" findest du "service_role" (Secret!)

### 4. Database Migrations ausführen

**Option A: Via Supabase Dashboard (Empfohlen)**

1. Öffne [Supabase SQL Editor](https://app.supabase.com)
2. Kopiere Inhalt von `migrations/005_add_subscriptions.sql`
3. Einfügen und **Run** klicken
4. Dann Inhalt von `migrations/006_lifetime_deals.sql`
5. Einfügen und **Run** klicken

**Option B: Via CLI**
```bash
supabase migration up
```

### 5. Edge Functions deployen

```bash
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
```

### 6. Webhook in Stripe konfigurieren

1. Gehe zu [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Klicke **"Endpunkt hinzufügen"**
3. Endpoint URL: `https://DEIN-PROJECT-REF.supabase.co/functions/v1/stripe-webhook`
   - Ersetze `DEIN-PROJECT-REF` mit deiner Supabase Project Reference
4. Events auswählen:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. **Endpoint hinzufügen**
6. **Webhook Signing Secret kopieren** (fängt an mit `whsec_`)
7. Secret setzen:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_dein_webhook_secret_hier
```

### 7. Dev Server starten und testen!

```bash
npm run dev
```

Dann:
1. Account erstellen
2. "Upgrade" klicken
3. Pro auswählen
4. Test-Karte: `4242 4242 4242 4242`
5. Zahlung abschließen
6. ✅ Du solltest jetzt "Pro LTD" Status haben!

---

## 🎯 Deine Stripe Keys (Zusammenfassung)

### ✅ Bereits konfiguriert:

**Publishable Key (Frontend):**
```
pk_test_51SXJSi2EeXK7mLiFi0Y9sJlvLiAgsIewbpXYaUBGvoht3ziaLeaUFOPUx8NyPYL1Y7xKKbUg5uBXlNSe4odSftU400wjPN1gx4
```

**Secret Key (Backend):**
```
sk_test_51SXJSi2EeXK7mLiF... (siehe Stripe Dashboard)
```
ℹ️ Aus Sicherheitsgründen nicht im Code gespeichert - hole ihn aus Stripe Dashboard!

**Pro Price ID:**
```
price_1SXJTN2EeXK7mLiF7sYKU680
```

**Business Price ID:**
```
price_1SXJUo2EeXK7mLiFDCXcvhXw
```

---

## ✅ Setup Checklist:

- [x] Price IDs in Code eingetragen
- [x] .env.local erstellt
- [ ] Supabase URL & Anon Key in .env.local eintragen
- [ ] npm install ausführen
- [ ] Supabase Secrets setzen (3 Befehle)
- [ ] Database Migrations ausführen
- [ ] Edge Functions deployen
- [ ] Webhook in Stripe einrichten
- [ ] Webhook Secret setzen
- [ ] Test-Zahlung durchführen

---

## 🆘 Brauchst du Hilfe?

Wenn etwas nicht funktioniert:

1. **Check Browser Console** für Fehler
2. **Check Supabase Logs**: Dashboard → Edge Functions → Logs
3. **Check Stripe Logs**: Dashboard → Developers → Logs
4. **Schreib mir!** Ich helfe dir gerne weiter

---

## 🚀 Nach dem Setup:

Wenn alles funktioniert:

1. **Upgrade-Button in Dashboard einbauen**
2. **Feature-Gates aktivieren** (Free = 1 Karte Limit)
3. **Landing Page optimieren**
4. **Product Hunt Launch vorbereiten**

**Du bist fast fertig!** Nur noch die Supabase-Details eintragen und testen! 💪
