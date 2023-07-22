import type { LibraryUUIDs } from "./magic.js"
import type { Opaque } from "ts-essentials"
import { Platform as Platform0 } from "obsidian"
import { deepFreeze } from "./util.js"

export namespace Platform {
	export const
		DESKTOP = deepFreeze(["darwin", "desktop", "linux", "win32"]),
		MOBILE = deepFreeze(["android", "ios", "mobile"]),
		ALL = deepFreeze([...DESKTOP, ...MOBILE, "unknown"])
	export type Desktop = typeof DESKTOP[number]
	export type Mobile = typeof MOBILE[number]
	export type All = typeof ALL[number]
	export type Current = Opaque<All, typeof LibraryUUIDs["UUID2"]>
	export const CURRENT = ((): All => {
		if (Platform0.isIosApp) { return "ios" }
		if (Platform0.isAndroidApp) { return "android" }
		if (Platform0.isMacOS) { return "darwin" }
		if (Platform0.isWin) { return "win32" }
		if (Platform0.isLinux) { return "linux" }
		// In case new platforms are added
		if (Platform0.isMobileApp) { return "mobile" }
		if (Platform0.isDesktopApp) { return "desktop" }
		return "unknown"
	})() as Current
}
