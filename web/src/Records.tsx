import { useState } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";
import { useRead } from "./data";
import { address, errorText } from "./domain";
import { AddressView, Field, Notice, QueryState, Title } from "./ui";

export function RecordCard({
  account,
  title,
}: {
  account: Address;
  title?: string;
}) {
  const q = useRead<readonly [number, number, number, number, number]>(
    "records",
    [account],
  );
  const labels = [
    "Client wins",
    "Client losses",
    "Recipient wins",
    "Recipient losses",
    "Disputes raised",
  ];
  return (
    <section className="record-card">
      {title && <h3>{title}</h3>}
      <AddressView value={account} full />
      <QueryState query={q} />
      {q.data && (
        <dl className="record-grid">
          {labels.map((label, i) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className="numeric">{q.data![i].toString()}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
export function Records() {
  const { address: account } = useAccount();
  const [value, setValue] = useState("");
  const [target, setTarget] = useState<Address>();
  const [error, setError] = useState("");
  return (
    <>
      <Title>Public records</Title>
      <p className="page-description">
        Look up an address’s on-chain dispute record.
      </p>
      <form
        className="lookup-form"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            setTarget(address(value));
            setError("");
          } catch (e) {
            setError(errorText(e));
          }
        }}
      >
        <Field label="Wallet address">
          <input
            autoComplete="off"
            value={value}
            spellCheck={false}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0x…"
          />
        </Field>
        <button type="submit" className="primary">
          Look up records
        </button>
      </form>
      {account && (
        <button
          className="text-button"
          onClick={() => {
            setTarget(account);
            setValue(account);
            setError("");
          }}
        >
          Use my wallet
        </button>
      )}
      {error && <Notice error>{error}</Notice>}
      {target && <RecordCard account={target} />}
      <section className="reading-note">
        <h2>What a record means</h2>
        <p>
          Rulings count against both parties only after the recipient has
          accepted the terms. Accepting, withdrawing or raising a dispute as the
          recipient records that acceptance.
        </p>
        <p>
          A timeout or panel failure does not add a win or loss. A record
          reflects a panel judgement, not a court of law.
        </p>
      </section>
    </>
  );
}
