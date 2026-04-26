import os
import sys

from django.apps import AppConfig


class RecommenderConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "recommender"

    def ready(self) -> None:
        if os.environ.get("SKIP_ENGINE"):
            return
        # Skip during management commands that don't need or can't use the engine
        skip_cmds = {"migrate", "makemigrations", "collectstatic", "load_jobs",
                     "createsuperuser", "shell", "dbshell"}
        if any(cmd in sys.argv for cmd in skip_cmds):
            return

        try:
            import pandas as pd
            from recommender.engine import build_engine
            from recommender.models import Job

            jobs = list(Job.objects.values(
                "job_id", "job_title", "company", "location", "required_skills", "description"
            ))
            if not jobs:
                return  # DB not populated yet — engine stays uninitialised

            job_df = pd.DataFrame(jobs)
            build_engine(job_df)
        except Exception:
            # DB may not exist yet (first migration). Engine will initialise on next start.
            pass
