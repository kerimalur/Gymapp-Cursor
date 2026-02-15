# GymApp Pro - Professionelle Fitness Tracking Software

Eine moderne, umfassende Fitness- und Ernährungs-Tracking-App, entwickelt mit Next.js, TypeScript, Tailwind CSS und Firebase.

## 🚀 Features

### 💪 Workout Tracking
- **Trainingstage erstellen**: Erstelle individuelle Trainingstage mit spezifischen Übungen
- **Trainingspläne**: Plane deine Woche mit strukturierten Trainingsplänen
- **Umfangreiche Übungsdatenbank**: Über 50 vordefinierte Übungen mit Muskelgruppen-Zuordnung
- **Live-Workout-Tracking**: Tracke deine Sätze, Wiederholungen und Gewichte in Echtzeit
- **Trainingshistorie**: Vollständige Historie aller absolvierten Trainings mit Detailansicht

### 🔄 Intelligentes Regenerations-System
- **Muskelgruppen-Tracking**: Überwache die Regeneration jeder Muskelgruppe einzeln
- **2D Muskel-Map**: Visualisiere deinen Regenerationsstatus mit interaktiver Körperkarte
- **Trainingstag-Bereitschaft**: Sieh auf einen Blick, welche Trainingstage bereit sind
- **Automatische Berechnung**: Basierend auf deinem letzten Training und Muskelgruppen

### 📅 Kalender & Planung
- **Monatsübersicht**: Übersichtlicher Kalender mit allen geplanten und absolvierten Trainings
- **Training planen**: Plane Workouts für bestimmte Tage im Voraus
- **Notizen**: Füge Notizen zu bestimmten Tagen hinzu
- **Intelligente Ersetzung**: Geplante Trainings werden automatisch durch abgeschlossene ersetzt

### 📊 Statistiken & Analyse
- **Leistungsdiagramme**: Visualisiere deine Fortschritte über Zeit
- **Muskelbalance**: Radar-Chart zur Analyse deiner Muskelgruppen-Balance
- **Übungsvergleich**: Vergleiche die Entwicklung verschiedener Übungen
- **Detaillierte Metriken**: Volumen, Durchschnittsgewichte, Trainingsfrequenz

### 🍎 Ernährungs-Tracking
- **Makronährstoff-Übersicht**: Tracke Kalorien, Protein, Kohlenhydrate und Fette
- **Umfangreiche Lebensmittel-Datenbank**: Über 40 vordefinierte Lebensmittel
- **Mahlzeiten-Historie**: Vollständige Übersicht aller gegessenen Mahlzeiten
- **Wasser & Koffein-Tracker**: Tracke deine Flüssigkeitsaufnahme
- **Supplements-Verwaltung**: Verwalte und tracke deine täglichen Supplements

### ⚙️ Einstellungen & Anpassung
- **Ernährungsziele**: Setze individuelle Makro- und Kalorienziele
- **Regenerationszeiten**: Passe die Standard-Regenerationszeiten an
- **Benachrichtigungen**: Konfiguriere Erinnerungen für Training und Ernährung
- **Profilverwaltung**: Verwalte deine persönlichen Daten

## 🛠️ Technologie-Stack

- **Framework**: Next.js 14 (App Router)
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **State Management**: Zustand
- **Charts**: Recharts
- **Animationen**: Framer Motion
- **Icons**: Lucide React
- **Datum/Zeit**: date-fns

## 📦 Installation

1. Repository klonen:
```bash
git clone <repository-url>
cd gymapp-cursor
```

2. Dependencies installieren:
```bash
npm install
```

3. Firebase-Konfiguration einrichten:
   - Erstelle eine `.env.local` Datei im Root-Verzeichnis
   - Kopiere den Inhalt aus `.env.local.example`
   - Füge deine Firebase-Konfigurationsdaten ein

4. Development-Server starten:
```bash
npm run dev
```

5. App im Browser öffnen:
```
http://localhost:3000
```

## 🔧 Firebase Setup

1. Erstelle ein neues Firebase-Projekt auf [firebase.google.com](https://firebase.google.com)
2. Aktiviere Authentication (Google Sign-In)
3. Erstelle eine Firestore-Datenbank
4. Kopiere die Firebase-Konfiguration in deine `.env.local`

### Firestore Collections:

- **users**: Benutzerprofile
- **trainingDays**: Trainingstage
- **trainingPlans**: Trainingspläne
- **workoutSessions**: Trainingseinheiten
- **meals**: Mahlzeiten
- **savedMeals**: Gespeicherte Mahlzeiten
- **supplements**: Supplements

## 📱 App-Struktur

```
gymapp-cursor/
├── app/                      # Next.js App Router
│   ├── dashboard/           # Dashboard-Seite
│   ├── tracker/             # Workout-Tracker
│   ├── recovery/            # Regenerations-Übersicht
│   ├── calendar/            # Trainingskalender
│   ├── statistics/          # Statistiken & Analyse
│   ├── nutrition/           # Ernährungs-Tracking
│   ├── settings/            # Einstellungen
│   ├── login/               # Login-Seite
│   └── onboarding/          # Onboarding-Tutorial
├── components/              # React-Komponenten
│   ├── layout/             # Layout-Komponenten
│   ├── tracker/            # Tracker-Komponenten
│   ├── recovery/           # Regenerations-Komponenten
│   ├── calendar/           # Kalender-Komponenten
│   ├── statistics/         # Statistik-Komponenten
│   ├── nutrition/          # Ernährungs-Komponenten
│   └── providers/          # Context-Provider
├── data/                    # Statische Daten
│   ├── exerciseDatabase.ts # Übungsdatenbank
│   └── foodDatabase.ts     # Lebensmittel-Datenbank
├── lib/                     # Utility-Funktionen
│   └── firebase.ts         # Firebase-Konfiguration
├── store/                   # Zustand-Stores
│   ├── useAuthStore.ts
│   ├── useWorkoutStore.ts
│   └── useNutritionStore.ts
└── types/                   # TypeScript-Typen
    └── index.ts
```

## 🎨 Design-Philosophie

- **Modern & Clean**: Minimalistisches Design mit Fokus auf Benutzerfreundlichkeit
- **Responsive**: Optimiert für Desktop, Tablet und Mobile
- **Intuitiv**: Klare Navigation und verständliche User-Flows
- **Visuell**: Starke Verwendung von Charts, Grafiken und Farben
- **Performant**: Schnelle Ladezeiten und flüssige Animationen

## 🚀 Deployment

### Vercel (Empfohlen)

1. Repository zu GitHub pushen
2. Auf [vercel.com](https://vercel.com) anmelden
3. Neues Projekt erstellen und Repository verbinden
4. Environment Variables hinzufügen (Firebase-Config)
5. Deployen!

## 📝 Lizenz

Dieses Projekt ist für private Nutzung gedacht.

## 👤 Autor

Entwickelt für persönliche Fitness-Ziele.

## 🙏 Acknowledgments

- Icons von [Lucide](https://lucide.dev/)
- UI-Inspiration von modernen Fitness-Apps
- Firebase für die Backend-Infrastruktur

---

**Viel Erfolg beim Training! 💪**
