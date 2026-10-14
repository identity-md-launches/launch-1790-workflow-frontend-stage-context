import { useState } from "react";
import { useAccount } from "wagmi";
import {
  decodeEventLog,
  formatUnits,
  isAddress,
  keccak256,
  toBytes,
  zeroHash,
  type Address,
  type Hex,
} from "viem";
import { useRead, useRuntime, useToken } from "./data";
import {
  address,
  amount,
  byteLength,
  errorText,
  jobId,
  safeUri,
  tryAmount,
  UINT128_MAX,
  units,
} from "./domain";
import { ApprovalAction } from "./actions";
import { Eligibility } from "./Home";
import { AddressView, Field, Notice, QueryState, Title } from "./ui";
import { ConnectPrompt } from "./Wallet";

type Draft = {
  recipient: Address;
  token: Address;
  rate: bigint;
  deposit: bigint;
  hash: Hex;
  uri: string;
  job: Hex;
};
export function Create() {
  const r = useRuntime();
  const { address: account } = useAccount();
  const eligible = useRead<boolean>("canUse", [account], !!account);
  const [recipient, setRecipient] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [rate, setRate] = useState("");
  const [daily, setDaily] = useState("");
  const [deposit, setDeposit] = useState("");
  const [uri, setUri] = useState("");
  const [hash, setHash] = useState("");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [job, setJob] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft>();
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState<{ name: string; message: string }>();
  const fieldError = (name: string) =>
    invalid?.name === name ? invalid.message : undefined;
  const tokenAddress = isAddress(tokenInput.trim())
    ? (tokenInput.trim() as Address)
    : undefined;
  const token = useToken(tokenAddress);
  const rateAmount = token.data
    ? tryAmount(rate, token.data.decimals, UINT128_MAX)
    : undefined;
  async function hashFile(file?: File) {
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      setError("Choose a file smaller than 16 MiB to hash in this browser.");
      return;
    }
    try {
      setHash(keccak256(new Uint8Array(await file.arrayBuffer())));
      setFileName(file.name);
      setText("");
      setError("");
    } catch (e) {
      setError(errorText(e));
    }
  }
  function review() {
    setInvalid(undefined);
    const fail = (name: string, message: string): never => {
      setInvalid({ name, message });
      document
        .querySelector<HTMLInputElement>(`input[name="${name}"]`)
        ?.focus();
      throw new Error(message);
    };
    const checked = <T,>(name: string, read: () => T): T => {
      try {
        return read();
      } catch (e) {
        return fail(name, errorText(e));
      }
    };
    try {
      if (!account)
        throw new Error("Connect your wallet before reviewing a stream.");
      if (!eligible.data)
        throw new Error(
          "Hold the required WEIR balance before creating a stream.",
        );
      const rec = checked("recipient", () => address(recipient)),
        tok = checked("token", () => address(tokenInput));
      if (
        [account.toLowerCase(), r.weir.address.toLowerCase()].includes(
          rec.toLowerCase(),
        )
      )
        fail(
          "recipient",
          "The recipient must be someone other than you or the Weir contract.",
        );
      if (!token.data)
        throw new Error("Wait for the token’s symbol and decimals to load.");
      const rateValue = checked("rate", () =>
        amount(rate, token.data!.decimals, UINT128_MAX),
      );
      const depositValue = checked("deposit", () =>
        amount(deposit, token.data!.decimals, UINT128_MAX),
      );
      if (!/^0x[0-9a-fA-F]{64}$/.test(hash) || hash === zeroHash)
        fail("termsHash", "Paste or generate a nonzero 32-byte terms hash.");
      if (!uri.trim() || !safeUri(uri.trim()))
        fail(
          "termsUri",
          "Enter a public https://, http:// or ipfs:// terms URI.",
        );
      if (byteLength(uri.trim()) > 512)
        fail("termsUri", "Keep the terms URI within 512 UTF-8 bytes.");
      if (/[\u0000-\u001f\u007f]/.test(uri))
        fail("termsUri", "Remove control characters from the terms URI.");
      setDraft({
        recipient: rec,
        token: tok,
        rate: rateValue,
        deposit: depositValue,
        hash: hash as Hex,
        uri: uri.trim(),
        job: checked("imdJobId", () => jobId(job)),
      });
      setError("");
    } catch (e) {
      setError(errorText(e));
    }
  }
  return (
    <>
      <Title>Create a stream</Title>
      <p className="page-description">
        Agree on the work, set the pace, and fund the first stretch.
      </p>
      {!account ? <ConnectPrompt /> : <Eligibility compact />}
      {draft && token.data ? (
        <section className="form-surface">
          <h2>Review your stream</h2>
          <dl className="detail-list">
            <div>
              <dt>Recipient</dt>
              <dd>
                <AddressView value={draft.recipient} full />
              </dd>
            </div>
            <div>
              <dt>Token</dt>
              <dd>
                {token.data.symbol} <AddressView value={draft.token} />
              </dd>
            </div>
            <div>
              <dt>Rate per second</dt>
              <dd>
                {units(draft.rate, token.data.decimals)} {token.data.symbol}
              </dd>
            </div>
            <div>
              <dt>Per day</dt>
              <dd>
                {units(draft.rate * 86400n, token.data.decimals)}{" "}
                {token.data.symbol}
              </dd>
            </div>
            <div>
              <dt>Initial deposit</dt>
              <dd>
                {units(draft.deposit, token.data.decimals)} {token.data.symbol}
              </dd>
            </div>
            <div>
              <dt>Terms URI</dt>
              <dd>{draft.uri}</dd>
            </div>
            <div>
              <dt>Terms hash</dt>
              <dd className="hash">{draft.hash}</dd>
            </div>
            <div>
              <dt>IMD job</dt>
              <dd className="hash">
                {draft.job === zeroHash ? "None" : draft.job}
              </dd>
            </div>
          </dl>
          <p>
            Streaming starts when the create transaction confirms. Only
            exact-transfer, non-rebasing tokens are supported.
          </p>
          <ApprovalAction
            token={token.data}
            amount={draft.deposit}
            name="createStream"
            args={[
              draft.recipient,
              draft.token,
              draft.rate,
              draft.deposit,
              draft.hash,
              draft.uri,
              draft.job,
            ]}
            label="Create stream"
            disabled={!eligible.data || eligible.isError}
            onBusy={setBusy}
            onDone={(receipt) => {
              for (const log of receipt.logs) {
                try {
                  const decoded = decodeEventLog({
                    abi: r.weir.abi,
                    data: log.data,
                    topics: log.topics,
                  }) as { eventName: string; args: unknown };
                  if (decoded.eventName === "StreamCreated") {
                    const id = (decoded.args as { id: bigint }).id;
                    location.hash = `/stream/${id}`;
                    return;
                  }
                } catch {
                  /* another contract's event */
                }
              }
              location.hash = "/streams";
            }}
          />
          <button
            className="text-button"
            disabled={busy}
            onClick={() => setDraft(undefined)}
          >
            Edit details
          </button>
        </section>
      ) : (
        <form
          className="create-grid"
          onSubmit={(e) => {
            e.preventDefault();
            review();
          }}
          noValidate
        >
          <div className="form-surface">
            <h2>Payment details</h2>
            <Field
              error={fieldError("recipient")}
              label="Recipient address"
              hint="The wallet that will receive the streamed tokens."
            >
              <input
                name="recipient"
                autoComplete="off"
                spellCheck={false}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x…"
              />
            </Field>
            <Field
              error={fieldError("token")}
              label="Token address"
              hint="Symbol and decimals are read from the token contract."
            >
              <input
                name="token"
                autoComplete="off"
                spellCheck={false}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="0x…"
              />
            </Field>
            <div className="preset-row">
              <button
                type="button"
                onClick={() => setTokenInput(r.token.address)}
              >
                Use WEIR
              </button>
            </div>
            {tokenAddress && <QueryState query={token} />}{" "}
            {token.data && (
              <p className="token-info">
                {token.data.symbol} · {token.data.decimals} decimals ·{" "}
                <AddressView value={token.data.address} />
              </p>
            )}
            <Field
              error={fieldError("rate")}
              label={`Rate per second${token.data ? ` (${token.data.symbol})` : ""}`}
              hint={
                rateAmount && token.data
                  ? `${units(rateAmount * 86400n, token.data.decimals)} ${token.data.symbol} per day`
                  : "Use this token’s units, not its smallest units."
              }
            >
              <input
                name="rate"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0.001"
              />
            </Field>
            <details className="helper">
              <summary>Calculate a rate from a daily amount</summary>
              <Field label="Amount per day">
                <input
                  inputMode="decimal"
                  value={daily}
                  onChange={(e) => setDaily(e.target.value)}
                  placeholder="86.4"
                />
              </Field>
              <button
                type="button"
                disabled={!token.data}
                onClick={() => {
                  try {
                    const d = token.data!;
                    const value = amount(daily, d.decimals) / 86400n;
                    if (value === 0n)
                      throw new Error(
                        "This daily amount is below one smallest token unit per second.",
                      );
                    setRate(formatUnits(value, d.decimals));
                    setError("");
                  } catch (e) {
                    setError(errorText(e));
                  }
                }}
              >
                Use calculated rate
              </button>
              <small>
                Rounded down to a whole smallest token unit per second. Review
                the resulting daily amount above.
              </small>
            </details>
            <Field
              error={fieldError("deposit")}
              label={`Initial deposit${token.data ? ` (${token.data.symbol})` : ""}`}
            >
              <input
                name="deposit"
                inputMode="decimal"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="Amount"
              />
            </Field>
            <small className="muted">
              Token amounts only. A USD price is not available.
            </small>
          </div>
          <div className="form-surface">
            <h2>Agreed terms</h2>
            <Field
              error={fieldError("termsUri")}
              label="Terms URI"
              hint={`${byteLength(uri)}/512 UTF-8 bytes. Make the terms accessible to both parties and the panel.`}
            >
              <input
                name="termsUri"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                placeholder="https://… or ipfs://…"
              />
            </Field>
            <Field
              error={fieldError("termsHash")}
              label="Terms hash (keccak256)"
            >
              <input
                name="termsHash"
                value={hash}
                onChange={(e) => setHash(e.target.value.trim())}
                placeholder="0x…"
                spellCheck={false}
              />
            </Field>
            <details className="helper" open>
              <summary>Generate a terms hash</summary>
              <Field label="Paste the exact terms text">
                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setFileName("");
                    setHash(
                      e.target.value ? keccak256(toBytes(e.target.value)) : "",
                    );
                  }}
                />
              </Field>
              <Field
                label="Or choose the terms file"
                hint="The file stays in your browser. Publish it separately and paste its URI above."
              >
                <input
                  type="file"
                  onChange={(e) => void hashFile(e.target.files?.[0])}
                />
              </Field>
              {fileName && (
                <small role="status">
                  Hashed the exact bytes of {fileName}.
                </small>
              )}
            </details>
            <Field
              error={fieldError("imdJobId")}
              label="IMD job ID (optional)"
              hint="An IMD job UUID or bytes32 ID. Leave empty if this work has no job."
            >
              <input
                name="imdJobId"
                value={job}
                onChange={(e) => setJob(e.target.value)}
                placeholder="Job ID"
              />
            </Field>
          </div>
          <div className="form-end">
            {error && <Notice error>{error}</Notice>}
            <p>
              Check the token, recipient and terms carefully. The client
              controls the rate and unearned funds.
            </p>
            <button
              className="primary"
              type="submit"
              disabled={!account || !eligible.data || eligible.isError}
            >
              Review stream <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      )}
    </>
  );
}
