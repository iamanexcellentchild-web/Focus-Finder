from django.forms import CharField, ModelForm
from django.contrib.auth.password_validation import validate_password
from rest_framework.serializers import ModelSerializer, Serializer
import re
from rest_framework import serializers
from .models import WatchHistory, User

from django.contrib.auth import get_user_model
User=get_user_model()
class SearchRequestSerializer(serializers.Serializer):
    q=serializers.CharField(max_length=255)
    max_results=serializers.IntegerField(min_value=1, max_value=50, default=10)

    def validate_q(self, value):
        value=value.strip()
        if not value:
            raise serializers.ValidationError("Search query can not be empty")
        return value

class WatchHistorySerializer(serializers.ModelSerializer):
    url=serializers.SerializerMethodField()
    class Meta:
        model=WatchHistory

        fields=["id", "youtube_id", "title", "channel_title", "thumbnail_url", "watched_at", "url"]
        read_only_fields=["id", "watched_at"]

    def get_url(self, obj):
        return f"https://www.youtube.com/watch?v={obj.youtube_id}"
        

class RegisterSerializer(serializers.ModelSerializer):
    password=serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={"input_type": "password"}


    )
    class Meta:
        model=User
        fields=["id", "username", "password", "email"]
    
    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
class ProfileSerializer(serializers.ModelSerializer):
    password=serializers.CharField(
    write_only=True,
    validators=[validate_password],
    style={"input_type": "password"}


    )
    class Meta:
        model=User
        fields=["id", "username", "email", "password"]
        read_only_fields = ["id"]