import { Extension } from "@domternal/core";
import { Plugin, PluginKey } from "@domternal/pm/state";
import { Decoration, DecorationSet } from "@domternal/pm/view";

export const yCursorPluginKey = new PluginKey("yjs-cursor-plugin");

/**
 * Creates a Notion-grade cursor DOM element with user badge, dot indicator, and arrow
 */
export const createNotionCursorBuilder = (user) => {
  const color = user?.color || "#0b6e99";
  const name = user?.name || "Collaborator";

  const cursor = document.createElement("span");
  cursor.classList.add("ProseMirror-yjs-cursor");
  cursor.style.borderColor = color;

  // The floating badge above the cursor — shows briefly then fades
  const badge = document.createElement("div");
  badge.classList.add("yjs-cursor-badge");
  badge.style.backgroundColor = color;

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
  arrow.style.borderTopColor = color;
  badge.appendChild(arrow);

  cursor.appendChild(badge);

  // Show the badge, then fade it out after 2s of inactivity
  // Re-shows whenever the cursor position changes (new element is created)
  requestAnimationFrame(() => {
    badge.classList.add("yjs-cursor-badge--visible");
    clearTimeout(badge._hideTimer);
    badge._hideTimer = setTimeout(() => {
      badge.classList.remove("yjs-cursor-badge--visible");
    }, 2000);
  });

  return cursor;
};

/**
 * Creates a selection decoration with the user's color
 */
export const createNotionSelectionBuilder = (user) => {
  const color = user?.color || "#0b6e99";
  return {
    style: `background-color: ${color}33;`,
    class: "ProseMirror-yjs-selection",
  };
};

/**
 * Builds ProseMirror decorations from Yjs awareness states
 */
export function buildCursorDecorations(doc, awareness, options = {}) {
  if (!awareness || !doc) return DecorationSet.empty;

  const decorations = [];
  const localClientId = awareness.clientID;
  const currentUserId =
    typeof options.getUserId === "function" ? options.getUserId() : options.currentUserId;
  const states = awareness.getStates();
  const docSize = doc.content.size;

  // Group by user identity to only render 1 cursor per real person (prevent duplicate ghost cursors)
  const userClients = new Map();

  states.forEach((clientState, clientId) => {
    if (clientId === localClientId) return;
    if (!clientState || !clientState.cursor || !clientState.user) return;

    // Filter out our own user identity (prevent showing self cursor if reconnecting/multiple tabs)
    const peerUserId = clientState.user._id || clientState.user.id;
    if (currentUserId && peerUserId && peerUserId === currentUserId) return;

    const userKey = peerUserId || clientState.user.email || `client-${clientId}`;
    // Store latest state for this user
    userClients.set(userKey, { clientState, clientId });
  });

  userClients.forEach(({ clientState, clientId }) => {
    const { anchor, head } = clientState.cursor;
    if (typeof head !== "number") return;

    // Clamp head to valid document text range: pos 0 is outside root textblock in ProseMirror
    const minPos = docSize > 1 ? 1 : 0;
    const maxPos = docSize > 1 ? docSize - 1 : docSize;
    const clampedHead = Math.max(minPos, Math.min(head, maxPos));
    const user = clientState.user;

    // 1. Cursor caret with name flag / indicator
    // side: -1 anchors the widget just before the character so it doesn't jump
    // when adjacent text is inserted or deleted
    decorations.push(
      Decoration.widget(
        clampedHead,
        () => (options.cursorBuilder || createNotionCursorBuilder)(user, clientId),
        {
          key: `cursor-${clientId}`,
          side: -1,
        }
      )
    );

    // 2. Selection highlight (if selection range is active)
    if (typeof anchor === "number" && anchor !== head) {
      const clampedAnchor = Math.max(minPos, Math.min(anchor, maxPos));
      const from = Math.min(clampedAnchor, clampedHead);
      const to = Math.max(clampedAnchor, clampedHead);
      if (from < to) {
        const selProps = (options.selectionBuilder || createNotionSelectionBuilder)(user);
        decorations.push(
          Decoration.inline(
            from,
            to,
            {
              class: selProps.class || "ProseMirror-yjs-selection",
              style: selProps.style || `background-color: ${user.color || "#0b6e99"}33;`,
            },
            {
              key: `sel-${clientId}`,
            }
          )
        );
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Custom ProseMirror Plugin connecting Yjs Awareness to ProseMirror Decorations
 */
export function createYjsCursorPlugin(initialAwareness, options = {}) {
  const resolveAwareness = () => {
    if (typeof options.getAwareness === "function") {
      const a = options.getAwareness();
      if (a) return a;
    }
    if (typeof initialAwareness === "function") {
      const a = initialAwareness();
      if (a) return a;
    }
    return initialAwareness || options.awareness || null;
  };

  return new Plugin({
    key: yCursorPluginKey,
    state: {
      init(_, state) {
        const aw = resolveAwareness();
        return buildCursorDecorations(state.doc, aw, options);
      },
      apply(tr, oldDecos, oldState, newState) {
        const awarenessChanged = tr.getMeta(yCursorPluginKey);
        const aw = resolveAwareness();
        if (awarenessChanged) {
          // Explicit awareness update (peer moved cursor or content was replaced externally)
          return buildCursorDecorations(newState.doc, aw, options);
        }
        // For local incremental edits (typing, formatting), map existing decoration
        // positions forward through the transaction so peer cursors shift naturally
        // with the inserted/deleted characters rather than jumping.
        return oldDecos.map(tr.mapping, newState.doc);
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
    view(editorView) {
      let currentAwareness = null;
      let onAwarenessChange = null;

      const detachAwareness = () => {
        if (currentAwareness && onAwarenessChange) {
          currentAwareness.off("change", onAwarenessChange);
          try {
            currentAwareness.setLocalStateField("cursor", null);
          } catch {
            // ignore
          }
        }
        currentAwareness = null;
        onAwarenessChange = null;
      };

      const updateLocalCursor = (aw) => {
        if (!editorView || editorView.isDestroyed || !aw) return;
        const sel = editorView.state.selection;
        if (!sel) return;
        const { anchor, head } = sel;
        const current = aw.getLocalState() || {};
        const prevCursor = current.cursor;
        if (!prevCursor || prevCursor.anchor !== anchor || prevCursor.head !== head) {
          aw.setLocalStateField("cursor", { anchor, head });
        }
      };

      const attachAwareness = (aw) => {
        if (!aw || aw === currentAwareness) return;
        detachAwareness();
        currentAwareness = aw;

        onAwarenessChange = ({ added, updated, removed }, origin) => {
          if (!editorView || editorView.isDestroyed) return;
          // Only skip purely local-only updates that contain ONLY our own clientID
          // and no remote peer changes. We must NOT skip when remote peers changed.
          if (origin === "local") {
            const changed = [...added, ...updated, ...removed];
            // If every changed client is us, there's nothing to redraw for peers
            if (changed.length > 0 && changed.every((id) => id === aw.clientID)) {
              return;
            }
          }
          try {
            const tr = editorView.state.tr.setMeta(yCursorPluginKey, true);
            editorView.dispatch(tr);
          } catch {
            // View might be in a dispatch cycle; ignore
          }
        };

        currentAwareness.on("change", onAwarenessChange);
        updateLocalCursor(currentAwareness);

        // Dispatch initial decoration build on next animation frame to avoid
        // synchronous dispatch-within-update warnings
        requestAnimationFrame(() => {
          if (!editorView.isDestroyed) {
            try {
              editorView.dispatch(editorView.state.tr.setMeta(yCursorPluginKey, true));
            } catch {
              // ignore
            }
          }
        });
      };

      // Check initial awareness
      const initialAw = resolveAwareness();
      if (initialAw) {
        attachAwareness(initialAw);
      }

      return {
        update(view, prevState) {
          const aw = resolveAwareness();
          if (aw !== currentAwareness) {
            attachAwareness(aw);
          } else if (currentAwareness) {
            if (!prevState || !prevState.selection.eq(view.state.selection)) {
              updateLocalCursor(currentAwareness);
            }
          }
        },
        destroy() {
          detachAwareness();
        },
      };
    },
  });
}

/**
 * Domternal Extension for Yjs Collaboration Cursors
 */
export const CollaborationCursor = Extension.create({
  name: "collaborationCursor",

  addOptions() {
    return {
      awareness: null,
      getAwareness: null,
      currentUserId: null,
      getUserId: null,
      cursorBuilder: createNotionCursorBuilder,
      selectionBuilder: createNotionSelectionBuilder,
    };
  },

  addProseMirrorPlugins() {
    return [createYjsCursorPlugin(this.options.awareness, this.options)];
  },
});

export default CollaborationCursor;
