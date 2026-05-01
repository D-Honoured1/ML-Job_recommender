import pdfplumber
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from accounts.models import UserProfile, JobInteraction, Review, Notification
from accounts.serializers import RegisterSerializer, UserProfileSerializer, ProfileUpdateSerializer


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class RegisterView(APIView):
    """POST /api/auth/register/"""

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        return Response(
            {"message": "Account created.", **_tokens_for_user(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/auth/login/"""

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")
        if not username or not password:
            return Response({"error": "username and password are required."}, status=400)

        from django.contrib.auth import authenticate
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({"error": "Invalid credentials."}, status=401)
        return Response(_tokens_for_user(user))


class LogoutView(APIView):
    """POST /api/auth/logout/ — blacklist the refresh token"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "refresh token required."}, status=400)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            pass
        return Response({"message": "Logged out."})


class ProfileView(APIView):
    """GET/PUT /api/auth/profile/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(UserProfileSerializer(profile).data)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(UserProfileSerializer(profile).data)


class ResumeUploadView(APIView):
    """POST /api/auth/profile/resume/"""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if "resume" not in request.FILES:
            return Response({"error": "No file uploaded."}, status=400)

        file = request.FILES["resume"]
        if not file.name.lower().endswith(".pdf"):
            return Response({"error": "Only PDF files are accepted."}, status=400)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.resume_file = file
        profile.save()

        extracted_skills = []
        try:
            with pdfplumber.open(file) as pdf:
                text = " ".join(page.extract_text() or "" for page in pdf.pages)
            KNOWN_SKILLS = [
                "Python", "Django", "Flask", "JavaScript", "TypeScript", "React", "Vue", "Angular",
                "Node.js", "Express", "HTML", "CSS", "SQL", "PostgreSQL", "MySQL", "MongoDB",
                "REST APIs", "Git", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform",
                "Linux", "CI/CD", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
                "scikit-learn", "Pandas", "NumPy", "NLP", "spaCy", "NLTK", "Transformers",
                "Java", "Spring Boot", "C#", ".NET", "Go", "Kotlin", "Swift", "PHP", "Laravel",
                "Ruby", "Rails", "Scala", "Apache Spark", "Airflow", "Hadoop", "Power BI",
                "Excel", "JIRA", "Agile", "Scrum", "Figma", "Adobe XD", "Selenium",
                "Penetration Testing", "Solidity", "Web3.js", "C", "C++",
            ]
            text_lower = text.lower()
            for skill in KNOWN_SKILLS:
                if skill.lower() in text_lower:
                    extracted_skills.append(skill)
        except Exception:
            pass

        if extracted_skills:
            existing = [s.strip() for s in profile.skills.split(";") if s.strip()]
            merged = list(dict.fromkeys(existing + extracted_skills))
            profile.skills = ";".join(merged)
            profile.save()

        return Response({
            "message": "Resume uploaded.",
            "extracted_skills": extracted_skills,
            "skills": profile.skills,
        })


class JobInteractView(APIView):
    """POST /api/jobs/interact/"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        job_id = request.data.get("job_id", "").strip()
        interaction_type = request.data.get("interaction_type", "viewed")
        if not job_id:
            return Response({"error": "job_id is required."}, status=400)
        if interaction_type not in ("viewed", "applied"):
            interaction_type = "viewed"

        JobInteraction.objects.create(
            user=request.user,
            job_id=job_id,
            interaction_type=interaction_type,
        )
        return Response({"message": "Interaction recorded."}, status=201)


class ApplicationsView(APIView):
    """GET /api/applications/ — all applied jobs for the logged-in user"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from recommender.models import Job

        interactions = JobInteraction.objects.filter(
            user=request.user, interaction_type="applied"
        )
        seen = set()
        result = []
        for interaction in interactions:
            if interaction.job_id in seen:
                continue
            seen.add(interaction.job_id)
            try:
                job = Job.objects.get(job_id=interaction.job_id)
                result.append({
                    "job_id": interaction.job_id,
                    "job_title": job.job_title,
                    "company": job.company,
                    "location": job.location,
                    "applied_at": interaction.timestamp,
                    "status": "Application Submitted",
                })
            except Job.DoesNotExist:
                pass
        return Response(result)


class ReviewView(APIView):
    """GET/POST /api/reviews/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from recommender.models import Job

        reviews = Review.objects.filter(user=request.user)
        result = []
        for review in reviews:
            try:
                job = Job.objects.get(job_id=review.job_id)
                result.append({
                    "id": review.id,
                    "job_id": review.job_id,
                    "job_title": job.job_title,
                    "company": job.company,
                    "rating": review.rating,
                    "comment": review.comment,
                    "created_at": review.created_at,
                })
            except Job.DoesNotExist:
                pass
        return Response(result)

    def post(self, request):
        job_id = request.data.get("job_id", "").strip()
        rating = request.data.get("rating")
        comment = request.data.get("comment", "")

        if not job_id:
            return Response({"error": "job_id is required."}, status=400)
        if rating is None:
            return Response({"error": "rating is required."}, status=400)
        try:
            rating = int(rating)
        except (TypeError, ValueError):
            return Response({"error": "rating must be a number."}, status=400)
        if not 1 <= rating <= 5:
            return Response({"error": "rating must be between 1 and 5."}, status=400)

        review, created = Review.objects.update_or_create(
            user=request.user,
            job_id=job_id,
            defaults={"rating": rating, "comment": comment},
        )
        return Response({"message": "Review saved.", "id": review.id}, status=201 if created else 200)


class NotificationsView(APIView):
    """GET /api/notifications/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        return Response([{
            "id": n.id,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at,
            "notification_type": n.notification_type,
        } for n in notifications])


class NotificationsMarkReadView(APIView):
    """POST /api/notifications/mark-read/"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read."})
