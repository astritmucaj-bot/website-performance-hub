# Cloudflare Access integration

This guide is for the `security/access-dashboard-v1` branch. It does not change the live GitHub Pages site or the production Worker.

## Intended same-site hostnames

Suggested hostnames (not configured yet):

- Dashboard: `https://hub.drastritmucaj.com`
- API Worker: `https://api.drastritmucaj.com`

Both hostnames would share the `drastritmucaj.com` site boundary. Keep the existing GitHub Pages URL and `workers.dev` URL available until the custom hostnames have been tested.

## Frontend changes in this branch

- API base URL is configurable with `VITE_API_BASE_URL`.
- All three API fetches send browser credentials (`credentials: "include"`) so the browser can include the Cloudflare Access authorization cookie.
- The header includes a **Secure API sign-in** link. Open it, complete the Access login in the new tab, return to the dashboard, and refresh.

Do not put Cloudflare API tokens, Access service tokens, Google service-account JSON, or private keys in Vite variables. Vite variables are compiled into public browser JavaScript.

## Cloudflare configuration (manual dashboard steps)

1. Add `api.drastritmucaj.com` as a Custom Domain on the existing `website-performance-hub-api` Worker. Do not replace or delete the current `workers.dev` hostname.
2. Enable Cloudflare Access for the Worker (Workers & Pages > select the Worker > Access > Protect this Worker). Protect production traffic. Use an Allow policy restricted to the account owner's verified email address. Enter that address in Cloudflare's dashboard; do not store it in this repository.
3. In Worker Settings > Variables and Secrets, add the non-secret variable `DASHBOARD_ORIGINS` with the exact value `https://hub.drastritmucaj.com`. Add `http://localhost:5173` only for local development if needed; local development should use a separate non-production setup.
4. Keep `GOOGLE_SERVICE_ACCOUNT_JSON` as a Worker secret, not a plain-text variable.
5. Configure the GitHub Pages site to use the custom dashboard domain `hub.drastritmucaj.com`. Add the DNS record GitHub Pages specifies. Keep the existing default Pages hostname available during validation.
6. For the dashboard build, set `VITE_API_BASE_URL=https://api.drastritmucaj.com`. Build/deploy only from this branch or a preview until authentication is verified.

## Browser login and CORS

The current dashboard uses simple GET requests without custom headers. Those requests should not require a CORS preflight. The API returns an exact allowed origin and `Access-Control-Allow-Credentials: true`.

Before loading dashboard data for the first time:

1. Open the dashboard on `hub.drastritmucaj.com`.
2. Select **Secure API sign-in**. This opens the API hostname as a top-level page so Cloudflare Access can complete login and set its authorization cookie.
3. Return to the dashboard and refresh it. API requests use `credentials: include` to send that cookie.
4. Confirm all three API panels load.

Avoid testing this flow in Incognito/private browsing. Browser third-party-cookie restrictions can interfere with cross-origin Access cookies; the recommended sibling custom hostnames reduce that risk but still require real-browser validation.

If a future frontend change adds custom headers or non-simple request methods, revisit Cloudflare Access CORS preflight settings. Access can block OPTIONS before the Worker receives it; use Cloudflare's CORS settings to handle preflight safely rather than opening the API broadly.

## Release gate

Do not merge or deploy this branch until:

- the two custom hostnames resolve with valid HTTPS;
- Access protects the Worker and the policy permits only the intended user;
- unauthenticated API calls cannot retrieve analytics data;
- the authenticated browser can fetch GA4, Search Console, and Traffic data;
- the API rejects unapproved origins;
- no credentials or private keys are present in the frontend bundle;
- the existing production dashboard and Worker still work.

