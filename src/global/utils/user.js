/**
 * Centralized utility functions for extracting, formatting, and presenting
 * user profiles, names, avatars, initials, and theme styles across the application.
 */

export const extractUser = (u) => {
  if (!u) return null;
  if (u.user && typeof u.user === "object") return extractUser(u.user);
  if (u.data && typeof u.data === "object") return extractUser(u.data);

  // In chatParticipant documents or attendee records, u.userId is the real user ID,
  // whereas u._id is the participant join-table / membership ID.
  const rawUserId =
    typeof u.userId === "object" && u.userId !== null
      ? u.userId._id || u.userId.id
      : u.userId || (u.userSnapshot ? u.userSnapshot._id || u.userSnapshot.userId : null);

  const canonicalId = rawUserId || u._id || u.id;

  if (u.userSnapshot && typeof u.userSnapshot === "object") {
    return {
      ...u,
      ...u.userSnapshot,
      _id: canonicalId,
      id: canonicalId,
      userId: canonicalId,
    };
  }

  if (rawUserId && rawUserId !== u._id) {
    return {
      ...u,
      _id: canonicalId,
      id: canonicalId,
      userId: canonicalId,
    };
  }

  return u;
};

export const getUserDisplayName = (u) => {
  const target = extractUser(u);
  if (!target) return "Member";

  if (typeof target === "string") return target;

  if (target.firstName || target.lastName) {
    return `${target.firstName || ""} ${target.lastName || ""}`.trim();
  }
  return target.fullName || target.name || target.email || "Member";
};

export const getUserInitials = (u) => {
  const target = extractUser(u);
  if (!target) return "U";

  if (typeof target === "string") {
    const parts = target.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.slice(0, 2).toUpperCase() || "U";
  }

  if (target.firstName || target.lastName) {
    const first = (target.firstName || "")[0] || "";
    const second = (target.lastName || "")[0] || "";
    if (first && second) return (first + second).toUpperCase();
    if (first) return target.firstName.slice(0, 2).toUpperCase();
  }

  const rawName = target.fullName || target.name || target.email || "U";
  const parts = rawName.trim().split(/[\s@.]+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return rawName.slice(0, 2).toUpperCase() || "U";
};

export const getAvatarInitials = getUserInitials;
export const getInitials = getUserInitials;

// Curated collaborator palette (vibrant, high contrast, clean)
const NOTION_COLLAB_COLORS = [
  "#e03e3e",
  "#0b6e99",
  "#0f7b6c",
  "#dfab01",
  "#9065b0",
  "#d95700",
  "#ad1a72",
  "#2b8a3e",
  "#495057",
];

export const getCollaboratorColor = (seed = "") => {
  const str = String(seed || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % NOTION_COLLAB_COLORS.length;
  return NOTION_COLLAB_COLORS[idx];
};

export const getUserColor = getCollaboratorColor;

export const getAvatarStyle = (seedOrUser = "") => {
  const target = extractUser(seedOrUser);
  const seed = (typeof target === "object" && target !== null)
    ? String(target?.userId || target?._id || target?.id || target?.email || target?.name || target?.fullName || "")
    : String(seedOrUser || "");

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Disperse consecutive IDs (e.g. sequential MongoDB ObjectIds) across the 360-degree color wheel using the golden angle (~137.5 deg)
  const h = Math.abs(Math.round(hash * 137.5)) % 360;
  return {
    backgroundColor: `hsl(${h}, 55%, 88%)`,
    color: `hsl(${h}, 60%, 30%)`,
  };
};

export const getUserProfile = (u) => {
  const target = extractUser(u);
  const name = getUserDisplayName(target);
  const initials = getUserInitials(target);
  const id = target?._id || target?.id || null;
  const email = target?.email || null;
  const avatar = target?.avatar || null;
  const seed = email || id || name;
  const color = getCollaboratorColor(seed);
  const avatarStyle = getAvatarStyle(seed);

  return {
    _id: id,
    name,
    initials,
    email,
    avatar,
    color,
    avatarStyle,
  };
};
