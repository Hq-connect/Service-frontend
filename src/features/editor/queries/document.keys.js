export const documentKeys = {
  all: ["documents"],
  tree: () => [...documentKeys.all, "tree"],
  list: (folderId = null) => [...documentKeys.all, "list", folderId],
  detail: (id) => [...documentKeys.all, "detail", id],
  comments: (id) => [...documentKeys.all, "comments", id],
  members: (id) => [...documentKeys.all, "members", id],
  versions: (id) => [...documentKeys.all, "versions", id],
};
