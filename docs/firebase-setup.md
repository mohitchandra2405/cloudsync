# Firebase setup

1. Create a Firebase project in the Firebase console.
2. In **Authentication → Sign-in method**, enable **Email/Password** and **Google**. Add the local and deployed frontend domains under authorized domains.
3. Create a Cloud Firestore database. Deploy `firestore.rules` and `firestore.indexes.json` from the project root.
4. Create a Storage bucket. Deploy `storage.rules`. Ensure the bucket's billing/plan and region meet your project requirements.
5. Add a Web App in Project Settings. Copy its `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId` into a local `.env.local` using `.env.example` as the template. These Firebase web configuration values are identifiers intended for browser use; authorization is enforced by rules. They are not Admin credentials.
6. For Express and Hocuspocus, create a service account with only the required Firebase Admin permissions or use the hosting provider's workload identity/Application Default Credentials. Locally set `GOOGLE_APPLICATION_CREDENTIALS` to a private service-account JSON file outside this repository, and set `FIREBASE_PROJECT_ID` and `FIREBASE_STORAGE_BUCKET` in `backend/.env`. An optional `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable is supported for a secure secret manager; do not put it in frontend `VITE_*` variables.
7. Copy `backend/.env.example` to `backend/.env`, set the API/WebSocket ports and `CLIENT_ORIGIN`, and configure the client `VITE_API_URL`/`VITE_COLLAB_URL`.
8. Create two Firebase Auth accounts through the app. Profiles are created in `users/{uid}`. Sharing looks up the invited address in this collection, so recipients must register first.

Use the Firebase Emulator Suite if you want an isolated development project. Rules are deny-by-default for documents not owned or explicitly shared. Admin SDK calls bypass Firestore rules, so the Express/Hocuspocus code independently verifies ID tokens and roles; backend Admin credentials must be carefully limited and kept private.
