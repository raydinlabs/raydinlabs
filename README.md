# Raydin Labs website

A responsive eight-page site preserving the original `.html` routes and branding. Node.js builds the HTML; CSS provides the shared design; Rust generates a deterministic 3D galaxy point cloud; JavaScript renders it using WebGL with a software 3D Canvas fallback.

## Local development

Requirements: Node.js 22 or newer. Rust stable is optional after the generated `assets/galaxy.bin` is committed.

```sh
npm run build
npm test
npm run dev
```

Open `http://localhost:4173`. No npm dependencies are required. Install Rust from https://rustup.rs to regenerate the galaxy. The build checks `$HOME/.cargo/bin/rustc`; set `RUSTC` to use a different compiler. If Rust is unavailable the committed binary is reused.

```sh
rustc --test rust/galaxy.rs -o /tmp/raydin-galaxy-tests
/tmp/raydin-galaxy-tests
```

## Editing

- `src/pages.mjs`: page content and shared document layout.
- `src/site.json`: confirmed social links and public email.
- `assets/style.css`: responsive layout and visual design.
- `assets/galaxy.js`: animation, motion preferences, rendering fallback.
- `rust/galaxy.rs`: deterministic star generation. Illustrative, not astronomical data.
- Run `npm run build` after changing content or configuration. Commit generated root HTML and `assets/galaxy.bin` together with sources.

## Deployment compatibility

The repository remains deployable as a static site from its root with all original URLs. `dist/` is also produced for static hosting providers. No Node.js or Rust server is needed in production. Cloudflare Workers deployment uses the committed `wrangler.jsonc`, which sets the asset directory to `./dist`. Build with `npm run build`, then deploy with `npm run deploy` (or the existing `npx wrangler deploy` command). This prevents repository source and installed dependencies from being uploaded. The Worker name is `raydinlabs`, matching the existing Cloudflare build settings. Domain settings are unchanged.

## Integrations and outstanding configuration

- **Project enquiries:** Set `email` in `src/site.json` to the owner's confirmed public business address, then build. With email configured the form opens a prefilled mail client; it does not silently submit or claim delivery. Without email, visitors can copy/download their brief and contact the existing LinkedIn profile. An actual server-backed delivery API is not configured.
- **YouTube:** The page links to the existing channel's Videos tab. No video IDs were verified, so the unrelated old placeholder embed was removed. Automatic latest-video synchronization is not implemented.
- **Community:** The existing Giscus repository/category identifiers are retained. The panel loads only after a visitor requests it. Posting requires GitHub sign-in. Availability and category permissions need owner verification.
- **Project imagery:** Conceptual CSS illustrations are labelled on Projects. Replace with verified project photos/CAD when supplied.
- **Project status:** FCV1 applications are described as intended, not flight-qualified. OMA-X is upcoming. No unverified dates or fabricated project results are published.
- **Typography:** Google Fonts with local system font fallbacks. Galaxy rendering has no external runtime dependency.
- **Background:** The original `hh-45.jpg` is retained as a static fallback; its existing NASA attribution is preserved in the hero.

## Design direction

Inspired by the requested reference sites' large space imagery, bold editorial typography, restrained navigation, and mission/service hierarchy. No third-party logos, code, or marketing copy were copied.
