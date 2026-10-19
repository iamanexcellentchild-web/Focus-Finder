# youtube.py
import requests
from django.conf import settings

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


class YouTubeAPIError(Exception):
    pass


def search_videos(query, max_results=10):
    try:
        resp = requests.get(
            SEARCH_URL,
            params={
                "part": "snippet",
                "q": query,
                "type": "video",
                "maxResults": max_results,
                "key": settings.YOUTUBE_API_KEY,
            },
            timeout=10,
        )
    except requests.RequestException as e:
        raise YouTubeAPIError(str(e))

    if resp.status_code != 200:
        message = resp.json().get("error", {}).get("message", resp.text)
        raise YouTubeAPIError(message)

    results = []
    for item in resp.json().get("items", []):
        video_id = item["id"]["videoId"]
        snippet = item["snippet"]
        thumbs = snippet.get("thumbnails", {})
        thumb = thumbs.get("high") or thumbs.get("medium") or thumbs.get("default") or {}
        results.append({
            "youtube_id": video_id,
            "title": snippet["title"],
            "channel_title": snippet["channelTitle"],
            "thumbnail_url": thumb.get("url", ""),
            "url": f"https://www.youtube.com/watch?v={video_id}",
        })
    return results