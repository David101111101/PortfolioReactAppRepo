// src/data/portfolio.ts
export type Link = { label: string; href: string };

export type Project = {
  title: string;
  status?: "public" | "nda" | "private";
  oneLiner: string;
  description: string;
  highlights: string[];
  tech: string[];
  links?: Link[];
};

export type Diploma = {
  title: string;
  issuer: string;
  category: "QA" | "Automation" | "Engineering" | "Other";
  proof?: Link;
  image?: string; 
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
  resume: "public/DAVID ABRIL QA Automation Engineer CV..pdf" // optional: put resume.pdf in /public
};

export const stats: Stat[] = [
  { label: "Workflows automated", value: "11", note: "Site setup modules" },
  { label: "Time saved", value: "150H", note: "Manual work eliminated" },
  { label: "Lines Of Code", value: "1038", note: "Advanced dynamic framework" },
  { label: "DOM interactions", value: "140K", note: "UI automation load" }
];

export const skills: { group: string; items: string[] }[] = [
  {
    group: "Test Automation",
    items: ["Playwright", "Cypress", "Puppeteer", "UI automation", "End-to-end frameworks", "Backend Testing", "BDD with Gherkin","Predictive forecasting","Parallel execution","Cross-browser testing"]
  },
  {
    group: "Testing & Strategy",
    items: [
      "API testing",
      "Exploratory",
      "Integration",
      "Regression",
      "Smoke",
      "Functional",
      "Usability",
      "Compatibility",
      "Security",
      "Accessibility",
      "Performance",
      "Mobile/responsive testing"
    ]
  },
  {
    group: "CI/CD & Tooling",
    items: [
      "CI pipelines",
      "Github Actions",
      "Azure DevOps",
      "REST/JSON",
      "Postman",
      "Docker Compose",
      "Allure reporting",
      "Jmeter",
      "Node.js",
      "Branching strategy (PRs)"
    ]
  },
  {
    group: "Languages",
    items: ["Java", "JavaScript", "TypeScript", "SQL/MySQL", "C#", "HTML", "CSS", "JSON", "React", "Gherkin"]
  },
  {
    group: "Delivery",
    items: ["Agile/Scrum", "Documentation", "Cross-team collaboration", "Ownership","Stakeholder Communication"]
  }
];

export const projects: Project[] = [
  {
    title: "Playwright Site-Setup Framework",
    status: "nda",
    oneLiner: "Owner/Developer/Tester (2025)",
    description:
      "Built a custom framework (~1038 LOC) rendering tedious manual repetitive work obsolete across 3 teams.",
    highlights: [
      "Saved 150 hours by Automating 11 manual setup workflows, reduced burnout & improved work satisfaction",
      "Reusable utilities: async helpers, fixtures, Page Object Models, centralized logging & error handling",
      "Reliability focus: advanced assertions, flakiness reduction patterns, and debug-friendly structure"
    ],
    tech: ["Playwright", "TypeScript", "Node.js", "Azure DevOps"]
  },
  {
    title: "Azure DevOps: CI/CD",
        status: "public",
    oneLiner: "Pipeline to build and deploy apps with full version control.",
    description:
        "Automated the entire development lifecycle of my React portfolio app using Azure DevOps.",
    highlights: [
        "Built a CI pipeline triggered on commits to master that installs Node.js, runs the production build and generates release-ready outputs, it then automates staging &  packaging: by copying the compiled build files into a staging directory, compresses outputs into a .zip artifact, and finally publishes the artifact for downstream release.",
        "Integrated version control workflows (branches/PRs) to keep changes auditable and safe",
        "Used scrum framework to plan, track, and deliver each step of the project",
        "Deployment pipeline publishes the built app directly to Azure for continuous delivery",
        
    ],
    tech: ["Azure DevOps", "CI/CD", "Git", "Node.js", "Vite", "React", "Scrum"]
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
    title: "Analysis & Development of Computer Software",
    issuer: "Sena",
    category: "Engineering",
    proof: { label: "View Certificate", 
    href: "https://drive.google.com/file/d/1ecQsbP8TfKjDRvH4kld4rpQGBcyK6iL5/view?usp=sharing"}, 
    image: "public/diplomas/TechnologistDegree.png"
  },
  { title: "Azure DevOps: CI/CD", 
    issuer: "Platzi", 
    category: "Engineering",  
    proof: { label: "View Certificate", href: "https://cert.efset.org/dbRhNU"}, 
    image: "public/diplomas/AzureDevOps.png" 
  },
  { title: "QA Automation Engineer", 
    issuer: "Platzi", 
    category: "Engineering",
    proof: { label: "View Certificate", href: "https://platzi.com/p/davidstevenabril/ruta/7632-ruta/diploma/detalle/"}, 
    image: "public/diplomas/QaAutomationEngineer.png" 
  },
  { title: "Software Quality Assurance Bootcamp",
     issuer: "Jala University",
     category: "QA",   
    proof: { label: "View Certificate", 
    href: "https://drive.google.com/file/d/1xl59g1H-h9vil5txBcSl4fhigCzxZM6n/view?usp=sharing"}, 
    image: "public/diplomas/QaBootcamp.png" },
  { 
    title: "Backend Test Automation Course with Cypress", 
    issuer: "Platzi", 
    category: "Automation", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/3076-course/diploma/detalle/" }, 
    image: "public/diplomas/CypressBackEndAutomation.png" 
  },
   { 
    title: "Advanced Test Automation with Puppeteer", 
    issuer: "Platzi", 
    category: "Automation", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/2706-course/diploma/detalle/" }, 
    image: "public/diplomas/AdvancedPuppeteerAutomation.png" 
  },
   { 
    title: "Advanced Cypress Frameworks", 
    issuer: "Platzi", 
    category: "Automation", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/4760-course/diploma/detalle/" }, 
    image: "public/diplomas/AdvancedCypress.png" 
  },
   { 
    title: "How to Get Feedback Audio Course", 
    issuer: "Platzi", 
    category: "Other", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/2482-course/diploma/detalle/" }, 
    image: "public/diplomas/HowToGetFeedback.png" 
  },
 
  { 
    title: "Effective Communication for Work Teams", 
    issuer: "Platzi", 
    category: "Other", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/2060-course/diploma/detalle/" }, 
    image: "public/diplomas/EffectiveCommunication.png" 
  },
   { 
    title: "Fundamentals of Software Testing",
    issuer: "Platzi",
    category: "QA",  
    proof: { label: "View Certificate", href: "https://platzi.com/p/davidstevenabril/curso/1421-course/diploma/detalle/"}, 
    image: "public/diplomas/TestingFundamentals.png" 
    },
  { 
    title: "English (C2 Proficient)", 
    issuer: "EF SET", 
    category: "Other", 
    proof: { label: "View Certificate", 
    href: "https://cert.efset.org/dbRhNU" }, 
    image: "public/diplomas/EfSetEnglish.png" 
  },
  { 
    title: "Managing Emotions for Productivity and Organization", 
    issuer: "Platzi", 
    category: "Other", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/2496-course/diploma/detalle/" }, 
    image: "public/diplomas/Emotionalintelligence.png" 
  },
];
