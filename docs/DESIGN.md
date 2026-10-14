# Weir implemented design system

## Overview

Weir is a workspace for clients and recipients managing payments for agreed work. The implemented interface uses a warm light background, dark green actions, a serif page heading and compact sans-serif controls. The first mobile screen contains the product description, wallet control, access state and Create stream action. Technical details appear beside the action they explain or in native disclosures.

This document describes the finished source under `web/`. Its location is intentional: the assignment’s overriding write scope permits `docs/**` and forbids a root `DESIGN.md`.

## Colors

The source of truth is `web/src/style.css`, beginning at `:root`. Primitive tokens feed semantic roles; components use the semantic tokens.

| Semantic token | Final value | Use |
| --- | --- | --- |
| `--color-page` | `#f7f7f2` | Page background |
| `--color-surface` | `#ffffff` | Inputs, forms, wallet rows |
| `--color-subtle` | `#efefe7` | Neutral hover/disabled backgrounds and badges |
| `--color-text` | `#20291f` | Primary text |
| `--color-muted` | `#565e53` | Supporting text, labels |
| `--color-border` | `#dedfd4` | Section separators and structural lines |
| `--color-input-border` | `#74796f` | Field and button boundaries |
| `--color-accent` | `#164d43` | Primary action background |
| `--color-accent-hover` | `#245c4f` | Primary hover |
| `--color-accent-pressed` | `#123d35` | Primary pressed state |
| `--color-on-accent` | `#ffffff` | Text on primary actions |
| `--color-highlight` | `#edf2e5` | Access and accounting regions |
| `--color-focus` | `#3e487b` | Two-pixel keyboard outline |
| `--color-error` / `--color-error-bg` | `#a02f22` / `#fff1eb` | Actionable error and destructive states |
| `--color-pending` / `--color-pending-bg` | `#3e487b` / `#edf0f9` | Disputed/Ruled badges |

Status always includes text. Only the current primary step uses the filled green action style. The site deliberately implements one light theme and exposes no theme toggle. Wallet marks retain their vendor colors. The final probe measured rendered text contrast successfully; exact observations are retained in the validation evidence rather than inferred from this palette.

## Typography

`style.css` defines six size tokens: small 14px, body 16px, section 20px, title 24px, large 32px, display 48px. At 640px and below, h1 changes from 48px to 32px and h2 from 24px to 20px. Weights are 400, 500 and 700; h1 and the brand use 700, section headings and controls 500, body text 400.

Body/UI uses the local system stack `Avenir Next, Avenir, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`. Page h1 uses `Georgia, Times New Roman, serif`. No network font is fetched or custom font file required. The exact available face depends on the visitor’s system; testing a CSS family list does not prove Avenir is installed.

Body line-height is 1.55, h1 1.1, h2/h3 1.3. Headline tracking is -0.045em on desktop and -0.035em on mobile. Body and small labels are untracked and use natural case. Prose is capped at 72ch. Inputs remain 16px on phones; numeric values use tabular figures. Full addresses, token amounts and hashes wrap instead of escaping their containers. Address links expose the full checksum address in a title and provide a separate Copy action. JSON/question text wraps and remains selectable.

## Layout

Main header, content and footer share a 1120px maximum width. Desktop outer space is 32px per side; below 640px it is 16px. Spacing tokens define 4, 8, 12, 16, 24, 32, 48 and 64px increments. The header stays in normal flow.

`.home-grid`, `.create-grid`, `.controls-grid` and `.two-columns` organize related content. At 900px, decorative flow art and the header network label disappear, stream metrics change from four to two columns, and the footer simplifies. At 640px, forms and controls become one column, stream party addresses stack, list amounts become label/value rows, and the wallet/dialog becomes a bottom sheet. The access region stacks its main action below the state. Navigation remains four visible links.

Long strings use `overflow-wrap: anywhere`; flex/grid children have zero minimum widths where needed. No horizontal overflow was observed at 320, 390, 768 or 1440px, including a 200-bit wallet balance, full addresses and the dispute dialog. Native 200% browser zoom, RTL localization and physical mobile rendering remain unverified.

## Elevation & depth

The page is mostly flat. Grouping uses spacing and background regions; one-pixel borders mark sections, tables and controls. Cards do not combine borders with shadows. Only dialogs use the `0 24px 80px #18251f30` shadow, with a `#17251fc0` native backdrop. Native modal behavior makes the background inert.

## Shapes

Buttons use an 8px radius, inputs 7px, regions/forms 12px and badges 20px. Desktop dialogs use 16px; mobile sheets use 20px on the top corners and square bottom corners. The line-based Weir mark and decorative flow SVG are repo-native assets. `web/assets/share.svg` is the source for the local 1200×630 social image.

## Components

| Component / source | Use and states |
| --- | --- |
| `Title`, `Field`, `Notice`, `QueryState` in `web/src/ui.tsx` | Page heading; labeled controls with hint/error association; persistent status/error; retryable read states |
| `Dialog` in `web/src/ui.tsx` | Native modal, title, close control, backdrop/Escape dismissal, explicit Tab cycling and restored trigger focus; transaction owners can prevent closing while pending |
| `TxButton`, `TxFeedback` in `web/src/ui.tsx` | Disabled/pending state, action-specific progress, confirmation/revert feedback and receipt link |
| `Action`, `ApprovalAction` in `web/src/actions.tsx` | Simulated single action or explicit allowance→action sequence; destructive confirmations, exact approval/reset, fresh balance checks |
| `WalletControl` in `web/src/Wallet.tsx` | Named extension rows, phone app links, Coinbase option, per-row pending/rejection, chain switch/add, connected address and disconnect |
| `Eligibility` in `web/src/Home.tsx` | Read-only wallet access and bond tier, with primary navigation to creation |
| `RecordCard` in `web/src/Records.tsx` | Address plus five live record counters, loading and error state |
| `AddressView`, `External` in `web/src/ui.tsx` | Checksum/explorer/copy affordances; safe external links with an announced new-tab hint |
| `.stream-metrics`, `.badge`, `.steps`, `.event-list` | Consistent accounting, state, approval progression and event history |

All meaningful controls have visible labels. Buttons are at least 44px high, wallet rows 56px; compact Copy controls are 32px with spacing. Inline prose links use the spacing exception and do not pretend to be primary controls. Keyboard focus uses `:focus-visible`; the skip link focuses the main content without changing the hash route.

Motion is limited to 120ms background/border/pressed feedback and a pending spinner. Pressed controls scale to 0.96. Motion is enabled only inside `prefers-reduced-motion: no-preference`; pending text remains when animation is disabled. Forced-colors mode preserves boundaries and uses system focus color.

## Do’s and don’ts

- Reuse `Title`, `.page-description` and an existing grid for a new page. Keep its primary action near its relevant state.
- Use `Field` for controls and `Action`/`ApprovalAction` for writes. Keep prerequisite reasons visible, simulate immediately before signing, and retain per-action pending state through receipt refresh.
- Use semantic color tokens. Keep large numbers and identifiers wrappable, and use actual token decimals.
- Keep terms, notes and errors in plain words. Do not describe a panel verdict as a legal decision or promise that an oracle fee is refundable.
- Do not add competing filled actions, marketing content above the main control, small tracked capitals, unbounded history scans or assumed USD prices.
