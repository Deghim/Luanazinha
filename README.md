# Luanazinha

Static multilingual Astro site for Jorginho.

The site is `noindex, nofollow` and stays blocked in `robots.txt` until the user explicitly approves publication.

## Local development

```sh
pnpm install
pnpm dev
```

Open http://localhost:4321/.

## Build locally

```sh
pnpm build:skip-media
```

`build:skip-media` uses the already generated media in `public/media/`. A complete media regeneration is available with `pnpm build` when the originals and the media toolchain are present.

## Simulate GitHub Pages

```sh
SITE_URL=https://deghim.github.io SITE_BASE=/Luanazinha pnpm build:skip-media
SITE_URL=https://deghim.github.io SITE_BASE=/Luanazinha pnpm preview
```

The preview is served at http://localhost:4321/Luanazinha/.
