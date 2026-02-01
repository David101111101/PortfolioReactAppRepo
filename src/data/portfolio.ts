// src/data/portfolio.ts
export type Link = { label: string; href: string };

export type Project = {
  title: string;
  oneLiner: string;
  description: string;
  highlights: string[];
  tech: string[];
  links?: Link[];
  status?: "public" | "nda" | "private";
};

export type Diploma = {
  title: string;
  issuer: string;
  year?: string;
  category: "QA" | "Automation" | "Engineering" | "Leadership" | "Other";
  proof?: Link;
  image?: string; // optional: /diplomas/your-image.png (place in /public)
};

export type Stat = { label: string; value: string; note?: string };

export type Experience = {
  role: string;
  company: string;
  period: string;
  bullets: string[];
};

export const profile = {
  name: "David Abril",
  role: "QA Automation Engineer",
  location: "Remote • Colombia",
  languages: "English (C2) Certified",
  summary:
    "Automation-focused QA engineer with software backend development experience and team leadership. I’m driven by challenges and bigger goals, and I’m pursuing an automation-first role while deepening engineering skills.",

  email: "davidstevenabril@gmail.com",
  linkedin: "https://www.linkedin.com/in/david-abril-189099138",
  github: "https://github.com/David101111101",
  resume: "/resume.pdf" // optional: put resume.pdf in /public
};

export const stats: Stat[] = [
  { label: "Workflows automated", value: "10", note: "site setup modules" },
  { label: "Time saved", value: "175h", note: "manual work eliminated" },
  { label: "Scale", value: "300 sites", note: "backlog forecast" },
  { label: "UI automation load", value: "140k", note: "DOM interactions" }
];

export const skills: { group: string; items: string[] }[] = [
  {
    group: "Test Automation",
    items: ["Playwright", "Cypress", "Puppeteer", "UI automation", "End-to-end frameworks"]
  },
  {
    group: "Testing & Strategy",
    items: [
      "API testing",
      "Backend testing",
      "Test strategy",
      "Exploratory",
      "Integration",
      "Regression",
      "Smoke",
      "Functional",
      "Usability",
      "Compatibility",
      "Security",
      "Accessibility"
    ]
  },
  {
    group: "CI/CD & Tooling",
    items: [
      "Git",
      "Azure DevOps",
      "REST/JSON",
      "Postman",
      "Docker",
      "Allure reporting",
      "Data analysis",
      "Predictive forecasting"
    ]
  },
  {
    group: "Languages",
    items: ["Java", "JavaScript", "TypeScript", "SQL/MySQL", "C#", "HTML", "CSS", "JSON", "React", "Node", "Gherkin"]
  },
  {
    group: "Delivery",
    items: ["Agile methodologies", "Documentation", "Cross-team collaboration"]
  }
];

export const projects: Project[] = [
  {
    title: "Playwright Site-Setup Framework",
    oneLiner: "Automated 10 website setup workflows and standardized execution across teams.",
    description:
      "Owner/Developer/Tester (2025). Built a custom framework (~1038 LOC) to automate repetitive site setup workflows and improve reliability and maintainability.",
    highlights: [
      "Automated 10 manual setup workflows; saved 175 hours and reduced repetitive work and burnout",
      "Reusable utilities: async helpers, Page Object Models, centralized logging & error handling, fixtures",
      "Reliability focus: advanced assertions, flakiness reduction patterns, and debug-friendly structure"
    ],
    tech: ["Playwright", "TypeScript", "Node.js", "Azure DevOps"],
    status: "nda"
  },
  {
    title: "Azure DevOps: CI/CD",
    oneLiner: "CI/CD pipeline to build and deploy apps with full version control.",
    description:
        "Automated the entire development lifecycle of my React portfolio app using Azure DevOps.",
    highlights: [
        "Configured build pipeline for repeatable installs, builds, and artifact generation",
        "Integrated version control workflows (branches/PRs) to keep changes auditable and safe",
        "Deployment pipeline publishes the built app directly to Azure for continuous delivery",
        "Used scrum framework to plan, track, and deliver each step of the project"
    ],
    tech: ["Azure DevOps", "CI/CD", "Git", "Node.js", "Vite", "React", "Scrum"],
    status: "public"
    },
    {
    title: "Cypress Framework",
    oneLiner: "Advanced testing techniques packaged into a practical Cypress framework.",
    description:
      "Developer/Tester (2025). Framework covering backend automation practices, stability patterns, and execution features used in real-world suites.",
    highlights: [
      "Covers cookies/local storage, retries, error interception, plugins, and Page Object Models",
      "Custom commands, fixtures, env variables, parallel testing, video reporting",
      "Docker + Node.js included for reproducible runs"
    ],
    tech: ["Cypress", "JavaScript/TypeScript", "Node.js", "Docker"]
  },
  {
    title: "Puppeteer Framework",
    oneLiner: "Automation framework exploring advanced browser automation and performance checks.",
    description:
      "Developer/Tester (2025). Built utilities for modern QA concerns: accessibility, performance, device emulation, and parallel execution.",
    highlights: [
      "Geolocation, PDF generation, incognito mode, device emulation & dynamic viewports",
      "Screenshots for visual checks; parallel multi-browser execution",
      "Performance checks (page-load / first contentful paint) and BDD (Gherkin)"
    ],
    tech: ["Puppeteer", "JavaScript/TypeScript", "Performance", "Accessibility"]
  },
  {
    title: "Playwright E2E Store Flow",
    oneLiner: "End-to-end automation of an e-commerce user flow with traceable debugging.",
    description:
      "Developer/Tester (2025). Automated product search → add to cart → checkout/payment flow using assertions at each interaction.",
    highlights: [
      "Assertions per interaction to validate UI state and business flow",
      "Tracing with screenshots and multi-browser usage",
      "Debugging tools integrated for fast failure diagnosis"
    ],
    tech: ["Playwright", "TypeScript", "E2E Testing"]
  },
  {
    title: "Cypress Backend Testing Framework",
    oneLiner: "API validation with SQL/MySQL + NoSQL and content-type/data integrity checks.",
    description:
      "Developer/Tester (2025). Mixed API testing tooling and data stores to validate status codes, headers, schemas, and CRUD integrity.",
    highlights: [
      "API testing with Postman/devtools; status codes, headers, content-type validation",
      "GraphQL practice with PokeAPI; CRUD with MongoDB + SQL/MySQL",
      "JSON Server usage to simulate and validate backend behavior"
    ],
    tech: ["Cypress", "Postman", "REST/JSON", "GraphQL", "SQL/MySQL", "MongoDB"]
  }
];

export const experiences: Experience[] = [
  {
    role: "Migrations Team Lead & Process Automator",
    company: "Nationwide Marketing Group",
    period: "Feb 2025–Present",
    bullets: [
      "Improved delivery efficiency through workflow refinement and cross-department collaboration; reduced design-to-go-live timelines by 43% while maintaining quality and team morale (9-person remote team).",
      "Proposed, developed, and deployed a Playwright automation framework to standardize and automate 10 core setup processes (~30 minutes manual per website)."
    ]
  },
  {
    role: "E-commerce Websites Migrator",
    company: "Nationwide Marketing Group",
    period: "Mar 2024–Feb 2025",
    bullets: [
      "Migrated legacy sites using HTML/CSS/JS; improved responsiveness and SEO baselines under modern design standards.",
      "Proposed workflow improvements adopted by multiple departments; achieved highest migration conversion rate."
    ]
  },
  {
    role: "Fullstack Software Developer Intern",
    company: "Credencial Business Magazine",
    period: "Jan 2014–Aug 2014",
    bullets: [
      "Built a Java + SQL tool to decrypt/transform/re-encrypt banking data with layered security and role-based visibility."
    ]
  }
];

export const otherExperience =
  "Other experience (compressed): Team Lead & Tier-2 Support (Teleperformance, 2014–2017) • Tour Ops Manager (Gran Colombia Tours, 2017–2024) • Real-Time Analyst (Sitel – PayPal/Venmo, 2020–2021).";

export const diplomas: Diploma[] = [
  {
    title: "Technologist — Analysis & Development of Computer Software",
    issuer: "Credential / Institution",
    category: "Engineering"
  },
  { title: "QA Automation Engineer", issuer: "Credential / Institution", category: "Automation" },
  { title: "Azure DevOps: CI/CD", issuer: "Credential / Institution", category: "Engineering" },
  { title: "Quality Assurance of Software Bootcamp", issuer: "Credential / Institution", category: "QA" },
  { title: "Fundamentals of Software Testing", issuer: "Credential / Institution", category: "QA" },
  { title: "EF SET English C2", issuer: "EF SET", category: "Other" }
];
