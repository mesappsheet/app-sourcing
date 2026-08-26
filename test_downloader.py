import urllib.request
import urllib.parse
import json
import re
import requests

def test_api_tikwm(url):
    print("Testing TikWM...")
    try:
        r = requests.post("https://www.tikwm.com/api/", data={"url": url}, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/javascript, */*; q=0.01"
        }, timeout=10)
        print("TikWM status:", r.status_code)
        if r.status_code == 200:
            data = r.json()
            print("TikWM data:", data.get("code"), data.get("msg"), "play:", data.get("data", {}).get("play"))
            return data.get("data", {}).get("play")
    except Exception as e:
        print("TikWM error:", e)
    return None

def test_api_musicaldown(url):
    print("Testing MusicalDown...")
    try:
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        r1 = session.get("https://musicaldown.com/en", timeout=10)
        form_name = re.search(r'name=\"([a-zA-Z0-9_-]+)\"[^>]*placeholder', r1.text)
        form_token = re.search(r'name=\"([a-zA-Z0-9_-]+)\"\s+value=\"([a-zA-Z0-9_-]+)\"', r1.text)
        print("MusicalDown fields:", form_name.group(1) if form_name else None)
    except Exception as e:
        print("MusicalDown error:", e)

def test_tiktok_direct_mobile(video_id):
    print("Testing TikTok Mobile API for ID:", video_id)
    try:
        api = f"https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id={video_id}"
        r = requests.get(api, headers={
            "User-Agent": "com.zhiliaoapp.musically/2022600030 (Linux; U; Android 7.1.2; es_ES; SM-G988N; Build/NRD90M;tt-ok/3.12.13.1)",
            "Accept-Encoding": "gzip"
        }, timeout=10)
        print("Mobile API status:", r.status_code)
        if r.status_code == 200:
            res = r.json()
            aweme = res.get("aweme_list", [{}])[0]
            video = aweme.get("video", {})
            play_addr = video.get("play_addr", {}).get("url_list", [])
            print("Play URLs count:", len(play_addr))
            if play_addr:
                print("Direct Video URL:", play_addr[0][:120])
                return play_addr[0]
    except Exception as e:
        print("Mobile API error:", e)
    return None

if __name__ == "__main__":
    test_url = "https://www.tiktok.com/@tiktok/video/7106594312292453678"
    vid_id = "7106594312292453678"
    test_api_tikwm(test_url)
    direct_url = test_tiktok_direct_mobile(vid_id)
    if direct_url:
        print("SUCCESS! Mobile API works directly!")
