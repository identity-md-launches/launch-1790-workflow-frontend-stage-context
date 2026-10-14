import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useRuntime, useVerification } from "./data";
import { LINKS } from "./config";
import { WalletControl } from "./Wallet";
import { Home } from "./Home";
import { Create } from "./Create";
import { Streams } from "./Streams";
import { StreamPage } from "./StreamPage";
import { Records } from "./Records";
import { AddressView, External, Notice } from "./ui";
import { errorText } from "./domain";

export function App() {
  const r = useRuntime();
  const [route, setRoute] = useState(location.hash.slice(1) || "/");
  const verification = useVerification();
  const { address, chainId } = useAccount();
  const cache = useQueryClient();
  useEffect(() => {
    const change = () => {
      setRoute(location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    const h1 = document.querySelector<HTMLElement>("h1");
    h1?.focus({ preventScroll: true });
    document.title = `Weir · ${route === "/" ? "Pay as the work flows" : route.startsWith("/stream/") ? `Stream #${route.split("/")[2]}` : ({ "/create": "Create stream", "/streams": "My streams", "/records": "Public records" }[route] ?? "Page not found")}`;
  }, [route]);
  useEffect(() => {
    void cache.invalidateQueries({
      predicate: (query) =>
        !["walletClient", "connectorClient"].includes(
          String(query.queryKey[0]),
        ),
    });
  }, [address, chainId, cache]);
  const id = /^\/stream\/([1-9]\d*)$/.exec(route)?.[1];
  const page =
    route === "/" ? (
      <Home />
    ) : route === "/create" ? (
      <Create />
    ) : route === "/streams" ? (
      <Streams />
    ) : route === "/records" ? (
      <Records />
    ) : id ? (
      <StreamPage key={id} id={BigInt(id)} />
    ) : (
      <section>
        <h1>Page not found</h1>
        <a href="#/">Go home</a>
      </section>
    );
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
          document.getElementById("main")?.scrollIntoView();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <div className="topbar">
          <a href="#/" className="brand" aria-label="Weir home">
            <svg width="36" height="36" viewBox="0 0 64 64" aria-hidden="true">
              <path d="M8 16v22c0 16 22 16 22 0V16m4 0v22c0 16 22 16 22 0V16" />
            </svg>
            <span>weir</span>
          </a>
          <div className="header-right">
            <span className="network-label">
              <span className="network-dot" />
              {r.chain.name}
            </span>
            <WalletControl />
          </div>
        </div>
        <nav aria-label="Main navigation">
          {[
            ["/", "Home"],
            ["/create", "Create stream"],
            ["/streams", "My streams"],
            ["/records", "Records"],
          ].map(([path, label]) => (
            <a
              key={path}
              href={`#${path}`}
              aria-current={
                route === path || (path === "/streams" && !!id)
                  ? "page"
                  : undefined
              }
            >
              {label}
            </a>
          ))}
        </nav>
      </header>
      <main id="main" className="page" tabIndex={-1}>
        {verification.isError && (
          <div className="verification-error">
            <Notice error>
              {errorText(verification.error)} All transaction controls are
              disabled.
            </Notice>
            <button
              disabled={verification.isFetching}
              onClick={() => verification.refetch()}
            >
              {verification.isFetching ? "Checking…" : "Retry verification"}
            </button>
          </div>
        )}
        {page}
      </main>
      <footer className="site-footer">
        <div className="footer-main">
          <a className="brand footer-brand" href="#/">
            weir<span className="brand-period">.</span>
          </a>
          <p>
            Open source. No application fee.
            <br />
            Not audited. The swarm’s panel review is not an audit.
          </p>
          <div className="footer-links">
            <External href={LINKS.repo}>Source on GitHub</External>
            <External href={LINKS.oracleDocs}>IdentityMD oracle docs</External>
            <a href="./imd-deployment.json">Deployment manifest</a>
          </div>
        </div>
        <details className="deployment-details">
          <summary>Deployment & network</summary>
          <p>
            {r.chain.name} · Chain {r.chain.id} ·{" "}
            {verification.data && !verification.isError
              ? "Contract code and chain verified"
              : "Verification pending"}
          </p>
          {r.deployment.contracts.map((c) => (
            <p key={c.name}>
              {c.name}: <AddressView value={c.address} full />
            </p>
          ))}
          <p className="hash">Source commit: {r.deployment.sourceCommit}</p>
          <p className="muted">
            Public RPC reads refresh automatically. Transaction signing stays in
            your wallet. No USD price source is configured.
          </p>
        </details>
      </footer>
    </>
  );
}
