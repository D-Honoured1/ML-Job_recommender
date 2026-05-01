from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import JobInteraction, Notification


@receiver(post_save, sender=JobInteraction)
def create_application_notification(sender, instance, created, **kwargs):
    if not created or instance.interaction_type != "applied":
        return
    try:
        from recommender.models import Job
        job = Job.objects.get(job_id=instance.job_id)
        Notification.objects.create(
            user=instance.user,
            message=(
                f"Your application for {job.job_title} at {job.company} "
                "has been submitted successfully"
            ),
            notification_type="application",
        )
    except Exception:
        pass
