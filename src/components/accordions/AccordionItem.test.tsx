import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import userEvent from "@testing-library/user-event";
// utils
import { RouterWrappedComponent } from "../../testing/setupJest";
// components
import { Accordion } from "@chakra-ui/react";
import { AccordionItem } from "./AccordionItem";

const testButtonLabel = "Test";

const accordionItemComponent = (
  <RouterWrappedComponent>
    <Accordion>
      <AccordionItem label={testButtonLabel} />
    </Accordion>
  </RouterWrappedComponent>
);

describe("Test AccordionItem", () => {
  beforeEach(() => {
    render(accordionItemComponent);
  });

  test("AccordionItem is visible", () => {
    expect(
      screen.getByText(testButtonLabel)
    ).toBeVisible();
  });

  test("AccordionItem shows plus sign when closed", () => {
    expect(screen.getByAltText("Expand")).toBeVisible();
    expect(screen.queryByAltText("Collapse")).toBeFalsy();
  });

  test("AccordionItem shows minus sign when open", async () => {
    await userEvent.click(screen.getByAltText("Expand"));
    expect(screen.queryByAltText("Expand")).toBeFalsy();
    expect(screen.getByAltText("Collapse")).toBeVisible();
  });
});

describe("Test AccordionItem accessibility", () => {
  it("Should not have basic accessibility issues", async () => {
    const { container } = render(accordionItemComponent);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
