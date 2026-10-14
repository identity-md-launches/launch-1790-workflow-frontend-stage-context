import { useState } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";
import { LINKS } from "./config";
import { useBalance, useRead, useRuntime, useToken } from "./data";
import { tryAmount, units } from "./domain";
import { ApprovalAction } from "./actions";
import { External, Field, QueryState } from "./ui";

export function Eligibility({ compact = false }: { compact?: boolean }) {
  const r = useRuntime();
  const { address } = useAccount();
  const balance = useBalance(r.token.address, address);
  const token = useToken(r.token.address);
  const eligible = useRead<boolean>("canUse", [address], !!address);
  const tier = useRead<number>("tierBps", [address], !!address);
  return (
    <div className={`eligibility ${compact ? "compact" : ""}`}>
      <div>
        <h2>{compact ? "Your access" : "Ready to start a stream?"}</h2>
        {!address ? (
          <p className="muted">
            Connect to check your WEIR balance and bond tier.
          </p>
        ) : (
          <>
            <div className="wallet-stats">
              <div>
                <span>WEIR balance</span>
                <strong className="numeric">
                  {balance.data !== undefined && token.data
                    ? units(balance.data, token.data.decimals)
                    : "Reading…"}
                </strong>
              </div>
              <div>
                <span>Eligibility</span>
                <strong>
                  {eligible.data === undefined
                    ? "Reading…"
                    : eligible.data
                      ? "Eligible"
                      : "More WEIR needed"}
                </strong>
              </div>
              <div>
                <span>Dispute bond</span>
                <strong>
                  {tier.data === undefined
                    ? "Reading…"
                    : `${tier.data / 100}% of stake`}
                </strong>
              </div>
            </div>
            <QueryState query={eligible} />
            <QueryState query={balance} />
          </>
        )}
      </div>
      {!compact && (
        <a href="#/create" className="button primary">
          Create stream <span aria-hidden="true">↗</span>
        </a>
      )}
    </div>
  );
}
export function Home() {
  const r = useRuntime();
  const fund = useRead<bigint>("courtFund");
  const minHold = useRead<bigint>("minHold");
  const imd = useRead<Address>("imd");
  const imdToken = useToken(imd.data);
  const weirToken = useToken(r.token.address);
  const [sponsor, setSponsor] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const sponsorAmount = imdToken.data
    ? tryAmount(sponsor, imdToken.data.decimals)
    : undefined;
  return (
    <>
      <section className="intro">
        <div>
          <h1 tabIndex={-1}>Pay as the work flows.</h1>
          <p>
            Weir streams tokens for agreed work, second by second.
            <br className="desktop-only" /> You set the terms; an IdentityMD
            panel can settle disputes.
            <br className="desktop-only" /> Weir takes no application fee.
          </p>
        </div>
        <div className="flow-art" aria-hidden="true">
          <svg viewBox="0 0 280 120">
            <path d="M0 24h90q30 0 30 30v12q0 30 30 30h130M0 60h72q30 0 30 30v6q0 20 20 20h158M0 4h108q30 0 30 30v12q0 30 30 30h112" />
            <circle cx="86" cy="24" r="5" />
            <circle cx="166" cy="76" r="5" />
            <circle cx="212" cy="96" r="5" />
          </svg>
        </div>
      </section>
      <Eligibility />
      <div className="home-grid">
        <section className="hold-section">
          <div className="section-heading">
            <h2>Hold WEIR. Use Weir.</h2>
            <External href={LINKS.token(r.token.address)}>Buy WEIR</External>
          </div>
          <p>
            Hold at least{" "}
            <strong>
              {minHold.data !== undefined && weirToken.data
                ? units(minHold.data, weirToken.data.decimals)
                : "10,000"}{" "}
              WEIR
            </strong>{" "}
            to create a stream or raise a dispute. Higher balances lower your
            bond.
          </p>
          <table>
            <caption>Dispute bond by WEIR balance</caption>
            <thead>
              <tr>
                <th scope="col">WEIR held</th>
                <th scope="col">Bond on stake</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Under 100,000</td>
                <td>5%</td>
              </tr>
              <tr>
                <td>100,000+</td>
                <td>2.5%</td>
              </tr>
              <tr>
                <td>1,000,000+</td>
                <td>1%</td>
              </tr>
              <tr>
                <td>10,000,000+</td>
                <td>0%</td>
              </tr>
            </tbody>
          </table>
          <small className="muted">
            Stake is everything still held in the stream. The bond is paid in
            the stream’s token.
          </small>
        </section>
        <section className="court-section">
          <div className="section-heading">
            <h2>The court fund</h2>
            <span className="status-dot" aria-hidden="true" />
          </div>
          <p className="fund-value numeric">
            {fund.data !== undefined && imdToken.data
              ? units(fund.data, imdToken.data.decimals)
              : "…"}{" "}
            <span>{imdToken.data?.symbol ?? "IMD"}</span>
          </p>
          <p>
            Sponsorship pays oracle fees for everyone. When the fund is short,
            the person raising the dispute pays.
          </p>
          <QueryState query={fund} />
          <button
            disabled={busy}
            onClick={() => setShow(!show)}
            aria-expanded={show}
          >
            Sponsor the court fund{" "}
            <span aria-hidden="true">{show ? "−" : "+"}</span>
          </button>
          {show && (
            <div className="sponsor-form">
              <Field
                label={`Sponsorship (${imdToken.data?.symbol ?? "IMD"})`}
                hint="Sponsorship cannot be withdrawn."
              >
                <input
                  inputMode="decimal"
                  value={sponsor}
                  onChange={(e) => setSponsor(e.target.value)}
                  placeholder="Amount"
                  disabled={busy}
                />
              </Field>
              <QueryState query={imdToken} />
              {sponsorAmount && imdToken.data ? (
                <ApprovalAction
                  token={imdToken.data}
                  amount={sponsorAmount}
                  name="sponsor"
                  args={[sponsorAmount]}
                  label="Sponsor"
                  onBusy={setBusy}
                />
              ) : (
                <small className="muted">
                  Enter a positive amount to review the approval.
                </small>
              )}
            </div>
          )}
        </section>
      </div>
      <section className="how-section">
        <h2>Terms first. Payments follow.</h2>
        <div className="three-columns">
          <div>
            <span className="step-number">01</span>
            <h3>Agree on the work</h3>
            <p>
              Link your terms and keep their hash on-chain. The recipient can
              accept them.
            </p>
          </div>
          <div>
            <span className="step-number">02</span>
            <h3>Fund a stream</h3>
            <p>
              Set a rate per second. The recipient withdraws what has streamed.
            </p>
          </div>
          <div>
            <span className="step-number">03</span>
            <h3>Resolve a disagreement</h3>
            <p>
              One question goes to five panel members, with four needed to
              agree.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
