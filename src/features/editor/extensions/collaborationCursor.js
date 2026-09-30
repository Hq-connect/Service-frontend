import { Extension } from "@domternal/core";
import { yCursorPlugin, yCursorPluginKey } from "y-prosemirror";

export { yCursorPluginKey };

/**
 * Creates a Notion-grade cursor DOM element with user badge, dot indicator, and arrow
 */
export const createNotionCursorBuilder = (user) => {
  const color = user?.color || "#0b6e99";
  const name = user?.name || "Collaborator";

  const cursor = document.createElement("span");
  cursor.classList.add("ProseMirror-yjs-cursor");
  cursor.setAttribute("style", `border-left: 2px solid ${color} !important; border-color: ${color} !important;`);

  // The floating badge above the cursor
  const badge = document.createElement("div");
  badge.classList.add("yjs-cursor-badge", "yjs-cursor-badge--visible");
  badge.setAttribute("style", `background-color: ${color} !important;`);

  // Pulsing white dot indicator
  const dot = document.createElement("span");
  dot.classList.add("yjs-cursor-dot");
  badge.appendChild(dot);

  // User name text
  const nameSpan = document.createElement("span");
  nameSpan.textContent = name;
  badge.appendChild(nameSpan);

  // Downward pointing arrow caret
  const arrow = document.createElement("span");
  arrow.classList.add("yjs-cursor-arrow");
  arrow.setAttribute("style", `border-top: 3px solid ${color} !important; border-top-color: ${color} !important;`);
  badge.appendChild(arrow);

  cursor.appendChild(badge);

  // Fade badge out after 3.5s of inactivity
  setTimeout(() => {
    badge.classList.remove("yjs-cursor-badge--visible");
  }, 3500);

  return cursor;
};

/**
 * Creates a selection decoration with the user's color
 */
export const createNotionSelectionBuilder = (user) => {
  const color = user?.color || "#0b6e99";
  return {
    style: `background-color: ${color}33 !important;`,
    class: "ProseMirror-yjs-selection",
  };
};

/**
 * Creates the Domternal Extension for Yjs Collaboration Cursors
 */
export function createCollaborationCursorExtension(getAwareness, getUserId) {
  return Extension.create({
    name: "collaborationCursor",

    addProseMirrorPlugins() {
      const awareness = typeof getAwareness === "function" ? getAwareness() : getAwareness;
      if (!awareness) return [];

      return [
        yCursorPlugin(awareness, {
          cursorBuilder: (user, clientId) => createNotionCursorBuilder(user, clientId),
          selectionBuilder: (user, clientId) => createNotionSelectionBuilder(user),
          awarenessStateFilter: (currentClientId, userClientId, aw) => {
            if (currentClientId === userClientId) return false;
            return Boolean(aw && aw.user);
          },
        }),
      ];
    },
  });
}

export const CollaborationCursor = {
  configure({ getAwareness, getUserId }) {
    return createCollaborationCursorExtension(getAwareness, getUserId);
  },
};

export default CollaborationCursor;
