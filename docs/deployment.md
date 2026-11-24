# Deployment guide

## Firebase resources

1. Create the Firebase project and enable Auth (Email/Password and Google), Firestore, and Storage as described in [firebase-setup.md](firebase-setup.md).
2. Install and authenticate the Firebase CLI, then select the project:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   ```

3. Deploy database rules, indexes, and storage rules:

   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```

## Collaboration/API service

Deploy the `backend/` folder to a Node.js 22+ host that supports long-lived WebSocket connections and persistent disk. Set the start command to `npm start` (or run `npm install` then `npm start` in that directory). Configure `PORT`, `COLLAB_PORT` (or adapt the host's port routing), `CLIENT_ORIGIN`, `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`/platform workload identity, and a persistent `COLLAB_DATABASE` path. The host must route both HTTPS API traffic and `wss://` WebSocket traffic to the process. Never expose the Admin service-account secret as a public build variable.

The current server starts Express and Hocuspocus on separate ports. If the platform exposes only one public port, configure a reverse proxy or split API and collaboration into separate services. Keep a single Hocuspocus instance for the SQLite demo unless you move to shared storage and coordination. Back up the collaboration database and provision durable storage.

## Frontend and hosting

1. Set the frontend build environment: all `VITE_FIREBASE_*` values, `VITE_API_URL=https://api.example.com`, and `VITE_COLLAB_URL=wss://collab.example.com` (or the same host if your proxy routes both paths/ports).
2. Build and deploy:

   ```bash
   npm install
   npm run build
   firebase deploy --only hosting
   ```

3. The `firebase.json` Hosting rewrite sends client routes to `index.html`. Add the Hosting domain and any custom frontend domain to Firebase Auth's authorized domains.
4. Set the backend `CLIENT_ORIGIN` to the deployed frontend origin. Confirm HTTPS/WSS, API CORS, Firebase rules, web OAuth callback/domain config, and server secret configuration.

Firebase Hosting serves the static app and is not the persistent WebSocket host. The Hocuspocus process must stay live independently.
