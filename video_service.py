"""
Micro-service Python ultra-robuste de Telechargement & Extraction Video Sourcing
Supporte: TikTok, Instagram, YouTube, Facebook, Douyin, Alibaba, 1688, etc.
Fournit une video MP4 reelle locale ou directe 100% lisible dans l'extension et l'application.
"""
import os
import sys

# Forcer UTF-8 pour Windows Console
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import json
import re
import urllib.request
import urllib.parse
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
import yt_dlp

PORT = 5005
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "public", "downloaded_videos")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def extract_tiktok_tikwm(url):
    """Extraction directe sans filigrane via TikWM API (haute vitesse)"""
    try:
        api_url = f"https://www.tikwm.com/api/?url={urllib.parse.quote(url)}"
        req = urllib.request.Request(api_url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        })
        with urllib.request.urlopen(req, timeout=10) as response:
            res = json.loads(response.read().decode('utf-8'))
            if res.get('code') == 0 and 'data' in res:
                data = res['data']
                return {
                    'success': True,
                    'title': data.get('title', 'Video TikTok Sourcing'),
                    'directMp4': data.get('play') or data.get('wmplay'),
                    'hdMp4': data.get('hdplay'),
                    'poster': data.get('cover') or data.get('origin_cover'),
                    'author': data.get('author', {}).get('nickname', 'Fournisseur'),
                    'views': f"{data.get('play_count', 0):,} vues",
                    'platform': 'TikTok'
                }
    except Exception as e:
        print(f"[TikWM Error]: {e}")
    return None

def extract_ytdlp(url, download=True):
    """Extraction & telechargement via yt-dlp pour toutes les plateformes"""
    clean_url = url.split('?')[0] if 'tiktok.com' in url else url

    ydl_opts = {
        'format': 'best[ext=mp4]/best',
        'outtmpl': os.path.join(OUTPUT_DIR, '%(extractor)s_%(id)s.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'socket_timeout': 15,
        'headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(clean_url, download=download)
            video_id = info.get('id', 'vid')
            ext = info.get('ext', 'mp4')
            filename = f"{info.get('extractor', 'video')}_{video_id}.{ext}"
            local_path = os.path.join(OUTPUT_DIR, filename)

            # Local URL servie par Vite ou le micro-service
            local_url = f"http://127.0.0.1:{PORT}/videos/{filename}"

            return {
                'success': True,
                'title': info.get('title', 'Video Produit Sourcing'),
                'directMp4': local_url if os.path.exists(local_path) else info.get('url'),
                'localMp4': local_url,
                'poster': info.get('thumbnail'),
                'author': info.get('uploader') or info.get('channel') or 'Fournisseur',
                'platform': info.get('extractor_key', 'Reseau Social'),
                'duration': info.get('duration')
            }
    except Exception as e:
        print(f"[yt-dlp Error]: {e}")
        return {'success': False, 'error': str(e)}

def process_video_request(url):
    """Tente TikWM d'abord pour TikTok (instantane), puis bascule sur yt-dlp"""
    if 'tiktok.com' in url or 'douyin.com' in url:
        tikwm_res = extract_tiktok_tikwm(url)
        if tikwm_res and tikwm_res.get('directMp4'):
            return tikwm_res

    # Fallback ou autres plateformes (YouTube, Instagram, Facebook, etc.)
    ytdl_res = extract_ytdlp(url, download=True)
    if ytdl_res.get('success'):
        return ytdl_res

    # Dernier recours : extraction sans telechargement
    return extract_ytdlp(url, download=False)

class VideoHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass # Éviter les erreurs d'encodage de console Windows

    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        try:
            clean_path = self.path.split('?')[0]

            # 📦 Téléchargement direct du ZIP Extension pour Mobile & PC
            if clean_path.endswith('.zip') or 'extension-sourcing' in clean_path or clean_path == '/download-extension':
                zip_path = os.path.join(BASE_DIR, "dist", "extension-sourcing.zip")
                if not os.path.exists(zip_path):
                    zip_path = os.path.join(BASE_DIR, "public", "extension-sourcing.zip")
                if os.path.exists(zip_path):
                    with open(zip_path, 'rb') as f:
                        zip_bytes = f.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/zip')
                    self.send_header('Content-Disposition', 'attachment; filename="extension-sourcing.zip"')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Length', str(len(zip_bytes)))
                    self.end_headers()
                    self.wfile.write(zip_bytes)
                    return
                else:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({'error': 'ZIP extension not found'}).encode('utf-8'))
                    return

            # 📱 Page web conviviale de téléchargement Mobile & PC
            if self.path == '/download' or self.path == '/install':
                html_content = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Téléchargement Extension App Sourcing</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; background: #0B1120; color: #F8FAFC; padding: 2rem 1rem; text-align: center; }
    .card { max-width: 440px; margin: 0 auto; background: #1E293B; border-radius: 16px; padding: 2rem 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #334155; }
    h1 { font-size: 1.4rem; color: #38BDF8; margin-bottom: 0.5rem; }
    p { font-size: 0.95rem; color: #94A3B8; margin-bottom: 1.5rem; line-height: 1.5; }
    .btn { display: inline-block; width: 100%; padding: 1rem; background: linear-gradient(135deg, #2563EB, #1D4ED8); color: white; text-decoration: none; font-weight: bold; border-radius: 12px; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(37,99,235,0.4); }
    .steps { text-align: left; margin-top: 1.5rem; background: #0F172A; padding: 1rem; border-radius: 10px; font-size: 0.85rem; color: #CBD5E1; }
    .steps ol { padding-left: 1.2rem; margin-top: 0.5rem; }
    .steps li { margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 3rem; margin-bottom: 0.5rem;">⚡</div>
    <h1>App Sourcing Mobile</h1>
    <p>Téléchargez l'extension pour capturer vos produits, vidéos et photos TikTok & Alibaba sur Android.</p>
    <a href="/extension-sourcing.zip" class="btn" download>📥 Télécharger le ZIP (1-Clic)</a>
    <div class="steps">
      <strong>📱 Installation sur Android :</strong>
      <ol>
        <li>Ouvrez <strong>Kiwi Browser</strong> ou <strong>Lemur Browser</strong>.</li>
        <li>Allez dans le menu ➔ <strong>Extensions</strong>.</li>
        <li>Activez le <em>Mode Développeur</em>.</li>
        <li>Cliquez sur <strong>+(from .zip/.crx/.user.js)</strong> et sélectionnez le fichier téléchargé !</li>
      </ol>
    </div>
  </div>
</body>
</html>"""
                html_bytes = html_content.encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(html_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(html_bytes)
                return

            # Servir les videos statiques sur http://<IP>:5005/videos/<filename>
            if self.path.startswith('/videos/'):
                filename = urllib.parse.unquote(self.path.replace('/videos/', ''))
                filepath = os.path.join(OUTPUT_DIR, filename)
                if os.path.exists(filepath):
                    self.send_response(200)
                    self.send_header('Content-Type', 'video/mp4')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Length', str(os.path.getsize(filepath)))
                    self.end_headers()
                    with open(filepath, 'rb') as f:
                        self.wfile.write(f.read())
                    return
                else:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({'error': 'Video file not found'}).encode('utf-8'))
                    return

            # Health check
            self._set_headers(200)
            self.wfile.write(json.dumps({
                'status': 'online',
                'service': 'Python Video Sourcing Downloader',
                'port': PORT,
                'videosDir': OUTPUT_DIR,
                'downloadExtensionUrl': f"http://192.168.100.7:{PORT}/extension-sourcing.zip"
            }).encode('utf-8'))
        except Exception as e:
            try:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            except Exception:
                pass

    def do_POST(self):
        if self.path == '/api/download-video' or self.path == '/api/extract-video':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode('utf-8'))
                video_url = data.get('url')
                if not video_url:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'success': False, 'error': 'Missing url'}).encode('utf-8'))
                    return

                print(f"[Python Service] Telechargement / Extraction pour : {video_url}")
                result = process_video_request(video_url)

                self._set_headers(200)
                self.wfile.write(json.dumps(result).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Not found'}).encode('utf-8'))

if __name__ == '__main__':
    server_address = ('0.0.0.0', PORT)
    httpd = HTTPServer(server_address, VideoHandler)
    print(f"[SUCCESS] Serveur Python Video Sourcing actif sur http://0.0.0.0:{PORT}")
    print(f"[STORAGE] Dossier video: {OUTPUT_DIR}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Arret du serveur.")
