import { wait } from "../utils/wait";

describe("wait", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("resolves immediately for zero or negative durations", async () => {
    const controller = new AbortController();

    await expect(wait(0, controller.signal)).resolves.toBeUndefined();
    await expect(wait(-50, controller.signal)).resolves.toBeUndefined();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("resolves once the duration has passed", async () => {
    const done = jest.fn();
    wait(500, new AbortController().signal).then(done);

    await jest.advanceTimersByTimeAsync(499);
    expect(done).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalled();
  });

  it("rejects with an AbortError and clears the timer when aborted", async () => {
    const controller = new AbortController();
    const promise = wait(500, controller.signal);

    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(jest.getTimerCount()).toBe(0);
  });
});
