# 0011. Serve the dashboard and the API from the same origin

- Status: Proposed
- Date: 2026-11-17

## Context
The dashboard is a static single-page app. The API is a separate process. If they live on different hosts or ports, every request becomes a cross-origin request: the API needs CORS rules, and session cookies need `SameSite=None` and extra CSRF care.

## Decision
The browser always sees one origin.
- **Development:** the Vite dev server proxies `/v1/*` to the API.
- **Compose, local and VPS:** Traefik serves the dashboard's static files at `console.<domain>/` and routes `console.<domain>/v1/*` to the API.

The dashboard only uses relative paths such as `/v1/servers`.

## Consequences
- No CORS configuration.
- Session cookies can be `HttpOnly` and `SameSite=Lax`, which blocks most CSRF on its own (Phase 5).
- One build of the dashboard works in every environment, because nothing environment-specific is baked in.
- Third-party browser apps cannot call the API directly. Scripts and the CLI are unaffected, because they use API keys, not cookies.

## Alternatives considered
- **API on its own subdomain (`api.<domain>`) with CORS:** common, but adds CORS and cookie configuration for no benefit here.
- **API serves the dashboard files itself:** one fewer container, but mixes concerns and makes the API restart for UI changes.
