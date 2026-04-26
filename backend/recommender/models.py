from django.db import models


class Job(models.Model):
    job_id = models.CharField(max_length=20, unique=True, db_index=True)
    job_title = models.CharField(max_length=300)
    company = models.CharField(max_length=300, blank=True)
    location = models.CharField(max_length=300, blank=True)
    required_skills = models.TextField(blank=True)
    description = models.TextField(blank=True)
    experience = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ["job_id"]

    def __str__(self):
        return f"{self.job_id}: {self.job_title}"
