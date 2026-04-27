import csv
import os
import unicodedata

from django.conf import settings
from django.core.management.base import BaseCommand

from recommender.models import Job

# Ordered rules: first match wins (most specific first)
SKILL_RULES = [
    ("machine learning",     "Python;scikit-learn;TensorFlow;Pandas;NumPy"),
    ("deep learning",        "Python;scikit-learn;TensorFlow;Pandas;NumPy"),
    ("data scientist",       "Python;Machine Learning;Pandas;scikit-learn;Statistics"),
    ("data science",         "Python;Machine Learning;Pandas;scikit-learn;Statistics"),
    ("data engineer",        "Python;Apache Spark;Airflow;SQL;AWS"),
    ("devops",               "Docker;Kubernetes;CI/CD;Linux;Terraform"),
    ("dev ops",              "Docker;Kubernetes;CI/CD;Linux;Terraform"),
    ("full stack",           "JavaScript;React;Node.js;SQL;Git"),
    ("fullstack",            "JavaScript;React;Node.js;SQL;Git"),
    ("cyber security",       "Networking;Python;Linux;Penetration Testing;SIEM"),
    ("cybersecurity",        "Networking;Python;Linux;Penetration Testing;SIEM"),
    ("information security", "Networking;Python;Linux;Penetration Testing;SIEM"),
    ("penetration",          "Networking;Python;Linux;Penetration Testing;SIEM"),
    ("embedded",             "C;C++;Embedded Linux;RTOS;Python"),
    ("android",              "Kotlin;Android;Java;REST APIs;Git"),
    ("react native",         "JavaScript;React;CSS;HTML;TypeScript"),
    ("react",                "JavaScript;React;CSS;HTML;TypeScript"),
    ("angular",              "JavaScript;React;CSS;HTML;TypeScript"),
    ("vue",                  "JavaScript;React;CSS;HTML;TypeScript"),
    ("frontend",             "JavaScript;React;CSS;HTML;TypeScript"),
    ("front end",            "JavaScript;React;CSS;HTML;TypeScript"),
    ("ui ux",                "Figma;Adobe XD;Prototyping;CSS;User Research"),
    ("web design",           "Figma;Adobe XD;Prototyping;CSS;User Research"),
    ("ux design",            "Figma;Adobe XD;Prototyping;CSS;User Research"),
    ("designer",             "Figma;Adobe XD;Prototyping;CSS;User Research"),
    ("ios",                  "Swift;iOS;Xcode;REST APIs;Git"),
    ("swift",                "Swift;iOS;Xcode;REST APIs;Git"),
    ("node.js",              "Node.js;REST APIs;SQL;Git;Express"),
    ("nodejs",               "Node.js;REST APIs;SQL;Git;Express"),
    ("php",                  "PHP;Laravel;MySQL;HTML;CSS"),
    ("laravel",              "PHP;Laravel;MySQL;HTML;CSS"),
    ("django",               "Python;Django;REST APIs;Git"),
    ("flask",                "Python;Django;REST APIs;Git"),
    ("python",               "Python;Django;REST APIs;Git"),
    (".net",                 "C#;.NET;SQL;REST APIs;Azure"),
    ("c#",                   "C#;.NET;SQL;REST APIs;Azure"),
    ("dotnet",               "C#;.NET;SQL;REST APIs;Azure"),
    ("kotlin",               "Kotlin;Android;Java;REST APIs;Git"),
    ("java",                 "Java;Spring Boot;SQL;Maven;Git"),
    ("spring",               "Java;Spring Boot;SQL;Maven;Git"),
    ("aws",                  "AWS;Azure;Terraform;Docker;Linux"),
    ("gcp",                  "Docker;Kubernetes;CI/CD;Linux;Terraform"),
    ("kubernetes",           "Docker;Kubernetes;CI/CD;Linux;Terraform"),
    ("docker",               "Docker;Kubernetes;CI/CD;Linux;Terraform"),
    ("terraform",            "Docker;Kubernetes;CI/CD;Linux;Terraform"),
    ("cloud",                "AWS;Azure;Terraform;Docker;Linux"),
    ("azure",                "AWS;Azure;Terraform;Docker;Linux"),
    ("sap",                  "SAP;ABAP;SQL;Business Analysis;ERP"),
    ("erp",                  "SAP;ABAP;SQL;Business Analysis;ERP"),
    ("salesforce",           "SAP;ABAP;SQL;Business Analysis;ERP"),
    ("hadoop",               "Python;Apache Spark;Airflow;SQL;AWS"),
    ("spark",                "Python;Apache Spark;Airflow;SQL;AWS"),
    ("airflow",              "Python;Apache Spark;Airflow;SQL;AWS"),
    ("postgresql",           "SQL;PostgreSQL;MySQL;MongoDB;Performance Tuning"),
    ("mysql",                "SQL;PostgreSQL;MySQL;MongoDB;Performance Tuning"),
    ("mongodb",              "SQL;PostgreSQL;MySQL;MongoDB;Performance Tuning"),
    ("database",             "SQL;PostgreSQL;MySQL;MongoDB;Performance Tuning"),
    ("dba",                  "SQL;PostgreSQL;MySQL;MongoDB;Performance Tuning"),
    ("network",              "Networking;Windows;Linux;Active Directory;Troubleshooting"),
    ("it support",           "Networking;Windows;Linux;Active Directory;Troubleshooting"),
    ("technical support",    "Networking;Windows;Linux;Active Directory;Troubleshooting"),
    ("system admin",         "Networking;Windows;Linux;Active Directory;Troubleshooting"),
    ("sysadmin",             "Networking;Windows;Linux;Active Directory;Troubleshooting"),
    ("quality assurance",    "Selenium;Python;JIRA;Test Planning;Automation"),
    ("test engineer",        "Selenium;Python;JIRA;Test Planning;Automation"),
    ("automation test",      "Selenium;Python;JIRA;Test Planning;Automation"),
    ("selenium",             "Selenium;Python;JIRA;Test Planning;Automation"),
    (" qa ",                 "Selenium;Python;JIRA;Test Planning;Automation"),
    (" qc ",                 "Selenium;Python;JIRA;Test Planning;Automation"),
    ("power bi",             "SQL;Excel;Power BI;Business Analysis;JIRA"),
    ("tableau",              "SQL;Excel;Power BI;Business Analysis;JIRA"),
    ("data analyst",         "SQL;Excel;Power BI;Business Analysis;JIRA"),
    ("business analyst",     "SQL;Excel;Power BI;Business Analysis;JIRA"),
    ("sql",                  "SQL;PostgreSQL;MySQL;MongoDB;Performance Tuning"),
    ("project manager",      "Agile;Scrum;JIRA;MS Project;Stakeholder Management"),
    ("program manager",      "Agile;Scrum;JIRA;MS Project;Stakeholder Management"),
    ("scrum master",         "Agile;Scrum;JIRA;MS Project;Stakeholder Management"),
    ("c++",                  "C;C++;Embedded Linux;RTOS;Python"),
    ("manager",              "Leadership;Strategy;Stakeholder Management;Agile;Budgeting"),
    ("director",             "Leadership;Strategy;Stakeholder Management;Agile;Budgeting"),
    ("head of",              "Leadership;Strategy;Stakeholder Management;Agile;Budgeting"),
    ("vp ",                  "Leadership;Strategy;Stakeholder Management;Agile;Budgeting"),
    ("chief",                "Leadership;Strategy;Stakeholder Management;Agile;Budgeting"),
    ("sales",                "Leadership;Strategy;Stakeholder Management;Agile;Budgeting"),
]

DEFAULT_SKILLS = "IT Skills;Problem Solving;Communication;Project Management;SQL"

DESCRIPTIONS = [
    "We are looking for a talented {title} to join our growing team. You will work with {s1} and {s2} to deliver high-quality solutions.",
    "Join our team as a {title} and help us build cutting-edge products. Strong expertise in {s1} and {s2} required.",
    "As a {title}, you will design, develop, and maintain scalable systems. Proficiency in {s1} and {s2} is essential.",
    "Exciting opportunity for a {title}. You will collaborate with cross-functional teams and apply your {s1} and {s2} expertise.",
]


def _sanitize(text: str) -> str:
    """Normalize Unicode and replace characters outside Latin-1 with ASCII equivalents."""
    replacements = {
        "–": "-", "—": "-", "―": "-",
        "‘": "'", "’": "'",
        "“": '"', "”": '"',
        " ": " ", "…": "...",
    }
    for char, repl in replacements.items():
        text = text.replace(char, repl)
    nfkd = unicodedata.normalize("NFKD", text)
    return nfkd.encode("latin-1", errors="replace").decode("latin-1")


def _derive_skills(title: str) -> str:
    t = f" {title.lower()} "
    for keyword, skills in SKILL_RULES:
        if keyword in t:
            return skills
    return DEFAULT_SKILLS


def _make_description(title: str, skills: str, idx: int) -> str:
    skill_list = [s.strip() for s in skills.split(";") if s.strip()]
    s1 = skill_list[0] if len(skill_list) > 0 else "IT Skills"
    s2 = skill_list[1] if len(skill_list) > 1 else "Problem Solving"
    template = DESCRIPTIONS[idx % len(DESCRIPTIONS)]
    return template.format(title=title, s1=s1, s2=s2)


class Command(BaseCommand):
    help = "Load jobs from data/IT_jobs.csv into the database"

    def handle(self, *args, **options):
        csv_path = os.path.join(settings.BASE_DIR, "data", "IT_jobs.csv")
        if not os.path.exists(csv_path):
            self.stderr.write(self.style.ERROR(f"IT_jobs.csv not found at {csv_path}"))
            return

        self.stdout.write(f"Loading jobs from {csv_path} …")

        Job.objects.all().delete()

        to_create = []
        with open(csv_path, encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=1):
                title = _sanitize((row.get("Job Title") or "").strip())
                company = _sanitize((row.get("Company Name") or "").strip())
                location = _sanitize((row.get("Location") or "").strip())
                experience = _sanitize((row.get("Experience (Years)") or "").strip())

                if not title:
                    continue

                skills = _derive_skills(title)
                description = _make_description(title, skills, i)

                to_create.append(Job(
                    job_id=f"J{i:04d}",
                    job_title=title,
                    company=company,
                    location=location,
                    required_skills=skills,
                    description=description,
                    experience=experience,
                ))

        Job.objects.bulk_create(to_create, batch_size=500)
        self.stdout.write(self.style.SUCCESS(f"Loaded {len(to_create)} jobs into the database."))
