import { InterviewMode } from './types';

export const INTERVIEW_MODES: InterviewMode[] = [
  {
    id: 'A',
    label: 'Mode A — Realistic Mock Interview (Default)',
    name: 'Realistic Mock Interview',
    shortDesc: 'Hiring manager simulation. 1 question at a time, minimal coaching until the final report.',
    fullDesc: 'Simulates a real high-stakes technical interview. The interviewer assesses answers strictly, asks adaptive follow-ups, challenges vague claims, and provides the full Section 13 report only at the end.',
    tag: 'Realistic Mock',
  },
  {
    id: 'B',
    label: 'Mode B — Practice with Feedback',
    name: 'Practice with Feedback',
    shortDesc: 'Real-time coaching. Instant evaluation and stronger model answer after each turn.',
    fullDesc: 'Ideal for rapid learning. After every answer you submit, the interviewer provides immediate constructive critique, shows what a top 5% answer looks like, then moves to the next question.',
    tag: 'Real-time Feedback',
  },
  {
    id: 'C',
    label: 'Mode C — Resume-Based Interview',
    name: 'Resume Deep-Dive',
    shortDesc: 'Investigates your projects, tech stack claims, metrics, and individual contributions.',
    fullDesc: 'Probes the architecture, challenges, trade-offs, and personal contributions behind every project and skill listed on your uploaded resume.',
    tag: 'Resume Deep-Dive',
  },
  {
    id: 'D',
    label: 'Mode D — Topic Mastery',
    name: 'Topic Mastery',
    shortDesc: 'Deep progressive drilling into a core technology (SQL, Spark, Python, AWS, etc.).',
    fullDesc: 'Selects a single technology and takes you from fundamentals (Level 1) to edge cases, internal workings, performance tuning, and failure recovery (Level 6).',
    tag: 'Topic Mastery',
  },
  {
    id: 'E',
    label: 'Mode E — SQL or Coding Round',
    name: 'SQL / Coding Challenge',
    shortDesc: 'Hands-on problem solving with test cases, query optimization, and edge cases.',
    fullDesc: 'Interactive coding and SQL queries. The interviewer presents realistic business scenarios, reviews query logic, execution plans, and asks for optimal alternatives.',
    tag: 'Coding / SQL',
  },
  {
    id: 'F',
    label: 'Mode F — Weakness Assessment',
    name: 'Weakness Diagnostic',
    shortDesc: 'Targeted diagnostic questions to uncover your knowledge gaps with a targeted plan.',
    fullDesc: 'Fast diagnostic round to stress-test your baseline across multiple domains, revealing blind spots and generating a prioritized study plan.',
    tag: 'Weakness Diagnostic',
  },
  {
    id: 'G',
    label: 'Mode G — HR & Behavioral Round',
    name: 'HR & Behavioral',
    shortDesc: 'STAR method, communication, accountability, conflicts, and culture fit.',
    fullDesc: 'Evaluates your behavioral answers, collaboration skills, reaction to setbacks, leadership, and how you articulate project experiences using the STAR framework.',
    tag: 'HR / Behavioral',
  },
];

export const SAMPLE_JOB_TITLES = [
  'Junior Data Engineer',
  'Junior Python / Backend Engineer',
  'Entry-Level Full Stack Developer',
  'Data Analyst / BI Developer',
  'Cloud / DevOps Engineer (Junior)',
];

export const SAMPLE_JOB_DESCRIPTION = `Role: Junior Data Engineer
Experience: 0–2 Years
Location: Hybrid

About the Role:
We are seeking a motivated Junior Data Engineer to join our core analytics and data platform team. You will assist in designing, building, and maintaining robust data ingestion and processing pipelines.

Key Responsibilities:
- Build and maintain batch & streaming ETL pipelines using Python and SQL.
- Ingest semi-structured data (JSON, CSV, Parquet) into Amazon S3 and our cloud data warehouse.
- Write modular Spark / PySpark transformations to compute aggregate business metrics.
- Monitor pipeline health, troubleshoot failed DAGs/jobs, and enforce data quality validations.
- Collaborate with Senior Engineers and Analysts to optimize query performance and schema design.

Requirements & Qualifications:
- Solid understanding of SQL (CTEs, Window Functions, Joins, Group By, NULL handling).
- Good programming foundation in Python (OOP, data structures, exception handling).
- Familiarity with cloud services like AWS S3, IAM, Athena, or Glue.
- Conceptual knowledge of Apache Spark, distributed processing, or data modeling.
- Clear communication, debugging mindset, and eager willingness to learn.`;
