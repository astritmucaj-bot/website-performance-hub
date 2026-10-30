# Cloudflare Access integration

This guide is for the `security/access-dashboard-v1` branch. It does not change the live GitHub Pages site or the production Worker.

## Intended hostnames

Suggested hostnames (not configured yet):

- Dashboard: `https://hub.drastritmucaj.com`
- API Worker: `https://api.drastritmucaj.com`

Both hostnames are sibling subdomains of `drastritmucaj.com`. Keep the existing GitHub Pages URL and `workers.dev` URL available until the custom hostnames have been tested.

## Frontend changes in this branch

- API base URL is configurable with `VITE_API_BASE_URL`.
- All three API fetches send browser credentials (`credentials: "include"`) so the browser can include the Cloudflare Access authorization cookie.
- The header includes a **Secure API sign-in** link. Open it, complete the Access login in the new tab, return to the dashboard, and refresh.
- The GitHub Pages deployment workflow reads `VITE_API_BASE_URL` from a GitHub Actions repository variable at build time.

Do not put Cloudflare API tokens, Access service tokens, Google service-account JSON, or private keys in Vite variables. Vite variables are compiled into public browser JavaScript.

## Configuration sequence

### A. Configure the dashboard hostname in GitHub first

1. Open the `website-performance-hub` repository on GitHub.
2. Go to **Settings > Pages**.
3. Under **Custom domain**, enter `hub.drastritmucaj.com` and save it.
4. Since this repository publishes through a GitHub Actions workflow, configure the custom domain in Pages settings; the workflow does not require a committed `CNAME` file.
5. In **Settings > Secrets and variables > Actions > Variables**, create the repository variable:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://api.drastritmucaj.com`

Set the custom domain in GitHub before adding its DNS record. GitHub recommends this order to reduce the risk of subdomain takeover.

### B. Connect the API hostname to the Worker

1. In Cloudflare, go to **Workers & Pages** and select `website-performance-hub-api`.
2. Open **Settings > Domains & Routes > Add > Custom Domain**.
3. Add `api.drastritmucaj.com`. Cloudflare should create the DNS record and issue the required certificate automatically. Do not delete or replace the existing `workers.dev` hostname.
4. In the Worker's **Access** tab, select **Protect this Worker behind Access** and choose **All traffic**.
5. Configure an Allow policy restricted to the intended account owner's verified email address. Enter the address directly in Cloudflare; do not store it in this repository.
6. Under **Settings > Variables and Secrets**, add the non-secret variable:
   - Name: `DASHBOARD_ORIGINS`
   - Value: `https://hub.drastritmucaj.com`
7. Keep `GOOGLE_SERVICE_ACCOUNT_JSON` configured as a Worker secret. Do not expose or replace it.

Worker-level Access protects all domains associated with the Worker, including its Custom Domain and `workers.dev` hostname.

### C. Add the dashboard DNS record in Cloudflare

After saving the custom domain in GitHub Pages:

- Type: `CNAME`
- Name: `hub`
- Target: `astritmucaj-bot.github.io`

Do not change the apex/root records for `drastritmucaj.com` or any existing production DNS records. Check the GitHub Pages domain verification and HTTPS status before proceeding. GitHub's official DNS guidance should be followed if Pages reports a validation issue.

## Browser login and CORS

The dashboard uses simple GET requests without custom headers. Those requests should not require a CORS preflight. The API returns the exact allowed origin and `Access-Control-Allow-Credentials: true`.

1. Open the dashboard on `hub.drastritmucaj.com`.
2. Select **Secure API sign-in**. This opens the API hostname as a top-level page so Cloudflare Access can complete login and set its authorization cookie.
3. Return to the dashboard and refresh it. API requests use `credentials: include` to send that cookie.
4. Confirm all three API panels load.

Avoid testing this flow in Incognito/private browsing. Cloudflare documents that Access authorization cookies may be blocked as third-party cookies in cross-origin requests. The sibling custom hostnames reduce this risk but still require real-browser validation.

If a future frontend change adds custom headers or non-simple request methods, revisit Cloudflare Access CORS preflight settings. Access can block OPTIONS before the Worker receives it; use Cloudflare's CORS settings to handle preflight safely rather than opening the API broadly.

## Release gate

Do not merge or deploy until:

- both custom hostnames resolve with valid HTTPS;
- Access protects the Worker and the policy permits only the intended user;
- an unauthenticated API call cannot retrieve analytics data;
- after API sign-in, the authenticated browser can fetch GA4, Search Console, and Traffic data;
- the API rejects unapproved browser origins;
- no credentials or private keys are present in the frontend bundle;
- the existing production dashboard and Worker still work.

## Rollback

These changes are isolated to `security/access-dashboard-v1` and `security/harden-api-v1`. Do not merge or deploy until the DNS, Access policy, and browser integration have passed the release gate. The current production dashboard and Worker remain available on their existing addresses until a separate, reviewed release.
