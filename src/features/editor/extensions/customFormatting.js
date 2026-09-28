import { Extension, wrappingInputRule } from "@domternal/core";

/**
 * Custom extension that enhances heading, paragraph, and block formatting:
 * 1. WITH "/" commands: ensures "Text" (Paragraph) and aliases (/p, /text, /normal) appear in slash suggestions
 * 2. WITHOUT "/" commands: adds markdown triggers (e.g. "[] " for task lists, "> " for blockquotes)
 * 3. WITHOUT "/" commands: adds keyboard hotkeys:
 *    - Ctrl+Alt+0: Paragraph
 *    - Ctrl+Alt+1: Heading 1
 *    - Ctrl+Alt+2: Heading 2
 *    - Ctrl+Alt+3: Heading 3
 *    - Ctrl+Shift+8: Bullet List
 *    - Ctrl+Shift+7: Numbered List
 *    - Ctrl+Shift+9: To-do / Task List
 *    - Ctrl+Shift+.: Quote / Callout
 */
export const CustomFormatting = Extension.create({
  name: "customFormatting",

  addFloatingMenuItems() {
    return [
      {
        name: "paragraph",
        label: "Text",
        description: "Just start writing with plain text",
        icon: "textT",
        group: "Basic",
        priority: 250,
        keywords: ["p", "paragraph", "text", "normal", "plain", "body"],
        shortcut: "",
        command: "setParagraph",
      },
    ];
  },

  addInputRules() {
    const rules = [];

    // Auto-convert "[ ] " or "[] " to TaskList checkbox item
    if (this.editor?.schema?.nodes?.taskList) {
      rules.push(
        wrappingInputRule({
          find: /^\s*(\[ \]|\[\])\s$/,
          type: this.editor.schema.nodes.taskList,
        })
      );
    }

    // Auto-convert "> " to Blockquote
    if (this.editor?.schema?.nodes?.blockquote) {
      rules.push(
        wrappingInputRule({
          find: /^\s*>\s$/,
          type: this.editor.schema.nodes.blockquote,
        })
      );
    }

    return rules;
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-0": () => {
        return this.editor?.commands?.setParagraph?.() ?? false;
      },
      "Mod-Alt-1": () => {
        return this.editor?.commands?.toggleHeading?.({ level: 1 }) ?? false;
      },
      "Mod-Alt-2": () => {
        return this.editor?.commands?.toggleHeading?.({ level: 2 }) ?? false;
      },
      "Mod-Alt-3": () => {
        return this.editor?.commands?.toggleHeading?.({ level: 3 }) ?? false;
      },
      "Mod-Shift-8": () => {
        return this.editor?.commands?.toggleBulletList?.() ?? false;
      },
      "Mod-Shift-7": () => {
        return this.editor?.commands?.toggleOrderedList?.() ?? false;
      },
      "Mod-Shift-9": () => {
        return this.editor?.commands?.toggleTaskList?.() ?? false;
      },
      "Mod-Shift-.": () => {
        return this.editor?.commands?.toggleBlockquote?.() ?? false;
      },
    };
  },
});

export default CustomFormatting;
