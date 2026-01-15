# Google Meet API Setup

Acest ghid te ajută să configurezi Google Meet API pentru a genera link-uri reale de întâlniri.

## Pași de configurare

### 1. Creează un proiect Google Cloud

1. Mergi la [Google Cloud Console](https://console.cloud.google.com/)
2. Creează un proiect nou sau selectează unul existent
3. Activează **Google Calendar API** și **Google Meet API** pentru proiectul tău:
   - Mergi la "APIs & Services" > "Library"
   - Caută "Google Calendar API" și activează-l
   - Caută "Google Meet API" și activează-l
   - **Notă:** Aplicația folosește Calendar API ca fallback pentru a crea link-uri Google Meet (funcționează mai bine cu service accounts)

### 2. Creează un Service Account

1. Mergi la "APIs & Services" > "Credentials"
2. Click pe "Create Credentials" > "Service Account"
3. Completează detaliile și creează contul
4. Click pe service account-ul creat
5. Mergi la tab-ul "Keys"
6. Click "Add Key" > "Create new key"
7. Selectează "JSON" și descarcă fișierul

### 3. Configurează autentificarea

1. Plasează fișierul JSON descărcat în folderul `server/`
2. Setează variabila de mediu:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="./path/to/your/service-account-key.json"
```

Sau adaugă în fișierul `.env`:
```
GOOGLE_APPLICATION_CREDENTIALS=./path/to/your/service-account-key.json
```

### 4. Permisiuni necesare

Service account-ul trebuie să aibă următoarele scope-uri OAuth:
- `https://www.googleapis.com/auth/calendar` (pentru crearea evenimentelor cu Meet)
- `https://www.googleapis.com/auth/meetings.space.created` (pentru Meet API direct)
- `https://www.googleapis.com/auth/meetings` (pentru Meet API direct)

**Important:** 
- Aplicația folosește **Google Calendar API** ca metodă principală pentru a crea link-uri Google Meet (funcționează mai bine cu service accounts)
- Dacă Meet API direct nu funcționează (eroare de permisiuni), aplicația va folosi automat Calendar API
- Asigură-te că Google Calendar API este activat în proiectul tău Google Cloud
- Service account-ul are rolul "Service Account User" sau "Editor" în IAM

### 5. Testare

După configurare, poți testa crearea unui meeting space:

```bash
curl -X POST http://localhost:3001/api/appointments/meet/create \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notă pentru dezvoltare

Dacă nu configurezi credențialele Google Cloud, aplicația va genera link-uri mock pentru dezvoltare. Acestea nu vor funcționa ca întâlniri reale, dar permit testarea funcționalității aplicației.

## Resurse

- [Google Meet API Documentation](https://developers.google.com/meet/api/guides/overview)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Service Accounts Guide](https://cloud.google.com/iam/docs/service-accounts)
