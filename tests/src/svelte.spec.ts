import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { svelteState } from "../../src";

// augment the global object with the $state function so TypeScript will allow it
declare global {
  var $state: unknown;
}

describe("svelteState helper", () => {
  let mockState: Mock;

  beforeEach(() => {
    // each test gets a fresh, strongly-typed mock
    mockState = vi.fn();
    global.$state = mockState;
  });

  afterEach(() => {
    delete global.$state;
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
});
