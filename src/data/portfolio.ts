// src/data/portfolio.ts
export type Link = { label: string; href: string };

export type Project = {
  title: string;
  status?: "public" | "nda" | "private";
  links?: Link[];
  oneLiner: string;
  description: string;
  highlights: string[];
  tech: string[];
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
    "QA Engineer specializing in automation, with backend development and team leadership experience.   Motivated by challenges and a passion for continuous learning, I am pursuing an automation‑first role while expanding my engineering expertise. I thrive in dynamic environments solving complex problems and contributing to high quality software delivery.",

  email: "davidstevenabril@gmail.com",
  linkedin: "https://www.linkedin.com/in/david-abril-189099138",
  github: "https://github.com/David101111101",
  resume: "DavidAbrilQaAutomationEngineerCV.pdf"
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
      "GitHub Actions",
      "Azure DevOps",
      "Postman",
      "Docker Compose",
      "Allure reporting",
      "K6",
      "Jira",
      "Monday",
      "Branching strategy (PRs)"
    ]
  },
  {
    group: "Languages",
    items: ["Java", "JavaScript", "TypeScript", "SQL/MySQL", "C#", "HTML", "CSS", "JSON", "React", "Gherkin","Node.js"]
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
    oneLiner: "Developer/Tester (2025)",
    description:
      "Built a custom framework (~1038 LOC) rendering tedious manual repetitive work obsolete across 3 teams.",
    highlights: [
      "Saved 150 hours by Automating 11 manual setup workflows that reduced burnout & improved work satisfaction on 3 teams by focusing on higher value/complexity tasks instead",
      "Used best coding practices with reusable utilities like async helpers, Fixtures, Page Object Models, centralized logging & thorough documentation of errors per module for fast & accurate debugging",
      "Reliability focus: advanced assertions, flakiness reduction patterns, and debug-friendly structure with a very detailed README with logical & physical architecture diagrams",
    ],
    tech: ["Playwright", "TypeScript", "Node.js", "Azure DevOps"],
  },
    {
    title: "Azure DevOps: CI/CD",
    links: [{label: "Git Repo",
           href: "https://github.com/David101111101/PortfolioReactAppRepo",}],
    oneLiner: "Owner/Developer/Tester (2026)",
    description:
        "Automated the entire development lifecycle of my React portfolio app using Azure DevOps with full version control.",
    highlights: [
      "Integrated version control workflows (branches/PRs) to keep changes auditable and safe using scrum framework to plan, track, and deliver each step of the project for CI",
      "Built a CD pipeline triggered on commits that installs Node.js in an ubuntu VM, runs the production build, automates staging & packaging by copying the compiled build files into a staging directory, compresses outputs into a (.zip) artifact, and finally publishes the artifact for downstream release",
      "Deployment pipeline publishes the built app directly to Azure for Continuous Delivery",  
    ],
    tech: ["Azure DevOps", "CI/CD", "Git", "Node.js", "Vite", "React", "Scrum"],
  },
    {
    title: "Performance Testing K6",
    oneLiner: "Owner/Developer/Tester (2026)",
    description:
      "Performance testing framework that gets triggered with Pull Requests and only merges to Main if it passes the Thresholds of API Req duration < 200ms & Req failure rate is < 10% .",
    highlights: [
      "Scheduled & Merged triggers an Ubuntu VM that publishes to K6 Cloud building a dashboard of trend graphs + historical results to detect performance regressions and bottlenecks early",      
      "Smoke, Load, Stress, Spike & Soak testing to validate API performance under various conditions",
      "Integration in CI through workflow YML Jobs, repository secrets & GitHub action rulesets for branch strategy with automated execution",

    ],
    tech: ["K6", "Node.js", "Postman", "K6 Cloud"],
    links: [{
        label: "Git Repo",
        href: "https://github.com/David101111101/performance-testing-k6",}],
  },
  {
    title: "Cypress Framework",
    oneLiner: "Developer/Tester (2025).",
    description:
      "Framework covering backend automation practices used in real-world suites.",
    highlights: [
      "Strategic cookie/local storage management, retry mechanisms for flaky tests, error interception for debugging, custom plugins and Page Object Models for maintainable, scalable test architecture",
      "Built reusable utilities including custom Cypress commands, fixtures, parallel test execution, and video recording with for test failure analysis",
      "Containerized with Docker and Node.js for environment consistency, eliminating 'works on my machine' issues and enabling seamless CI/CD integration with guaranteed reproducible test runs across all environments"
    ],
    tech: ["Cypress", "JavaScript/TypeScript", "Node.js", "Docker"],
    links: [{
        label: "Git Repo",
        href: "https://github.com/David101111101/Cypress-Automation-Framework",}],
  },
  {
    title: "Cypress Backend Testing",
    oneLiner: "Developer/Tester (2025)",
    description:
      "Mixed API testing tooling and data stores to validate status codes, headers, schemas, and CRUD integrity with SQL/MySQL.",
    highlights: [
      "API testing with Postman/Devtools; status codes, headers, content-type validation",
      "GraphQL practice with PokeAPI; CRUD with MongoDB + SQL/MySQL",
      "JSON Server usage to simulate and validate backend behavior"
    ],
    tech: ["Cypress", "Postman", "GraphQL", "SQL/MySQL", "MongoDB"],
    links: [{
        label: "Git Repo",
        href: "https://github.com/David101111101/cypress-backend-automation",}],
  },
  {
    title: "Puppeteer Framework",
    oneLiner: "Developer/Tester (2025)",
    description:
      "Built utilities for modern QA concerns: accessibility, performance, device emulation, and parallel execution.",
    highlights: [
      "Geolocation, PDF generation, incognito mode, device emulation & dynamic viewports",
      "Screenshots for visual checks; parallel multi-browser execution",
      "Performance checks (page-load / first contentful paint) and BDD (Gherkin)"
    ],
    tech: ["Puppeteer", "JavaScript/TypeScript", "Performance", "Accessibility"],
    links: [{
        label: "Git Repo",
        href: "https://github.com/David101111101/Puppeteer-Framework",}],
  }
];

export const experiences: Experience[] = [
  {
    role: "Team Lead & Process Automator",
    company: "Nationwide Marketing Group",
    period: "Feb 25 - Feb 26",
    bullets: [
      "Improved efficiency through workflow optimization, reduced design-to-go-live timelines by 43% while maintaining quality and team morale (9-person remote team).",
      "Oversee Bug, Defect & Feature requests till resolution, to keep projects on track without compromising quality through weekly audits with management.",
      "Constant strategic alignment with Management, Devs, Designers, QA's and CAM's, ensuring conversion-driven, performance-optimized sites that aim at retailer success and revenue growth."
    ]
  },
  {
    role: "E-commerce Websites Migrator",
    company: "Nationwide Marketing Group",
    period: "Mar 24 - Feb 25",
    bullets: [
      "Migrated legacy sites to a modern platform using advanced HTML/CSS/JS; improved responsiveness, SEO baselines & Accessibility under modern design standards relying in AI through LLM's and thorough Quality Assurance to guarantee accuracy.",
      "Proposed workflow improvements adopted by multiple departments like bi-weekly internal upskill sessions, AI custom prompt templates, higher documentation standards & a new Quality Control layer added before pushing a site live.",
      "Recognized as the top-performing team member for successful website migrations."
    ]
  },
  {
    role: "Full stack Software Developer Intern",
    company: "Credencial Business Magazine",
    period: "Jan 14 - Aug 14",
    bullets: [
      "Developed a Java + SQL desktop tool to decrypt/transform/re-encrypt banking data with layered security and role-based visibility."
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
    proof: 
    { 
      label: "View Certificate", 
      href: "https://drive.google.com/file/d/1ecQsbP8TfKjDRvH4kld4rpQGBcyK6iL5/view?usp=sharing"
    }, 
    image: "diplomas/TechnologistDegree.webp"
  },
  { title: "Azure DevOps: CI/CD", 
    issuer: "Platzi", 
    category: "Engineering",  
    proof: { label: "View Certificate", href: "https://platzi.com/p/davidstevenabril/curso/3275-course/diploma/detalle/"}, 
    image: "diplomas/AzureDevopsCDCI-diploma.webp" 
  },
  { title: "QA Automation Engineer", 
    issuer: "Platzi", 
    category: "Engineering",
    proof: { label: "View Certificate",
    href: "https://platzi.com/p/davidstevenabril/ruta/7632-ruta/diploma/detalle/"}, 
    image: "diplomas/QaAutomationEngineer.webp" 
  },
  { title: "Software Quality Assurance Bootcamp",
     issuer: "Jala University",
     category: "QA",   
    proof: { label: "View Certificate", 
    href: "https://drive.google.com/file/d/1xl59g1H-h9vil5txBcSl4fhigCzxZM6n/view?usp=sharing"}, 
    image: "diplomas/QaBootcamp.webp" },
  { 
    title: "Backend Test Automation Course with Cypress", 
    issuer: "Platzi", 
    category: "Automation", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/3076-course/diploma/detalle/" }, 
    image: "diplomas/CypressBackEndAutomation.webp" 
  },
   { 
    title: "Advanced Cypress Frameworks", 
    issuer: "Platzi", 
    category: "Automation", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/4760-course/diploma/detalle/" }, 
    image: "diplomas/AdvancedCypress.webp" 
  },   
  { 
    title: "UI Test Automation with Cypress", 
    issuer: "Platzi", 
    category: "Automation", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/3075-course/diploma/detalle/" }, 
    image: "diplomas/UI-Test-Automation-Cypress.webp" 
  },  
  { 
    title: "Test Automation with Playwright", 
    issuer: "Platzi", 
    category: "Automation", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/5679-course/diploma/detalle/" }, 
    image: "diplomas/TestAutomationPlaywright.webp" 
  },
    { 
    title: "Advanced Test Automation with Puppeteer", 
    issuer: "Platzi", 
    category: "Automation", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/2706-course/diploma/detalle/" }, 
    image: "diplomas/AdvancedPuppeteerAutomation.webp" 
  },
   { 
    title: "How to Get Feedback Audio Course", 
    issuer: "Platzi", 
    category: "Other", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/2482-course/diploma/detalle/" }, 
    image: "diplomas/HowToGetFeedback.webp" 
  },
 
  { 
    title: "Effective Communication for Work Teams", 
    issuer: "Platzi", 
    category: "Other", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/2060-course/diploma/detalle/" }, 
    image: "diplomas/EffectiveCommunication.webp" 
  },
   { 
    title: "Fundamentals of Software Testing",
    issuer: "Platzi",
    category: "QA",  
    proof: { label: "View Certificate", href: "https://platzi.com/p/davidstevenabril/curso/1421-course/diploma/detalle/"}, 
    image: "diplomas/TestingFundamentals.webp" 
    },
  { 
    title: "English (C2 Proficient)", 
    issuer: "EF SET", 
    category: "Other", 
    proof: { label: "View Certificate", 
    href: "https://cert.efset.org/dbRhNU" }, 
    image: "diplomas/EfSetEnglish.webp" 
  },
  { 
    title: "Managing Emotions for Productivity and Organization", 
    issuer: "Platzi", 
    category: "Other", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/2496-course/diploma/detalle/" }, 
    image: "diplomas/Emotionalintelligence.webp" 
  },
  { 
    title: "Performance Testing with K6", 
    issuer: "Platzi", 
    category: "QA", 
    proof: { label: "View Certificate", 
    href: "https://platzi.com/p/davidstevenabril/curso/4657-course/diploma/detalle/" }, 
    image: "diplomas/PerformanceTesting-k6.webp" 
  },
];
