/**
 * The Console is workspace-wide, not project-scoped, so nothing here is
 * location specific. This server entrypoint exists so the connected server
 * lists the plugin; the CLI then loads ./tui for the sidebar slot.
 *
 * Exported as a plain object on purpose: the published @opencode-ai/plugin
 * package still ships the V1 `Plugin` function shape, while the V2 runtime
 * wants a default definition carrying `id` and `setup`. `Plugin.define` is
 * only an identity helper, so skipping it avoids a dependency that cannot
 * satisfy both shapes.
 */
export default {
  id: "go-usage",
  setup() {},
}
