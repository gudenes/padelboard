import { getBoardStyle, type BoardStyleId } from "./board-styles";
import { DEFAULT_CUSTOM_DESIGN, type CustomBoardDesign } from "./custom-board";

// Start fine-tuning from the selected preset, never from the generic custom palette.
export function editableTemplate(
  id: BoardStyleId,
  accent: string,
): CustomBoardDesign {
  const style = getBoardStyle(id);
  const clay = id === "tour-clay";
  return {
    ...DEFAULT_CUSTOM_DESIGN,
    background: style.background,
    rowBackground: style.row,
    textColor: style.text,
    borderColor: style.border,
    scoreBackground: clay ? accent : style.row,
    scoreTextColor: clay
      ? "#174d3d"
      : id === "tour-premier"
        ? accent
        : style.text,
    pointTextColor:
      id === "tour-fip" ? "#123761" : clay ? "#174d3d" : "#11120f",
    font: clay ? "serif" : "sans",
    fontSize: 17,
    scoreSize: 22,
    rowHeight: 32,
    radius: id === "padelboard" ? 4 : 1,
    logoText: style.name.toUpperCase(),
  };
}
