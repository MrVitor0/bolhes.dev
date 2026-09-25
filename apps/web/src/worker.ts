import { compile } from "@bolhes/compiler";

self.addEventListener("message", (event: MessageEvent<{ id: number; source: string }>) => {
  const result = compile(event.data.source, { filename: "playground.bolhes" });
  self.postMessage({ id: event.data.id, result });
});
