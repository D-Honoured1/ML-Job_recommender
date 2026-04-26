from django.urls import path
from recommender.views import RecommendationsView

urlpatterns = [
    path("recommendations/", RecommendationsView.as_view(), name="recommendations"),
]