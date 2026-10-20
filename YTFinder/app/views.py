from rest_framework import generics, serializers, status, filters, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.template.context_processors import request
from rest_framework.serializers import Serializer
from rest_framework.exceptions import APIException
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import Permission
from rest_framework.filters import OrderingFilter
from .models import WatchHistory, User
from .serializers import SearchRequestSerializer, WatchHistorySerializer, RegisterSerializer, ProfileSerializer

from .youtube import YouTubeAPIError, search_videos
from django_filters.rest_framework import DjangoFilterBackend

class YouTubeUpstreamError(APIException):
    status_code = 502
    default_detail = "YouTube API request failed."
class VideoSearchView(APIView):
    permission_classes=[permissions.IsAuthenticated]
    def get(self, request):
        params=SearchRequestSerializer(data=request.query_params)
        params.is_valid(raise_exception=True)

        try:
            results=search_videos(
                params.validated_data["q"],
                params.validated_data["max_results"],

            ) 
        except YouTubeAPIError as e:
            raise YouTubeUpstreamError(str(e))
        return Response(results)

class WatchHistoryListCreateView(generics.ListCreateAPIView):
    serializer_class=WatchHistorySerializer
    permission_classes=[permissions.IsAuthenticated]
    filter_backends=[DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields=['title', 'channel_title']
    ordering_fields=['watched_at']
    ordering=['-watched_at']

    def get_queryset(self):
        return WatchHistory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WatchHistoryDetailView(generics.DestroyAPIView):
    serializer_class=WatchHistorySerializer
    permission_classes=[permissions.IsAuthenticated]

    def get_queryset(self):
        return WatchHistory.objects.filter(user=self.request.user)


class WatchHistoryClearView(APIView):
    permission_classes=[permissions.IsAuthenticated]
    def delete(self, request):
        WatchHistory.objects.filter(user=request.user).delete()
        return Response(status=204)



class RegisterView(generics.CreateAPIView):
    
    serializer_class=RegisterSerializer
    permission_classes=[permissions.AllowAny]

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class=ProfileSerializer
    permission_classes=[permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user