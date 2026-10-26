# Raydin Labs website

Matte aerospace website with a textured, rotating 3D Earth, retro Share Tech Mono typography, glass navigation, project stories, a blog, wiki, and a private publishing studio. Existing `.html` links remain valid.

## Development

Node.js 22.13 or newer is required (tests use Node's SQLite API).

```sh
npm ci
npm run build
npm run db:local
npm run dev
```

Open http://localhost:4173. The full Cloudflare Worker runs locally with local D1/R2 storage. `npm test` covers authentication, draft privacy, content CRUD/conflicts, rate limiting, email provider responses, uploads, navigation, and generated assets. `npm run build` generates all public HTML into `dist/`.

## Deploy from this repository

This version needs a **Worker script + static assets**, a D1 database, and an R2 bucket. Uploading only `dist/` will not provide the email or admin APIs. Keep the Worker named `raydinlabs` to preserve the existing deployment and domains. Production was intentionally left for the owner to deploy.

1. Sign in with `npx wrangler login`.
2. Create the database using `npx wrangler d1 create raydinlabs-content`. Copy the exact returned `database_id` into the existing `d1_databases[0]` object in `wrangler.jsonc`. If it already exists, use its ID from `npx wrangler d1 list` instead.
3. Create the bucket using `npx wrangler r2 bucket create raydinlabs-media` (skip if already present). R2 must be enabled on your account. If you do not want uploads yet, remove the `r2_buckets` block; the editor still accepts HTTPS image and PDF links.
4. Run `npm run db:remote` to apply schema and seed migrations. These insert the existing projects, wiki guides, and content; subsequent deploys do not overwrite editorial changes.
5. Configure `RESEND_API_KEY` as a Worker **secret**. On the machine used for this setup, `npm run setup:email-secret` securely reads the newly generated, ignored `.dev.vars` file and pipes only that key to Wrangler. On another machine, create a sending-only key restricted to `raydinlabs.org` and use `npx wrangler secret put RESEND_API_KEY` interactively. Never add a key to GitHub or `wrangler.jsonc`.
6. Run `npm run setup:admin` in your own terminal. Choose a password of at least 16 characters; input is hidden and only its salted PBKDF2 hash is stored as `ADMIN_PASSWORD_HASH`. The admin username is `kxizen`. No default password is shipped.
7. Run `npm run build`, `npm test`, and `npm run deploy`. For Cloudflare Git builds use `npm run build` as the build command and `npm run deploy` as the deploy command, after completing the one-time resource/secret setup.
8. Visit `/admin.html`, sign in, and publish an entry. Test Services once after deploying.

The `RESEND_FROM` and `RESEND_TEMPLATE_ID` variables already reference the verified sender and published template below. Keep the D1 binding `DB`, R2 binding `MEDIA`, and static asset binding `ASSETS` as configured.

## Email setup completed in Resend

- Verified domain: `raydinlabs.org` (sending enabled).
- Sender: `Raydin Labs <website@raydinlabs.org>`.
- Fixed recipient and fallback email: `raydinlabs@gmail.com`.
- Published template: `raydin-website-enquiry`, ID `352ff4ec-f8f9-4058-90e3-efaa20774cb9`.
- Template variables: `NAME`, `CONTACT_EMAIL`, `COMPANY`, `SERVICE`, `REQUIREMENTS`, `TIMELINE`, `BUDGET`.
- End-to-end setup test delivered to Gmail: `01a15886-3ccb-7b95-979f-bbb95346274e` (Resend status `delivered`).
- Domain-restricted sending key: `Raydin Labs website production`. The full-access CLI credential is not used by the website.

Visitors submit directly to `/api/contact`; their mail application does not open. The backend validates and rate-limits submissions and sets Reply-To to the visitor. Successful submission means Resend accepted the message; delivery is tracked in the Resend dashboard. Retries from the same form use an idempotency key. Errors retain form input and show a backup email link. The backup uses the visitor's mail application only when they explicitly choose it.

## Publishing studio

At `/admin.html`, create/edit/delete `blog`, `projects`, `wiki`, and `content` entries. Save as Draft to keep an entry private, or Published to make it visible immediately. Preview before saving. The editor supports titles, summaries, body text, process notes, demo links, document links, and image descriptions. Upload PNG/JPEG/WebP images or PDF documents up to 10 MB. Uploaded media URLs are public even before their entry is published; do not upload private files.

Body formatting intentionally supports a small, safe subset: paragraphs separated by blank lines, `##` / `###` headings, and `-` lists. HTML is displayed as text. Existing project records contain confirmed scope and clearly identify demonstrations/validation material that has not been supplied. Add real demo links, photos, and process evidence through the studio; no results or demo footage have been invented.

Sessions use HttpOnly/Secure/SameSite cookies, expire after eight hours, and are revoked on logout. Writes check request origin; SQL uses bound parameters. Stale edits return a conflict instead of overwriting newer work. Password changes do not immediately revoke existing sessions; to revoke all sessions run `npx wrangler d1 execute DB --remote --command "DELETE FROM sessions"`.

## Source map

- `src/pages.mjs`: shared page layout and static editorial copy.
- `assets/style.css`: matte palette, glass navigation, responsive layout and motion.
- `assets/earth.js`: textured WebGL Earth with solar shading, atmospheric rim, reduced-motion support, and static software fallback. Surface texture: Three.js examples, `earth_atmos_2048.jpg` (https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg).
- `server/worker.js`: contact, authentication, publishing and media APIs.
- `server/seed.js`, `migrations/`: initial public content and database schema.
- `assets/admin.js`, `assets/content.js`: publishing editor and public content rendering.

The old NASA photograph and credit have been removed from the current tree (historical Git commits are unchanged). The animation button is removed. The scene respects reduced-motion settings and pauses when the page is hidden. View Transitions enhance navigation in supporting browsers; ordinary page navigation remains the fallback.


## Page Studio and admin login checklist

The website editor in `/admin.html` now supports page text and hero image/GIF/video fields on the public pages, with private D1 drafts, iframe visitor preview, and an explicit Publish page action. Existing collection entries are still managed by the original publishing studio. The page editor stores safe text and media URLs, not arbitrary HTML. Files uploaded to R2 are publicly accessible immediately; drafts control only whether a page references them.

**Required Cloudflare Worker setup (cannot be completed by GitHub commits alone):**

1. Ensure the production Worker uses this repository's `server/worker.js`, not a static-only Pages deployment.
2. Set the correct D1 database ID in `wrangler.jsonc`, bind it as `DB`, and run `npm run db:remote`. The new `0003_page_editor.sql` migration is required.
3. Bind the R2 bucket as `MEDIA` for media uploads.
4. In your own secure terminal, run `npm run setup:admin` or set `ADMIN_PASSWORD_HASH` using `npx wrangler secret put ADMIN_PASSWORD_HASH`. Do not share the password or hash in chat or commit it. The configured `ADMIN_USERNAME` must match the login username.
5. Deploy with `npm run build && npm test && npm run deploy`. Then verify `/api/admin/session` returns a JSON 401 when signed out (not an HTML 404), sign in through `/admin.html`, save a draft, preview, publish and check the public page.

If login reports "Admin sign-in has not been configured yet", the password secret is missing. "Publishing service is not configured yet" means the DB binding is missing. A 404 or HTML response from `/api/admin/login` means the Worker API is not serving that route. "Username or password is incorrect" means credentials do not match. Rate limits can temporarily block repeated attempts.

Page text edits currently apply to stable headings, paragraphs, labels and text links present at initial page load; editing navigation destinations, complex layouts, and dynamic collection records is handled separately. Video uploads are limited to 10 MB; for larger files use an appropriately licensed HTTPS media URL or dedicated video hosting.

## October 2026 UX audit update

Implements the supplied independent UX/UI audit by Prajwal Halvi (25 October 2026):
- Concrete homepage capability copy, a primary project enquiry CTA, and Contact navigation.
- Build-time public project overviews and Wiki guides from the existing published seed content. Live API entries still refresh the collections; network errors retain the fallback and offer retry. A successful empty response is treated as an empty collection.
- Individual project pages preserve known scope and explicitly state the limits of published validation evidence. Live project updates enhance these pages when the API is available.
- Service comparison, an undecided service option, project stage, persistent field feedback, hidden honeypot, and retained input on submission failures. Stage is prepended to the email requirements so the existing email template remains compatible.
- Scoped article search and community loading/error/retry states, with a persistent direct Discussions link.
- Canonical URLs for static pages and responsive comparison/feedback styles.

The build-time content is public repository material, not a snapshot of private CMS drafts. Keep seed content aligned with editorial changes if a published overview is revised or withdrawn. The added static case-study URLs are generated by the build.

Validation: build, static site tests, deployment asset tests and audit regression tests. Browser preview and the full API suite could not be completed in the editing environment (local browser connectivity and dependency installation were unavailable). Validate responsive layouts, keyboard interaction, community embedding and a real enquiry after deployment. No WCAG conformance, Core Web Vitals, conversion uplift or end-to-end email delivery claim is made by this update. Use the audit's proposed metrics to establish a production baseline before setting improvement targets.
