import { expect, it } from "vitest";
import { editableTemplate } from "../template-design";
import { BOARD_STYLES } from "../board-styles";
import { parseBoardEdit } from "../board-edit";
it.each(BOARD_STYLES.filter((s) => s.id !== "custom"))(
  "fine-tunes $name with its palette and persists through board editing",
  (style) => {
    const design = editableTemplate(style.id, style.accent);
    expect(design.background).toBe(style.background);
    expect(design.rowBackground).toBe(style.row);
    expect(design.textColor).toBe(style.text);
    const saved = parseBoardEdit({
      template: "custom",
      accent: style.accent,
      tournamentName: "Club final",
      position: "top-left",
      scale: 1,
      showTimer: false,
      customDesign: { ...design, showHeader: false, width: 340 },
    });
    expect(saved.customDesign?.showHeader).toBe(false);
    expect(saved.customDesign?.width).toBe(340);
    expect(saved.customDesign?.background).toBe(style.background);
  },
);
