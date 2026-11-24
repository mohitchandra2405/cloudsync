# CloudSync data model

Firestore timestamps use server timestamps. Firebase Auth owns password credentials; no password is stored in Firestore.

| Path | Main fields | Access |
| --- | --- | --- |
| `users/{uid}` | `name`, lowercase `email`, `photoURL`, `createdAt`, `updatedAt` | User may read/write only their own profile. The server uses Admin access for share lookup. |
| `documents/{documentId}` | `title`, `ownerId`, `ownerName`, `createdAt`, `updatedAt`, `updatedBy`, `isDeleted`, `isStarred`, `visibility` | Owner and invited collaborators can read. Owner/editor can edit allowed metadata. Owner can delete. |
| `documents/{documentId}/permissions/{uid}` | `userId`, `email`, `name`, `role` (`editor`/`viewer`), `grantedBy`, `createdAt` | Target user can read their own permission; only the backend owner-checked sharing routes manage grants. |
| `documents/{documentId}/versions/{versionId}` | `content` (TipTap JSON), `createdBy`, `createdByName`, `createdAt` | Accessible to document members; editor/owner may add versions; owner can remove. |
| `documents/{documentId}/activity/{activityId}` | `userId`, `action`, `timestamp`, optional detail | Reserved for document activity events; member-readable and editor-writable by rules. |

The Hocuspocus SQLite extension stores its primary Yjs binary snapshots separately from Firestore in `COLLAB_DATABASE` (default `./data/collaboration.sqlite`). Yjs state must remain binary-compatible; do not reconstruct it from saved HTML/JSON on connect. SQLite is suitable for local demos/single server. Production horizontal scaling should move this persistence to shared durable storage and coordinate Hocuspocus instances.

Indexes are declared in `firestore.indexes.json`: owner documents sorted by `updatedAt`, collection-group permission lookup by `userId`, and versions sorted newest-first. The client query for shared items uses the `permissions` collection group and then fetches only those individual document IDs.
