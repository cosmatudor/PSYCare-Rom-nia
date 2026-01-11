# PSYCare România

Platformă digitală pentru psihologi și pacienți - instrument complementar terapiei care face legătura între ședințele de consiliere, susține monitorizarea zilnică și ușurează colaborarea.

## Funcționalități

### Pentru Pacienți

- **Jurnal digital emoțional** - Notează zilnic starea, emoțiile, gândurile automate (text, emoji, voce)
- **Self-monitoring & tracking** - Grafice cu evoluția stării de spirit, anxietății, somnului, nivelului de stres
- **Exerciții interactive** - Mindfulness, CBT (terapie cognitiv-comportamentală), respirație, relaxare
- **Reminder-e pentru sarcini terapeutice** - Notificări pentru practicarea tehnicilor și completarea fișelor
- **Psycho-educație adaptată** - Materiale video scurte, podcasturi, infografice
- **Acces la resurse de criză** - Buton rapid de apelare la linii de urgență, contacte de sprijin

### Pentru Psihologi

- **Dashboard pentru progres** - Rapoarte săptămânale cu datele introduse de pacient
- **Feedback asincron** - Trimite scurte mesaje sau sugestii între ședințe
- **Spațiu pentru teme de lucru** - Încărcarea și monitorizarea sarcinilor pentru pacient
- **Alertă în caz de risc suicidar sau agravare** - Dacă pacientul raportează stări critice
- **Integrare cu calendar** - Pentru programarea ședințelor, reminder automat
- **Gestionarea pacienților și ședințelor** - Calendar integrat, dosare electronice

## Tehnologii

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Autentificare**: JWT (JSON Web Tokens)
- **Stocare date**: JSON files (poate fi înlocuit cu MongoDB/PostgreSQL)

## Instalare

### Instalare dependențe

```bash
npm run install:all
```

Aceasta va instala dependențele pentru root, server și client.

### Rulare în modul development

```bash
npm run dev
```

Aceasta va porni:
- Serverul backend pe `http://localhost:3001`
- Clientul frontend pe `http://localhost:3000`

### Rulare separată

**Server:**
```bash
cd server
npm run dev
```

**Client:**
```bash
cd client
npm run dev
```

## Structura proiectului

```
terapy-app/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Pagini pentru pacienți și psihologi
│   │   ├── components/    # Componente reutilizabile
│   │   └── contexts/      # Context API pentru autentificare
│   └── package.json
├── server/                 # Backend Express
│   ├── src/
│   │   ├── routes/        # Rute API
│   │   ├── data/          # Logica de stocare date
│   │   └── middleware/    # Middleware pentru autentificare
│   └── package.json
└── package.json           # Root package.json
```

## Utilizare

### Creare cont

1. Accesează aplicația la `http://localhost:3000`
2. Click pe "Creează cont"
3. Selectează rolul (Pacient sau Psiholog)
4. Completează datele și creează contul

### Pentru Psihologi

1. Creează un cont ca Psiholog
2. Notează ID-ul tău (va fi afișat după crearea contului)
3. Distribuie ID-ul pacienților pentru a se putea conecta la tine

### Pentru Pacienți

1. Creează un cont ca Pacient
2. Introdu ID-ul psihologului tău (opțional)
3. Începe să folosești aplicația pentru a-ți urmări progresul

## API Endpoints

### Autentificare
- `POST /api/auth/register` - Înregistrare
- `POST /api/auth/login` - Autentificare

### Jurnal (Pacienți)
- `POST /api/journal` - Creează intrare în jurnal
- `GET /api/journal/me` - Obține propriile intrări
- `GET /api/journal/patient/:patientId` - Obține intrările unui pacient (psiholog)

### Pacienți (Psihologi)
- `GET /api/patients/my-patients` - Lista pacienților
- `GET /api/patients/:patientId/progress` - Progresul unui pacient

### Programări
- `POST /api/appointments` - Creează programare
- `GET /api/appointments` - Lista programărilor
- `PUT /api/appointments/:id` - Actualizează programare

### Exerciții
- `GET /api/exercises` - Lista exercițiilor
- `GET /api/exercises/:id` - Detalii exercițiu

### Mesaje
- `POST /api/messages` - Trimite mesaj
- `GET /api/messages/conversations` - Lista conversațiilor
- `GET /api/messages/:userId` - Mesajele cu un utilizator

## Dezvoltare viitoare

- [ ] Integrare cu baze de date (MongoDB/PostgreSQL)
- [ ] Notificări push
- [ ] Încărcare fișiere audio pentru jurnal
- [ ] Integrare cu Zoom/Google Meet
- [ ] Facturare automată
- [ ] Rapoarte pentru Colegiul Psihologilor
- [ ] Versiune mobilă (React Native)

## Licență

MIT

# PSYCare-Rom-nia
