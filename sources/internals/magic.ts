export const
	MAX_LOCK_PENDING = 1000,
	SAVE_SETTINGS_WAIT = 2,
	// eslint-disable-next-line no-void
	UNDEFINED = void 0

export namespace InternalDOMClasses {
	const NAMESPACE = "obsidian-plugin-library"
	export const
		AWAIT_CSS = `${NAMESPACE}:await-css` as const,
		HIDE_STATUS_BAR = `${NAMESPACE}:hide-status-bar` as const,
		ICON = `${NAMESPACE}:icon` as const
}
