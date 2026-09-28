import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";

/**
 * Socket.IO Awareness Provider for Yjs collaborative cursors
 */
export class SocketAwarenessProvider {
  constructor(documentId, socket, userProfile) {
    this.documentId = documentId;
    this.socket = socket;
    this.doc = new Y.Doc();
    this.awareness = new Awareness(this.doc);
    this.isDestroyed = false;

    // 1. Broadcast local awareness changes to socket room
    this.handleLocalAwarenessUpdate = ({ added, updated, removed }, origin) => {
      if (origin === "socket" || this.isDestroyed) return;
      const changedClients = added.concat(updated).concat(removed);
      if (changedClients.length === 0) return;

      const update = encodeAwarenessUpdate(this.awareness, changedClients);
      this.socket.emit("doc:yjs:awareness", {
        documentId: this.documentId,
        update: Array.from(update),
      });
    };

    // 2. Receive remote awareness updates from socket room
    this.handleRemoteAwarenessUpdate = ({ update }) => {
      if (!update || this.isDestroyed) return;
      try {
        const u8 = new Uint8Array(update);
        applyAwarenessUpdate(this.awareness, u8, "socket");
      } catch (err) {
        console.error("Error applying remote awareness update:", err);
      }
    };

    // 3. Immediately clean up awareness states when a peer leaves
    this.handlePeerLeft = ({ userId, socketId }) => {
      if (this.isDestroyed) return;
      const states = this.awareness.getStates();
      const toRemove = [];
      states.forEach((state, cId) => {
        if (state && state.user) {
          if (
            (userId && (state.user._id === userId || state.user.id === userId)) ||
            (socketId && state.socketId === socketId)
          ) {
            toRemove.push(cId);
          }
        }
      });
      if (toRemove.length > 0) {
        removeAwarenessStates(this.awareness, toRemove, "socket");
      }
    };

    // Register listeners first before setting any state
    this.awareness.on("update", this.handleLocalAwarenessUpdate);
    this.socket.on("doc:yjs:awareness", this.handleRemoteAwarenessUpdate);
    this.socket.on("doc:peer:left", this.handlePeerLeft);

    // Set initial local user state
    if (userProfile) {
      this.setUserProfile(userProfile);
    }
  }

  broadcastLocalState() {
    if (this.isDestroyed) return;
    try {
      const update = encodeAwarenessUpdate(this.awareness, [this.awareness.clientID]);
      this.socket.emit("doc:yjs:awareness", {
        documentId: this.documentId,
        update: Array.from(update),
      });
    } catch (err) {
      console.warn("Failed to broadcast local awareness state:", err);
    }
  }

  setUserProfile(userProfile) {
    if (this.isDestroyed || !userProfile) return;
    this.awareness.setLocalStateField("user", {
      _id: userProfile._id,
      name: userProfile.name,
      color: userProfile.color,
      initials: userProfile.initials,
      avatar: userProfile.avatar,
      email: userProfile.email,
    });
    this.awareness.setLocalStateField("socketId", this.socket.id);
  }

  /**
   * Encode the current full Yjs document state as a Uint8Array.
   * This is persisted to MongoDB as the yjsSnapshot field so collaborative
   * editing state can be restored when users re-open the document.
   */
  getSnapshot() {
    if (this.isDestroyed) return null;
    try {
      return Y.encodeStateAsUpdate(this.doc);
    } catch {
      return null;
    }
  }

  /**
   * Apply a remote Yjs update into the local doc so the snapshot stays current.
   * Call this when receiving remote content updates from the socket.
   */
  applyUpdate(updateUint8Array) {
    if (this.isDestroyed || !updateUint8Array) return;
    try {
      Y.applyUpdate(this.doc, updateUint8Array);
    } catch {
      // ignore invalid/empty updates
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.awareness.off("update", this.handleLocalAwarenessUpdate);
    this.socket.off("doc:yjs:awareness", this.handleRemoteAwarenessUpdate);
    this.socket.off("doc:peer:left", this.handlePeerLeft);
    this.awareness.destroy();
    this.doc.destroy();
  }
}
