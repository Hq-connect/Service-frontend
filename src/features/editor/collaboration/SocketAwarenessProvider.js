import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";

/**
 * SocketAwarenessProvider manages real-time document CRDT synchronization (Yjs Doc)
 * and active user presence (Awareness) via WebSockets.
 */
export class SocketAwarenessProvider {
  constructor(documentId, socket, userProfile) {
    this.documentId = String(documentId);
    this.socket = socket;
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
        const u8 = new Uint8Array(update);
        applyAwarenessUpdate(this.awareness, u8, "socket");
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
      if (origin === "socket" || origin === "server" || this.isDestroyed) return;
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
        Y.applyUpdate(this.doc, new Uint8Array(update), "socket");
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

  applyServerSnapshot(snapshotArray) {
    if (this.isDestroyed || !snapshotArray || snapshotArray.length === 0) return;
    try {
      Y.applyUpdate(this.doc, new Uint8Array(snapshotArray), "server");
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
      Y.applyUpdate(this.doc, updateUint8Array);
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
