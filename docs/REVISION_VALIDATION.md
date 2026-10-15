# Weir. mobile wallet revision

This revision addresses the two reviewer reports against the approved import at `fc3ac859dfbcd4f5bb030c577b4dec6657e33303`. Both reproduced before any application edit. The production changes are limited to **35 added CSS lines in `web/src/style.css` and the corresponding compiled stylesheet in `dist/assets/index-YTgPKy3v.css`**. No component, wording, font, color, plate, dependency, wallet function, contract call or build configuration changed.

The committed `dist/` is the deliverable for the existing IMD label `weir`. IMD performs publication after submission; no public deployment, CID or on-chain transaction is claimed by this report.

## Findings and recheck

| Finding | Reproduction on the original export | Correction and final result |
| --- | --- | --- |
| `cfb7ac40cf3865a0ca486ee332343872c126cef856fed16350874f1e12088524` — wrong-network overflow | Chromium 156, 360 px, EIP-6963 fixture on chain 1, `rejectSwitch=true`, connect, dismiss with Escape: home document width **434 px**; all six other routes **385 px**. Home's button extended to x=434.02. | `web/src/style.css:1184` allows both wallet-button variants to wrap below 640 px, retaining the existing `.header-right { min-width: 0 }`. All seven routes now have document width **360 px**. The same checks pass at 320, 390, 640, 900 and 1440 px. The full switch label is preserved and retry switches the mock wallet to 4663. |
| `025db0d2e0da458a2b5c980a9861ce0de96f7b5098c384435ee569459e918fe3` — wallet error blocks navigation | Chromium 156, 360 and 390 px, no injected wallet, Browser wallet, Escape: the alert intercepted Start a stream, My streams and Records. Records clicks timed out. On Create at 360 px the alert was x=92..344, y=78..176.39; navigation started at y=80. Also reproduced on home. | `web/src/style.css:1116` gives headers containing errors a normal-flow, full-width alert row through 900 px, retaining the existing first control-row height and styling tokens. At 360 px on Create the alert is x=16..344, y=80..153.59; navigation begins at y=153.59. Error and navigation boxes no longer overlap. Actual Records clicks pass on home and Create at 320, 360, 390, 640 and 900 px. |

The regression uses the unchanged `web/tests/mock-chain.mjs` for RPC and wallet simulation. For the no-wallet case, it skips only that fixture's provider injection. All wallet calls are simulated; the focused regression asserts that no transaction is sent. The `before` harness records the original defects without treating the expected broken measurements as an infrastructure failure. Raw measurements are retained in [wallet-before.json](revision-validation/wallet-before.json) and [wallet-after.json](revision-validation/wallet-after.json).

At 320 px the approved home navigation pans internally; the regression checks visible link centers and then performs a real Records click, allowing the browser to scroll the nav frame. This is distinct from document overflow. The street retains its existing independent sideways pan.

## Build and interaction checks

Dependencies were installed using the existing lockfile into a disposable checkout outside the repository. Node 24.21.0 and Chromium 156.0.8078.4 were used. Commands below are relative to the repository unless otherwise marked.

| Command / check | Actual result |
| --- | --- |
| `npm ci` in the disposable `web/` | Passed; no manifest or lockfile edits. Installed modules, cache and browsers remain outside the submission. |
| `npm run build` in the disposable `web/`, after the final CSS edit | Passed. Vite 8.3.4 produced 41 inventoried assets. Existing relative font warnings remain; the browser loaded the fonts locally. See [build.txt](revision-validation/build.txt). |
| `npm run typecheck` | Passed (`tsc --noEmit`). See [typecheck.txt](revision-validation/typecheck.txt). |
| `npm test` | **11/11 passed**. See [unit-tests.txt](revision-validation/unit-tests.txt). |
| `npm run check:export` on the fresh production build | Passed, including the handoff and canonical ABI checks. See [export-build-check.txt](revision-validation/export-build-check.txt). |
| `node docs/revision-validation/export-css.mjs /path/to/rebuilt/dist` | Passed: published CSS equals `assets/index-tTyK7sP7.css` from the build. Other runtime assets match; rebuilt JS differs only in generated asset names. The helper preserves all 41 other approved export files, including `index.html`, the manifest and ABIs. |
| `node docs/revision-validation/wallet-layout.mjs --record-before` | Recorded both defects at 360 and 390 px before source edits. |
| `node docs/revision-validation/wallet-layout.mjs` | **16/16 Chromium scenarios passed**. Covers all seven routes in the wrong-network state at six widths, full-width error rows in both mobile headers, actual navigation clicks, Escape/focus return and successful network-switch retry. |
| `node docs/import-validation/interaction-check.mjs` | **12/12 passed**. Covers navigation at seven widths, first-screen action, internal street pan, local fonts, metadata, wallet keyboard trap and app links, mock approval/creation, records lookup, stream filters, both receipt variants/copy/print, switch rejection/retry, mock pause/restart, rejected signature and reduced motion. See [interactions.json](revision-validation/interactions.json). |
| `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` | **12/16 passed**. The layout check now passes at 320, 390 and 1440 px. See [taste.json](revision-validation/taste.json). |
| WebKit 27.2 launch | **Unavailable**: missing host libraries including GTK4, Pango, libsoup and GStreamer. No WebKit success is claimed. |
| `sha256sum --check docs/revision-validation/delivered-files.sha256` | All 118 current source/export hashes verified. Exactly two differ from the original import list: source CSS and compiled CSS. |
| `npm run check:export` against the delivered export | **Fails as documented below** because the required immutable manifest retains the approved stylesheet digest. See [export-delivery-check.txt](revision-validation/export-delivery-check.txt). |

For temporary dependencies, both browser harnesses accept `WEIR_CHECK_WEB=/path/to/disposable/web` and `PLAYWRIGHT_BROWSERS_PATH=/path/to/browser-downloads`. The probe accepts `IMD_PLAYWRIGHT=/path/to/disposable/web/node_modules/playwright/index.mjs`. All harnesses serve the final repository export under a local `/preview/` subpath. They manage and close their servers and browsers. Screenshots are generated in `test/scratch/` and are deliberately excluded from submission.

## Required immutable deployment inventory

The assignment explicitly requires `dist/imd-deployment.json` and `dist/abi/` to remain exactly as committed. A CSS change necessarily invalidates the old CSS digest in that manifest. The delivery retains **all original asset names**, replaces only the compiled CSS bytes, and preserves the full original manifest rather than rewriting its inventory.

The only stale inventory entry is `assets/index-YTgPKy3v.css`:

- Delivered/production SHA-256: `d1abad81cda1acb41adaf17728d65fe3c282723aaf071a33ec05c88faaa836b5`.
- Every other inventory entry still names an existing file with the approved digest.
- All deployment configuration and ABI bytes, chain 4663, contract addresses, source lockfile, application JavaScript, fonts and plates are unchanged.
- Runtime routing and wallet checks passed using this exact delivered manifest. Runtime code does not enforce its asset-inventory hashes. A publisher that independently enforces those hashes would need IMD/requester resolution of the immutable-manifest requirement; the worker has not claimed that external publication step passed.

See [integrity.json](revision-validation/integrity.json) for both original and delivered hashes. The original import's integrity reports remain historical evidence and are not rewritten to suggest this revision is a byte-for-byte import. The CSS export helper refuses non-CSS application changes; it is not a general replacement for the normal build.

## Better Interface coverage

The pinned Better Interface workflow, the six domains' core principles, documentation guide and design-critic thresholds were read and applied within the requested correction scope. The owner's instruction to preserve the approved design remains authoritative. Attribution/licenses are retained in the existing `docs/import-validation/guide-licenses.txt`.

| Domain | Source and rendered coverage | Findings, fixes and limits |
| --- | --- | --- |
| Accessibility | Native wallet button, dialog and alert semantics remain unchanged. Tested Escape, focus restoration, unobstructed navigation and actual Records clicks. Existing harness exercises keyboard trapping and skip link. Screenshots confirm the focused button is visible after error dismissal. | Fixed the alert interception at `web/src/style.css:1116`. The first row retains space for the focus outline. Screen readers, native zoom and physical touch devices were not tested; this is not an accessibility certification. |
| Layout | Measured document, button, error and navigation boxes in each targeted state. Viewed final mobile error screenshots and 390/1440 home screenshots. Existing harness covers all seven routes at 360–1440 px; new harness adds wrong-network coverage at 320. | Both reported layout causes fixed. Full-width error rows grow the header instead of covering content. Default 390 px and desktop composition remain as approved. No RTL/localized variant exists or was added. |
| Writing | Checked the full network action label and both existing recovery messages against `Wallet.tsx`. Product, labels and instructions are unchanged. | No copy edits; the existing messages now remain readable beside their controls. No new audit claim. |
| Typography | Source font definitions unchanged; inspected wrapped network text and readable full error messages. Existing harness confirms loaded local fonts. | Fixed `white-space: nowrap`'s overflow through a scoped override at `web/src/style.css:1184`. No truncation, font shrinking or new sizes. Probe flags for the approved size/family system remain; no all-state contrast or text-enlargement claim. |
| Colors | All color tokens and component states are unchanged. The probe passed its measured solid-background text pairs. | No recoloring. The probe excludes 21 text boxes over artwork and does not cover every error/focus/background combination; those pairs are not claimed as newly measured. |
| UI | Wallet unavailable/rejection/retry states, native dialog dismissal, navigation and existing form/receipt interactions checked. Reduced motion still stops the coins. | The correction is CSS-only and does not change transactions or connection logic. Native Coinbase/passkey completion, real signatures and slowed animation inspection were not performed. |

The probe's remaining four flags are **casing, tracking, type sizes and type families**. These are inherited, deliberate elements of the approved pixel-art design, documented in the original import review; this revision does not restyle them. Render, layout, targets, measured contrast, eyebrows, glyphs, slogans, repetition, copy budget, chrome, motion and share metadata pass.

The inspected 390 px first screen visibly includes **Weir.**, the **Start a stream** navigation action and the street. The action was clicked successfully into Create. Fonts, scripts, styles and images loaded from the preview origin; no third-party script/font host, analytics or tracker was observed. The probe observed the configured public chain RPC, which is a data request rather than an external script or tracker.

## Delivery limits and size

Browser screenshots are reproducible scratch output, not shipped runtime assets. No plates were changed or recompressed, no required assets removed, no ignore files or protected build/dependency paths edited, and no modules, caches, archives or submodules added. [Submission-size evidence](revision-validation/submission-size.json) measures a self-contained snapshot of the final candidate tree, including the required reviewer responses. Existing project history is outside that snapshot; no repository Git metadata was modified.

The independent review findings are answered individually in root `.imd-responses.json`. Remaining limitations are the preserved manifest's CSS digest, unavailable WebKit runtime, untested real signing/native devices/assistive technology, and external IMD publication. The legacy pre-redesign browser suite was not rerun in this CSS revision; its old-label failures remain documented in the historical import report. The current-interface harness above was rerun successfully.
