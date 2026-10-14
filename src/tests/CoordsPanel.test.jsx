import { render, screen } from "@testing-library/react";
import CoordsPanel from "../components/CoordsPanel";

const data = {
  ipAddress: "8.8.8.8",
  cityName: "Mountain View",
  regionName: "California",
  countryName: "US",
  postalCode: "94035",
  timezone: "-07:00",
  asnOrganization: "Google LLC",
};

describe("CoordsPanel", () => {
  it("shows the four labels", () => {
    render(<CoordsPanel data={null} />);

    ["IP Address", "Location", "Timezone", "ISP"].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("renders the lookup result", () => {
    render(<CoordsPanel data={data} />);

    expect(screen.getByText("8.8.8.8")).toBeInTheDocument();
    expect(
      screen.getByText("Mountain View, California, US 94035"),
    ).toBeInTheDocument();
    expect(screen.getByText("UTC -07:00")).toBeInTheDocument();
    expect(screen.getByText("Google LLC")).toBeInTheDocument();
  });

  it("skips missing location parts and the postal code", () => {
    render(
      <CoordsPanel data={{ ...data, regionName: "", postalCode: undefined }} />,
    );

    expect(screen.getByText("Mountain View, US")).toBeInTheDocument();
  });

  it("leaves the timezone empty when the API sends none", () => {
    render(<CoordsPanel data={{ ...data, timezone: "" }} />);

    expect(screen.queryByText(/UTC/)).not.toBeInTheDocument();
  });

  it("shows skeleton bars instead of values while loading", () => {
    const { container } = render(<CoordsPanel data={data} isLoading />);

    expect(screen.getByRole("article", { busy: true })).toBeInTheDocument();
    expect(container.querySelectorAll(".skeleton-line")).toHaveLength(4);
    expect(screen.queryByText("8.8.8.8")).not.toBeInTheDocument();
    expect(screen.queryByText("Google LLC")).not.toBeInTheDocument();
  });

  it("shows the values again once loading is done", () => {
    const { container } = render(<CoordsPanel data={data} isLoading={false} />);

    expect(container.querySelectorAll(".skeleton-line")).toHaveLength(0);
    expect(screen.getByText("8.8.8.8")).toBeInTheDocument();
  });
});
