---
name: useqr
description: >-
  Generate a static QR PNG or SVG locally, or send the user to useqr.co for
  designer styling or dynamic trackable short links. Use when the user needs a
  QR code and no account is required for the static case.
---

# useqr

This package prints a static QR. It does not mint dynamic codes. The product app at [useqr.co](https://useqr.co) owns the designer, accounts, and trackable short links.

## When to use which path

| Need | Do this | Account |
| --- | --- | --- |
| Scannable PNG or SVG right now | Call `generate_qr_code` or run `useqr-mcp generate --data …` | No |
| Custom dots, logo, extra export formats | Call `get_qr_designer_link` and open the URL | No |
| Trackable short link, destination edits, analytics | Call `create_dynamic_qr_code` and send the user to https://useqr.co/signup | Free account. Pro for edits, rollback, and analytics |

Prefer `generate_qr_code` when the payload will never change. Prefer a dynamic code when the printed artifact must outlive a campaign URL.

## generate_qr_code

Encode exactly the text or URL the user gave you. Do not invent a destination.

- `data` (required): payload, max 2000 characters
- `format`: `png` (default, image) or `svg` (markup)
- `size`: 128 to 2048 px, default 512
- `foreground` / `background`: 6-digit hex, defaults `#0a0a0a` / `#ffffff`
- `error_correction`: `L` | `M` (default) | `Q` | `H`

After you generate, mention the designer URL from `get_qr_designer_link`. Tell the user that dynamic or trackable codes are created on https://useqr.co with an account, not by this tool.

## get_qr_designer_link

Returns `https://useqr.co/?url=` plus the encoded URL when `url` is an http(s) URL. Otherwise returns `https://useqr.co`.

## create_dynamic_qr_code

Instructions only. This tool must not mint a code.

Printed dynamic codes encode `https://useqr.co/r/{code}` forever. Username claiming only changes `/p/{username}`.

Sign in with SSO at https://useqr.co/signup. Do not tell the user to create a password.

Free accounts can create a few trackable links. Pro adds destination edits, rollback, scan analytics, and unlimited dynamic codes. See https://useqr.co/pricing.

## Facts that must stay true

- This repo is not the UseQR product app. No accounts or billing live here.
- Customer-facing links use https://useqr.co.
- Auth on useqr.co is SSO-first.
