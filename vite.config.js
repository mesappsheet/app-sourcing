import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { scrapeProductInfo } from './src/server/productExtractor.js';

function scraperApiPlugin() {
  return {
    name: 'scraper-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/extract', async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { url } = JSON.parse(body || '{}');
              if (!url) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'URL requise' }));
                return;
              }

              // 1. Exécution du Bot Python Intelligent en priorité
              const scriptPath = path.resolve(process.cwd(), 'src/server/scraper_bot.py');
              
              execFile('python', [scriptPath, url], { encoding: 'utf-8', timeout: 15000 }, async (error, stdout, stderr) => {
                if (!error && stdout && stdout.trim().startsWith('{')) {
                  try {
                    const parsed = JSON.parse(stdout.trim());
                    if (!parsed.error) {
                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'application/json; charset=utf-8');
                      res.end(JSON.stringify(parsed));
                      return;
                    }
                  } catch (e) {}
                }

                // 2. Repli vers le moteur Node.js si Python rencontre un souci
                try {
                  const data = await scrapeProductInfo(url);
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify(data));
                } catch (fallbackErr) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: fallbackErr.message || 'Erreur d\'extraction' }));
                }
              });

            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Erreur lors de l\'extraction' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });

      // Endpoint pour recevoir les données extraites directement depuis le navigateur de l'utilisateur (0 Captcha)
      let lastLiveImport = null;

      server.middlewares.use('/api/import-live', async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              lastLiveImport = { ...data, timestamp: Date.now() };
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Données reçues en direct !' }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else if (req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(lastLiveImport || {}));
        }
      });

      // 🗄️ API Base de Données Disque Permanente pour Dossiers Lourds (Sans limite de taille)
      const DB_FILE = path.resolve(process.cwd(), 'src/data/products_db.json');

      server.middlewares.use('/api/products-db', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          try {
            if (fs.existsSync(DB_FILE)) {
              const content = fs.readFileSync(DB_FILE, 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(content);
            } else {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ products: [] }));
            }
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, count: parsed.products?.length || 0 }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), scraperApiPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
