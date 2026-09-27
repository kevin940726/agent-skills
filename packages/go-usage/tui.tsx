/** @jsxImportSource @opentui/solid */
import { For, Show, onCleanup } from "solid-js"
import {
  DEFAULT_POLL_MS,
  REQUEST_TIMEOUT_MS,
  TOKEN_ENV,
  WINDOWS,
  bar,
  emptySnapshot,
  fetchUsage,
  resolveToken,
  until,
  type UsageSnapshot,
  type Window,
} from "./status"

/**
 * Widest label in WINDOWS. Padding every label to it keeps the bar and
 * percentage columns flush, so the three rows read as a table instead of
 * drifting right as the label lengths change. Derived rather than hardcoded so
 * a label edit in status.ts cannot silently break the alignment.
 */
const LABEL_WIDTH = Math.max(...WINDOWS.map((window) => window.label.length))

/**
 * Bar cells. 10 puts a full row at 29 columns: LABEL_WIDTH (7) + 10 + the
 * space and percentage group (5) + COUNTDOWN_WIDTH (7). Every cell is 10%, so
 * the exact percentage beside it is what you actually read; the bar is there to
 * make the three rows scannable as a column, not to be measured off.
 */
const BAR_WIDTH = 10

/**
 * Width of the percentage column, excluding the % sign.
 *
 * Must be 3, the width of the largest value, and not for tidiness. The bar and
 * percentage are one centred child between two space-between edges. If that
 * middle child changes width, the row's free space changes with it, so the
 * space-between gap changes and Yoga rounds it differently per row, knocking
 * the countdown out by a column. Measured: 3 gives percent and countdown
 * aligned at the same offset on 0%, 87% and 100% rows; 2 does not.
 */
const PERCENT_WIDTH = 3

/**
 * What the plugin holds, which is not the same as what the API reports.
 *
 * Visibility is a display choice, so it lives here rather than on
 * UsageSnapshot. Putting it there made normalizeUsage and emptySnapshot invent a
 * value neither of them has an opinion about, at eight call sites that only
 * wanted a state and a detail string.
 *
 * `visible` is a store field rather than a Solid signal because nothing in this
 * Solid build is reactive. Under Bun, solid-js resolves through the
 * "node"/"worker" export condition to dist/server.js, whose Show is a one-shot
 * ternary and whose signals do not drive re-renders. Measured: mount a tree, flip
 * a signal, flush, and nothing updates, for a bare Show, a boxed Show and a plain
 * `{cond && x}` alike. A signal would look like a working toggle and not be one.
 *
 * A store write does re-render, because that is what makes the host re-invoke
 * the slot's render function, which re-reads this field live. Same mechanism as
 * the usage numbers updating, and the only reactive path available here.
 */
type PluginStore = {
  snapshot: UsageSnapshot
  visible: boolean
}

/**
 * The command layer has to be registered from inside a rendered component.
 * Calling context.keymap.layer() directly in setup throws
 * "Keymap.Provider is missing", because setup runs outside the render tree
 * where the provider lives.
 *
 * It goes in the always-mounted "app" slot rather than alongside the sidebar,
 * so the command still works when the sidebar is hidden or the terminal is too
 * narrow to show it.
 *
 * No dialog and no close binding. An earlier version opened a popup duplicating
 * the sidebar, which was redundant and, because it bypassed the host's dialog
 * stack, unclosable. The host binds escape and ctrl+c to that stack, so a
 * plugin that opens a dialog any other way leaves the user with no way out.
 */
function CommandRoot(props: { context: any; run: () => Promise<void> | void }) {
  const dispose = props.context.keymap.layer(() => ({
    mode: "global",
    priority: 10,
    commands: [
      {
        id: "go-usage.toggle",
        title: "Toggle OpenCode Go usage in the sidebar",
        group: "Go usage",
        bind: "ctrl+g",
        palette: true,
        slash: { name: "usage", aliases: ["go-usage"], arguments: false },
        enabled: () => true,
        suggested: true,
        run: props.run,
      },
    ],
    bindings: ["go-usage.toggle"],
  }))
  onCleanup(() => {
    if (typeof dispose === "function") dispose()
  })
  return null
}

/**
 * Exported as a plain object rather than via a `Plugin.define` helper: the
 * published @opencode-ai/plugin package still ships the V1 plugin shape
 * (a function, no `define`), while the V2 runtime wants a default export
 * carrying `id` and `setup`. A plain object satisfies the runtime and needs no
 * dependency that cannot satisfy both.
 */
export default {
  id: "go-usage",
  setup(context: any) {
    console.log(`[go-usage] setup; location=${context.location?.directory ?? "-"}`)
    const [store, setStore] = context.storage.memory("goUsage", {
      initial: {
        snapshot: emptySnapshot({ detail: `connecting to OpenCode Go` }),
        visible: true,
      } as PluginStore,
    })

    let timer: ReturnType<typeof setInterval> | undefined
    let inFlight: AbortController | undefined

    const apply = (next: UsageSnapshot) => {
      // Diagnostic only, and only useful when stdout is attached. These lines do
      // NOT reach ~/.local/share/opencode/log/opencode.log: no [go-usage] line has
      // ever appeared there, under role=cli or otherwise. The state is also always
      // on screen in the sidebar, which is the better surface.
      console.log(`[go-usage] state=${next.state} windows=${next.windows.length} detail=${next.detail ?? "-"}`)
      // Field-by-field, not a wholesale reassign of draft.snapshot. Both reach
      // the slots; mutation is kept because it is the form already proven to
      // drive the sidebar in the running client.
      setStore((draft) => {
        draft.snapshot.state = next.state
        draft.snapshot.windows = next.windows
        draft.snapshot.fetchedAt = next.fetchedAt
        draft.snapshot.detail = next.detail
      })
    }

    const stopPolling = () => {
      if (timer) clearInterval(timer)
      timer = undefined
    }

    const startPolling = () => {
      if (timer) return
      timer = setInterval(() => void refresh(), DEFAULT_POLL_MS)
    }

    async function refresh() {
      inFlight?.abort()
      const controller = new AbortController()
      inFlight = controller
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      try {
        const token = await resolveToken(context.location?.directory)
        if (!token) {
          apply(
            emptySnapshot({
              detail: `no credential found. Run /connect and pick OpenCode Go, or set ${TOKEN_ENV}`,
            }),
          )
          stopPolling()
          return
        }
        const next = await fetchUsage(token, controller.signal)
        apply(next)
        // A rejected credential or a missing subscription will not fix itself,
        // so stop asking instead of polling a dead endpoint every cycle. A
        // manual /usage re-checks and resumes if that situation changed.
        if (next.state === "unauthenticated" || next.state === "notSubscribed" || next.state === "unconfigured") {
          stopPolling()
          return
        }
        startPolling()
      } catch {
        if (!controller.signal.aborted) {
          apply(emptySnapshot({ state: "retryable", fetchedAt: Date.now(), detail: "refresh failed" }))
        }
      } finally {
        clearTimeout(timeout)
        if (inFlight === controller) inFlight = undefined
      }
    }

    /**
     * `/usage`, bound to ctrl+g. Toggles this plugin's own sidebar block; see
     * PluginStore for why that is a store field rather than a signal.
     *
     * It is a toggle and not a view. The sidebar already shows every window with
     * its percentage and reset countdown at all times, so the dialog this
     * replaced only interrupted to restate what was on screen permanently, and a
     * silent refresh is indistinguishable from a dead key.
     *
     * Only this plugin's output is toggled, not the host sidebar. The published
     * @opencode-ai/plugin typings expose no sidebar command and are out of sync
     * with the running host in other ways, so guessing a command name is not
     * worth it.
     *
     * Showing also re-checks, which is what resumes polling after it stopped on
     * a rejected credential or a missing subscription. Hiding does not, since
     * there is nothing on screen to be fresh. `next` is computed before the write
     * rather than re-read afterwards, because the store write is not guaranteed
     * to have landed by the time this returns.
     */
    const toggleVisible = () => {
      const next = !store.visible
      setStore((draft) => {
        draft.visible = next
      })
      if (next) void refresh()
    }

    const monthlySummary = () => {
      const current = store.snapshot
      if (current.state !== "ok") return null
      const monthly = current.windows.find((w) => w.key === "monthly")
      if (!monthly) return null
      return `Go ${monthly.percentUsed}% used`
    }

    /**
     * One window as a three-zone line: label hard left, bar and percentage
     * centred, countdown hard right.
     *
     * space-between is the engine's own idiom for this. Yoga distributes the
     * free space between the children, so the first lands on the left edge
     * and the last on the right edge, and the middle ends up centred because
     * the two outer children are the same width: the label is padded to
     * LABEL_WIDTH and pad2 in status.ts holds every countdown at 7 columns.
     * Equal outer widths are what make the centring exact rather than
     * approximate, so LABEL_WIDTH and the countdown padding are load-bearing
     * here, not just cosmetic.
     *
     * A middle child of varying width still centres correctly, so the centre
     * group is never off-centre. But a varying width does break the outer
     * alignment: it changes the row's free space, which changes the size of
     * the space-between gap, and Yoga rounds those fractional gaps per row, so
     * a 100% row lands a column left of a 0% one. Pinning the middle to a
     * constant width makes the free space constant, every gap identical, and
     * the rounding the same on every row.
     */
    const windowRow = (window: Window) => (
      <box
        flexDirection="row"
        width="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        <text fg={context.theme.text.base}>{window.label.padEnd(LABEL_WIDTH)}</text>
        <text fg={context.theme.text.base}>
          {`${bar(window.percentUsed, BAR_WIDTH)} ${String(window.percentUsed).padStart(PERCENT_WIDTH)}%`}
        </text>
        <text fg={context.theme.text.muted}>{until(window.resetsAt)}</text>
      </box>
    )

    const diagnostic = () => {
      const current = store.snapshot
      return current.detail ?? current.state
    }

    const disposables = [
      context.ui.slot({
        append: "sidebar.content",
        // The <box> is unconditional and the visibility test below it is a plain
        // `{cond && ...}`, not a <Show>. A <Show> whose `when` is false resolves
        // to nothing, and the reconciler then throws `Orphan text error: "" must
        // have a <text> as a parent: __root__`. Wrapping it in a <box> does not
        // help; the throw just moves to the box. The inner <Show> is safe because
        // it always resolves to one branch or the other.
        //
        // While visible, always render the header and, on failure, a diagnostic
        // line. A block that renders nothing at all is indistinguishable from a
        // broken one.
        render: () => (
          <box flexDirection="column">
            {store.visible && (
              <>
                <text fg={context.theme.text.muted}>OpenCode Go</text>
                <Show
                  when={store.snapshot.state === "ok"}
                  fallback={<text fg={context.theme.text.muted}>{diagnostic()}</text>}
                >
                  <For each={store.snapshot.windows}>
                    {(window) => windowRow(window)}
                  </For>
                </Show>
              </>
            )}
          </box>
        ),
      }),
      context.ui.slot({
        append: "home.footer.status",
        // Same expression form and the same reason: this slot's root is itself
        // the conditional, so there is no enclosing <box> to absorb the throw.
        // `summary` is read once, since the guard and the child would otherwise
        // each call monthlySummary().
        render: () => {
          const summary = store.visible ? monthlySummary() : null
          return <box>{summary && <text fg={context.theme.text.muted}>{summary}</text>}</box>
        },
      }),
      context.ui.slot({
        append: "app",
        render: () => <CommandRoot context={context} run={toggleVisible} />,
      }),
    ]

    void refresh()

    return () => {
      stopPolling()
      inFlight?.abort()
      for (const dispose of disposables) {
        if (typeof dispose === "function") dispose()
      }
    }
  },
}
