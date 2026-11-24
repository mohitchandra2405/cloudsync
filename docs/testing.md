# Testing and demonstration checklist

## Automated checks

From the project root:

```bash
npm test
npm run build
```

Vitest/React Testing Library cover deterministic UI/service utility behavior. A production build catches module and JSX integration errors. The application does not claim a Firebase cloud flow has passed until it is exercised against a configured Firebase project.

## Cloud-backed demonstration

Set up Firebase, Admin credentials, frontend environment, then run `npm run server` and `npm run dev`. Use two browser sessions and two registered accounts.

1. Register with full name/email/password; verify a `users/{uid}` profile. Log out/in, reset password, and sign in with Google after enabling that provider.
2. Create, rename, star, search, sort, and trash a document. Refresh and confirm metadata still exists. Restore from Trash.
3. Open the same document in both sessions. Type at once and check both views converge; inspect collaborator cursor/name and saved status. Disconnect/reconnect one session and verify it catches up.
4. Share to the second account as Viewer. Verify it opens read-only, and verify it cannot edit. Change permission to Editor, reconnect, edit simultaneously, then remove access and confirm new document/WebSocket requests are denied.
5. Save a version, make more edits, preview the history summary, restore the saved version, and verify the pre-restore document state appears as a new snapshot.
6. Upload a supported image under 5 MB and confirm it loads after refresh. Confirm an unsupported type or oversized image is rejected. Export HTML, print/save as PDF, and download DOCX.
7. Verify another signed-in user without a grant cannot open the Firestore document, version, file URL, Express sharing route, or Hocuspocus room.
8. Stop/restart the collaboration server while retaining its data directory, reconnect, and confirm the Yjs content loads. For deployment, repeat against the actual persistent disk and WebSocket host.

Firebase Console Rules Playground or the Emulator Suite can exercise denied and allowed rule cases. For a release, automate the multi-browser collaboration checks with Playwright and the Firebase Emulator Suite, and run against the same Node version and hosting topology as deployment.
