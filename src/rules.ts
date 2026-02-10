import { ALWAYS_REGEX, NEVER_REGEX } from "./magic.js";
import { constant, escapeRegExp, identity } from "lodash-es";
import type { DeepReadonly } from "ts-essentials";
import { EventEmitterLite } from "./util.js";
import { ListModal } from "./modals.js";
import type { PluginContext } from "./plugin.js";
import { normalizePath } from "obsidian";

export type Rule = NormalRule | ErrorRule;
export interface NormalRule {
  readonly type: "-" | "+";
  readonly value: RegExp;
}
export interface ErrorRule {
  readonly type: "error";
  readonly value: unknown;
}

type Rules0 = readonly Rule[];
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Rules extends Rules0 {}
export namespace Rules {
  export function parse(
    strings: readonly string[],
    interpreter = identityInterpreter,
  ): Rules {
    return strings.map((str) => {
      let type: Rule["type"] = "+",
        str2 = str;
      if (str2.startsWith("+")) {
        str2 = str2.slice("+".length);
      } else if (str2.startsWith("-")) {
        type = "-";
        str2 = str2.slice("-".length);
      }
      const [, pattern, flags] =
        /^\/(?<pattern>(?:\\\/|[^/])+)\/(?<flags>[dgimsuvy]*)$/u.exec(str2) ??
        [];
      if (pattern !== void 0 && flags !== void 0) {
        let value = null;
        try {
          value = new RegExp(pattern, flags);
        } catch (error) {
          /* @__PURE__ */ self.console.debug(error);
          return { type: "error", value: error };
        }
        return { type, value };
      }
      return { type, value: interpreter(str2) };
    });
  }

  export function test(rules: Rules, str: string): boolean {
    let ret = false;
    for (const { type, value } of rules) {
      if (type === "error") {
        continue;
      }
      if (type === (ret ? "-" : "+") && value.test(str)) {
        ret = !ret;
      }
    }
    return ret;
  }

  export function identityInterpreter(str: string): RegExp {
    return new RegExp(escapeRegExp(str), "u");
  }

  export function pathInterpreter(str: string): RegExp {
    const path = normalizePath(str);
    return str
      ? path === "/"
        ? ALWAYS_REGEX
        : new RegExp(`^${escapeRegExp(path)}(?:/|$)`, "u")
      : NEVER_REGEX;
  }
}

export class SettingRules<S extends PluginContext.Settings> {
  public rules;
  public readonly onChanged = new EventEmitterLite<readonly []>();

  public constructor(
    protected readonly context: PluginContext<S>,
    protected readonly accessor: (
      setting: DeepReadonly<S>,
    ) => readonly string[],
    protected readonly interpreter?: ((str: string) => RegExp) | undefined,
  ) {
    const {
      context: { settings },
    } = this;
    this.rules = Rules.parse(accessor(settings.value), interpreter);
    context.register(
      settings.onMutate(accessor, async (cur) => {
        this.rules = Rules.parse(cur, interpreter);
        await this.onChanged.emit();
      }),
    );
  }

  public test(str: string): boolean {
    const { rules } = this;
    return Rules.test(rules, str);
  }
}

export function rulesList(
  context: PluginContext,
  data: readonly string[],
  options: ListModal.Options<string> = {},
): ListModal<string> {
  const {
    language: { value: i18n },
  } = context;
  return new ListModal(
    context,
    ListModal.stringInputter<string>({ back: identity, forth: identity }),
    constant(""),
    data,
    {
      description: () => i18n.t("components.rules-list.description"),
      ...options,
    },
  );
}
