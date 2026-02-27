import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import MarathonRuckEvent from "../MarathonRuckEvent";

describe("MarathonRuckEvent", () => {
  it("renders key sections and tracked registration link", () => {
    render(<MarathonRuckEvent />);

    expect(screen.getByText("The Weight We Carry")).toBeInTheDocument();
    expect(screen.getByText("Why We Ruck")).toBeInTheDocument();
    expect(screen.getByText("Event Specs")).toBeInTheDocument();
    expect(screen.getByText("Partner with the Mission")).toBeInTheDocument();

    const registerLinks = screen.getAllByRole("link", { name: /Register on SweatPals/i });
    const href = registerLinks[0].getAttribute("href") || "";

    expect(href).toContain("utm_source=men-at-gate");
    expect(href).toContain("utm_medium=website");
    expect(href).toContain("utm_campaign=marathon_ruck_2026");
  });
});
