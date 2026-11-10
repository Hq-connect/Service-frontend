import {
  CheckSquare,
  Video,
  BarChart3,
  Sparkles,
  Smile,
} from "lucide-react";

export const SLASH_COMMANDS = [
  {
    command: "/task",
    label: "Create & Assign Task",
    syntax: "/task #PROJECT [title] [@user] [!priority]",
    example: "/task #WEB Fix login page @Subham !high",
    description: "Create a task in a project (use # to pick project, @ to assign, !high/!urgent for priority)",
    icon: CheckSquare,
    accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    command: "/poll",
    label: "Live Poll",
    syntax: '/poll "Question" "Option 1" "Option 2"',
    example: '/poll "Release day?" "Tuesday" "Thursday"',
    description: "Post an interactive real-time voting card (quotes or | separated)",
    icon: BarChart3,
    accent: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    command: "/meet",
    label: "Instant Meeting Room",
    syntax: "/meet [video|audio] [optional title]",
    example: "/meet video Sprint Sync",
    description: "Drop a 1-click LiveKit video or voice call card into the chat",
    icon: Video,
    accent: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  },
  {
    command: "/ai",
    label: "AI Catch-Up & Summary",
    syntax: "/ai [summarize | action-items | prompt]",
    example: "/ai summarize",
    description: "Summarize recent conversation highlights & action items",
    icon: Sparkles,
    accent: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    command: "/shrug",
    label: "Shrug Kaomoji",
    syntax: "/shrug [optional message]",
    example: "/shrug Ship it",
    description: "Append ¯\\_(ツ)_/¯ to your message",
    icon: Smile,
    accent: "text-sky-500 bg-sky-500/10 border-sky-500/20",
  },
];

/**
 * Parses `/task #PROJECT Fix navbar @Subham !high` into structured task payload.
 */
export const parseTaskCommand = (
  argsText = "",
  projects = [],
  mentionableMembers = [],
  selectedMentionsMap = {},
  defaultProject = null
) => {
  let working = argsText.trim();
  let resolvedProject = defaultProject || projects[0] || null;
  let priority = "medium";
  let assignee = null;

  // 1. Extract #PROJECT token (matches project.key or project.name slug)
  const projectTagMatch = working.match(/(?:^|\s)#([^\s#]+)/);
  if (projectTagMatch) {
    const rawKey = projectTagMatch[1].toLowerCase();
    const matched = projects.find(
      (p) =>
        (p.key && p.key.toLowerCase() === rawKey) ||
        (p.name && p.name.toLowerCase().replace(/\s+/g, "-") === rawKey) ||
        (p.name && p.name.toLowerCase().startsWith(rawKey))
    );
    if (matched) {
      resolvedProject = matched;
    }
    working = working.replace(projectTagMatch[0], " ").trim();
  }

  // 2. Extract !priority token (!low, !medium, !high, !urgent)
  const priorityMatch = working.match(/(?:^|\s)!(low|medium|high|urgent)\b/i);
  if (priorityMatch) {
    priority = priorityMatch[1].toLowerCase();
    working = working.replace(priorityMatch[0], " ").trim();
  }

  // 3. Extract @Assignee from mentionableMembers or selectedMentionsMap
  if (working.includes("@")) {
    const sortedMembers = [...mentionableMembers].sort(
      (a, b) => (b.displayName?.length || 0) - (a.displayName?.length || 0)
    );

    for (const m of sortedMembers) {
      if (!m.displayName) continue;
      const escapedFull = m.displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const fullRegex = new RegExp(`(?:^|\\s)@${escapedFull}(?=\\s|$)`, "i");
      if (fullRegex.test(working)) {
        assignee = m;
        working = working.replace(fullRegex, " ").trim();
        break;
      }

      const firstWord = m.displayName.split(" ")[0];
      if (firstWord) {
        const escapedFirst = firstWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const firstRegex = new RegExp(`(?:^|\\s)@${escapedFirst}\\b`, "i");
        if (firstRegex.test(working)) {
          assignee = m;
          working = working.replace(firstRegex, " ").trim();
          break;
        }
      }
    }

    if (!assignee) {
      for (const [nameLower, uid] of Object.entries(selectedMentionsMap || {})) {
        const found = mentionableMembers.find((m) => String(m.userId) === String(uid));
        if (found && working.toLowerCase().includes(`@${nameLower}`)) {
          assignee = found;
          const escaped = nameLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          working = working.replace(new RegExp(`@${escaped}`, "ig"), " ").trim();
          break;
        }
      }
    }
  }

  const title = working.replace(/\s+/g, " ").trim();

  return {
    title,
    project: resolvedProject,
    priority,
    assignee,
  };
};

/**
 * Parses `/poll "Question" "Opt 1" "Opt 2"` or `/poll Question | Opt 1 | Opt 2`
 */
export const parsePollCommand = (argsText = "") => {
  let raw = argsText.trim();
  let allowMultiple = false;

  if (/(?:^|\s)--multi\b/i.test(raw)) {
    allowMultiple = true;
    raw = raw.replace(/(?:^|\s)--multi\b/i, " ").trim();
  }

  // Case 1: Quoted strings `/poll "Question?" "Option A" "Option B"`
  const quotedMatches = [...raw.matchAll(/"([^"]+)"|'([^']+)'/g)].map(
    (m) => (m[1] || m[2] || "").trim()
  ).filter(Boolean);

  if (quotedMatches.length >= 2) {
    return {
      question: quotedMatches[0],
      options: quotedMatches.slice(1, 11),
      allowMultiple,
    };
  }

  // Case 2: Pipe separated `/poll Question? | Option A | Option B`
  if (raw.includes("|")) {
    const parts = raw
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return {
        question: parts[0],
        options: parts.slice(1, 11),
        allowMultiple,
      };
    }
  }

  // Case 3: Question mark or colon followed by comma-separated options
  const qSplit = raw.match(/^([^?:]+[?:])\s*(.+)$/);
  if (qSplit) {
    const question = qSplit[1].trim();
    const opts = qSplit[2]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (opts.length >= 2) {
      return {
        question,
        options: opts.slice(0, 10),
        allowMultiple,
      };
    }
  }

  // Fallback default Yes / No poll if user just typed a question
  if (raw.length > 0) {
    return {
      question: raw.endsWith("?") ? raw : `${raw}?`,
      options: ["Yes 👍", "No 👎"],
      allowMultiple: false,
    };
  }

  return null;
};

/**
 * Parses `/meet [video|audio] [optional title]`
 */
export const parseMeetCommand = (argsText = "") => {
  const trimmed = argsText.trim();
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const first = (tokens[0] || "").toLowerCase();

  if (first === "audio" || first === "voice" || first === "call") {
    const title = tokens.slice(1).join(" ").trim() || "Instant Voice Call";
    return { callType: "audio", title };
  }
  if (first === "video" || first === "meet") {
    const title = tokens.slice(1).join(" ").trim() || "Instant Video Meeting";
    return { callType: "video", title };
  }

  return {
    callType: "video",
    title: trimmed || "Instant Video Meeting",
  };
};

/**
 * Generates a structured AI Catch-Up / Summary from recent messages in the active chat.
 */
export const buildAiChatSummary = (messages = [], promptText = "") => {
  const recent = [...messages]
    .filter((m) => !m.deletedAt && m.content?.text)
    .slice(0, 30)
    .reverse();

  if (recent.length === 0) {
    return `✨ **AI Assistant**${promptText ? ` (${promptText})` : ""}\n• No recent messages in this conversation to summarize yet.`;
  }

  const actionItems = [];
  const questions = [];
  const highlights = [];

  for (const msg of recent) {
    const txt = (msg.content?.text || "").trim();
    if (!txt || txt.startsWith("✨ **AI")) continue;

    if (
      /\b(todo|task|will do|need to|please|assign|fix|deploy|review|deadline|by tomorrow|action)\b/i.test(
        txt
      )
    ) {
      if (actionItems.length < 3) actionItems.push(txt);
    } else if (txt.includes("?")) {
      if (questions.length < 2) questions.push(txt);
    } else if (txt.length > 18 && highlights.length < 3) {
      highlights.push(txt);
    }
  }

  const lines = [
    `✨ **AI Conversation Summary** *(last ${recent.length} messages)*`,
  ];

  if (highlights.length > 0) {
    lines.push(
      `\n📌 **Key Points:**\n` +
        highlights.map((h) => `• ${h.slice(0, 120)}${h.length > 120 ? "…" : ""}`).join("\n")
    );
  }

  if (actionItems.length > 0) {
    lines.push(
      `\n✅ **Action Items Detected:**\n` +
        actionItems.map((a) => `• ${a.slice(0, 120)}${a.length > 120 ? "…" : ""}`).join("\n")
    );
  }

  if (questions.length > 0) {
    lines.push(
      `\n❓ **Open Questions:**\n` +
        questions.map((q) => `• ${q.slice(0, 120)}${q.length > 120 ? "…" : ""}`).join("\n")
    );
  }

  if (highlights.length === 0 && actionItems.length === 0 && questions.length === 0) {
    const latest = recent.slice(-3);
    lines.push(
      `\n💬 **Latest Updates:**\n` +
        latest.map((m) => `• ${m.content.text.slice(0, 120)}`).join("\n")
    );
  }

  return lines.join("\n");
};
