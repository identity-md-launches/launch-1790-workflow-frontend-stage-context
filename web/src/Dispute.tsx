import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { hexToString, type Address, type Hex } from "viem";
import {
  useAllowance,
  useBalance,
  useRead,
  useReady,
  useRuntime,
  useToken,
  useTransaction,
  type Token,
} from "./data";
import {
  byteLength,
  disputeAllowances,
  errorText,
  units,
  type Stream,
} from "./domain";
import { Dialog, Field, Notice, QueryState, TxButton, TxFeedback } from "./ui";

type Quote = {
  body: string;
  question: string;
  bond: bigint;
  price: bigint;
  fund: bigint;
  block: bigint;
  caller: Address;
  note: string;
};
function DisputeApproval({
  token,
  required,
  disabled,
  label,
  onBusy,
}: {
  token: Token;
  required: bigint;
  disabled: boolean;
  label: string;
  onBusy: (key: string, value: boolean) => void;
}) {
  const r = useRuntime();
  const { address } = useAccount();
  const allowance = useAllowance(token.address, address);
  const balance = useBalance(token.address, address);
  const tx = useTransaction();
  const gate = useReady();
  const approved = allowance.data !== undefined && allowance.data >= required;
  const enough = balance.data !== undefined && balance.data >= required;
  const reset = (allowance.data ?? 0n) > 0n && !approved;
  useEffect(() => {
    onBusy(token.address, tx.pending);
    return () => onBusy(token.address, false);
  }, [token.address, tx.pending, onBusy]);
  return (
    <div className="dispute-approval">
      <p>
        <strong>{label}</strong> · {units(required, token.decimals)}{" "}
        {token.symbol}
      </p>
      {approved ? (
        <p className="success">✓ Allowance ready</p>
      ) : (
        <TxButton
          label={
            reset
              ? `Reset ${token.symbol} allowance`
              : `Approve ${token.symbol}`
          }
          pending={tx.pending}
          phase={tx.state.phase}
          disabled={
            disabled ||
            !gate.ready ||
            !enough ||
            allowance.isError ||
            allowance.data === undefined
          }
          onClick={() =>
            tx.run(
              "approve",
              [r.weir.address, reset ? 0n : required],
              token.address,
            )
          }
        />
      )}
      {!enough && balance.data !== undefined && (
        <Notice error>
          Your {token.symbol} balance is too small for this approval.
        </Notice>
      )}
      <QueryState query={allowance} />
      <QueryState query={balance} />
      <TxFeedback state={tx.state} />
    </div>
  );
}
export function DisputeDialog({
  id,
  stream,
  token,
  onClose,
}: {
  id: bigint;
  stream: Stream;
  token: Token;
  onClose: () => void;
}) {
  const r = useRuntime();
  const { address } = useAccount();
  const gate = useReady();
  const imd = useRead<Address>("imd");
  const imdToken = useToken(imd.data);
  const canUse = useRead<boolean>("canUse", [address], !!address);
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState<Quote>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const tx = useTransaction();
  const [approvalStates, setApprovalStates] = useState<Record<string, boolean>>(
    {},
  );
  const onApprovalBusy = useCallback(
    (key: string, value: boolean) =>
      setApprovalStates((states) =>
        states[key] === value ? states : { ...states, [key]: value },
      ),
    [],
  );
  const pending = tx.pending || Object.values(approvalStates).some(Boolean);
  const tokenAllowance = useAllowance(token.address, address);
  const imdAllowance = useAllowance(imd.data, address);
  const tokenBalance = useBalance(token.address, address);
  const imdBalance = useBalance(imd.data, address);
  const requests =
    quote && imd.data
      ? disputeAllowances(
          token.address,
          imd.data,
          quote.bond,
          quote.price,
          quote.fund,
        ).filter((x) => x.amount > 0n)
      : [];
  const ready =
    !!quote &&
    quote.caller.toLowerCase() === address?.toLowerCase() &&
    requests.every((req) => {
      const isToken = req.token.toLowerCase() === token.address.toLowerCase();
      const allowance = isToken ? tokenAllowance : imdAllowance;
      const balance = isToken ? tokenBalance : imdBalance;
      return (
        !allowance.isError &&
        !balance.isError &&
        allowance.data !== undefined &&
        balance.data !== undefined &&
        allowance.data >= req.amount &&
        balance.data >= req.amount
      );
    });
  async function preview() {
    setLoading(true);
    setError("");
    setQuote(undefined);
    try {
      if (!address || !canUse.data)
        throw new Error("Connect an eligible client or recipient wallet.");
      if (byteLength(note) > 280)
        throw new Error("Keep your note within 280 UTF-8 bytes.");
      const block = await r.client.getBlockNumber();
      const read = <T,>(name: string, args: readonly unknown[] = []) =>
        r.client.readContract({
          address: r.weir.address,
          abi: r.weir.abi,
          functionName: name,
          args,
          blockNumber: block,
        }) as Promise<T>;
      const [bodyHex, bond, price, fund] = await Promise.all([
        read<Hex>("expectedBody", [id, address, note]),
        read<bigint>("bondFor", [id, address]),
        read<bigint>("oraclePrice"),
        read<bigint>("courtFund"),
      ]);
      const body = hexToString(bodyHex);
      const parsed = JSON.parse(body);
      setQuote({
        body,
        question: parsed.question,
        bond,
        price,
        fund,
        block,
        caller: address,
        note,
      });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }
  async function preflight() {
    if (!quote || quote.caller.toLowerCase() !== address?.toLowerCase())
      throw new Error("Your wallet changed. Review the dispute again.");
    const read = <T,>(name: string) =>
      r.client.readContract({
        address: r.weir.address,
        abi: r.weir.abi,
        functionName: name,
      }) as Promise<T>;
    const [price, fund] = await Promise.all([
      read<bigint>("oraclePrice"),
      read<bigint>("courtFund"),
    ]);
    if (price !== quote.price || (quote.fund >= quote.price && fund < price))
      throw new Error(
        "The oracle price or fee payer changed. Refresh the dispute preview before signing.",
      );
  }
  return (
    <Dialog
      title={`Dispute stream #${id}`}
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <p>
        The stream pauses while five panel members consider the work. Four must
        agree.
      </p>
      <Field
        label="Dispute note"
        hint={`${byteLength(note)}/280 UTF-8 bytes. This note becomes public.`}
      >
        <textarea
          rows={3}
          disabled={loading || pending}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setQuote(undefined);
          }}
        />
      </Field>
      <button
        onClick={preview}
        disabled={
          loading ||
          pending ||
          !gate.ready ||
          !canUse.data ||
          canUse.isError ||
          byteLength(note) > 280
        }
      >
        {loading
          ? "Reading question and costs…"
          : quote
            ? "Refresh dispute preview"
            : "Review dispute"}
      </button>
      {!gate.ready && <Notice>{gate.reason}</Notice>}
      {canUse.data === false && (
        <Notice error>
          Hold the required WEIR balance to raise a dispute.
        </Notice>
      )}
      <QueryState query={imdToken} />
      {error && <Notice error>{error}</Notice>}
      {quote && imdToken.data && (
        <div className="dispute-review">
          <h3>The exact oracle question</h3>
          <blockquote className="question">{quote.question}</blockquote>
          <small className="muted">
            Read from expectedBody at block {quote.block.toString()}. The
            execution block number changes when mined; the paid question is
            recorded in QuestionCommitted.
          </small>
          <details>
            <summary>View expectedBody JSON</summary>
            <pre className="body-json">{quote.body}</pre>
          </details>
          <dl className="detail-list">
            <div>
              <dt>Your bond</dt>
              <dd>
                {units(quote.bond, token.decimals)} {token.symbol}
              </dd>
            </div>
            <div>
              <dt>Oracle price now</dt>
              <dd>
                {units(quote.price, imdToken.data.decimals)}{" "}
                {imdToken.data.symbol}
              </dd>
            </div>
            <div>
              <dt>Who pays the oracle</dt>
              <dd>
                {quote.fund >= quote.price
                  ? "The court fund"
                  : "You, the caller"}
              </dd>
            </div>
          </dl>
          <p className="muted">
            The launch price is 0.5 IMD. The live price above is read from the
            Intake through Weir.
          </p>
          <p>
            The oracle fee is spent even if the panel cannot agree. Losing sends
            the bond to the counterparty; a win, failure or timeout releases it
            to the person who posted it.
          </p>
          {stream.recipient.toLowerCase() === address?.toLowerCase() && (
            <p>
              Raising this dispute also accepts the stream’s terms, so a ruling
              will count in both parties’ records.
            </p>
          )}
          <p className="muted">
            The fund may be spent before confirmation. If that happens, the
            contract can charge your wallet using an existing IMD allowance.
            Review existing allowances before signing.
          </p>
          {requests.map((req, i) => (
            <DisputeApproval
              key={`${req.token}-${req.amount}`}
              token={
                req.token.toLowerCase() === token.address.toLowerCase()
                  ? token
                  : imdToken.data!
              }
              required={req.amount}
              label={`${i + 1}. Approve ${req.kind}`}
              disabled={pending || !canUse.data || canUse.isError}
              onBusy={onApprovalBusy}
            />
          ))}
          <TxButton
            label="Raise dispute"
            primary
            pending={tx.pending}
            phase={tx.state.phase}
            disabled={
              pending || !gate.ready || !ready || !canUse.data || canUse.isError
            }
            onClick={async () => {
              const receipt = await tx.run(
                "dispute",
                [id, quote.note, quote.bond],
                undefined,
                preflight,
              );
              if (receipt) onClose();
            }}
          />
          <TxFeedback state={tx.state} />
        </div>
      )}
    </Dialog>
  );
}
