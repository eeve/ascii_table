import AsciiTable from "./mod.ts";
import { assert } from "./deps.ts";

function calculateRenderedLength(arr: string[]): number {
  return arr.reduce((cum, cur) => {
    cum += cur.length + 2;
    return cum;
  }, arr.length + 1);
}

Deno.test("Basic", () => {
  const table = new AsciiTable();
  const baseRow = ["one", "two", "three"];
  // Add a single row.
  table.addRow(baseRow);
  // Total row length
  const totalRowLength = calculateRenderedLength(baseRow);
  // turn the table into rows.
  const rows = table.render().split("\n");
  // Ensure that all rows are equal in length
  rows.forEach((row, i) => {
    assert.assertEquals(
      row.length,
      totalRowLength,
      `Row ${i} doesn't have the correct length in the table.`,
    );
  });

  baseRow.forEach((value) => {
    assert.assertStringIncludes(rows[1], `| ${value} |`);
  });
});

Deno.test("With Headers", () => {
  console.info("hello there");
  const table = new AsciiTable();
  const row1 = ["one", "two", "three"];
  const row2 = ["four", "five", "six"];
  const heading = ["head1", "head2", "head3"];

  const maxLength = Math.max(
    calculateRenderedLength(row1),
    calculateRenderedLength(row2),
    calculateRenderedLength(heading),
  );

  table.setHeading(heading);
  table.addRow(row1);
  table.addRow(row2);

  const output = table.render().split("\n");

  output.forEach((row) => {
    assert.assertEquals(row.length, maxLength);
  });

  assert.assertEquals(output.length, 6); // 6 is 3 rows we add + 3 rows to make the table
});
