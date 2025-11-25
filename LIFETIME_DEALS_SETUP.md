# Lifetime Deals Setup - WeShare

Einfache Anleitung für Einmal-Zahlungen (Lifetime Deals) mit Stripe.

## 🎯 Preise

- **Free**: Kostenlos (1 Karte, 3 Links)
- **Pro LTD**: €89 einmalig - Lebenslanger Zugang
- **Business LTD**: €249 einmalig - Unlimited alles

---

## 🚀 Setup (ca. 30 Minuten)

### 1. Stripe Account erstellen

1. Registrieren auf [stripe.com](https://stripe.com)
2. Bleibe im **Test Mode** für erste Tests

### 2. Produkte in Stripe anlegen

#### Pro LTD erstellen:

1. Gehe zu **Produkte** → **Produkt hinzufügen**
2. Name: `WeShare Pro LTD`
3. Beschreibung: `Lebenslanger Zugriff auf Pro Features`
4. **Pricing**:
   - Preismodell: **Einmalig** (One-time)
   - Preis: `€89.00`
   - Currency: EUR
5. Speichern und **Price ID kopieren** (sieht aus wie `price_xxxxx`)

#### Business LTD erstellen:

1. Neues Produkt erstellen
2. Name: `WeShare Business LTD`
3. Beschreibung: `Lebenslanger Zugriff - Unlimited alles`
4. **Pricing**:
   - Preismodell: **Einmalig** (One-time)
   - Preis: `€249.00`
   - Currency: EUR
5. Speichern und **Price ID kopieren**

### 3. Price IDs eintragen

Öffne `subscriptionUtils.ts` und ersetze die Price IDs:

```typescript
{
  id: 'pro',
  name: 'Pro LTD',
  priceLifetime: 89,
  stripePriceId: 'price_DEINE_PRO_PRICE_ID', // ← Hier einfügen
  // ...
},
{
  id: 'business',
  name: 'Business LTD',
  priceLifetime: 249,
  stripePriceId: 'price_DEINE_BUSINESS_PRICE_ID', // ← Hier einfügen
  // ...
}
```

### 4. Environment Variables setzen

**Frontend (`.env.local`):**
```bash
VITE_SUPABASE_URL=deine_supabase_url
VITE_SUPABASE_ANON_KEY=dein_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxx  # Von Stripe Dashboard
```

**Supabase Secrets:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set SUPABASE_URL=deine_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=dein_service_role_key
```

### 5. Dependencies installieren

```bash
npm install
```

### 6. Datenbank Migrations ausführen

**Option A: Via Supabase Dashboard (Empfohlen)**

1. Öffne [Supabase Dashboard → SQL Editor](https://app.supabase.com)
2. Kopiere Inhalt von `migrations/005_add_subscriptions.sql`
3. Einfügen und **Run** klicken
4. Dann Inhalt von `migrations/006_lifetime_deals.sql` kopieren
5. Einfügen und **Run** klicken

**Option B: Via CLI**

```bash
supabase migration up
```

### 7. Edge Functions deployen

```bash
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
```

(stripe-portal brauchst du nicht für Lifetime Deals)

### 8. Webhook in Stripe konfigurieren

1. Gehe zu [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Klicke **Endpoint hinzufügen**
3. Endpoint URL: `https://DEIN-PROJECT-REF.supabase.co/functions/v1/stripe-webhook`
4. Events auswählen:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Endpoint hinzufügen
6. **Webhook Secret kopieren** (fängt an mit `whsec_`)
7. Secret setzen:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_dein_secret
```

### 9. Testen!

#### Test Cards von Stripe:

**Erfolgreiche Zahlung:**
- Karte: `4242 4242 4242 4242`
- Ablauf: Beliebiges zukünftiges Datum
- CVC: Beliebige 3 Ziffern
- PLZ: Beliebige 5 Ziffern

**Zahlung fehlgeschlagen:**
- Karte: `4000 0000 0000 9995`

#### Test-Ablauf:

1. Dev Server starten: `npm run dev`
2. Neuen Account erstellen
3. Auf "Upgrade" klicken
4. Pro oder Business auswählen
5. Testk arte `4242 4242 4242 4242` verwenden
6. Checkout abschließen
7. Prüfen: In Dashboard sollte jetzt "Pro LTD" oder "Business LTD" status angezeigt werden

#### Verifizierung:

**In Stripe Dashboard:**
- [Zahlungen](https://dashboard.stripe.com/test/payments) - Zahlung sollte sichtbar sein
- [Kunden](https://dashboard.stripe.com/test/customers) - Dein Test-User sollte da sein
- [Webhooks](https://dashboard.stripe.com/test/webhooks) - Events sollten empfangen worden sein

**In Supabase:**
- Tabelle `subscriptions` - Row mit `status = 'lifetime'` und richtiger `tier_id`
- Tabelle `payment_history` - Zahlungseintr ag mit `status = 'succeeded'`

---

## 🎨 UI Integration

Die UI-Komponenten sind schon fertig! Du musst nur noch:

### In Dashboard/Settings integrieren:

```typescript
import { UpgradePricingModal } from './components/UpgradePricingModal';

const [showUpgrade, setShowUpgrade] = useState(false);

// Upgrade Button irgendwo anzeigen
<Button onClick={() => setShowUpgrade(true)}>
  Jetzt upgraden
</Button>

// Modal anzeigen
{showUpgrade && (
  <UpgradePricingModal
    onClose={() => setShowUpgrade(false)}
    currentTier="free"  // oder 'pro' / 'business'
  />
)}
```

### Features sperren für Free User:

```typescript
import { FeatureGate } from './components/FeatureGate';

<FeatureGate
  feature="customColors"
  onUpgrade={() => setShowUpgrade(true)}
>
  <ColorPicker />  {/* Nur für Pro/Business sichtbar */}
</FeatureGate>
```

---

## 💡 AppSumo / Deal-Plattformen

Falls du auf AppSumo oder anderen Deal-Plattformen launchen willst:

### Spezielle Codes erstellen:

1. In Stripe Dashboard → **Gutscheine** → **Neuer Gutschein**
2. Prozentsatz: z.B. 30% Rabatt
3. Code: z.B. `APPSUMO30`
4. Gültig für: Einmalige Zahlungen
5. Nutzer können Code beim Checkout eingeben

### Tracking:

Jede Zahlung wird in `payment_history` gespeichert mit:
- Betrag
- Tier
- Datum
- Stripe Payment ID

Du kannst also genau sehen, wer wann was gekauft hat.

---

## 🔄 Production Deployment

Wenn alles getestet ist:

### 1. Stripe Live Mode aktivieren

1. Toggle in Stripe Dashboard von "Test" zu "Live"
2. Neue **Live** Price IDs erstellen (gleiche Produkte, aber im Live Mode)
3. Live API Keys holen:
   - Publishable Key: `pk_live_xxxxx`
   - Secret Key: `sk_live_xxxxx`

### 2. Environment Variables updaten

**Frontend:**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

**Supabase:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
```

### 3. Live Webhook erstellen

1. Neuer Webhook im Live Mode
2. Gleiche URL: `https://dein-projekt.supabase.co/functions/v1/stripe-webhook`
3. Gleiche Events
4. Live Webhook Secret holen und setzen:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx
```

### 4. Price IDs in Code updaten

Ersetze Test Price IDs mit Live Price IDs in `subscriptionUtils.ts`.

---

## 📊 Erwartete Einnahmen

### Conservative (erste 3 Monate):

- 200 Sign ups
- 3% Conversion = 6 zahlende Kunden
- 4 × Pro (€89) + 2 × Business (€249) = **€854**

### Mit Marketing Push:

- 1,000 Sign ups
- 5% Conversion = 50 zahlende Kunden
- 35 × Pro (€89) + 15 × Business (€249) = **€6,850**

### Nach 6 Monaten:

- Bei 100 Pro + 30 Business = **€16,370 einmalig**
- Das ist **purer Gewinn** (keine monatlichen Kosten für bestehende Kunden!)

---

## 🎯 Marketing Tipps für LTDs

1. **Zeitlich begrenzt**: "Nur noch 48h: Lifetime Deal für €89!"
2. **Limited Spots**: "Nur noch 100 Plätze verfügbar"
3. **Social Proof**: Zeige wie viele schon gekauft haben
4. **Vergleich**: "Statt €9.99/Monat → Nur €89 einmalig (zahlt sich nach 9 Monaten ab)"
5. **30-Tage Geld-zurück-Garantie**: Senkt Kaufhemmung

---

## ❓ FAQ

**Q: Kann ich später zu Subscriptions wechseln?**
A: Ja! Die Infrastruktur unterstützt beides. Einfach neue Subscription-Produkte in Stripe anlegen.

**Q: Was passiert mit Lifetime-Käufern wenn ich zu Subscriptions wechsle?**
A: Die behalten lebenslang Zugriff (`status = 'lifetime'`). Neue Kunden zahlen dann monatlich.

**Q: Kann ich Preise ändern?**
A: Ja, neue Preise in Stripe anlegen und Price IDs in `subscriptionUtils.ts` updaten. Bestehende Käufer sind nicht betroffen.

**Q: Wie handle ich Refunds?**
A: In Stripe Dashboard → Zahlungen → Refund. Status in DB wird automatisch upgedatet via Webhook.

**Q: Brauche ich Customer Portal?**
A: Nein, bei Lifetime Deals nicht notwendig. Kunden haben nichts zu verwalten.

---

## ✅ Checkliste

- [ ] Stripe Account erstellt
- [ ] Produkte und Prices in Stripe angelegt
- [ ] Price IDs in `subscriptionUtils.ts` eingetragen
- [ ] Environment Variables gesetzt (Frontend + Supabase)
- [ ] Dependencies installiert (`npm install`)
- [ ] Migrations ausgeführt (005 + 006)
- [ ] Edge Functions deployed
- [ ] Webhook konfiguriert in Stripe
- [ ] Webhook Secret gesetzt in Supabase
- [ ] Test-Zahlung erfolgreich durchgeführt
- [ ] Lifetime-Status in Datenbank verifiziert
- [ ] UI integriert (Upgrade Modal, Feature Gates)

---

## 🚀 Du bist startklar!

Alles ist vorbereitet für Lifetime Deals. Setup dauert ca. **30 Minuten**.

**Los geht's mit deinem ersten zahlenden Kunden!** 💰
