# Weir frontend validation

The frontend source, lockfile and static export are complete within `web/`, `dist/` and `docs/`. Deployed contracts and root build configuration were preserved. This is worker-produced evidence, not independent certification or a contract audit. No funded transaction, deployment or publication was performed.

## Export and provenance

The tested production manifest is [dist/imd-deployment.json](../dist/imd-deployment.json), SHA-256 `291e9e4f013dda30a86b53fc46be8d2828f5826673beb3cc61f3bfcabaea781e`. The browser report records this same hash, binding its run to these exported bytes. The export has 16 inventoried assets totaling 889,616 bytes, excluding the manifest itself. All asset paths are local and relative, every file is below 8 MiB, and the manifest inventories every other exported file.

The build obtained both raw ABI arrays with `git show` from deployed source commit `a01e3ae534fbe2789742d5512ded7a99b2c83f85`. Canonical Keccak hashes match the handoff for LaunchToken and Weir. The manifest preserves the exact contract set, addresses, launch ID, chain ID, source commit, attestation hash, pool key, network and wallet-add-chain blocks. Its top-level keys follow the required schema. The frontend fetches this manifest and its referenced ABIs at runtime; no independent address/chain/RPC map exists. [Export-check evidence](validation/export-check.json) and [build implementation](../web/scripts/export.mjs).

`base: './'`, local assets and hash routes were exercised from `/preview/`, not only the server root. The first mobile screen exposes the product, wallet control, access state and Create stream action. The HTML contains the title, favicon, description, `og:title` and local `og:image`.

## Checks run

Commands below use repository-root paths unless a working directory is stated. The final build and interaction run finished on 2026-10-14 UTC (2026-10-15 in the worker's Europe/Berlin timezone).

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run typecheck` in `web/` | Passed; TypeScript reports no errors | [typecheck.txt](validation/typecheck.txt) |
| `npm test` in `web/` | 11 tests passed | [unit-tests.txt](validation/unit-tests.txt), [test source](../web/tests/domain.test.ts) |
| `npm run build` in `web/` | Production export and final manifest generated successfully | [build.txt](validation/build.txt) |
| `node web/scripts/export.mjs check` | Exact configuration, ABI hashes and every asset hash passed | [export-check.json](validation/export-check.json) |
| `PLAYWRIGHT_BROWSERS_PATH=/tmp/weir-browsers npm run test:browser` in `web/` | 18 scenarios passed against the production export | [browser-tests.json](validation/browser-tests.json), [suite](../web/tests/browser.mjs) |
| Pinned Better Interface design probe | All 16 checks passed | [design-probe.json](validation/design-probe.json) |
| `npm run check:chain` in `web/` | Both configured public RPCs reported chain 4663, nonempty deployed code and matching application getters | [live-chain.json](validation/live-chain.json) |
| Interactive Chromium inspection with real public RPC reads | Home and Create rendered; local resources loaded; zero console errors or warnings observed; create review disabled while disconnected | [Create screenshot](validation/screenshots/create-1280.png) |
| Submission scope and size inspection | All additions are within the allowed paths; original tracked files are unchanged; no submodules or dependency/cache directories are included; complete uncompressed candidate tree is below 8 MiB | [submission-size.json](validation/submission-size.json) |

The exact pinned probe invocation was:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/weir-browsers \
IMD_PLAYWRIGHT="$PWD/web/node_modules/playwright-core/index.mjs" \
node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste
```

The pinned probe is an assignment input and is removed before delivery. Its JSON result and selected screenshots are retained under `docs/validation/`. The delivered browser suite is independently rerunnable after installing frontend dependencies and Chromium; it starts and closes its own local server and browser. No vendored registry or browser binary is required in the submission.

## Interaction coverage

The browser tests use a stateful EIP-1193 wallet and JSON-RPC mock through the same production configuration and ABI decoding paths. They do not replace the production manifest or install a test signing key. Assertions cover calldata, token units, prerequisite gates, pending feedback, receipts and resulting UI state.

- Wallet: EIP-6963 discovery, connection, account changes, disconnect, rejected switching, exact 4902 add-chain fallback and recovery. The phone sheet exposes all four requested app links and Coinbase Smart Wallet.
- Create: on-chain six-decimal metadata, daily/rate handling, exact pasted-text and file-byte hashes, field validation, review, approval pending state, encoded create arguments and receipt navigation.
- Home: connected eligibility/tier, sponsorship approval, user rejection, retry and confirmed court-fund balance.
- Client controls: deposit, pause, restart, adjust, partial/max refund and void.
- Recipient controls: accept, partial/max withdraw and deferred-payout claim.
- Disputes: exact `expectedBody` preview, bounded bond, separate token/IMD approvals, merged allowance when the stream token is IMD, fund-paid fee, changed fee-payer preflight, pending approval locking, UTF-8 note limit, resolved oracle link, permissionless enforcement and strict timeout expiry.
- Read surfaces: both `StreamCreated` roles, amounts/status/terms/job links, records lookup, account changes and retryable errors.
- Failure handling: custom contract errors surface before signing; missing deployed code blocks writes; disconnected and wrong-chain users cannot execute an action.
- Layout and accessibility: 320, 390, 768 and 1440px reflow; 200-bit balances and full identifiers; mobile dialogs; keyboard Tab cycling, Escape and restored focus; inline errors and first-invalid-field focus; skip link without hash-route corruption; reduced motion and metadata.

Unit tests additionally exercise decimal precision, uint128 bounds, whitespace normalization, job UUID encoding, URI protocol rejection, UTF-8 byte counts, role/state permissions, combined bond/fee allowances, ABI bindings and switch/add/rejection behavior.

## Better Interface review

The supplied Better Interface workflow and core principles for all six domains were applied during implementation. Supporting form, modal, navigation, mobile, status, error and motion guidance was used where relevant. Source review was followed by the pinned rendered probe, browser interaction tests and direct screenshot inspection.

| Domain | Source and rendered coverage | Result and limits |
| --- | --- | --- |
| Accessibility | Labels and descriptions, field errors, landmarks/headings, skip link, focus visibility, native modal inertness, Tab/Escape/restore, status text, target sizes, reduced motion, forced-colors styles | Automated keyboard and semantic checks passed. The probe found all 14 home controls at least 24px or sufficiently spaced; seven inline/compact controls are below the comfortable 44px size. Full screen-reader and physical assistive-technology testing remain unperformed. |
| Layout | Shared width/alignment, mobile first screen, 320/390/768/1440 reflow, dialogs, longest balances/addresses, grid collapse, clipping and overlap | Probe found no horizontal scroll, overlapping text, covered text or clipping at 320/390/1440. Interaction checks extend coverage to other routes and connected extremes. Native 200% browser zoom and RTL were not tested. |
| Writing | Five-word headline, three-sentence product introduction, action-specific instructions, fee payer, irreversible actions, errors and not-audited disclosure | No yield/return claims or unexplained approval flow. Probe counted 49 prose words on the mobile first screen (limit 60), 66 on desktop (limit 90), no repeated lines and no stack of slogans. Actual paid oracle question is distinguished from its block-dependent preview. |
| Typography | Six-size scale, two local font stacks, three weights, heaviest h1, line lengths, untracked small labels, numeric alignment | Probe found four recurring sizes on mobile and six on desktop, two family stacks and three weights. It found no all-caps content, tracked body labels or eyebrow headings. Installed system fonts may differ across devices. |
| Colors | Semantic roles, error/pending text, focus ring, input boundaries, contrast, disabled/hover/pressed states | All probe-measured text met 4.5:1, or 3:1 for large text. Direct computed-color sampling gave 13.97:1 for primary text and 6.26:1 for muted text on the page background. These measurements do not establish every possible state combination or physical display. |
| UI | Primary action placement, approval steps, transaction locks and receipts, error recovery, wallet sheet, confirmations, loading/empty/error states, restrained surfaces | All primary action scenarios passed. Probe found no nested cards, combined card borders/shadows, gradient text, `transition: all`, or animation continuing under reduced motion. Vendor wallet/passkey interfaces were not exercised end to end. |

### Findings fixed before the final build

Severity here describes frontend usability or transaction-state risk, not a smart-contract audit rating. Line references identify the final implementation.

| Finding | Fix and evidence |
| --- | --- |
| High: a newly connected wallet could expose an action before its signing client finished initializing | [web/src/data.tsx:134](../web/src/data.tsx#L134) now requires the signing client on the configured chain. Browser action scenarios pass immediately after connection. |
| High: changing a dispute preview during an approval could unmount its pending state | [web/src/Dispute.tsx:125](../web/src/Dispute.tsx#L125) aggregates approval state and locks editing, dismissal and final execution while pending. The dispute scenario verifies the lock. |
| Medium: native dialog Tab behavior could allow focus to leave the intended cycle | [web/src/ui.tsx:205](../web/src/ui.tsx#L205) explicitly cycles first/last controls. Browser checks cover Tab, Shift+Tab, Escape and restored trigger focus. |
| Medium: a normal `#main` skip link collided with the hash router | [web/src/App.tsx:63](../web/src/App.tsx#L63) focuses main without changing the route. The browser regression check passes. |
| Medium: creation errors initially lacked field-level association and focused recovery | [web/src/Create.tsx:81](../web/src/Create.tsx#L81) focuses the invalid input; [web/src/ui.tsx:114](../web/src/ui.tsx#L114) associates its hint/error and invalid state. Invalid address and precision scenarios verify both. |
| Medium: the initial Rabby app-link shape did not match its current source | [web/src/Wallet.tsx:66](../web/src/Wallet.tsx#L66) uses the source-verified `_cmd=open-dapp&dapp=` link. Phone-picker assertions verify its structure. Physical app opening remains untested. |
| Medium: an Intake receipt cannot be used as an oracle request UUID | [web/src/OracleLink.tsx:9](../web/src/OracleLink.tsx#L9) resolves the event transaction through public intake admission status and otherwise offers a stream-specific explorer search. Mocked resolution passes; a real Weir dispute was not created. |

No failed first-screen or repeated-layout probe finding remains. The complete implemented tokens, components and responsive behavior are in [DESIGN.md](DESIGN.md). The brief also requested this document at repository root; its overriding path budget forbids that location, so the complete document is delivered under `docs/`.

### Screenshots inspected

- [390px first screen, real public RPC](validation/screenshots/home-390.png): product, wallet, access state and Create stream are visible.
- [1440px full home, real public RPC](validation/screenshots/home-1440.png): aligned content, tier table, sponsorship and footer.
- [Phone wallet picker](validation/screenshots/phone-wallets.png): local vendor marks and labeled wallet choices; mocked connection environment.
- [390px stream page](validation/screenshots/stream-390.png): mocked populated stream with long values and controls.
- [1280px Create page](validation/screenshots/create-1280.png): direct browser inspection with real reads and visible keyboard focus.

## Live-chain observations and remaining limits

At block 88,744,524 both configured RPCs returned chain 4663. LaunchToken had 1,723 bytes of runtime code and Weir 23,817, with matching hashes between the endpoints. Live getters returned the attested WEIR address, IMD and Intake addresses, a 10,000 WEIR minimum, a 604,800-second timeout, a zero court fund, a 0.5 IMD oracle price and zero streams. The read-only evidence records the timestamp and exact results. Runtime configuration/code checks are not a proof that deployed bytecode equals a source build.

The following behavior remains untested on live funds: approvals, stream creation/accounting over time, every write action, a real oracle admission/callback, a fee-fund race, enforcement, expiry, fee-on-transfer token behavior and deferred payout recovery. The deployed stream count was zero during observation. Mocked integration validates UI behavior and ABI calldata, not oracle correctness, chain economics or token compatibility. The pinned contract integration notes about `submitAttestation` and the timeout fallback are explained in [web/README.md](../web/README.md).

No physical mobile wallet, installed extension or Coinbase passkey flow was completed. Coinbase controls Smart Wallet chain support. NVDA/VoiceOver, native zoom, RTL and physical-device accessibility checks were not run. Optional intake-indexer lookup is tested with documented response shapes, not a paid Weir request. Public RPC limits can affect history scans; the UI paginates, shows its scanned range and exposes errors rather than claiming completeness.

No Solidity test suite, new security audit, published CID/name, immutable HTTP verification or named-site publication check is claimed. The publisher performs those subsequent publication checks. The exported Open Graph image is relative until a hosting origin is assigned. No backend or private configuration is needed to serve this build.
