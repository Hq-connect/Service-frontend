/**
 * Utility to extract and normalize user profiles across Redux auth shapes,
 * socket awareness payloads, and tenant member records.
 */

export const extractUser = (u) => {
  if (!u) return null;
  if (u.user && typeof u.user === "object") return extractUser(u.user);
  if (u.data && typeof u.data === "object") return extractUser(u.data);
  return u;
};

export const getUserDisplayName = (u) => {
  const target = extractUser(u);
  if (!target) return "Collaborator";

  if (target.firstName || target.lastName) {
    return `${target.firstName || ""} ${target.lastName || ""}`.trim();
  }
  return target.fullName || target.name || target.email || "Collaborator";
};

export const getUserInitials = (u) => {
  const target = extractUser(u);
  if (!target) return "U";

  if (typeof target === "string") {
    const parts = target.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.slice(0, 2).toUpperCase();
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
  return rawName.slice(0, 2).toUpperCase();
};

export const getAvatarInitials = getUserInitials;
export const getInitials = getUserInitials;

// Curated Notion-grade collaborator palette (vibrant, modern, high contrast)
const NOTION_COLLAB_COLORS = [
  "#e03e3e", // Notion red
  "#0b6e99", // Notion blue
  "#0f7b6c", // Notion teal
  "#dfab01", // Notion yellow/amber
  "#9065b0", // Notion purple
  "#d95700", // Notion orange
  "#ad1a72", // Notion pink
  "#2b8a3e", // Notion green
  "#495057", // Notion charcoal
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

export const getAvatarStyle = (seed = "") => {
  const str = String(seed || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return {
    backgroundColor: `hsl(${h}, 65%, 90%)`,
    color: `hsl(${h}, 70%, 26%)`,
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
