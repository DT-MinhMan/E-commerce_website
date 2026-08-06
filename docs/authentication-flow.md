# Authentication Flow

Phase 3 uses a short-lived JWT access token and a rotated opaque refresh token.

## Register And Login

1. The client posts email, password and full name to `/api/v1/auth/register`, or email and password to `/api/v1/auth/login`.
2. The backend normalizes email, hashes passwords with `bcryptjs`, and public registration always creates `CUSTOMER`.
3. The response returns a safe user object and a JWT access token.
4. The backend also sets an httpOnly `refreshToken` cookie scoped to `/api/v1/auth`.

The access token is held only in frontend memory through the Zustand auth store. TanStack Query owns server-state fetching and caching for auth-related requests. Tokens are not stored in localStorage or sessionStorage.

## Refresh

1. The client posts to `/api/v1/auth/refresh`; the raw refresh token is read from the cookie.
2. The backend hashes the raw token and looks up the hash in `refresh_tokens`.
3. The backend checks `revokedAt`, `expiresAt` and user status.
4. A valid refresh creates a new refresh token, revokes the old record, links `replacedByTokenId`, returns a new access token and replaces the cookie.

TTL indexes clean up expired refresh token rows, but application logic still enforces `expiresAt`.

## Logout

`POST /api/v1/auth/logout` revokes the current refresh token when present and clears the cookie with matching cookie options. Logout is intentionally idempotent.

## Cookie Options

- `httpOnly=true`
- `secure=COOKIE_SECURE`
- `sameSite=COOKIE_SAME_SITE`
- `path=/api/v1/auth`

Local development defaults to `COOKIE_SECURE=false` and `COOKIE_SAME_SITE=lax`. Production should use a strong `JWT_ACCESS_SECRET` and secure cookies.

## Security Trade-Offs

- httpOnly refresh cookies reduce exposure to XSS, but require CORS credentials and careful SameSite/Secure settings.
- In-memory access tokens disappear on full page reload; the SPA restores valid sessions by calling refresh on boot.
- Role checks trust short-lived JWT claims for route-level authorization. Endpoints that need fresh account state, such as `/users/me`, load the user from MongoDB.
- Refresh reuse detection is moderate: reused revoked tokens fail and the visible token chain/session is revoked where possible.
