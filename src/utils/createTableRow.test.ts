import { createTableRow } from "./createTableRow";

describe("createTableRow", () => {
  it("should create a table row with default options", () => {
    const type = "Type";
    const total = "Total";
    const percentage = "50%";
    const result = createTableRow(type, total, percentage);
    expect(result).toEqual({
      type: "TableRow",
      cells: [
        {
          type: "TableCell",
          items: [
            {
              type: "TextBlock",
              text: type,
              wrap: true,
            },
          ],
        },
        {
          type: "TableCell",
          items: [
            {
              type: "TextBlock",
              text: total,
              wrap: true,
            },
          ],
        },
        {
          type: "TableCell",
          items: [
            {
              type: "TextBlock",
              text: percentage,
              wrap: true,
            },
          ],
        },
      ],
    });
  });

  it("should create a table row with custom style", () => {
    const type = "Type";
    const total = "Total";
    const percentage = "50%";
    const style = "attention";
    const result = createTableRow(type, total, percentage, { style });
    expect(result.cells[0].style).toEqual(style);
  });

  it("should create a table row with subtle text", () => {
    const type = "Type";
    const total = "Total";
    const percentage = "50%";
    const result = createTableRow(type, total, percentage, { isSubtle: true });
    expect(result.cells[0].items[0].isSubtle).toBe(true);
    expect(result.cells[1].items[0].isSubtle).toBe(true);
    expect(result.cells[2].items[0].isSubtle).toBe(true);
  });

  it("should create a table row with bold text", () => {
    const type = "Type";
    const total = "Total";
    const percentage = "50%";
    const result = createTableRow(type, total, percentage, { weight: "Bolder" });
    expect(result.cells[0].items[0].weight).toBe("Bolder");
    expect(result.cells[1].items[0].weight).toBe("Bolder");
    expect(result.cells[2].items[0].weight).toBe("Bolder");
  });
});