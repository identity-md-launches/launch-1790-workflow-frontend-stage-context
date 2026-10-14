import { useState } from "react";
import { useAccount } from "wagmi";
import { zeroHash } from "viem";
import { useCreatedEvents } from "./history";
import { useStream, useToken } from "./data";
import { displayJob, safeUri, stateLabel, units } from "./domain";
import { LINKS } from "./config";
import { AddressView, External, Field, Notice, QueryState, Title } from "./ui";
import { ConnectPrompt } from "./Wallet";

export function StreamRow({ id }: { id: bigint }) {
  const q = useStream(id);
  const token = useToken(q.data?.stream.token);
  const s = q.data?.stream;
  return (
    <article className="stream-row">
      <div className="stream-row-head">
        <h3>
          <a href={`#/stream/${id}`}>Stream #{id.toString()}</a>
        </h3>
        {s && <span className={`badge state-${s.state}`}>{stateLabel(s)}</span>}
      </div>
      <QueryState query={q} />
      {s && (
        <>
          <div className="parties">
            <span>
              From <AddressView value={s.client} />
            </span>
            <span>
              To <AddressView value={s.recipient} />
            </span>
          </div>
          {q.data && token.data && (
            <dl className="amount-grid">
              {(["streamed", "withdrawable", "refundable"] as const).map(
                (key) => (
                  <div key={key}>
                    <dt>{key[0].toUpperCase() + key.slice(1)}</dt>
                    <dd>
                      {units(q.data![key], token.data!.decimals)}{" "}
                      <span>{token.data!.symbol}</span>
                    </dd>
                  </div>
                ),
              )}
            </dl>
          )}
          <QueryState query={token} />
          <div className="row-links">
            {safeUri(s.termsURI) ? (
              <External href={safeUri(s.termsURI)!}>Read terms</External>
            ) : (
              <span className="hash">Terms: {s.termsURI || "No URI"}</span>
            )}
            {s.imdJobId !== zeroHash && (
              <External href={LINKS.job(displayJob(s.imdJobId))}>
                View IMD job
              </External>
            )}
            <a href={`#/stream/${id}`}>Manage stream →</a>
          </div>
        </>
      )}
    </article>
  );
}
export function Streams() {
  const { address } = useAccount();
  const q = useCreatedEvents(address);
  const [role, setRole] = useState<"client" | "recipient">("client");
  const [lookup, setLookup] = useState("");
  const [error, setError] = useState("");
  const events = [
    ...new Map(
      (q.data?.pages.flatMap((p) => p.events) ?? [])
        .filter(
          (e) => String(e.args[role]).toLowerCase() === address?.toLowerCase(),
        )
        .map((e) => [String(e.args.id), e]),
    ).values(),
  ].sort((a, b) =>
    Number(BigInt(String(b.args.id)) - BigInt(String(a.args.id))),
  );
  return (
    <>
      <Title
        aside={
          <a href="#/create" className="button primary">
            Create stream ↗
          </a>
        }
      >
        My streams
      </Title>
      <p className="page-description">
        Payments you fund and payments you receive.
      </p>
      <form
        className="lookup-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (/^[1-9]\d*$/.test(lookup)) {
            setError("");
            location.hash = `/stream/${lookup}`;
          } else setError("Enter a stream ID greater than zero.");
        }}
      >
        <Field label="Open a stream by ID">
          <input
            inputMode="numeric"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder="Stream ID"
          />
        </Field>
        <button type="submit">Open stream</button>
      </form>
      {error && <Notice error>{error}</Notice>}
      {!address ? (
        <ConnectPrompt />
      ) : (
        <>
          <div className="tabs" aria-label="Stream role">
            <button
              aria-pressed={role === "client"}
              onClick={() => setRole("client")}
            >
              As client
            </button>
            <button
              aria-pressed={role === "recipient"}
              onClick={() => setRole("recipient")}
            >
              As recipient
            </button>
            <button
              className="refresh-button"
              disabled={q.isFetching}
              onClick={() => q.refetch()}
            >
              {q.isFetching ? "Refreshing…" : "Refresh history"}
            </button>
          </div>
          <QueryState query={q} />
          {events.map((e) => (
            <StreamRow key={String(e.args.id)} id={BigInt(String(e.args.id))} />
          ))}
          {!q.isPending && !q.isError && events.length === 0 && (
            <div className="empty">
              <h2>No {role} streams in these blocks</h2>
              <p>
                {q.hasNextPage
                  ? "Search older blocks to find earlier streams, or open a stream by its ID above."
                  : "No streams found for this wallet since deployment."}
              </p>
              <a href="#/create">Create a stream →</a>
            </div>
          )}
          {q.data && (
            <p className="muted history-range">
              StreamCreated events scanned from block{" "}
              {q.data.pages.at(-1)!.from.toString()} to{" "}
              {q.data.pages[0].to.toString()}.{" "}
              {q.hasNextPage
                ? "Earlier history is available."
                : "Deployment history fully scanned."}
            </p>
          )}
          {q.hasNextPage && (
            <button disabled={q.isFetching} onClick={() => q.fetchNextPage()}>
              {q.isFetchingNextPage ? "Searching…" : "Load older streams"}
            </button>
          )}
        </>
      )}
    </>
  );
}
