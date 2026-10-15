# Weir. approved-import validation

## Scope and result

**Complete for the import and static-export handoff, with the inherited findings and runtime limits below.** Publication under the existing IMD label `weir` occurs after submission; no new public CID or live deployment is asserted by this report. These are worker observations, not independent certification or an audit.

The source is [SwarmStream/swarmstream, commit `fc3ac859dfbcd4f5bb030c577b4dec6657e33303`](https://github.com/SwarmStream/swarmstream/tree/fc3ac859dfbcd4f5bb030c577b4dec6657e33303). Its entire `web/` (76 files, 2,695,697 bytes) and `dist/` (42 files, 3,200,266 bytes) were imported unchanged. Old export chunks absent upstream were removed. No PNG conversion, recompression, resizing, dependency change, ignore-file edit, contract edit or wallet-flow edit was made.

The deliverable is the **committed upstream `dist/`**, including all fonts, nine plates, favicon, share card, deployment data, ABIs and dependency notices. Tests built an isolated source copy so build finalization could not alter the approved delivery. The result nevertheless matched every delivered export byte. Documentation and validation are separate from the exact source/export.

The current root [DESIGN.md](../DESIGN.md) and [README](../README.md) supersede historical frontend descriptions. The earlier documents under `docs/` remain marked historical; their previous passing results are not reused as evidence for this import.

## Integrity and build

| Check actually run | Result | Evidence |
| --- | --- | --- |
| Download pinned GitHub source archive and compare relative file sets/bytes | Both directories exactly match upstream | [integrity.json](import-validation/integrity.json), [118 file hashes](import-validation/approved-files.sha256) |
| `npm ci --no-audit --no-fund` in isolated `web/` | Exit 0; installed from preserved lockfile; dependencies/cache remain outside submission | No manifest or lockfile change |
| `npm run typecheck` | Exit 0 | [typecheck.txt](import-validation/typecheck.txt) |
| `npm test` | Exit 0; 11/11 passed | [unit-tests.txt](import-validation/unit-tests.txt) |
| `npm run build` | Exit 0; 799 transformed modules; output byte-identical to approved export | [build.txt](import-validation/build.txt) |
| `npm run check:export` | Exit 0; 41 inventoried assets plus manifest, canonical ABI hashes and SHA-256 inventory verified | [export-check.txt](import-validation/export-check.txt) |
| Current-interface Chromium harness | Exit 0; 12/12 scenarios passed | [interactions.json](import-validation/interactions.json), [rerunnable harness](import-validation/interaction-check.mjs) |
| Unmodified imported `npm run test:browser` | Exit 1; 2/18 passed, 16 failed against obsolete interface expectations | [upstream-browser-tests.json](import-validation/upstream-browser-tests.json) |
| Pinned `taste.mjs` against delivered export | Measured all 16 checks; 11 passed, 5 flagged; assessed below | [taste.json](import-validation/taste.json) |
| axe-core 4.10.3 | Zero reported violations across five routes and wallet dialog; some contrast checks need manual review | [accessibility.json](import-validation/accessibility.json) |
| Read-only chain verification | Chain 4663; nonempty code for both contracts; expected Weir/token binding and getters | [live-chain.json](import-validation/live-chain.json) |
| Source/path and size review | No protected-path changes or dependency/cache artifacts; complete current-tree bundle and raw tree below cap | [submission-size.json](import-validation/submission-size.json) |

The exact approved manifest SHA-256 is `5126f34f3b39af42e0e11a6e475bbbb684f1c83f1bc5ed22022e601cb54bd80b`. All files under `dist/abi/` and both plate directories match upstream; complete hashes are included above. The manifest's chain, contract set, network and wallet-add-chain values also agree with the supplied public handoff. Source commit `a01e3ae534fbe2789742d5512ded7a99b2c83f85` identifies the deployed contracts; `fc3ac859…` identifies this frontend import.

Vite warns that the relative inline font URLs will resolve at runtime. Browser requests proved they do: the actual loaded WOFF2 files returned HTTP 200 under `/preview/fonts/`. The warning did not prevent a byte-identical production build.

## Browser and interaction coverage

Chromium served the actual delivered export under `/preview/`. All seven routes were loaded at **360, 390, 640, 768, 900, 901 and 1440 px**, including `#/stream/1` and both receipt roles. Each had one visible h1 and document width no greater than the viewport in the tested read-only state. The 390 px first screen includes the Weir. brand, Connect wallet and the **Start a stream navigation link** (top about 74 px, bottom about 110 px). The larger button beneath the town lies below the first 844 px screen; it is not misreported as above the fold.

The street scrolled independently inside its 1100 px content frame, updated the position indicator, and left the 390 px document width unchanged. All title/description/favicon/Open Graph metadata was present. Browser resource observation found no external script, stylesheet, font or image loads in the tested mock interactions; actual interactive browser inspection also loaded scripts/fonts locally and recorded no console errors. Contract JSON-RPC, optional oracle lookup and linked agreement reads remain application data requests. Third-party wallet applications/passkey windows were not completed.

The current harness exercised:

- Navigation and disconnected transaction gates; invalid and valid record lookup; five record counters; invalid/valid stream number lookup; connected role filters and empty state.
- EIP-6963 discovery, unknown-chain add/switch with the exact manifest parameters, disconnect, keyboard modal focus containment, Escape and focus return, and skip-to-content.
- Phone wallet links for MetaMask, Coinbase, Rabby and Phantom, plus Coinbase Smart Wallet. These links were inspected rather than opening/installing external apps.
- Creation field errors and focus, custom six-decimal token selection, day/week toggle, review, pending exact approval, and simulated `createStream` calldata. The checked example used rate 1 smallest unit/second and deposit 10,123,456 smallest units, with the expected terms hash.
- Wrong-network rejection and retry; signature rejection/retry; simulated client pause and restart.
- Client and freelancer receipt routes, agreement/amount output, no wallet address in the receipt article, unaccepted agreement notice, accepted ruling state, copy payload, print invocation and print CSS. Clipboard/print APIs were intercepted to validate calls; no physical printer or OS PDF dialog was exercised.
- Reduced motion: the coin animation becomes `none`. No funded transaction, token approval or deployment occurred on chain. All write-flow tests use the imported stateful wallet/RPC fixture.

The imported suite independently passed its recipient accept/withdraw/claim scenario and missing-contract-code write gate. Its other failures include obsolete labels (`Recipient address`, `Pause stream`, `As recipient`) and a strict locator matching both hidden/mobile and desktop home h1 elements. The replacement harness changes only validation selectors and expectations; application code and the historical tests remain intact.

Manual browser-tool inspection covered home at 390/1440, Create and its keyboard-focused wallet dialog, invalid Records at 360, and the real stream #1 client receipt at 390. The real receipt eventually loaded the linked agreement as plain text. No signing was attempted.

Selected inspected screenshots:

- [Home, 390 px](import-validation/screenshots/home-390.jpg) and [home, 1440 px](import-validation/screenshots/home-1440.jpg).
- [Create, 390 px](import-validation/screenshots/create-390.jpg) and [phone wallet sheet](import-validation/screenshots/wallet-phone.jpg).
- [Live client receipt, 390 px](import-validation/screenshots/receipt-client-live-390.jpg). Other browser fixture captures were inspected in scratch and are not presented as live data.

## Better Interface: six-domain review

The supplied guide's workflow and core principles for all six domains were read before validation. The source's established tokens, CSS, components and approved copy were used as the review baseline. The task explicitly says **“do NOT redesign, restyle, rewrite copy, rename anything, or add features”**. That takes precedence over general stylistic recommendations.

| Domain | Coverage and evidence | Unperformed or inapplicable |
| --- | --- | --- |
| Accessibility — Checked | Native controls, labels and hint/error bindings; visible keyboard focus; native modal/Escape/focus return; skip link; reduced motion; axe scan and browser accessibility snapshots | No screen-reader session, physical touch device or full assistive-technology audit; radiogroup arrow-key behavior and every focus/background combination not exhaustively tested |
| Layout — Checked | Seven route/width matrix; 390 first screen; internal pan; forms, wallet sheet and receipt; source grid and breakpoint review | Native 200% browser zoom, RTL mirror and pseudolocalization not tested; no RTL/localized theme is implemented |
| Writing — Checked | Existing action labels compared with handlers; validation/error/empty/retry states; costly-action review and receipt draft/ruling wording; no extra audit claim introduced | Approved copy intentionally unchanged; public site/footer wording remains the owner's supplied text |
| Typography — Checked | Actual CSS cascade, four loaded families, local font HTTP responses, heading/body/control roles and observed wrapping | Every Unicode subset and synthetic weight not separately audited; approved type-scale exceptions retained |
| Colors — Checked | Tokens, computed solid backgrounds, identified contrast ratios and automated scans | Taste could not measure 21 text boxes over artwork/media; axe marked two home and one Create contrast nodes incomplete; no dark theme exists |
| UI — Checked | Native modal, hover/focus/disabled states, mock transaction pending/rejection/success, empty/error reads, receipt copy/print and reduced-motion coins | Motion not replayed at 10% speed; no physical wallet/passkey completion; full real-chain dispute lifecycle not executed |

Measured solid text pairs: ink/page 18.50:1; muted/page 7.50:1; ink/white form 19.65:1; disabled primary muted/subtle 7.13:1. These identify the rendered state and are not blanket contrast certification.

## Findings, repairs and retained limitations

| Finding | Source / reproduction | Disposition |
| --- | --- | --- |
| Layout: approved home header overflows at 320 px | `web/src/town.css:117`, `:118`, `:120`, `:160`; 320 px viewport produces 353 px document; confirmed by probe and separate browser measurement | Retained under exact-import/no-restyle scope. The brief requires 360 px; tested read-only routes pass there. This does not pass the broader guide's 320 px reflow bar. |
| Casing and tracking: scene signs and branding depart from house rules | `web/src/town.css:58`, `:64`; `web/src/style.css:263`; uppercase scene signs, 0.1em Disputes tracking and -0.05em brand tracking | Intentional approved visual treatment; no restyling. |
| Typography: more sizes and families than generic probe bar | `web/src/town.css:25`, `:150`–`:161`; `web/src/style.css:182`, `:1344`; probe counts 8 repeated sizes at 390, 9 at 1440 and four families | Approved container-relative artwork/type choices preserved and documented accurately in root DESIGN.md. |
| Historical browser tests target the previous design | `web/tests/browser.mjs:71`, `:235`, `:253`; duplicate h1 strict locator and renamed fields/actions | Repaired validation coverage with a separate current-interface harness: 12/12 pass. Original suite preserved, its 16 failures reported explicitly. |
| Historical documentation does not describe the final cascade/receipts | Imported `web/README.md` and prior `docs/DESIGN.md` | Added current root README/DESIGN and marked earlier local docs historical. No imported source file changed. |
| Build emits relative font warnings | `web/index.html:22`, Vite build output | Confirmed runtime WOFF2 requests and loaded font faces; no missing font resource. No source change needed. |

The probe's passed checks were render, targets, contrast on resolvable backgrounds, eyebrows, glyphs, slogans, repetition, copy budget, chrome, motion and share metadata. Its failed check names were layout, casing, tracking, type-sizes and type-faces. These findings were assessed rather than claiming the probe was clean.

WebKit installation completed but launch failed because required host shared libraries were unavailable. Safari/iOS rendering is **Not verified**. Chromium phone emulation is not a physical-phone test. Screen readers, native 200% zoom, real signing, Coinbase passkey completion, and a post-publication gateway check are also **Not verified**. Publication is the remaining pipeline step, not a claim established by local rendering.

## Commands and provenance

Production/type/unit/export commands ran in an isolated copy of the exact `web/` plus root ABI inputs; no repository dependency directories were installed. The current harness ran from the repository root with `WEIR_CHECK_WEB` selecting that copy and a temporary Playwright browser directory. It serves the repository's actual `dist/`, not a mock application.

The design-probe invocation was:

```sh
IMD_PLAYWRIGHT=/tmp/weir-approved-validation/web/node_modules/playwright/index.mjs \
PLAYWRIGHT_BROWSERS_PATH=/tmp/weir-browsers \
node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste --offline
```

The pinned guide/probe inputs are removed by the assignment after review. Only their result is delivered; the upstream files are not modified. Accessibility checks injected axe into the test browser only; it is not a site dependency or exported script.

Submission-size validation uses an isolated temporary Git object database containing every candidate file, including the existing contracts/tests/dependencies and the new frontend/documentation. Its complete snapshot bundle verifies with Git. It does not include prior project history: an attempted full-history pack encountered an unavailable historical object in the supplied partial clone. The complete uncompressed candidate files also fit the 8 MiB limit. No bundle archive, browser binary, installed dependency tree or package cache is included in the delivery. Both existing ignore files remain unchanged; validation outputs live under `docs/` because the workspace excludes `artifacts/` from submission.

Guide attribution: Jakub Krehel, Better Interface, MIT, commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`; documentation method by Paul Bakaus, Impeccable, Apache-2.0, commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`. Applied from the supplied pinned references. Their combined license notice is retained in [guide-licenses.txt](import-validation/guide-licenses.txt).
