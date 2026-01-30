# Configuration des Tuiles Locales pour le Tileserver

## Problème
Le style actuel utilise `tile.openstreetmap.org` qui nécessite une connexion Internet. Pour fonctionner en mode local, vous devez télécharger des tuiles locales.

## Solution : Télécharger des tuiles MBTiles pour Madagascar

### Option 1 : OpenMapTiles (Recommandé)

1. **Télécharger les tuiles pour Madagascar**
   - Aller sur https://data.maptiler.com/downloads/planet/
   - Ou extraire la région de Madagascar : https://openmaptiles.com/downloads/

2. **Placer le fichier MBTiles**
   ```
   Infrastructure/
   └── madagascar.mbtiles
   ```

3. **Mettre à jour config.json**
   ```json
   {
     "options": {
       "paths": {
         "root": "",
         "styles": "styles",
         "fonts": "fonts",
         "sprites": "sprites",
         "mbtiles": ""
       }
     },
     "styles": {
       "basic": {
         "style": "basic/style.json",
         "serve_rendered": true
       }
     },
     "data": {
       "madagascar": {
         "mbtiles": "madagascar.mbtiles"
       }
     }
   }
   ```

4. **Mettre à jour le style (basic/style.json)**
   ```json
   {
     "version": 8,
     "name": "Madagascar Local",
     "center": [47.5079, -18.8792],
     "zoom": 11,
     "sources": {
       "openmaptiles": {
         "type": "vector",
         "url": "mbtiles://madagascar"
       }
     },
     "layers": [
       {
         "id": "background",
         "type": "background",
         "paint": {
           "background-color": "#f8f4f0"
         }
       },
       {
         "id": "water",
         "type": "fill",
         "source": "openmaptiles",
         "source-layer": "water",
         "paint": {
           "fill-color": "#a0c8f0"
         }
       },
       {
         "id": "landuse",
         "type": "fill",
         "source": "openmaptiles",
         "source-layer": "landuse",
         "paint": {
           "fill-color": "#e0e0e0"
         }
       },
       {
         "id": "roads",
         "type": "line",
         "source": "openmaptiles",
         "source-layer": "transportation",
         "paint": {
           "line-color": "#ffffff",
           "line-width": 2
         }
       }
     ],
     "glyphs": "http://localhost:8081/fonts/{fontstack}/{range}.pbf",
     "sprite": "http://localhost:8081/sprites/basic"
   }
   ```

### Option 2 : Générer des tuiles avec OpenStreetMap data

1. **Télécharger les données OSM pour Madagascar**
   ```bash
   # Depuis https://download.geofabrik.de/africa/madagascar.html
   wget https://download.geofabrik.de/africa/madagascar-latest.osm.pbf
   ```

2. **Convertir en MBTiles avec tilemaker**
   ```bash
   docker run -it --rm \
     -v $(pwd):/data \
     ghcr.io/felt/tilemaker:latest \
     --input /data/madagascar-latest.osm.pbf \
     --output /data/madagascar.mbtiles
   ```

### Option 3 : Utiliser un cache de tuiles OSM (Solution rapide)

Pour tester rapidement, gardez OpenStreetMap mais ajoutez un cache :

**config.json**
```json
{
  "options": {
    "paths": {
      "root": "",
      "styles": "styles"
    },
    "serveAllStyles": true,
    "frontendCache": true
  },
  "styles": {
    "basic": {
      "style": "basic/style.json",
      "serve_rendered": true
    }
  }
}
```

Cela mettra en cache les tuiles téléchargées d'OpenStreetMap.

## Redémarrer le tileserver

Après toute modification :

```bash
docker-compose restart tileserver
```

Ou

```bash
docker-compose down tileserver
docker-compose up tileserver -d
```

## Vérification

```bash
# Vérifier que le tileserver répond
curl http://localhost:8081/styles.json

# Vérifier qu'une tuile est servie
curl http://localhost:8081/styles/basic/11/1294/1133.png -o test.png
```

## Note

La solution la plus simple pour commencer est l'Option 3 (utiliser OpenStreetMap avec cache). Pour une vraie solution hors ligne, utilisez l'Option 1 avec MBTiles.
