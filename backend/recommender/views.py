from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from recommender.engine import get_recommender
from recommender.models import Job
from recommender.serializers import JobRecommendationSerializer


class RecommendationsView(APIView):
    """
    GET /api/recommendations/?n=10

    Requires a valid JWT. Returns personalised recommendations for the
    authenticated user using the hybrid CBF+CF engine.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        db_user = request.user
        user_id = f"db_{db_user.pk}"

        try:
            n = int(request.query_params.get("n", 10))
        except ValueError:
            return Response({"error": "n must be a valid integer."}, status=400)
        n = max(1, min(n, 50))

        try:
            recommender = get_recommender()
        except RuntimeError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        recommendations = recommender.recommend(user_id=user_id, n=n, db_user=db_user)
        alpha, beta = recommender._dynamic_weights(user_id, db_user=db_user)

        profile_data = {}
        try:
            p = db_user.profile
            profile_data = {
                "username": db_user.username,
                "current_title": p.current_title or "",
                "skills": p.skills or "",
            }
        except Exception:
            profile_data = {"username": db_user.username, "current_title": "", "skills": ""}

        serializer = JobRecommendationSerializer(recommendations, many=True)
        return Response({
            "user_id": user_id,
            "weights": {"alpha": alpha, "beta": beta},
            "count": len(recommendations),
            "recommendations": serializer.data,
            "profile": profile_data,
        })


class JobSearchView(APIView):
    """GET /api/jobs/search/?q=query — returns full job catalogue for Fuse.js"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        jobs = Job.objects.all()
        if q:
            jobs = jobs.filter(
                Q(job_title__icontains=q)
                | Q(company__icontains=q)
                | Q(location__icontains=q)
                | Q(required_skills__icontains=q)
            )
        return Response([{
            "job_id": j.job_id,
            "job_title": j.job_title,
            "company": j.company,
            "location": j.location,
            "required_skills": j.required_skills,
        } for j in jobs])
