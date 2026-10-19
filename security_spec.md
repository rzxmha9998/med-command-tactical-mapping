# MED-COMMAND Security Specification & Dirty Dozen Audit

## 1. Data Invariants

1. **Role Separation**: Only verified Admins (present in `/admins/{uid}` or bootstrapped `riskiramad3@gmail.com`) can create, update, or delete maps, units, and risk zones.
2. **Read Boundary for Officers**: Officers can ONLY read maps if their UID is included in `map.allowedOfficerIds` or their user profile `allowedMapIds` contains the `mapId`. Officers cannot modify any map, unit, or zone.
3. **Subcollection Relational Guard**: Units and Risk Zones in `/maps/{mapId}/*` inherit access from their parent `/maps/{mapId}`. They cannot be read if the parent map is not accessible.
4. **No Privilege Escalation**: Users cannot modify their own `role` or create themselves in `/admins/*`.
5. **Payload Integrity**: Unit and Risk Zone creations must contain required fields with bounded length (e.g. coordinates size limit, string length limits).
6. **Default Deny**: All unauthenticated access and unregistered paths are strictly denied.

## 2. The "Dirty Dozen" Payloads (Must be Denied)

1. **DD-1 (Self-Promotion)**: An unprivileged officer writes to `/admins/{uid}` to grant themselves admin status.
2. **DD-2 (Role Self-Assignment)**: An unprivileged user updates their `/users/{uid}` document to set `role: "admin"`.
3. **DD-3 (Unauthorized Map Creation)**: An officer attempts to create a new document in `/maps/{mapId}`.
4. **DD-4 (Unauthorized Unit Injection)**: An officer or unauthenticated visitor attempts to write a new unit into `/maps/{mapId}/units/{unitId}`.
5. **DD-5 (Unauthorized Zone Manipulation)**: An officer attempts to update or delete a risk zone in `/maps/{mapId}/riskZones/{zoneId}`.
6. **DD-6 (Unauthorized Map Reading)**: An officer attempts to read a map where they are NOT in `allowedOfficerIds`.
7. **DD-7 (Unauthenticated Read)**: An anonymous or unauthenticated client attempts to read `/maps`.
8. **DD-8 (Oversized Payload / Denial of Wallet)**: An attacker attempts to write a unit with a 5MB notes string.
9. **DD-9 (Invalid Status Injection)**: An attacker attempts to write an unauthorized status like `status: "SUPER_ADMIN"`.
10. **DD-10 (ID Poisoning Attack)**: An attacker uses malicious characters in `{mapId}` (e.g. `../../secret`).
11. **DD-11 (Orphan Unit Write)**: An attacker writes to `/maps/{nonExistentMap}/units/{unitId}` where the parent map does not exist.
12. **DD-12 (Malicious PII Read)**: An officer attempts to read another user's private profile in `/users/{otherUid}` without permission.

## 3. Security Rules Architecture

Rules enforce `rules_version = '2';` with helper functions:
- `isSignedIn()`
- `isAdmin()`: checks `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or bootstrapped admin email `riskiramad3@gmail.com`
- `isAllowedOfficer(mapData)`: checks if `request.auth.uid in mapData.allowedOfficerIds`
- `isValidId(id)`: regex `^[a-zA-Z0-9_\\-]+$` and size check.
