import React, { useMemo } from "react";
import {
  useEditor,
  DomternalBubbleMenu,
  DomternalFloatingMenu,
  DomternalNotionColorPicker,
} from "@domternal/react";
import {
  StarterKit,
  Placeholder,
  UniqueID,
  TextStyle,
  TextColor,
  Highlight,
  BlockColor,
  NotionColorPicker,
  ListIndent,
} from "@domternal/core";
import {
  BlockHandle,
  BlockContextMenu,
  SlashCommand,
  SmartPaste,
  KeyboardReorder,
} from "@domternal/extension-block-controls";
import { TableOfContents, FloatingTocOutline } from "@domternal/extension-toc";
import "@domternal/theme";

// Extensions configured per Domternal Notion-style tutorial Step 1 - Step 6
const extensions = [
  StarterKit,
  UniqueID,
  Placeholder.configure({
    placeholder: ({ node }) =>
      node.type.name === "paragraph" ? "Press '/' for commands..." : "",
  }),
  TextStyle,
  TextColor,
  Highlight,
  BlockColor,
  NotionColorPicker,
  ListIndent,
  BlockHandle.configure({ nested: true }),
  BlockContextMenu,
  SlashCommand,
  SmartPaste,
  KeyboardReorder,
  TableOfContents,
  FloatingTocOutline.configure({ anchor: "viewport" }),
];

const DEFAULT_CONTENT = `
  <h1>HQ Product Architecture</h1>
  <p>Welcome to the <strong>HQ Notion-style collaborative editor</strong>. Type <code>/</code> anywhere on a new line to browse commands, or hover on the left margin to grab the 6-dot drag handle.</p>
  
  <h2>Core Modules</h2>
  <ul data-type="taskList">
    <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Document editor engine with Domternal block controls</p></div></li>
    <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Slash commands menu (headings, lists, quotes, tables)</p></div></li>
    <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Multi-level nested drag-and-drop block reordering</p></div></li>
    <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Real-time collaboration via HQ real-time socket server</p></div></li>
    <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Workspace permissions and inline discussions</p></div></li>
  </ul>

  <h2>Key Features</h2>
  <ul>
    <li><strong>Block-based flexibility</strong>: Hover over any block to reorder, delete, or turn into another type.</li>
    <li><strong>Floating Bubble Menu</strong>: Select any text to toggle Bold, Italic, Code, Link, and color styles.</li>
    <li><strong>Floating Outline</strong>: Move your cursor to the right edge to view the table of contents.</li>
  </ul>

  <blockquote>
    <p>“Simplicity is prerequisite for reliability.” — Edsger W. Dijkstra</p>
  </blockquote>

  <p>Start writing your thoughts below...</p>
`;

export default function NotionEditor({ content = DEFAULT_CONTENT, onChange }) {
  const { editor, editorRef } = useEditor({
    extensions,
    content,
    onUpdate: ({ editor: currentEditor }) => {
      if (onChange) {
         console.log("editor", editor);
        onChange(currentEditor.getHTML(), currentEditor.getJSON());
      }
    },
  });
  
  return (
    <div className="relative w-full min-h-[calc(100vh-120px)] px-6 sm:px-12 md:px-16 lg:px-24 py-8">
      {/* 
        In Domternal Notion mode, the drag handle sits ~44px (2.75rem) to the left of the content column.
        The wrapper must provide sufficient gutter padding and not clip with overflow-hidden.
      */}
      <div className="dm-editor dm-notion-mode max-w-4xl mx-auto focus:outline-none">
        <div ref={editorRef} />

        {editor && (
          <>
            {/* Inline selection bubble menu */}
            <DomternalBubbleMenu editor={editor} />

            {/* Notion-style "+" button popup menu (explicit trigger via handle) */}
            <DomternalFloatingMenu editor={editor} requireExplicitTrigger />

            {/* Notion 9-color palette picker */}
            <DomternalNotionColorPicker editor={editor} />
          </>
        )}
      </div>
    </div>
  );
}
