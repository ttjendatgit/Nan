/**
 * Production startup file for cPanel (Jupiter) + Phusion Passenger via the Node.js Selector.
 * Set this file as the application's "Application startup file" and run `npm run build` first.
 *
 * Starts the already-built Next.js app (.next) in-process with Next's official custom server API
 * (next() + getRequestHandler(), see node_modules/next/dist/docs/01-app/02-guides/custom-server.md)
 * -- no child process, no extra dependency. It changes nothing about how the app behaves: every
 * request goes straight to Next's own request handler, exactly as with `next start`, and the
 * package.json scripts (`build: next build`, `start: next start`) stay as they are.
 *
 * Port: process.env.PORT (set by Passenger / the host), 3000 when it isn't set.
 * Binding: listen(port) with no host argument, i.e. all interfaces. Passenger intercepts this
 * listen() call and serves the app on its own socket behind its reverse proxy, so a fixed host
 * must not be forced here. process.env.HOSTNAME is deliberately not used: on shared Linux hosts it
 * is usually the machine's own name, not an address to bind to.
 *
 * Run from this directory (the project root, with node_modules installed): it loads the regular
 * .next build output. next.config.ts deliberately has no `output: "standalone"` -- Next.js states
 * that standalone output and a custom server can't be used together.
 *
 * CommonJS (package.json has no "type": "module"), which is what Passenger loads. Modules are
 * loaded with dynamic import() -- valid in CommonJS and allowed by the project's lint rules, which
 * forbid require().
 */

// A production start: Next expects NODE_ENV=production here (Passenger normally sets it already).
process.env.NODE_ENV = process.env.NODE_ENV || "production";

const port = Number.parseInt(process.env.PORT || "3000", 10);

async function main() {
  const { createServer } = await import("node:http");
  const { default: next } = await import("next");

  const app = next({ dev: false, dir: __dirname, port });
  const handle = app.getRequestHandler();
  await app.prepare();

  const server = createServer((req, res) => {
    handle(req, res);
  });

  server.on("error", (error) => {
    console.error("> Server error:", error);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Nan (Next.js) ready on port ${port} (${process.env.NODE_ENV})`);
  });
}

main().catch((error) => {
  // e.g. no production build yet (.next missing) -- fail loudly so Passenger's log shows why.
  console.error("> Failed to start Next.js:", error);
  process.exit(1);
});
