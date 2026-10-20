from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from .models import WatchHistory


class WatchHistoryAPITests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(username="focus-user", password="test-pass-123")
        self.other_user = user_model.objects.create_user(username="other-user", password="test-pass-123")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_history_can_be_created_and_is_scoped_to_the_signed_in_user(self):
        response = self.client.post(
            "/api/history/",
            {
                "youtube_id": "video123",
                "title": "A video worth saving",
                "channel_title": "Focus",
                "thumbnail_url": "https://example.com/thumbnail.jpg",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["url"], "https://www.youtube.com/watch?v=video123")
        self.assertEqual(WatchHistory.objects.filter(user=self.user).count(), 1)

        self.client.force_authenticate(user=self.other_user)
        self.assertEqual(self.client.get("/api/history/").data, [])

    def test_history_clear_only_deletes_the_signed_in_users_videos(self):
        own_video = WatchHistory.objects.create(
            user=self.user,
            youtube_id="mine",
            title="My video",
        )
        other_video = WatchHistory.objects.create(
            user=self.other_user,
            youtube_id="theirs",
            title="Their video",
        )

        response = self.client.delete("/api/history/clear/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(WatchHistory.objects.filter(pk=own_video.pk).exists())
        self.assertTrue(WatchHistory.objects.filter(pk=other_video.pk).exists())

    def test_registration_login_and_profile_work_with_the_frontend_api(self):
        self.client.force_authenticate(user=None)
        password = "Unrelated!Passphrase2026"
        registration = self.client.post(
            "/api/auth/register/",
            {
                "username": "zebra-918",
                "email": "zebra@example.com",
                "password": password,
            },
            format="json",
        )
        self.assertEqual(registration.status_code, 201, registration.data)

        login = self.client.post(
            "/api/auth/login/",
            {"username": "zebra-918", "password": password},
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.data)
        self.assertIn("access", login.data)
        self.assertIn("refresh", login.data)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        profile = self.client.get("/api/profile/")
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data["username"], "zebra-918")
