import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import EventsIndex from "../EventsIndex";

describe("EventsIndex", () => {
  it("renders events hub with marathon ruck card", () => {
    render(<EventsIndex />);

    expect(screen.getByRole("heading", { name: "Events" })).toBeInTheDocument();
    expect(screen.getByText("The Weight We Carry")).toBeInTheDocument();
    expect(screen.getByText("Twice A Month Workout")).toBeInTheDocument();

    const eventLinks = screen.getAllByRole("link", { name: /View Event/i });
    const marathonLink = eventLinks.find(
      (link) => link.getAttribute("href") === "/events/marathon-ruck",
    );

    expect(marathonLink).toBeDefined();
  });
});
