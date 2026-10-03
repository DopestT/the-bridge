# NETIZENS College Groups Pilot

## Scope

College Groups is a pilot **inside Crews**, not a new top-level NETIZENS place.

The first seed set is intentionally small and local to the DMV:

- University of Maryland
- Howard University
- Georgetown University
- George Washington University
- American University

These are seeded spaces only. Their presence does **not** assert current political activity, membership, ideological composition, or endorsement by the institution.

## Product hypothesis

Students may use a campus-specific Crew as a lower-friction entry point into NETIZENS than a national campus map or issue graph.

The pilot tests one narrow behavior:

**Crews → College Groups → Open campus group → Join / return**

If students do not use this reliably, expanding into a national campus layer, issue graph, or coalition system would be premature.

## Instrumented events

The browser emits these NETIZENS analytics events:

- `college_groups_pilot_impression`
- `college_group_view`
- `college_group_membership`

Existing `place_view` and `entity_view` events remain available.

### Suggested funnel

1. Unique Citizens with `college_groups_pilot_impression`
2. Unique Citizens with `college_group_view`
3. Unique Citizens whose latest `college_group_membership.status` is `active`
4. Returning group viewers after 1, 7, and 30 days

## What is not implemented yet

The current V3 prototype dispatches analytics events in-browser. It does **not** yet provide a production analytics sink, authenticated unique-user aggregation, retention cohorts, or cross-device identity.

That means the UI can be tested now, but real usage measurement requires the production host to persist these events.

## Expansion gates

Do not expand the pilot merely because the UI looks good.

Before building a national Campus Map or Issue Graph, verify:

- students can find their campus group without explanation;
- group opens are more than accidental impressions;
- joins occur;
- joined users return;
- groups produce useful activity rather than empty membership;
- moderation and campus verification requirements are understood.

## Political/civic boundary

NETIZENS provides infrastructure for students to organize, discuss issues, create projects, attend events, and participate in civic life. The product should not decide which political position students should adopt or manipulate ranking to favor a viewpoint.
