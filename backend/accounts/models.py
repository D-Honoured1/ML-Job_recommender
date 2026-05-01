from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    current_title = models.CharField(max_length=200, blank=True)
    education = models.CharField(max_length=200, blank=True)
    skills = models.TextField(blank=True, help_text="Semicolon-separated skill list")
    experience_years = models.PositiveIntegerField(default=0)
    resume_file = models.FileField(upload_to="resumes/", blank=True, null=True)

    def __str__(self):
        return f"Profile({self.user.username})"


class JobInteraction(models.Model):
    INTERACTION_TYPES = [
        ("viewed", "Viewed"),
        ("applied", "Applied"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="job_interactions")
    job_id = models.CharField(max_length=20)
    interaction_type = models.CharField(max_length=10, choices=INTERACTION_TYPES, default="viewed")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [models.Index(fields=["user", "job_id"])]

    def __str__(self):
        return f"{self.user.username} → {self.job_id} ({self.interaction_type})"


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    job_id = models.CharField(max_length=20)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [("user", "job_id")]

    def __str__(self):
        return f"Review by {self.user.username} for {self.job_id} ({self.rating}/5)"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("application", "Application"),
        ("system", "System"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    notification_type = models.CharField(
        max_length=20, choices=NOTIFICATION_TYPES, default="system"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification({self.user.username}): {self.message[:50]}"
