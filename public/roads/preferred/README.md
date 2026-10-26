# Preferred routing catalog 11 — Małopolska

© OpenStreetMap contributors. ODbL 1.0; license ../../licenses/ODbL-1.0.txt.
Source snapshot 2026-10-24, 05A-v1-a0575a3f5bd99f19-98733c38.
19 cities / 342 directed pairs; all individually audited from original directed OSM edges.
135 certified stage08 pairs never replaced by a longer route. Gorlice: all 36 directions.
Full-graph Dijkstra over edge+via-way state; no forced visits to county-city centres.
Conditional HGV/bus rules are scoped to their vehicle classes; unresolved van rules blocked.
Incomplete restriction members are never invented. Partial-node manoeuvres require a
universal proof against every possible missing from/to; other manoeuvres are excluded.
Distances optimize the frozen graph under this conservative, auditable van profile,
not current traffic or legal changes after the snapshot.

catalog.json stores original directed segment geometries once, routes as segment indices.
manifest.json identifies the exact SHA256 and version; the game verifies it, with no
silent fallback to older county detours. Saved active journeys retain their own geometry.
No full road graph is loaded in the browser. Source graph remains available in ../demo/.
Full evidence: docs/reports/11-route-acceptance.json in the repository.
Reproduction: node scripts/verify-routes11.mjs.
