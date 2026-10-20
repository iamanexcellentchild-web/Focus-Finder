from django.urls import path

from .views import(

    VideoSearchView,
    WatchHistoryClearView,
    WatchHistoryDetailView,
    WatchHistoryListCreateView,
    RegisterView,
    ProfileView
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="login"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("search/", VideoSearchView.as_view()),
    path("history/", WatchHistoryListCreateView.as_view()),
    path("history/clear/", WatchHistoryClearView.as_view()),
    path("history/<int:pk>/", WatchHistoryDetailView.as_view()),
    
    path("profile/", ProfileView.as_view())

]
