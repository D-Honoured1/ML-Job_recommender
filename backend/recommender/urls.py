from django.urls import path
from recommender.views import RecommendationsView, JobSearchView

urlpatterns = [
    path("recommendations/", RecommendationsView.as_view(), name="recommendations"),
    path("jobs/search/", JobSearchView.as_view(), name="job_search"),
]
