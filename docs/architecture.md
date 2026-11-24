# CloudSync architecture

## Request flow

1. Firebase Authentication signs a user in and returns an ID token.
2. The React app reads/writes metadata directly through the Firestore SDK, where Firestore Rules enforce document and role access. User profiles are private to their owner.
3. Image uploads go to Firebase Storage. Storage Rules consult the document and permission records in Firestore and restrict writes to owner/editor roles and approved image types/size.
4. Sharing and permanent deletion go through Express. Express verifies the Firebase ID token with Firebase Admin, checks owner role, then updates Firestore permissions or recursively deletes a document tree.
5. The browser connects to a Hocuspocus room named with the Firestore document ID. `onAuthenticate` verifies the Firebase ID token and reads the current Firestore permission before Hocuspocus loads any document bytes. Viewers get a read-only WebSocket connection.
6. TipTap maps ProseMirror transactions into a Yjs shared document. Yjs merges concurrent local changes; Hocuspocus sends updates and awareness states (including remote cursors) to the other connected clients.
7. Hocuspocus stores binary Yjs document state in SQLite. The browser separately updates Firestore metadata and writes occasional JSON snapshots to the document's `versions` subcollection.

## Two-device collaboration

The owner invites an existing Firebase user and grants Editor or Viewer access. Both devices authenticate independently and connect to the same Hocuspocus room name. The server checks each user's Firestore role before opening the room. Editors submit Yjs updates; the server broadcasts merged CRDT updates and cursor awareness. The SQLite store restores the Yjs state on a later connection. A viewer can receive updates and cursor presence, but Hocuspocus marks that connection read-only and Firestore rules reject client-side edits.

## Deployment boundaries

Firebase Hosting serves the static Vite bundle and SPA rewrite. Firebase Authentication, Firestore, and Storage are managed cloud services. The Node.js API and WebSocket server are a separate deployable service. The included SQLite file persists the Yjs state across process restarts only when the host supplies persistent disk. A multi-instance deployment needs shared durable Yjs persistence and Hocuspocus horizontal coordination; a single local SQLite file does not coordinate multiple instances.
