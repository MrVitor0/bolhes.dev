import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { registry } from "@bolhes/pragmas";
import { demos } from "./demos.js";
import type { CompileResult } from "@bolhes/compiler";
import "./style.css";

let nextId = 0;

function App() {
  const [source, setSource] = useState(demos[0].source);
  const [selectedDemo, setSelectedDemo] = useState(demos[0].name);
  const [result, setResult] = useState<CompileResult>();
  const [busy, setBusy] = useState(false);
  const worker = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, (value: CompileResult) => void>());
  useEffect(() => {
    worker.current = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.current.onmessage = (event: MessageEvent<{ id: number; result: CompileResult }>) => {
      pending.current.get(event.data.id)?.(event.data.result);
      pending.current.delete(event.data.id);
    };
    return () => { worker.current?.terminate(); worker.current = null; };
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const id = ++nextId;
      setBusy(true);
      pending.current.set(id, (compiled) => { setResult(compiled); setBusy(false); });
      worker.current?.postMessage({ id, source });
    }, 160);
    return () => window.clearTimeout(timer);
  }, [source]);

  const active = useMemo(() => {
    const names = (source.match(/^\s*@use\s+(.+)$/gm) ?? []).flatMap((line) => line.replace(/^\s*@use\s+/, "").split(",").map((name) => name.trim().toLowerCase()));
    return new Set(names);
  }, [source]);
  function togglePragma(id: string) {
    const lines = source.split(/\r?\n/);
    const directives: string[] = [];
    const body: string[] = [];
    for (const line of lines) (/^\s*@use\s+/.test(line) ? directives : body).push(line);
    const names = directives.flatMap((line) => line.replace(/^\s*@use\s+/, "").split(",").map((name) => name.trim()).filter(Boolean));
    const exists = names.some((name) => name.toLowerCase() === id);
    const updated = exists ? names.filter((name) => name.toLowerCase() !== id) : [...names, id];
    setSource([...(updated.length ? [`@use ${updated.join(", ")}`] : []), ...body].join("\n"));
  }

  return <main className="shell">
    <header className="topbar"><a className="wordmark" href="#">bolhês<span>.</span></a><span className="badge">compiler playground</span><a className="repo" href="https://github.com/bolhes/bolhes.dev">GitHub ↗</a></header>
    <section className="intro"><p className="eyebrow">UM COMPILER PRA BOLHA DEV BRASILEIRA</p><h1>Escreva o take.<br /><em>Compile o código.</em></h1><p className="lede">Um dialeto de autoria para JavaScript e TypeScript. O código segue sendo seu; o quote-tweet vem de brinde.</p></section>
    <section className="toolbar"><label>Demonstração<select value={selectedDemo} onChange={(event) => { const demo = demos.find((item) => item.name === event.target.value); if (demo) { setSelectedDemo(demo.name); setSource(demo.source); } }}>
      <option value="">código atual</option>
      {demos.map((demo) => <option key={demo.name}>{demo.name}</option>)}
    </select></label><div className="pragma-label">Pragmas</div><div className="chips">{registry.pragmas.map((pragma) => <button key={pragma.id} className={active.has(pragma.id) ? "chip active" : "chip"} onClick={() => togglePragma(pragma.id)} title={pragma.gesture}>{pragma.id}</button>)}</div><span className="compile-state">{busy ? "compilando…" : result?.ok ? "✓ compilado" : "● confira o diagnostic"}</span></section>
    <section className="panes">
      <article className="pane"><div className="pane-head"><span><i className="dot pink" />entrada</span><code>main.bolhes</code></div><textarea spellCheck={false} value={source} onChange={(event) => { setSelectedDemo(""); setSource(event.target.value); }} aria-label="Código Bolhês" /></article>
      <article className="pane"><div className="pane-head"><span><i className="dot green" />saída</span><code>JavaScript</code></div><pre className="output">{result?.code ?? "// A saída aparece quando o código compila."}</pre></article>
    </section>
    <section className="feedback">
      <article className="feedback-card"><h2>Diagnostics</h2>{result?.diagnostics.length ? result.diagnostics.map((item, index) => <p className={item.severity} key={`${item.code}-${index}`}><code>{item.code}</code> {item.message}</p>) : <p className="muted">Nenhum erro. O compiler não executa o programa.</p>}</article>
      <article className="feedback-card quote"><h2>Quote-tweet</h2>{result?.social?.takes.length ? result.social.takes.map((take, index) => <blockquote key={index}>{take.quoteTweet}</blockquote>) : <p className="muted">Adicione um <code>hot take</code> para gerar o artefato social.</p>}</article>
    </section>
    <footer><span>Feito pra reconhecer o trabalho, sem inventar fofoca.</span><a href="https://bolhes.dev">bolhes.dev ↗</a></footer>
  </main>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
