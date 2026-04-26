from django.contrib.auth.models import User
from rest_framework import serializers
from accounts.models import UserProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    current_title = serializers.CharField(required=False, allow_blank=True, default="")
    education = serializers.CharField(required=False, allow_blank=True, default="")
    skills = serializers.CharField(required=False, allow_blank=True, default="")
    experience_years = serializers.IntegerField(required=False, default=0)

    class Meta:
        model = User
        fields = ["username", "email", "password", "current_title", "education", "skills", "experience_years"]

    def create(self, validated_data):
        profile_data = {
            "current_title": validated_data.pop("current_title", ""),
            "education": validated_data.pop("education", ""),
            "skills": validated_data.pop("skills", ""),
            "experience_years": validated_data.pop("experience_years", 0),
        }
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        UserProfile.objects.create(user=user, **profile_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = UserProfile
        fields = ["username", "email", "current_title", "education", "skills", "experience_years", "resume_file"]
        read_only_fields = ["resume_file"]


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["current_title", "education", "skills", "experience_years"]
