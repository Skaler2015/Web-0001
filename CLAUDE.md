# ApneSoftware — Project Conventions

Static, client-side tools website. Each tool is a self-contained HTML file in
`tools/`, sharing `assets/style.css` and `assets/common.js`. Tools are listed in
`assets/tools-data.json`. Deployment is automatic: merging to `main` triggers the
GitHub Actions FTP deploy in `.github/workflows/deploy.yml` (Hostinger). Purge the
LiteSpeed cache after deploy to see changes live.

## Tool page section order (REQUIRED for all tools — existing and future)

When a tool page includes these content sections (below the interactive tool UI),
they MUST appear in this top-to-bottom order:

1. **Related Tools** — placed ABOVE "About This Tool".
2. **About This Tool** — bilingual (English + Hindi).
3. **FAQ** — placed together with / immediately after "About This Tool".

So the canonical order is: **Related → About → FAQ**.

- "FAQ with About" means the FAQ sits directly after the About section (ideally in
  the same container / matching width), not separated by other blocks.
- "Related above About" means the related-tools grid comes before the About section.
- This applies to every tool that has these sections. If a tool lacks one of them,
  keep the remaining sections in the same relative order.

## Other conventions

- Preserve existing element IDs and working functionality when upgrading a tool.
- Keep the dark theme / glassmorphism UI; scope new CSS with a per-tool class prefix.
- Tools are offline/browser-only where possible; avoid servers/APIs unless required.
- About sections are bilingual (English then Hindi); FAQs are bilingual and also
  emit FAQPage JSON-LD schema.
- Validate before deploy: JS parses and runs under a stubbed DOM, IDs preserved,
  balanced tags, schema valid.
