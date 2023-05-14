import type { LibraryUUIDs } from "./magic.js"
import type { Opaque } from "ts-essentials"
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
	export const CURRENT = ((): All => {
		const { userAgent } = self.navigator
		if (userAgent.includes("like Mac")) {
			return "ios"
		}
		if (userAgent.includes("Android")) {
			return "android"
		}
		if (userAgent.includes("Mac")) {
			return "darwin"
		}
		if (userAgent.includes("Win")) {
			return "win32"
		}
		if (userAgent.includes("Linux") || userAgent.includes("X11")) {
			return "linux"
		}
		return "unknown"
	})() as Current
}
