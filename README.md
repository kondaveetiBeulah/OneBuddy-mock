# Firestore bootstrap files

This folder contains Firestore and Realtime Database rules, Firestore indexes, Cloud Storage rules, Emulator Suite ports, and a repeatable Admin SDK seed importer. It is separate from the Expo app; it does not change the app's current Firebase configuration.

## What this setup creates

Deploying the rules and indexes configures security and query support. Firestore does not have empty tables, so those files do not create data collections by themselves. The seed file creates `systemMetadata/firestoreSchema`, the service directory, and initial healthcare specialty references. The service and specialty documents are editable reference data, not real hospitals/providers. The empty catalog arrays are placeholders for your authorized restaurant, grocery, hospital, doctor and service-provider datasets.

The schema is defined in [../FIRESTORE_SCHEMA.md](../FIRESTORE_SCHEMA.md), including hospital, department, doctor, availability, appointment, pharmacy, medicine, prescription and medical document models.

## First setup

1. Create a new Firebase project for the product and enable Authentication, Cloud Firestore, Realtime Database, Cloud Storage, and Cloud Functions as needed.
2. Create the default Firestore database and select its location carefully. Create a Realtime Database instance and note its URL as part of app/backend configuration. Deploying rules does not create either database instance.
3. Install Node.js 22 or newer and Firebase CLI. In this directory run:

   ```bash
   npm install
   ```

4. Authenticate with Firebase CLI for rules/index deployment and Google Application Default Credentials for the Admin SDK import. With Google Cloud CLI installed, set up ADC with `gcloud auth application-default login`. The Admin SDK has full database access; use a dedicated, least-privilege operator account and keep its credentials out of source control.
5. Add actual catalog records to `seed-data.json` before importing them. The importer accepts stable document IDs and supports `{"__type":"timestamp","value":"ISO-8601"}` and `{"__type":"geopoint","latitude":0,"longitude":0}` values.

## Deploy and initialize in one command

After installing dependencies and confirming Firebase CLI login plus Google Application Default Credentials, review `seed-data.json`, then run this from PowerShell:

```powershell
.\firebase-bootstrap\bootstrap.ps1 -ProjectId YOUR_FIREBASE_PROJECT_ID -Apply
```

`-Apply` is required because the script deploys security rules/indexes and writes documents. It deploys Firestore, Realtime Database and Storage rules, then imports the starter seed. The current seed importer writes reference documents to the default Firestore database.

## Deploy rules and indexes manually

From the project root, select the project explicitly:

```bash
firebase deploy --config firebase-bootstrap/firebase.json --project YOUR_FIREBASE_PROJECT_ID --only firestore,database,storage
```

The rules are intentionally restrictive for orders, appointments, medical records, payments and wallets. Implement the corresponding authenticated Cloud Functions before enabling those client flows. Catalog and reference records can be read publicly; only users with the `admin` custom claim can write catalog documents from a client. Admin SDK imports bypass rules. The schema uses the supported default Firestore database for business and catalog documents, and Realtime Database for short-lived ride locations.

## Import seed records

From the project root, preview first:

```bash
npm --prefix firebase-bootstrap run import:seed -- --project YOUR_FIREBASE_PROJECT_ID --file firebase-bootstrap/seed-data.json
```

The default is a dry run. Apply the seed data only after reviewing the project and file:

```bash
npm --prefix firebase-bootstrap run import:seed -- --project YOUR_FIREBASE_PROJECT_ID --file firebase-bootstrap/seed-data.json --apply
```

The importer only accepts reference/catalog collection names, validates records before writing, uses a Firestore `BulkWriter`, and never deletes documents. It accepts nested menu items, hospital departments/doctors/availability, and pharmacy inventory paths. Re-running it updates the selected IDs. Use a separate reviewed migration tool for user records, appointments, medical files or historical orders; this importer deliberately rejects those collections.

## Notes before production

- Run rules through the Firebase Emulator Suite and verify owner, other-user, anonymous and admin cases.
- The feedback Storage path is scoped to the signed-in user's order directory; the backend must still validate that the referenced order belongs to that user before attaching feedback.
- Decide how hospital staff accounts and patient consent are represented before loading real medical records. Do not load actual patient details into the sample seed.
- Seed the real hospital/doctor catalog from an approved data source. No real hospital records are included because the project has no hospital dataset, and its hospital/appointment references are UI placeholders rather than a complete booking flow.
- Add automated runtime validation in Cloud Functions. Firestore itself does not enforce the document field schemas in the Markdown file.
- Run the app and backend against the configured local emulators during development. CI should deploy rules/indexes to a disposable project or emulator, run startup smoke checks, and fail on lint, typecheck, rules, API contract, or integration errors.
- No schema or architecture can guarantee zero production errors. Treat clean startup, valid configuration, tested rules, idempotent retries, monitoring and rollback as release gates; run load tests against expected peak traffic before launch.
