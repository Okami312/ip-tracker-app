import { act, render, screen } from "@testing-library/react";
import L from "leaflet";
import Map from "../components/Map";

const mockHandler = () => ({ enable: jest.fn(), disable: jest.fn() });
const mockLeafletMap = {
  setView: jest.fn(),
  invalidateSize: jest.fn(),
  getContainer: jest.fn(),
  dragging: mockHandler(),
  touchZoom: mockHandler(),
  doubleClickZoom: mockHandler(),
};

jest.mock("react-leaflet", () => {
  const React = jest.requireActual("react");
  const MapContext = React.createContext(null);
  const h = React.createElement;

  return {
    MapContainer: ({ children, ...props }) =>
      h(
        "div",
        {
          "data-testid": "map-container",
          "data-center": props.center.join(","),
          "data-zoom": props.zoom,
          "data-scroll-wheel-zoom": String(props.scrollWheelZoom),
          className: props.className,
        },
        h(MapContext.Provider, { value: mockLeafletMap }, children),
      ),
    useMap: () => React.useContext(MapContext),
    TileLayer: ({ url, attribution }) =>
      h("div", {
        "data-testid": "tile-layer",
        "data-url": url,
        "data-attribution": attribution,
      }),
    Marker: ({ position, icon, children }) =>
      h(
        "div",
        {
          "data-testid": "marker",
          "data-position": position.join(","),
          "data-icon-class": icon.className,
        },
        children,
      ),
    Popup: ({ children }) => h("div", { "data-testid": "popup" }, children),
  };
});

jest.mock("leaflet", () => ({
  __esModule: true,
  default: { divIcon: jest.fn((options) => options) },
}));

const data = { latitude: 48.85, longitude: 2.35, ipAddress: "8.8.8.8" };

const setPointer = (coarse) => {
  window.matchMedia = jest.fn(() => ({ matches: coarse }));
};

let mapContainer;

beforeEach(() => {
  mapContainer = document.createElement("div");
  document.body.appendChild(mapContainer);
  mockLeafletMap.getContainer.mockReturnValue(mapContainer);
  setPointer(false);
});

afterEach(() => {
  mapContainer.remove();
});

describe("Map rendering", () => {
  it.each([
    ["no data", null],
    ["no latitude", { ...data, latitude: undefined }],
    ["no longitude", { ...data, longitude: undefined }],
    ["null latitude", { ...data, latitude: null }],
    ["null longitude", { ...data, longitude: null }],
  ])("renders nothing for %s", (_, value) => {
    const { container } = render(<Map data={value} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the skeleton while loading without data", () => {
    const { container } = render(<Map data={null} isLoading />);

    expect(container.querySelector(".map-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("map-container")).not.toBeInTheDocument();
  });

  it("centres the map on the coordinates", () => {
    render(<Map data={data} />);
    const map = screen.getByTestId("map-container");

    expect(map).toHaveAttribute("data-center", "48.85,2.35");
    expect(map).toHaveAttribute("data-zoom", "13");
    expect(map).toHaveAttribute("data-scroll-wheel-zoom", "false");
    expect(map).toHaveClass("leaflet-container");
  });

  it.each([
    ["the equator", { ...data, latitude: 0 }, "0,2.35"],
    ["the prime meridian", { ...data, longitude: 0 }, "48.85,0"],
    ["null island", { ...data, latitude: 0, longitude: 0 }, "0,0"],
  ])("renders the map for a location on %s", (_, value, center) => {
    render(<Map data={value} />);

    expect(screen.getByTestId("map-container")).toHaveAttribute(
      "data-center",
      center,
    );
    expect(screen.getByTestId("marker")).toBeInTheDocument();
  });

  it("loads OpenStreetMap tiles with attribution", () => {
    render(<Map data={data} />);
    const tiles = screen.getByTestId("tile-layer");

    expect(tiles).toHaveAttribute(
      "data-url",
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    );
    expect(tiles.getAttribute("data-attribution")).toContain("OpenStreetMap");
  });

  it("puts a marker with an IP popup on the coordinates", () => {
    render(<Map data={data} />);

    expect(screen.getByTestId("marker")).toHaveAttribute(
      "data-position",
      "48.85,2.35",
    );
    expect(screen.getByTestId("popup")).toHaveTextContent("IP: 8.8.8.8");
  });

  it("anchors the pin by its tip using the SVG's real size", () => {
    render(<Map data={data} />);

    expect(L.divIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        className: "leaflet-icon",
        iconSize: [46, 56],
        iconAnchor: [23, 56],
        popupAnchor: [0, -66],
        html: expect.stringContaining("test-file-stub"),
      }),
    );
  });

  it("shows the skeleton over an existing map while loading", () => {
    const { container } = render(<Map data={data} isLoading />);

    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(container.querySelector(".map-skeleton")).toBeInTheDocument();
  });

  it("shows no skeleton once loading is done", () => {
    const { container } = render(<Map data={data} isLoading={false} />);

    expect(container.querySelector(".map-skeleton")).not.toBeInTheDocument();
  });
});

describe("Map view syncing", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("moves the view to the coordinates at zoom 13", () => {
    render(<Map data={data} />);

    expect(mockLeafletMap.setView).toHaveBeenCalledWith([48.85, 2.35], 13);
  });

  it("recalculates the map size after mount and on window resize", () => {
    render(<Map data={data} />);
    expect(mockLeafletMap.invalidateSize).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(0));
    expect(mockLeafletMap.invalidateSize).toHaveBeenCalledTimes(1);

    act(() => window.dispatchEvent(new Event("resize")));
    expect(mockLeafletMap.invalidateSize).toHaveBeenCalledTimes(2);
  });

  it("stops listening for resize after unmount", () => {
    const { unmount } = render(<Map data={data} />);
    act(() => jest.advanceTimersByTime(0));
    mockLeafletMap.invalidateSize.mockClear();

    unmount();
    window.dispatchEvent(new Event("resize"));

    expect(mockLeafletMap.invalidateSize).not.toHaveBeenCalled();
  });

  it("cancels the pending size update on unmount", () => {
    const { unmount } = render(<Map data={data} />);

    unmount();
    act(() => jest.advanceTimersByTime(0));

    expect(mockLeafletMap.invalidateSize).not.toHaveBeenCalled();
  });
});

describe("tap to activate", () => {
  const handlers = () => [
    mockLeafletMap.dragging,
    mockLeafletMap.touchZoom,
    mockLeafletMap.doubleClickZoom,
  ];

  it("leaves the map interactive for a mouse pointer", () => {
    setPointer(false);
    render(<Map data={data} />);

    handlers().forEach((handler) => {
      expect(handler.disable).not.toHaveBeenCalled();
      expect(handler.enable).not.toHaveBeenCalled();
    });
    expect(mapContainer).not.toHaveClass("map-inactive");
  });

  it("locks the map until it is tapped on a touch device", () => {
    setPointer(true);
    render(<Map data={data} />);

    handlers().forEach((handler) => {
      expect(handler.disable).toHaveBeenCalledTimes(1);
    });
    expect(mapContainer).toHaveClass("map-inactive");
  });

  it("unlocks the map when it is tapped", () => {
    setPointer(true);
    render(<Map data={data} />);

    act(() => {
      mapContainer.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    handlers().forEach((handler) => {
      expect(handler.enable).toHaveBeenCalledTimes(1);
    });
    expect(mapContainer).not.toHaveClass("map-inactive");
  });

  it("locks the map again when something outside is touched", () => {
    setPointer(true);
    render(<Map data={data} />);
    act(() => {
      mapContainer.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    handlers().forEach((handler) => handler.disable.mockClear());

    act(() => {
      document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });

    handlers().forEach((handler) => {
      expect(handler.disable).toHaveBeenCalledTimes(1);
    });
    expect(mapContainer).toHaveClass("map-inactive");
  });

  it("stays unlocked when the touch is inside the map", () => {
    setPointer(true);
    render(<Map data={data} />);
    const inner = document.createElement("span");
    mapContainer.appendChild(inner);
    act(() => {
      mapContainer.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    handlers().forEach((handler) => handler.disable.mockClear());

    act(() => {
      inner.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });

    handlers().forEach((handler) => {
      expect(handler.disable).not.toHaveBeenCalled();
    });
    expect(mapContainer).not.toHaveClass("map-inactive");
  });

  it("removes its listeners on unmount", () => {
    setPointer(true);
    const { unmount } = render(<Map data={data} />);
    handlers().forEach((handler) => {
      handler.enable.mockClear();
      handler.disable.mockClear();
    });

    unmount();
    mapContainer.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));

    handlers().forEach((handler) => {
      expect(handler.enable).not.toHaveBeenCalled();
      expect(handler.disable).not.toHaveBeenCalled();
    });
  });
});
