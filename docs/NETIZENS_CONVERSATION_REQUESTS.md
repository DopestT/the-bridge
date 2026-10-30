# First-conversation contract

Existing decisions: Supabase owns canonical private conversations; ordinary clients cannot insert threads or membership roles. Blocking and current account restrictions remain authoritative. Circle conversations retain their separate entity-bound path.

Implementation choice: direct conversations begin with a body-free invitation to an exact Citizen handle. Only its recipient may accept or decline; the sender may cancel. Acceptance atomically creates/reuses a two-member direct thread. Replays must not create extra requests, threads, members or notifications. No private message can be sent before acceptance.

Beta limits chosen for this implementation: five new invitations per sender per hour, seven-day invitation expiry, and a thirty-day cooldown after that recipient declines. Existing pending invitations and accepted conversations are reused without consuming another invitation. All bounds are server-side. These are implementation defaults, not claims that the owner explicitly selected these numbers.

Invitations contain no user-supplied message body. Only the two participants may read invitation metadata; blocked, anonymous or restricted accounts cannot use it to bypass contact controls. The target must also be an active permanent Citizen with a completed profile. Rejection states do not disclose whether an inaccessible handle exists.

Notifications are canonical in-app records. This does not claim remote push delivery. Sending/accepting requires a live connection and confirmed server response; the app never shows pending consent as an active conversation. No test invitation is sent to real people during implementation.

Acceptance: real PostgreSQL role tests cover consent, idempotency, nonparticipant denial, blocking, current-account restrictions, expiration, quota/cooldown and unchanged client thread grants. UI/transport tests cover request, acceptance, decline/cancel, unavailable service and canonical navigation. Live two-account and physical-device proof remain separate gates. The earlier Android APK does not contain this new flow; its provenance remains unchanged.
