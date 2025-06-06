import type { LibraryUUIDs } from "./magic.js"
import type { Opaque } from "ts-essentials"
import { Platform as Platform0 } from "obsidian"
import { deepFreeze } from "./util.js"

export namespace Platform {
	export const
		DESKTOP = deepFreeze(["darwin", "linux", "win32"]),
		MOBILE = deepFreeze(["android", "ios"]),
		ALL = deepFreeze([...DESKTOP, ...MOBILE, "unknown"])
	export type Desktop = typeof DESKTOP[number]
	export type Mobile = typeof MOBILE[number]
	export type All = typeof ALL[number]
	export type Current = Opaque<All, typeof LibraryUUIDs["UUID2"]>
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	export const CURRENT = ((): All => {
		if (Platform0.isIosApp) {
			return "ios"
		}
		if (Platform0.isAndroidApp) {
			return "android"
		}
		if (Platform0.isDesktopApp) {
			const { userAgent } = self.navigator
			if (userAgent.includes("Mac")) {
				return "darwin"
			}
			if (userAgent.includes("Win")) {
				return "win32"
			}
			if (userAgent.includes("Linux") || userAgent.includes("X11")) {
				return "linux"
			}
		}
		return "unknown"
	})() as Current
}
