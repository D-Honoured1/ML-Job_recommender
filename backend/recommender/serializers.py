from rest_framework import serializers


class JobRecommendationSerializer(serializers.Serializer):
    """Serializes a single job recommendation produced by HybridRecommender."""

    job_id = serializers.CharField()
    job_title = serializers.CharField()
    company = serializers.CharField()
    location = serializers.CharField()
    required_skills = serializers.CharField(
        help_text="Semicolon-separated list of skills, e.g. 'Python;Django;REST APIs'"
    )
    match_score = serializers.FloatField(
        help_text="Hybrid similarity score in [0, 1]"
    )
    cbf_pct = serializers.FloatField(default=1.0, help_text="Fraction of score from content-based filtering")
    cf_pct = serializers.FloatField(default=0.0, help_text="Fraction of score from collaborative filtering")
    apply_url = serializers.CharField()
    recommendation_driver = serializers.CharField(default="skills_match")
    recommendation_reason = serializers.CharField(default="")