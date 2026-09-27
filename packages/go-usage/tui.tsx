import { For, Show } from "solid-js"
import {
  DEFAULT_POLL_MS,
  REQUEST_TIMEOUT_MS,
  TOKEN_ENV,
  bar,
  emptySnapshot,
  fetchUsage,
  resolveToken,
  until,
  type UsageSnapshot,
} from "./status"

const POLL_MS = DEFAULT_POLL_MS

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
    const [snapshot, setSnapshot] = context.storage.memory("goUsage", {
      initial: emptySnapshot({ detail: `connecting to OpenCode Go` }),
    })

    let timer: ReturnType<typeof setInterval> | undefined
    let inFlight: AbortController | undefined

    const apply = (next: UsageSnapshot) =>
      setSnapshot((draft) => {
        draft.state = next.state
        draft.windows = next.windows
        draft.fetchedAt = next.fetchedAt
        draft.detail = next.detail
      })

    const stopPolling = () => {
      if (timer) clearInterval(timer)
      timer = undefined
    }

    const startPolling = () => {
      if (timer) return
      timer = setInterval(() => void refresh(), POLL_MS)
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
        // manual /go re-checks and resumes if the situation changed.
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

    const monthlySummary = () => {
      const current = snapshot()
      if (current.state !== "ok") return null
      const monthly = current.windows.find((w) => w.key === "monthly")
      if (!monthly) return null
      return `Go ${monthly.percentUsed}% used`
    }

    const line = (label: string, percentUsed: number) =>
      `${label} ${bar(percentUsed)} ${String(percentUsed).padStart(3)}%`

    const showDetail = () => {
      const current = snapshot()
      context.ui.dialog.show(
        () => (
          <box>
            <Show
              when={current.state === "ok"}
              fallback={<text fg={context.theme.text.base}>{current.detail ?? current.state}</text>}
            >
              <For each={current.windows}>
                {(window) => (
                  <text fg={context.theme.text.base}>
                    {`${line(window.label, window.percentUsed)}   resets in ${until(window.resetsAt)}`}
                  </text>
                )}
              </For>
            </Show>
          </box>
        ),
        () => context.ui.dialog.clear(),
      )
    }

    const openDetail = async () => {
      await refresh()
      showDetail()
    }

    const disposables = [
      context.ui.slot({
        append: "sidebar.content",
        render: () => (
          <Show when={snapshot().state === "ok"}>
            <box>
              <text fg={context.theme.text.muted}>OpenCode Go</text>
              <For each={snapshot().windows}>
                {(window) => (
                  <text fg={context.theme.text.base}>{line(window.label, window.percentUsed)}</text>
                )}
              </For>
            </box>
          </Show>
        ),
      }),
      context.ui.slot({
        append: "home.footer.status",
        render: () => (
          <Show when={monthlySummary()}>
            {(summary) => <text fg={context.theme.text.muted}>{summary()}</text>}
          </Show>
        ),
      }),
      context.keymap.layer(() => ({
        mode: "global",
        priority: 10,
        commands: [
          {
            id: "go-usage.show",
            title: "Show OpenCode Go usage",
            group: "Go usage",
            bind: "ctrl+g",
            palette: true,
            slash: { name: "usage", aliases: ["go-usage"], arguments: false },
            enabled: () => true,
            suggested: true,
            run: openDetail,
          },
        ],
        bindings: ["go-usage.show"],
      })),
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
