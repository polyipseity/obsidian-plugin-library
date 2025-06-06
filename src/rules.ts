import { ALWAYS_REGEX, NEVER_REGEX } from "./magic.js"
import { constant, escapeRegExp, identity } from "lodash-es"
import type { DeepReadonly } from "ts-essentials"
import { EventEmitterLite } from "./util.js"
import { ListModal } from "./modals.js"
import type { PluginContext } from "./plugin.js"
import { normalizePath } from "obsidian"

export interface Rule {
	readonly op: "-" | "+"
	readonly value: RegExp
}

type Rules0 = readonly Rule[]
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Rules extends Rules0 { }
export namespace Rules {
	export function parse(
		strs: readonly string[],
		interpreter = identityInterpreter,
	): Rules {
		return strs.map(str => {
			let op: Rule["op"] = "+",
				str2 = str
			if (str2.startsWith("+")) {
				str2 = str2.slice("+".length)
			} else if (str2.startsWith("-")) {
				op = "-"
				str2 = str2.slice("-".length)
			}
			const [, pattern, flags] =
				(/^\/(?<pattern>(?:\\\/|[^/])+)\/(?<flags>[dgimsuvy]*)$/u)
					.exec(str2) ?? []
			if (pattern !== void 0 && flags !== void 0) {
				return { op, value: new RegExp(pattern, flags) }
			}
			return { op, value: interpreter(str2) }
		})
	}

	export function test(rules: Rules, str: string): boolean {
		let ret = false
		for (const { op, value } of rules) {
			if (op === (ret ? "-" : "+") && value.test(str)) { ret = !ret }
		}
		return ret
	}

	export function identityInterpreter(str: string): RegExp {
		return new RegExp(escapeRegExp(str), "u")
	}

	export function pathInterpreter(str: string): RegExp {
		const path = normalizePath(str)
		return str
			? path === "/"
				? ALWAYS_REGEX
				: new RegExp(
					`^${escapeRegExp(path)}(?:/|$)`,
					"u",
				)
			: NEVER_REGEX
	}
}

export class SettingRules<S extends PluginContext.Settings> {
	public rules
	public readonly onChanged = new EventEmitterLite<readonly []>()

	public constructor(
		protected readonly context: PluginContext<S>,
		protected readonly accessor: (
			setting: DeepReadonly<S>,
		) => readonly string[],
		protected readonly intepreter?: ((str: string) => RegExp) | undefined,
	) {
		const { context: { settings } } = this
		this.rules = Rules.parse(accessor(settings.value), intepreter)
		context.register(settings.onMutate(
			accessor,
			async cur => {
				this.rules = Rules.parse(cur, intepreter)
				await this.onChanged.emit()
			},
		))
	}

	public test(str: string): boolean {
		const { rules } = this
		return Rules.test(rules, str)
	}
}

export function rulesList(
	context: PluginContext,
	data: readonly string[],
	options: ListModal.Options<string> = {},
): ListModal<string> {
	const { language: { value: i18n } } = context
	return new ListModal(
		context,
		ListModal.stringInputter<string>({ back: identity, forth: identity }),
		constant(""),
		data,
		{
			description: () => i18n.t("components.rules-list.description"),
			...options,
		},
	)
}
