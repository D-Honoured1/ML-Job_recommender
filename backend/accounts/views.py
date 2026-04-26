import pdfplumber
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from accounts.models import UserProfile, JobInteraction
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

        # Extract text and parse skills
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