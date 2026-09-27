import * as esbuild from "esbuild"
import { solidPlugin } from "esbuild-plugin-solid"

// Compiles tui.tsx -> tui/index.js, the artifact the "./tui" export points at.
//
// Two things this must get right:
//
// 1. JSX needs the Solid transform, not just type stripping. OpenCode's loader
//    strips types from a .ts entrypoint, but raw JSX has no DOM output until
//    babel-preset-solid or esbuild-plugin-solid runs. Hence this build step.
//
// 2. @opentui/* and solid-js stay external, always. The host owns the renderer
//    instance; inlining a second copy yields "No renderer found" at render
//    time. Declare them as dependencies so npm installs them, but never let
//    them into the bundle.
await esbuild.build({
  entryPoints: ["tui.tsx"],
  outfile: "tui/index.js",
  format: "esm",
  platform: "node",
  bundle: true,
  target: "node22",
  external: ["@opencode-ai/*", "@opentui/*", "solid-js", "solid-js/*"],
  plugins: [solidPlugin({ solid: { moduleName: "@opentui/solid", generate: "universal" } })],
})
