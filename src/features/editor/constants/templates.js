export const TEMPLATES = [
  {
    title: "Blank Document",
    desc: "Start from scratch with a clean Notion-style canvas",
    icon: "📄",
    content: "<h1></h1><p></p>",
  },
  {
    title: "Engineering Spec",
    desc: "System architecture, API contracts, and requirements",
    icon: "⚡",
    content:
      '<h1>Engineering Spec</h1><h2>1. Problem Statement</h2><p>Describe the core problem here...</p><h2>2. Architecture & Design</h2><p>Document the components and data flows...</p><h2>3. Milestones & Checklist</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Backend API & DB Schemas</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Frontend Views & Navigation</p></div></li></ul>',
  },
  {
    title: "Meeting Notes",
    desc: "Agenda, discussion points, action items, and attendees",
    icon: "📝",
    content:
      "<h1>Meeting Notes</h1><p><strong>Date:</strong> " +
      new Date().toLocaleDateString() +
      '</p><h2>Agenda</h2><ul><li>Weekly progress review</li><li>Blockers & next steps</li></ul><h2>Action Items</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Follow up with engineering</p></div></li></ul>',
  },
  {
    title: "Project Roadmap",
    desc: "Q1 - Q4 strategic milestones and deliverables",
    icon: "🚀",
    content:
      "<h1>Project Roadmap</h1><h2>Q1 Goals</h2><ul><li>Core feature release</li><li>Telemetry and monitoring</li></ul><h2>Q2 Goals</h2><ul><li>Scale real-time services</li></ul>",
  },
];
