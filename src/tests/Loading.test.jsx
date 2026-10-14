import { act, render, renderHook, screen } from "@testing-library/react";
import {
  LoadingStatus,
  MapSkeleton,
  SearchSpinner,
  SkeletonLine,
  useDelayedLoading,
} from "../components/Loading";

describe("useDelayedLoading", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const setup = (initial, delay) =>
    renderHook(({ loading }) => useDelayedLoading(loading, delay), {
      initialProps: { loading: initial },
    });

  it("starts out false", () => {
    const { result } = setup(false);

    expect(result.current).toBe(false);
  });

  it("only turns true after the delay", () => {
    const { result } = setup(true);

    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(199));
    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });

  it("never turns true when loading finishes before the delay", () => {
    const { result, rerender } = setup(true);

    act(() => jest.advanceTimersByTime(100));
    rerender({ loading: false });
    act(() => jest.advanceTimersByTime(1000));

    expect(result.current).toBe(false);
  });

  it("turns false again as soon as loading ends", () => {
    const { result, rerender } = setup(true);

    act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe(true);

    rerender({ loading: false });
    expect(result.current).toBe(false);
  });

  it("honours a custom delay", () => {
    const { result } = setup(true, 500);

    act(() => jest.advanceTimersByTime(499));
    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });
});

describe("loading pieces", () => {
  it("hides decorative skeletons from assistive tech", () => {
    const { container } = render(
      <>
        <SkeletonLine />
        <MapSkeleton />
        <SearchSpinner />
      </>,
    );

    container.querySelectorAll("span, div").forEach((node) => {
      expect(node).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("announces loading through a status region", () => {
    const { rerender } = render(<LoadingStatus isLoading={false} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    rerender(<LoadingStatus isLoading />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading location data",
    );
  });
});
