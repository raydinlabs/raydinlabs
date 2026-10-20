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
6. Run `npm run setup:admin` in your own terminal. Choose a password of at least 16 characters; input is hidden and only its salted PBKDF2 hash is stored as `ADMIN_PASSWORD_HASH`. The admin identity is `raydinlabs@gmail.com`. No default password is shipped.
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
