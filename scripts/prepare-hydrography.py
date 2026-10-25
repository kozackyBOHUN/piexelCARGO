#!/usr/bin/env python3
"""Natural Earth 5.1.2 -> clipped Polish hydrography with three LODs.
Requires scripts/requirements-map.txt. Source files must match pinned SHA-256.
"""
import argparse
import hashlib
import json
from pathlib import Path
from shapely import make_valid
from shapely.geometry import shape, mapping

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'rivers': ('ne_10m_rivers_lake_centerlines.geojson', 'bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a'),
    'rivers-europe': ('ne_10m_rivers_europe.geojson', '90712202ac46985812e90840df9acd5101599a9c649868d5bc55ee96c2fedd4c'),
    'lakes': ('ne_10m_lakes.geojson', '2d036f53dedec578001c5c30c2959ee7d4eebc1306900fa4367c49929ec8f2d9'),
    'lakes-europe': ('ne_10m_lakes_europe.geojson', 'b4dd9e7a5edd0d07b54768b5404d1ebe77f80b9d579c85fff65f90cf50369769'),
}
NAMES = {'Vistula': 'Wisła', 'Oder': 'Odra', 'Luzicka Nisa': 'Nysa Łużycka'}
MAJOR = {'Wisła', 'Odra', 'Warta', 'Bug', 'Narew', 'San', 'Dunajec', 'Pilica'}

def rounded(value):
    if isinstance(value, float): return round(value, 5)
    if isinstance(value, (list, tuple)): return [rounded(x) for x in value]
    if isinstance(value, dict): return {k: rounded(v) for k, v in value.items()}
    return value

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-dir', required=True)
    args = parser.parse_args()
    country = make_valid(shape(json.loads((ROOT/'src/world/data/poland.json').read_text())['geometry']))
    features = []
    for key, (filename, sha) in SOURCES.items():
        content = (Path(args.source_dir)/filename).read_bytes()
        if hashlib.sha256(content).hexdigest() != sha: raise ValueError(f'Checksum mismatch: {filename}')
        for f in json.loads(content)['features']:
            original = make_valid(shape(f['geometry']))
            if not original.intersects(country): continue
            geometry = original.intersection(country)
            kind = 'lake' if key.startswith('lakes') else 'river'
            allowed = ('Polygon','MultiPolygon') if kind=='lake' else ('LineString','MultiLineString')
            if geometry.geom_type not in allowed or geometry.is_empty: continue
            props = f['properties']
            name = props.get('name_pl') or props.get('name') or ''
            name = NAMES.get(name, name)
            major = name in MAJOR
            detail = 0 if major else (0 if geometry.area >= 0.004 else 1) if kind=='lake' else 1 if name else 2
            geometries = [mapping(geometry.simplify(tolerance, preserve_topology=True)) for tolerance in [0.012, 0.003, 0.0007]]
            features.append({'id':f"ne:{key}:{props.get('ne_id',props.get('id',len(features)))}",'kind':kind,'name':name,'major':major,'minDetail':detail,'geometries':geometries})
    features.sort(key=lambda f: f['id'])
    assert MAJOR.issubset({f['name'] for f in features})
    result = {'schemaVersion':1,'source':'Natural Earth 5.1.2, public domain','features':features}
    (ROOT/'src/world/data/hydrography.json').write_text(json.dumps(rounded(result), ensure_ascii=False, separators=(',',':'))+'\n')
    print(f"Generated {sum(f['kind']=='river' for f in features)} river features and {sum(f['kind']=='lake' for f in features)} lake/reservoir polygons")

if __name__=='__main__': main()
