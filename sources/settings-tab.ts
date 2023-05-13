import {
	EditDataModal,
	ListModal,
} from "./modals.js"
import {
	cloneAsWritable,
	createChildElement,
	deepFreeze,
	logError,
	unexpected,
} from "./util.js"
import { identity, isEmpty } from "lodash-es"
import {
	linkSetting,
	resetButton,
	setTextToEnum,
	setTextToNumber,
} from "./settings-widgets.js"
import type { DeepReadonly } from "ts-essentials"
import type { Fixer } from "./fixers.js"
import type { PluginContext } from "./plugin.js"
import { PluginSettingTab } from "obsidian"
import type { ReadonlyTuple } from "./types.js"
import { UpdatableUI } from "./obsidian.js"

export abstract class AdvancedSettingTab<S extends PluginContext
	.Settings> extends PluginSettingTab {
	protected readonly ui = new UpdatableUI()
	#onMutate

	public constructor(protected readonly context: PluginContext<S>) {
		super(context.app, context)
		this.#onMutate = this.snapshot()
		const { ui } = this,
			{ language: { onChangeLanguage } } = context
		context.register(() => { ui.destroy() })
		ui.finally(onChangeLanguage.listen(() => { this.ui.update() }))
	}

	public display(): void {
		this.#onMutate = this.snapshot()
		this.ui.update()
	}

	protected newTitleWidget(): void {
		const { context, containerEl, ui } = this
		ui.new(() => createChildElement(containerEl, "h1"), ele => {
			ele.textContent = context.displayName()
		})
	}

	protected newDescriptionWidget(): void {
		const { context: { language: { i18n } }, containerEl, ui } = this
		ui.new(() => createChildElement(containerEl, "div"), ele => {
			ele.textContent = i18n.t("settings.description")
		})
	}

	protected newLanguageWidget(
		languages: ReadonlyTuple<S["language"]>,
		languageNamer: (language: S["language"] | "") => string,
		defaults: DeepReadonly<Pick<S, "language">>,
	): void {
		const
			{
				containerEl,
				ui,
				context: { settings, language: { i18n } },
			} = this,
			langs = deepFreeze(["", ...languages.filter(identity)])
		ui.newSetting(containerEl, setting => {
			setting
				.setName(i18n.t("settings.language"))
				.setDesc(i18n.t("settings.language-description"))
				.addDropdown(linkSetting(
					(): string => settings.copy.language,
					setTextToEnum(
						langs,
						async value => settings.mutate(settingsM => {
							settingsM.language = value || defaults.language
						}),
					),
					() => { this.postMutate() },
					{
						pre: dropdown => {
							dropdown
								.addOptions(Object.fromEntries(langs
									.map(lang => [lang, languageNamer(lang)])))
						},
					},
				))
				.addExtraButton(resetButton(
					i18n.t("asset:settings.language-icon"),
					i18n.t("settings.reset"),
					async () => settings
						.mutate(settingsM => {
							settingsM.language = defaults.language
						}),
					() => { this.postMutate() },
				))
		})
	}

	protected newAllSettingsWidget(
		defaults: DeepReadonly<Partial<S>>,
		fixer: Fixer<S>,
	): void {
		const {
			containerEl,
			context,
			context: { settings, language: { i18n } },
			ui,
		} = this
		ui.newSetting(containerEl, setting => {
			// Disabling undo is required for its CTA status to work properly
			let undoable = false
			setting
				.setName(i18n.t("settings.all-settings"))
				.addButton(button => {
					button
						.setIcon(i18n.t("asset:settings.all-settings-actions.edit-icon"))
						.setTooltip(i18n.t("settings.all-settings-actions.edit"))
						.onClick(() => {
							new EditDataModal(
								context,
								settings.copy,
								fixer,
								{
									callback: async (settings0): Promise<void> => {
										await settings.mutate(settingsM => {
											Object.assign(settingsM, settings0)
										})
										this.postMutate()
									},
									title(): string {
										return i18n.t("settings.all-settings")
									},
								},
							).open()
						})
				})
				.addButton(button => {
					button
						.setIcon(i18n
							.t("asset:settings.all-settings-actions.recover-icon"))
						.setTooltip(i18n.t("settings.all-settings-actions.recover"))
						.onClick(() => {
							new ListModal(
								context,
								ListModal.stringInputter<readonly [string, string]>({
									back: unexpected,
									forth: value => value[1],
								}),
								unexpected,
								Object.entries(settings.copy.recovery),
								{
									callback: async (recovery0): Promise<void> => {
										await settings.mutate(settingsM => {
											settingsM.recovery = Object.fromEntries(recovery0)
										})
										this.postMutate()
									},
									dynamicWidth: true,
									editables: ["remove"],
									namer: (value): string => value[0],
									title: (): string =>
										i18n.t("settings.all-settings-actions.recover"),
								},
							).open()
						})
					if (!isEmpty(settings.copy.recovery)) {
						button.setCta()
					}
				})
				.addButton(resetButton(
					i18n.t("asset:settings.all-settings-actions.undo-icon"),
					i18n.t("settings.all-settings-actions.undo"),
					async () => {
						if (!undoable) { return false }
						await settings.mutate(async settingsM =>
							Object.assign(settingsM, await this.#onMutate))
						return true
					},
					() => {
						this.#onMutate = this.snapshot()
						this.postMutate()
					},
					{
						post: component => {
							this.#onMutate.then(() => {
								undoable = true
								component.setCta()
							}).catch(logError)
						},
					},
				))
				.addButton(resetButton(
					i18n.t("asset:settings.all-settings-actions.reload-icon"),
					i18n.t("settings.all-settings-actions.reload"),
					async () => settings.read(),
					() => { this.postMutate() },
				))
				.addButton(resetButton(
					i18n.t("asset:settings.all-settings-actions.reset-icon"),
					i18n.t("settings.all-settings-actions.reset"),
					async () => settings.mutate(settingsM =>
						Object.assign(settingsM, cloneAsWritable(defaults))),
					() => { this.postMutate() },
				))
		})
	}

	protected newNoticeTimeoutWidget(
		defaults: DeepReadonly<Pick<S, "errorNoticeTimeout" | "noticeTimeout">>,
	): void {
		const {
			containerEl,
			context: { settings, language: { i18n } },
			ui,
		} = this
		ui.newSetting(containerEl, setting => {
			setting
				.setName(i18n.t("settings.notice-timeout"))
				.setDesc(i18n.t("settings.notice-timeout-description"))
				.addText(linkSetting(
					() => settings.copy.noticeTimeout.toString(),
					setTextToNumber(async value => settings.mutate(settingsM => {
						settingsM.noticeTimeout = value
					})),
					() => { this.postMutate() },
				))
				.addExtraButton(resetButton(
					i18n.t("asset:settings.notice-timeout-icon"),
					i18n.t("settings.reset"),
					async () => settings.mutate(settingsM => {
						settingsM.noticeTimeout = defaults.noticeTimeout
					}),
					() => { this.postMutate() },
				))
		})
			.newSetting(containerEl, setting => {
				setting
					.setName(i18n.t("settings.error-notice-timeout"))
					.setDesc(i18n.t("settings.error-notice-timeout-description"))
					.addText(linkSetting(
						() => settings.copy.errorNoticeTimeout.toString(),
						setTextToNumber(async value => settings.mutate(settingsM => {
							settingsM.errorNoticeTimeout = value
						})),
						() => { this.postMutate() },
					))
					.addExtraButton(resetButton(
						i18n.t("asset:settings.error-notice-timeout-icon"),
						i18n.t("settings.reset"),
						async () => settings.mutate(settingsM => {
							settingsM.errorNoticeTimeout = defaults.errorNoticeTimeout
						}),
						() => { this.postMutate() },
					))
			})
	}

	protected async snapshot(): Promise<unknown> {
		const { context: { settings } } = this,
			snapshot = this.snapshot0()
		return new Promise((resolve, reject) => {
			const unregister = settings.on("mutate-settings", identity, () => {
				try {
					resolve(snapshot)
				} catch (error) {
					reject(error)
				} finally {
					unregister()
				}
			})
		})
	}

	protected postMutate(): void {
		const { context: { settings }, ui } = this
		settings.write().catch(logError)
		ui.update()
	}

	protected abstract snapshot0(): Partial<S>
}
