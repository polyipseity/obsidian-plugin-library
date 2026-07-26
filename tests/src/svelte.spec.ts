import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { svelteState } from "../../src/index.js";

describe("svelteState helper", () => {
  let mockState: Mock;

  beforeEach(() => {
    // each test gets a fresh, strongly-typed mock
    mockState = vi.fn();
    vi.stubGlobal("$state", mockState);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("calls $state with the given value and returns its result", () => {
    mockState.mockReturnValue("returned");

    const result = svelteState<string>("hello");
    expect(mockState).toHaveBeenCalledWith("hello");
    expect(result).toBe("returned");
  });

  it("reads and returns the current value when called without args", () => {
    mockState.mockReturnValue(123);

    const result = svelteState<number>();
    expect(mockState).toHaveBeenCalledWith();
    expect(result).toBe(123);
  });

  it("distinguishes an explicit undefined write from a read", () => {
    // when `undefined` is intentionally stored we still expect `$state` to be
    // invoked with that value rather than being called with no arguments.
    mockState.mockReturnValue("ok");

    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- svelteState<undefined> returns void, assigned intentionally
    const result = svelteState<undefined>(undefined);
    expect(mockState).toHaveBeenCalledWith(undefined);
    expect(result).toBe("ok");
  });
});
