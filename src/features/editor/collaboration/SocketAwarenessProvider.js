import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";

/**
 * Robust helper to convert various binary/buffer representations (Node.js Buffer,
 * Array of numbers, Base64 string, Uint8Array, BSON binary) into a clean Uint8Array for Yjs.
 */
export const toUint8Array = (val) => {
  if (!val) return null;
  if (val instanceof Uint8Array) return val;
  if (Array.isArray(val)) return new Uint8Array(val);
  if (val?.data && Array.isArray(val.data)) return new Uint8Array(val.data);
  if (typeof val === "string") {
    try {
      const binStr = atob(val);
      const len = binStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binStr.charCodeAt(i);
      }
      return bytes;
    } catch {
      return null;
    }
  }
  if (val?.$binary?.base64) {
    try {
      const binStr = atob(val.$binary.base64);
      const len = binStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binStr.charCodeAt(i);
      }
      return bytes;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * SocketAwarenessProvider manages real-time document CRDT synchronization (Yjs Doc)
 * and active user presence (Awareness) via WebSockets.
 */
export class SocketAwarenessProvider {
  constructor(documentId, socket, userProfile, readOnly = false) {
    this.documentId = String(documentId);
    this.socket = socket;
    this.readOnly = Boolean(readOnly);
    this.doc = new Y.Doc();
    this.yXmlFragment = this.doc.getXmlFragment("prosemirror");
    this.awareness = new Awareness(this.doc);
    this.isDestroyed = false;

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

    this.handleRemoteAwarenessUpdate = ({ documentId: remoteDocId, update } = {}) => {
      if (!update || this.isDestroyed) return;
      if (remoteDocId && String(remoteDocId) !== this.documentId) return;
      try {
        const u8 = toUint8Array(update);
        if (u8) {
          applyAwarenessUpdate(this.awareness, u8, "socket");
        }
      } catch (err) {
        console.error("Error applying remote awareness update:", err);
      }
    };

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

    this.handleDocUpdate = (update, origin) => {
      // In read-only mode or remote origin, never emit outbound updates
      if (this.readOnly || origin === "socket" || origin === "server" || this.isDestroyed) return;
      const fullSnapshot = Y.encodeStateAsUpdate(this.doc);
      this.socket.emit("doc:yjs:update", {
        documentId: this.documentId,
        update: Array.from(update),
        yjsSnapshot: Array.from(fullSnapshot),
      });
    };

    this.handleRemoteDocUpdate = ({ documentId: remoteDocId, update } = {}) => {
      if (!update || this.isDestroyed) return;
      if (remoteDocId && String(remoteDocId) !== this.documentId) return;
      try {
        const u8 = toUint8Array(update);
        if (u8) {
          Y.applyUpdate(this.doc, u8, "socket");
        }
      } catch (err) {
        console.error("Error applying remote Yjs update:", err);
      }
    };

    this.awareness.on("update", this.handleLocalAwarenessUpdate);
    this.socket.on("doc:yjs:awareness", this.handleRemoteAwarenessUpdate);
    this.socket.on("doc:peer:left", this.handlePeerLeft);
    this.doc.on("update", this.handleDocUpdate);
    this.socket.on("doc:yjs:update", this.handleRemoteDocUpdate);

    if (userProfile) {
      this.setUserProfile(userProfile);
    }
  }

  setReadOnly(readOnly) {
    this.readOnly = Boolean(readOnly);
  }

  applyServerSnapshot(snapshotRaw) {
    if (this.isDestroyed || !snapshotRaw) return;
    try {
      const u8 = toUint8Array(snapshotRaw);
      if (u8 && u8.length > 0) {
        Y.applyUpdate(this.doc, u8, "server");
      }
    } catch (err) {
      console.warn("Failed to apply server snapshot:", err);
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

  getSnapshot() {
    if (this.isDestroyed) return null;
    try {
      return Y.encodeStateAsUpdate(this.doc);
    } catch {
      return null;
    }
  }

  applyUpdate(updateUint8Array) {
    if (this.isDestroyed || !updateUint8Array) return;
    try {
      const u8 = toUint8Array(updateUint8Array);
      if (u8) {
        Y.applyUpdate(this.doc, u8);
      }
    } catch {
      // ignore
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.awareness.off("update", this.handleLocalAwarenessUpdate);
    this.socket.off("doc:yjs:awareness", this.handleRemoteAwarenessUpdate);
    this.socket.off("doc:peer:left", this.handlePeerLeft);
    this.doc.off("update", this.handleDocUpdate);
    this.socket.off("doc:yjs:update", this.handleRemoteDocUpdate);
    this.awareness.destroy();
    this.doc.destroy();
  }
}

export default SocketAwarenessProvider;
