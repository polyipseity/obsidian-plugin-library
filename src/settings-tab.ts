import { EditDataModal, ListModal } from "./modals.js"
import { LambdaComponent, UpdatableUI } from "./obsidian.js"
import { SettingsManager, StorageSettingsManager } from "./settings.js"
import {
	activeSelf,
	cloneAsWritable,
	createChildElement,
	createDocumentFragment,
	deepFreeze,
	unexpected,
} from "./util.js"
import { identity, isEmpty } from "lodash-es"
import {
	linkSetting,
	resetButton,
	setTextToEnum,
	setTextToNumber,
} from "./settings-widgets.js"
import { DOMClasses } from "./magic.js"
import type { DeepReadonly } from "ts-essentials"
import type { Fixer } from "./fixers.js"
import type { PluginContext } from "./plugin.js"
import { PluginSettingTab } from "obsidian"
import type { ReadonlyTuple } from "./types.js"

export abstract class AdvancedSettingTab<S extends PluginContext
	.Settings> extends PluginSettingTab {
	protected readonly ui = new UpdatableUI()
	#onMutate

	public constructor(protected readonly context: PluginContext<S>) {
		super(context.app, context)
		this.#onMutate = this.snapshot()
		Promise.resolve()
			.then(() => {
				context.addChild(new LambdaComponent(
					() => { this.onLoad() },
					() => { this.onUnload() },
				))
			})
			.catch((error: unknown) => {
				activeSelf(this.containerEl).console.error(error)
			})
	}

	public display(): void {
		this.#onMutate = this.snapshot()
		this.ui.update()
	}

	protected onLoad(): void {
		const { context: { language: { onChangeLanguage } }, ui } = this
		ui.finally(onChangeLanguage.listen(() => { ui.update() }))
	}

	protected onUnload(): void {
		this.ui.destroy()
	}

	protected newSectionWidget(
		text: () => DocumentFragment | string,
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		heading: 1 | 2 | 3 | 4 | 5 | 6 = 2,
	): void {
		const { containerEl, ui } = this
		ui.new(() => createChildElement(containerEl, `h${heading}`), ele => {
			const text0 = text()
			ele.replaceChildren(typeof text0 === "string"
				? createDocumentFragment(ele.ownerDocument, frag2 => {
					frag2.textContent = text0
				})
				: text0)
		}, ele => { ele.remove() })
	}

	protected newTitleWidget(): void {
		const { context } = this
		this.newSectionWidget(() => context.displayName(), 1)
	}

	protected newDescriptionWidget(): void {
		const { context: { language: { value: i18n } }, containerEl, ui } = this
		ui.new(() => createChildElement(containerEl, "div"), ele => {
			ele.classList.add(DOMClasses.SETTING_ITEM)
			ele.textContent = i18n.t("settings.description")
		}, ele => { ele.remove() })
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
				context: { settings, language: { value: i18n } },
			} = this,
			langs = deepFreeze(["", ...languages.filter(Boolean)])
		ui.newSetting(containerEl, setting => {
			setting
				.setName(i18n.t("settings.language"))
				.setDesc(i18n.t("settings.language-description"))
				.addDropdown(linkSetting(
					(): string => settings.value.language,
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
			context: { localSettings, settings, language: { value: i18n } },
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
								settings.value,
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
								[
									...StorageSettingsManager.getRecovery(
										localSettings.value.recovery,
										SettingsManager.RECOVERY_PREFIX,
									).entries(),
								],
								{
									callback: async (recovery0): Promise<void> => {
										await localSettings.mutate(lsm => {
											StorageSettingsManager.setRecovery(
												lsm.recovery,
												SettingsManager.RECOVERY_PREFIX,
												new Map(recovery0),
											)
										})
										this.postMutate(true)
									},
									editables: ["remove"],
									namer: (value): string => value[0],
									title: (): string =>
										i18n.t("settings.all-settings-actions.recover"),
								},
							).open()
						})
					if (!isEmpty(StorageSettingsManager.getRecovery(
						localSettings.value.recovery,
						SettingsManager.RECOVERY_PREFIX,
					))) { button.setCta() }
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
							}).catch((error: unknown) => {
								activeSelf(component.buttonEl).console.error(error)
							})
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
			context: { settings, language: { value: i18n } },
			ui,
		} = this
		ui.newSetting(containerEl, setting => {
			setting
				.setName(i18n.t("settings.notice-timeout"))
				.setDesc(i18n.t("settings.notice-timeout-description"))
				.addText(linkSetting(
					() => settings.value.noticeTimeout.toString(),
					setTextToNumber(async value => settings.mutate(settingsM => {
						settingsM.noticeTimeout = value
					})),
					() => { this.postMutate() },
					{
						post(component) {
							component.inputEl.type = "number"
						},
					},
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
						() => settings.value.errorNoticeTimeout.toString(),
						setTextToNumber(async value => settings.mutate(settingsM => {
							settingsM.errorNoticeTimeout = value
						})),
						() => { this.postMutate() },
						{
							post(component) {
								component.inputEl.type = "number"
							},
						},
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
			const unregister = settings.onMutate(identity, () => {
				try {
					resolve(snapshot)
				} catch (error) {
					// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
					reject(error)
				} finally {
					unregister()
				}
			})
		})
	}

	protected postMutate(local = false): void {
		const { containerEl, context: { localSettings, settings }, ui } = this;
		(local ? localSettings : settings).write().catch((error: unknown) => {
			activeSelf(containerEl).console.error(error)
		})
		ui.update()
	}

	protected abstract snapshot0(): Partial<S>
}
