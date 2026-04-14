# MIOC Nogometni Turnir 2026

Web aplikacija za praćenje školskog nogometnog turnira XV. gimnazije (MIOC), Zagreb.

- **Frontend:** Vite + React + TypeScript + Tailwind, deploy na **GitHub Pages**
- **Backend:** **Firebase** (Firestore za podatke, Auth za organizatore)
- **Realtime:** rezultati se osvježavaju uživo svima koji gledaju

Live URL (nakon prvog deploya): `https://Mramar-croatia.github.io/mioc-nogometni-turnir/`

---

## Setup — od nule do live aplikacije

Pretpostavlja se da imaš instaliran [Node.js 20+](https://nodejs.org) i [Git](https://git-scm.com).

### 1) Kloniraj repo i instaliraj pakete

```bash
git clone https://github.com/Mramar-croatia/mioc-nogometni-turnir.git
cd mioc-nogometni-turnir
npm install
```

### 2) Kreiraj Firebase projekt

1. Otvori https://console.firebase.google.com → **Add project**
2. Naziv: `mioc-turnir` (ili po želji), bez Google Analyticsa.
3. U lijevom meniju otvori **Build → Authentication**
   - Klikni **Get started**
   - Pod **Sign-in method** → omogući **Email/Password**
4. **Build → Firestore Database** → **Create database**
   - Lokacija: `eur3 (europe-west)`
   - Početno: **Production mode** (sigurnosna pravila ćemo postaviti odmah)
5. **Project Settings** (zupčanik gore lijevo) → kartica **General** → dolje **Your apps** → klikni **`</>`** ikonu (Web app)
   - Nadimak: `mioc-turnir-web`
   - **Nemoj** uključiti Hosting (koristimo GitHub Pages)
   - Kopiraj `firebaseConfig` vrijednosti — trebat će u sljedećem koraku.

### 3) Lokalna `.env` datoteka

Kopiraj `.env.example` u `.env` i ispuni iz Firebase config-a:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=mioc-turnir.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mioc-turnir
VITE_FIREBASE_STORAGE_BUCKET=mioc-turnir.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...:web:...
```

> API ključ je javan — sigurno ga je ostaviti u frontend kodu. Sigurnost se osigurava Firestore pravilima u koraku 4.

### 4) Postavi Firestore sigurnosna pravila

U Firebase konzoli → **Firestore Database → Rules** — kopiraj sadržaj datoteke `firestore.rules` iz repoa i klikni **Publish**.

Pravila kažu: **svi mogu čitati javne podatke, samo dokumenti u `/admins/{uid}` mogu pisati.**

### 4a) Omogući Firebase Storage (za grbove ekipa)

1. U Firebase konzoli → **Build → Storage → Get started**.
2. Lokacija: `eur3 (europe-west)`, odaberi **Production mode**.
3. Otvori karticu **Rules** i zalijepi sadržaj datoteke `storage.rules` iz repoa, pa **Publish**.
   - Ili preko CLI-ja: `firebase deploy --only storage`.

Pravila dozvoljavaju javno čitanje grbova iz `team-crests/`, a upis samo adminima.

### 5) Pokreni lokalno

```bash
npm run dev
```

Otvori http://localhost:5173 — vidjet ćeš praznu početnicu jer još nema podataka.

### 6) Bootstrap prvog admina (jednom)

Aplikacija ne dopušta otvorenu registraciju. Prvi admin se kreira ručno:

1. U Firebase konzoli → **Authentication → Users → Add user**
   - Unesi svoj email i lozinku.
   - Kopiraj **User UID** koji se pojavi (npr. `aBcDeF12...`).
2. **Firestore Database → Start collection**
   - Collection ID: `admins`
   - Document ID: zalijepi tvoj UID
   - Polje: `email` (string) = tvoj email
   - Polje: `addedAt` (number) = `0`
   - Save.

### 7) Unos podataka

U adminu (`/#/admin`):
- **Ekipe** → **+ Nova** za svaku ekipu (kapetan, igrači, divizija).
- **Utakmice** → **+ Nova** za svaku utakmicu I. kola (datum, vrijeme, ekipe).
- **Ladder** → koristi se za dodavanje utakmica II. faze (double elimination) kasnije.

### 8) Dodaj ostale organizatore

U adminu → **Organizatori** → unesi email + privremenu lozinku → klikni **Kreiraj admina**.
Reci im da promijene lozinku nakon prve prijave (Firebase to traži kroz Auth).

> Napomena: nakon dodavanja Firebase te automatski prijavi kao novokreirani korisnik. Odjavi se i prijavi svojim računom.

### 9) Deploy na GitHub Pages

1. **Settings → Pages** u GitHub repou → **Build and deployment → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → New repository secret** — dodaj svih 6 vrijednosti iz `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. **Settings → Authorized domains** u Firebase Authentication → dodaj `mramar-croatia.github.io`.
4. Commit + push:

   ```bash
   git add .
   git commit -m "init aplikacije"
   git push origin main
   ```
5. Otvori karticu **Actions** u GitHub repou — workflow se pokreće sam. Nakon ~2 minute aplikacija je na `https://Mramar-croatia.github.io/mioc-nogometni-turnir/`.

---

## Svakodnevno korištenje

- **Otvori utakmicu u adminu** → unesi rezultat → klikni status **Završeno** → odaberi **Pobjednika** → **Spremi**.
- **Dodaj gol** → odaberi ekipu → unesi ime, minutu, poluvrijeme → **Dodaj gol**. Timeline na javnoj stranici se odmah ažurira.
- **II. faza:** kad I. kolo završi, idi na **Ladder** u adminu → dodaj utakmice double-elimination ladera ručno (Pobjednička / Poražena / Finale / Veliko finale).

## Struktura

```
src/
├── components/      Layout, MatchCard, GoalTimeline, Loading
├── lib/             firebase.ts, types.ts, utils.ts, hooks.ts
└── pages/
    ├── Home, Matches, MatchDetail, Teams, TeamDetail, Bracket, TopScorers
    └── admin/       Login, AdminLayout, Dashboard, MatchEdit, BracketAdmin, Admins, Seed
public/data.json     izvorni podaci o ekipama i rasporedu
firestore.rules      sigurnosna pravila baze
.github/workflows/   automatski deploy
```

## Boje

- Plava `#1d4e9e`, Crvena `#d42a3c`, Tamna `#13152a`
- Fontovi: Bebas Neue (display), Barlow Condensed (oznake), Barlow (tijelo)
