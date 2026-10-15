# Weir. — implemented design

## Overview

This documents the source imported from SwarmStream/swarmstream commit `fc3ac859dfbcd4f5bb030c577b4dec6657e33303`, with the reviewed mobile wallet-layout corrections in `web/src/style.css`. Weir. is a token-streaming interface for clients and freelancers on Robinhood Chain. Its home page is a pixel-art cutaway street: the client's house, reviewers, a doorway to creation, the freelancer's studio, and coins in a pipe. Transaction pages use readable forms and plain paper surfaces. The product spelling includes the period: **Weir.**

The implementation is authoritative. This document describes the actual CSS cascade, including existing rounded dialogs and notices; it does not propose a redesign. The imported source's `web/README.md` and the earlier `docs/DESIGN.md` contain historical descriptions. This root document describes the current design. Review evidence and exceptions are in [the revision validation](docs/REVISION_VALIDATION.md) and [the original import validation](docs/IMPORT_VALIDATION.md).

## Colors

Tokens live in `web/src/style.css:1` and `web/src/town.css:3`. Values use hex; the application declares `color-scheme: light` and has no theme switch.

| Token | Value | Implemented role |
| --- | --- | --- |
| `--color-page`, `--px-paper` | `#f8f8f8` | Page and town paper |
| `--color-surface` | `#ffffff` | Forms, inputs, secondary buttons |
| `--color-text`, `--px-ink` | `#0a0b11` | Text and strong borders |
| `--color-muted` | `#4a5160` | Hints, captions, secondary text |
| `--color-border` | `#d7dce3` | Dividers and neutral bevels |
| `--color-subtle` | `#eef3f7` | Disabled buttons, receipt agreement |
| `--color-highlight` | `#e6f4fd` | Eligibility and secondary hover |
| `--px-yellow` | `#f7c751` | Primary controls and selected token/period |
| Primary hover / pressed | `#ffd978` / `#e8b53a` | Existing button states |
| `--color-focus`, `--px-brick` | `#b8402a` | Focus outline, active navigation and town period |
| `--color-accent` / hover / pressed | `#0a0b11` / `#26282f` / `#000000` | Shared accent references |
| `--px-sky`, `--px-grass` | `#56c7f8`, `#4f8f3a` | Town palette |
| `--px-soil`, `--px-sign`, `--px-wood` | `#4c2c24`, `#f8f7ee`, `#f6cb87` | Town soil and signs |
| Error foreground / background | `#a02f22` / `#fff1eb` | Error notice, destructive action |
| Pending foreground / background | `#3e487b` / `#edf0f9` | Pending state |

Legacy `--stone-*` and `--green-*` tokens remain in the approved stylesheet; selection uses `#cce1bc` on `#20291f`. The footer period uses `--color-accent`, whereas the town period uses brick. Metadata retains theme color `#f7f7f2`.

Computed solid pairs measured on Create: ink on page **18.50:1**, muted on page **7.50:1**, ink on white **19.65:1**. The disabled primary uses muted on subtle, **7.13:1**. These measurements do not cover all text over artwork; see the validation limitations.

## Typography

All font files are served locally from `dist/fonts/`, copied from `web/public/fonts/`. Their `@font-face` declarations are in `web/index.html`; all use `font-display: swap`. The committed export preserves all 16 font files, including fallback/subset faces.

| Role | Actual family / weights | Size and leading |
| --- | --- | --- |
| Page h1 | `--font-pixel`: Press Start 2P, Pixelify Sans, monospace; 400 | Final global override `2.1rem`, line-height `1.25`; mobile tracking `-0.035em` |
| Town headline | Press Start 2P; 400 | `2.6cqw`, line-height `1`; mobile copy `2rem`, `1.1` |
| h2 / h3 | `--font-numeric`: Atkinson Hyperlegible, Alef, system-ui, sans-serif; 700 | `1.35rem` / `1.1rem`, leading `1.3` / `1.35`; h2 becomes `1.25rem` below 640 px |
| Body | `--font-body`: Alef, Avenir Next, system-ui, sans-serif; 400 | `1rem`, leading `1.55`, paragraphs capped at `72ch` |
| Hints / small | Body family | `0.875rem`, leading `1.5` |
| Buttons | Atkinson Hyperlegible; 700 | Normally `0.95rem`, leading `1.4`; home mobile navigation/wallet `0.9rem` |
| Money and record counters | Atkinson Hyperlegible | Tabular numerals; size depends on the metric component |
| Town small figure labels | Jersey 25, numeric fallbacks; 400 | Deposit `1.35cqw`, streamed `1.4cqw`, other small labels use Atkinson |
| Receipt | Pixel h1/brand, numeric h2, body text | h1 `1.6rem`, brand `1.1rem`, h2 `1rem`, footer `0.8125rem` |

The declared six size tokens are `0.875rem`, `1rem`, `1.25rem`, `1.5rem`, `2rem`, and `3rem`. Local overrides and town container-relative sizes extend that scale. The rendered home uses four font families, not a three-family system. Press Start 2P has one 400 face; Atkinson and Alef include 400/700 faces. CSS also requests 500 for `strong` and some numerals; this document does not imply a distinct 500 font file exists.

Headings balance wrapping; paragraphs use `text-wrap: pretty`. Addresses, terms and hashes have wrapping rules. Town signs intentionally use uppercase and fixed scene geometry. Town `image-rendering` is pixelated/crisp-edges. The original nine PNG plates are unchanged.

## Layout

Shared spacing tokens are 4, 8, 12, 16, 24, 32, 48 and 64 px. Header, product page and footer share `width: min(1120px, calc(100% - 64px))`; below 640 px their total gutters shrink to 32 px. Normal pages have 48/64 px vertical padding, changing to 32/48 px on phones. The home page spans the viewport; its lower `.page-inner` uses a 1120 px maximum and 32 px padding, reduced to 16 px below 640 px.

`Town` places layers by percentage in a `1536 / 1024` aspect-ratio container. Desktop `.town-wrap` crops to `1536 / 940`. At **900 px and below**, dedicated mobile chrome and text appear, the scene becomes an **1100 px wide, 513 px tall** internally pannable strip, and the scene's desktop chrome and vehicles hide. A swipe hint and three square position indicators explain the horizontal content. The full-width mobile creation button follows the scene; the creation navigation link remains on the first screen.

At **640 px and below**, forms, major grids and amount/period rows become single-column layouts. Wallet dialogs become bottom sheets. At **560 px and below**, receipt facts become a single column and paper padding drops from 32 to 20 px. Receipt width is capped at 640 px. Print CSS hides navigation, footer and action controls, removes the paper border and allows full print width.

Wallet buttons use `white-space: normal` and `min-width: 0` at **640 px and below**, including the home `.mobile-topbar`; `.header-right` retains its existing `min-width: 0`. The full network-switch label wraps without shrinking its font or clipping text. At **900 px and below**, a header containing `.wallet-error` becomes a two-column grid. Its neutral `.header-right` wrapper uses `display: contents`, letting the existing alert span both columns in normal flow above navigation. The shared topbar retains its 100 px first row (80 px below 640 px); the home topbar retains its own padding and gap. Headers without errors keep their existing flex layout. These rules are in `web/src/style.css:1116` and `web/src/style.css:1184`; colors, copy, fonts and wallet logic are unchanged.

The seven inspected routes have no page-level horizontal overflow at 360, 390, 640, 768, 900, 901 and 1440 px in Chromium. Wrong-network states also pass at 320, 360, 390, 640, 900 and 1440 px. The prior 320 px home-header overflow is resolved by the same wrapping rule; its navigation and street still pan inside their own frames. Home's internal street pan was exercised independently. WebKit remains unverified because its required host libraries are unavailable.

## Elevation & depth

Primary and secondary buttons have 2 px ink borders and inset pixel bevels. Yellow bevels use `#c98f00` and `#ffe08a`. Pressing a control translates it 1 px down/right. Scene layers use explicit z-indices, with decorative plates ignoring pointer events.

The existing native dialog is a deliberate exception to flat product surfaces: 16 px radius, `0 24px 80px #18251f30` shadow, and `#17251fc0` backdrop. Eligibility notices, badges and wallet rows also retain their approved rounded treatments. The dialog uses native modal behavior and contained overscroll.

## Shapes

Main buttons, token options, forms, receipt paper, scene signs and position indicators are square. Form and paper borders are 2 px ink; inputs retain their existing 1 px ink border and 7 px radius. Wallet rows have 8 px radii and wallet icons 6 px. The two-arch mark is a rect-based SVG with crisp edges. Do not infer that every component is square from the town alone.

## Components

| Source | Component or pattern | Behavior |
| --- | --- | --- |
| `web/src/Town.tsx` | `Town`, `Mark`, `Coin` | Approved layered artwork, home navigation, creation doorway, mobile pan indicators; static shell before runtime loads |
| `web/src/App.tsx` | Application shell | Hash routing, title changes, route scroll reset, header/footer and contract verification error |
| `web/src/ui.tsx` | `Field`, `Notice`, `QueryState`, `Dialog`, `AddressView`, `TxButton` | Associated labels/hints, alert/status messages, retryable reads, native modal with Escape/focus return, copy/explorer actions, transaction phases |
| `web/src/Wallet.tsx` | `WalletControl`, `ConnectPrompt` | EIP-6963 wallets, named mobile app links, Coinbase, chain switch, pending/rejection/disconnect states |
| `web/src/Create.tsx` | Creation form and review | Recipient, named/custom token, day/week amount, deposit, agreement and optional details; explicit review then exact approval and creation |
| `web/src/Streams.tsx` | `StreamRow`, role filter, number lookup | Client/recipient views, live balances, empty state, direct stream navigation |
| `web/src/StreamPage.tsx` | Stream controls | Role/state-sensitive actions, confirmation dialogs, terms and receipt links |
| `web/src/Records.tsx` | `RecordCard` | Address lookup and five public counters |
| `web/src/Receipt.tsx` | `Receipt` | Client payment receipt/freelancer proof, agreement and amounts, draft/ruling states, copy and print |

Most buttons have at least 44 px height; wallet rows are at least 56 px. Global keyboard focus is a 2 px brick outline offset 4 px. The skip link targets the main landmark. `h1` and main programmatic focus intentionally suppress outlines. Validation, disabled, pending and error behavior is retained; the mobile wallet alert now occupies its own header row so it cannot block navigation.

Coins animate in `steps(8, end)` over four seconds only under `prefers-reduced-motion: no-preference`. Other existing button transitions and pending spinners also live behind that preference. The reduced-motion check observed no ongoing coin animation.

## Preservation rules

- Reuse the source tokens, existing components and actual CSS cascade when maintaining this design. This assignment adds no page or feature.
- Keep the product name **Weir.**, approved copy and original plates. Do not resize, recompress or replace the art.
- Keep `dist/imd-deployment.json`, `dist/abi/`, contract calls, chain 4663 and wallet flows byte-for-byte as imported for this delivery.
- Keep fonts, scripts and runtime assets local and paths relative. Hash routes need no server rewrites.
- Read the validation report before interpreting design-probe recommendations as permission to change the approved design.

Documentation method: Better Interface by Jakub Krehel (MIT, `267330e1adfc66a718fb65fa6918c1f06d0a689e`) and Impeccable by Paul Bakaus (Apache-2.0, `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`), using the supplied pinned references. No new audit or design approval is claimed.
