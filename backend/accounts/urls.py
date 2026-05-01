from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    ResumeUploadView,
    JobInteractView,
    ApplicationsView,
    ReviewView,
    NotificationsView,
    NotificationsMarkReadView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/profile/", ProfileView.as_view(), name="profile"),
    path("auth/profile/resume/", ResumeUploadView.as_view(), name="resume_upload"),
    path("jobs/interact/", JobInteractView.as_view(), name="job_interact"),
    path("applications/", ApplicationsView.as_view(), name="applications"),
    path("reviews/", ReviewView.as_view(), name="reviews"),
    path("notifications/", NotificationsView.as_view(), name="notifications"),
    path("notifications/mark-read/", NotificationsMarkReadView.as_view(), name="notifications_mark_read"),
]
