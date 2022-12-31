import {
	ItemView,
	type ViewStateResult,
	type WorkspaceLeaf,
	debounce,
} from "obsidian"
import { NOTICE_NO_TIMEOUT, TERMINAL_EXIT_SUCCESS, TERMINAL_RESIZE_TIMEOUT } from "./magic"
import { UnnamespacedID, notice, onVisible, openExternal, printError, statusBar } from "./util"
import { basename, extname } from "path"
import { FitAddon } from "xterm-addon-fit"
import { SearchAddon } from "xterm-addon-search"
import { Terminal } from "xterm"
import type TerminalPlugin from "./main"
import type TerminalPty from "./pty"
import { WebLinksAddon } from "xterm-addon-web-links"

class TerminalView extends ItemView {
	public static readonly viewType = new UnnamespacedID("terminal-view")
	public static namespacedViewType: string

	protected state = new TerminalView.State({
		args: [],
		cwd: "",
		executable: "",
	})

	protected readonly terminal = new Terminal()
	protected readonly terminalAddons = {
		fit: new FitAddon(),
		search: new SearchAddon(),
		webLinks: new WebLinksAddon((_0, uri) => { openExternal(uri) }),
	} as const

	protected pty?: TerminalPty
	protected readonly resizeNative = debounce(async (
		columns: number,
		rows: number,
	) => {
		const { pty } = this
		if (typeof pty === "undefined") {
			return
		}
		await pty.resize(columns, rows).catch(() => { })
	}, TERMINAL_RESIZE_TIMEOUT, false)

	public constructor(
		protected readonly plugin: TerminalPlugin,
		leaf: WorkspaceLeaf
	) {
		super(leaf)
		for (const addon of Object.values(this.terminalAddons)) {
			this.terminal.loadAddon(addon)
		}
	}

	public override async setState(
		state: any,
		_0: ViewStateResult
	): Promise<void> {
		if (!(state instanceof TerminalView.State) || typeof this.pty !== "undefined") {
			return
		}
		this.state = state
		const { plugin, terminal } = this,
			{ i18n } = plugin,
			pty = new plugin.platform.terminalPty(
				plugin,
				state.executable,
				state.cwd,
				state.args,
			)
		this.register(() => pty.shell.kill())
		this.pty = pty
		pty.once("exit", code => {
			notice(i18n.t("notices.terminal-exited", { code }), TERMINAL_EXIT_SUCCESS.includes(code) ? plugin.settings.noticeTimeout : NOTICE_NO_TIMEOUT)
			this.leaf.detach()
		})
		const { shell } = pty
		shell
			.once("error", error => {
				printError(error, i18n.t("errors.error-spawning-terminal"))
			})
		shell.stdout.on("data", data => {
			terminal.write(data as Uint8Array | string)
		})
		shell.stderr.on("data", data => {
			terminal.write(data as Uint8Array | string)
		})
		terminal.onData(data => shell.stdin.write(data))
		await Promise.resolve()
	}

	public override getState(): TerminalView.State {
		return this.state
	}

	public override onResize(): void {
		if (this.plugin.app.workspace.getActiveViewOfType(TerminalView) === this) {
			const { fit } = this.terminalAddons,
				dim = fit.proposeDimensions()
			if (typeof dim === "undefined") {
				return
			}
			fit.fit()
			this.resizeNative(dim.cols, dim.rows)
		}
	}

	public getDisplayText(): string {
		const { executable } = this.getState()
		return this.plugin.i18n.t("views.terminal-view.display-name", { executable: basename(executable, extname(executable)) })
	}

	public override getIcon(): string {
		return this.plugin.i18n.t("assets:views.terminal-view-icon")
	}

	public getViewType(): string {
		// Workaround: super() calls this method
		return TerminalView.namespacedViewType
	}

	protected override async onOpen(): Promise<void> {
		const { containerEl, plugin, terminal } = this
		containerEl.empty()
		containerEl.createDiv({}, ele => {
			const obsr = onVisible(ele, obsr0 => {
				try {
					this.register(() => { terminal.dispose() })
					terminal.open(ele)
				} finally {
					obsr0.disconnect()
				}
			})
			this.register(() => { obsr.disconnect() })
		})

		this.registerEvent(plugin.app.workspace.on("active-leaf-change", leaf => {
			if (leaf === this.leaf) {
				terminal.focus()
				return
			}
			terminal.blur()
		}))
		statusBar(div => {
			const hider = new MutationObserver(() => {
				div.style.visibility = "hidden"
			})
			this.register(() => {
				hider.disconnect()
				div.style.visibility = ""
			})
			this.registerEvent(plugin.app.workspace.on("active-leaf-change", leaf => {
				hider.disconnect()
				if (leaf === this.leaf) {
					div.style.visibility = "hidden"
					hider.observe(div, { attributeFilter: ["style"] })
					return
				}
				div.style.visibility = ""
			}))
		})
		await Promise.resolve()
	}
}
namespace TerminalView {
	export class State implements State.Impl {
		public constructor(protected readonly obj: State.Impl) { }
		public get executable(): string { return this.obj.executable }
		public get cwd(): string { return this.obj.cwd }
		public get args(): string[] { return this.obj.args }
	}
	namespace State {
		export interface Impl {
			readonly executable: string
			readonly cwd: string
			readonly args: string[]
		}
	}
}
export default TerminalView
