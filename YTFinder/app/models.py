import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class SearchHistory(models.Model):
    query=models.CharField(max_length=300)
    created_at=models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering=["-created_at"]
class WatchHistory(models.Model):
    user = models.ForeignKey(
        "app.User",
        on_delete=models.CASCADE,
        related_name="watch_history",
        null=True,
        blank=True,
    )
    youtube_id=models.CharField(max_length=32)
    title=models.CharField(max_length=255)
    channel_title=models.CharField(max_length=255, blank=True)
    thumbnail_url=models.URLField(blank=True)
    watched_at=models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering=["-watched_at"]
    
    def __str__(self):
        return self.title
class User(AbstractUser):
    pass
    