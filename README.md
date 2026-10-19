# Aarogya Loop

Connected care, from prescription to follow-up.

Aarogya Loop is a healthcare coordination demo for patients, doctors, and caregivers. It covers medications, appointments, prescriptions, follow-ups, notifications, and health-record notes. The interface does not diagnose, prescribe, or replace emergency care.

This repository has no backend. Records stay in the browser unless you later connect an API.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5171` or `http://localhost:5173`.

Other commands:

```bash
npm test
npm run lint
npm run build
npm run preview
```

Copy `.env.example` to `.env` only if you want to change the data source. The default is the browser demo.

## Sample sign-in

These accounts exist only in the demo. Passwords are not sent anywhere.

| Person | Role | Email | Password |
| --- | --- | --- | --- |
| Aarav Mehta | Patient | aarav.mehta@demo.aarogyaloop.test | demo-patient |
| Ananya Shah | Doctor | ananya.shah@demo.aarogyaloop.test | demo-doctor |
| Priya Mehta | Caregiver | priya.mehta@demo.aarogyaloop.test | demo-caregiver |
| Lakshmi Nair | Older patient | lakshmi.nair@demo.aarogyaloop.test | demo-elder |

Ananya sees Aarav and Lakshmi. She does not see Rohan Desai, who is assigned to a different sample clinician. Priya is linked to Aarav and Lakshmi.

Choosing “Doctor” on the registration form does not verify a clinician. A new caregiver is not linked to anyone.

## Routes

- `/` public site
- `/login`, `/register`, `/forgot-password`
- `/patient/dashboard`, `/doctor/dashboard`, `/caregiver/dashboard`
- `/patients/:patientId` for an assigned clinician
- `/medications`, `/appointments`, `/prescriptions`, `/follow-ups`
- `/notifications`, `/health-records`, `/profile`, `/settings`

## What is real in this demo

- Navigation, validation, search, filters, and confirmation dialogs
- Creating reminders, visits, follow-ups, and document notes in `localStorage`
- Recording a reminder as taken, skipped, or missed
- Role-aware screens

Recording “taken” stores that choice. It does not prove a dose was consumed.

Uploading a prescription stores the file name and the text you confirm. The file is not read, scanned, or medically verified. The “sample extraction” button inserts placeholder text.

Browser alerts run only after you press the test button. Email, SMS, and background push are not configured.

## Proposed API

`src/services/contract.ts` lists the routes a backend should provide, including login, medications, doses, appointments, prescriptions, follow-ups, notifications, and records. The UI calls `src/services/care.ts`. Set `VITE_DATA_SOURCE=api` to surface an explicit “not connected” error instead of the demo.

The server, not these screens, must enforce authentication and which patient records a person can open.

## Limitations

- No server, database, OCR, pharmacy, or notification provider
- Demo passwords live in the browser and are not a security design
- Sessions last eight hours in `localStorage`
- Resetting demo data removes accounts created in this browser
