/**
 * PhantomDeps Team Configuration for ClaimCheck
 * Single editable config for the Contact Dialog.
 * Empty fields are automatically omitted from rendering.
 */
export const TEAM = {
  name: "PhantomDeps",
  description: "TypeScript fail-closed BLOCK / WARN / ALLOW engine with NDJSON audit logs.",
  event: "AMD Developer Hackathon: ACT III · lablab.ai",
  email: "contact@phantomdeps.ai",        // team contact email
  repo: "https://github.com/narayan-nkj/claimcheck-retail-media",         // project repository URL
  members: [
    {
      name: "Narayan Kumar Jha",
      role: "AMD Model Serving & Structured Extraction",
      email: "narayan@phantomdeps.ai",
      github: "https://github.com/narayan-nkj",
      linkedin: "https://linkedin.com/in/narayanjha",
    },
    {
      name: "Adi",
      role: "Deterministic Policy Engine & Audit Chain",
      email: "",
      github: "",
      linkedin: "",
    },
    {
      name: "Roshan",
      role: "Web Application & Validation Workflow",
      email: "",
      github: "",
      linkedin: "",
    },
  ],
};

if (typeof window !== 'undefined') {
  window.TEAM = TEAM;
}

