#!/usr/bin/env python3
"""Extract Poland's actual OSM admin relation, never a drawn/simplified proxy."""
import argparse
import json
from pathlib import Path
import osmium
from shapely.geometry import shape

parser = argparse.ArgumentParser()
parser.add_argument('pbf')
parser.add_argument('output')
a = parser.parse_args()
factory = osmium.geom.GeoJSONFactory()
for item in osmium.FileProcessor(a.pbf).with_locations().with_areas(osmium.filter.TagFilter(('admin_level', '2'))).with_filter(osmium.filter.EntityFilter(osmium.osm.AREA)).with_filter(osmium.filter.TagFilter(('ISO3166-1', 'PL'))):
    if isinstance(item, osmium.osm.Area) and not item.from_way() and item.orig_id() == 49715:
        geometry = json.loads(factory.create_multipolygon(item))
        polygon = shape(geometry)
        if not polygon.is_valid or not 35 < polygon.area < 45:
            raise ValueError('Poland boundary invalid or incomplete')
        Path(a.output).write_text(json.dumps({'type': 'Feature', 'id': 'osm:relation:49715',
            'properties': {'name': 'Polska', 'source': 'OSM relation 49715'}, 'geometry': geometry},
            separators=(',', ':')) + '\n')
        print('Poland OSM boundary:', polygon.bounds, polygon.area)
        break
else:
    raise ValueError('Complete Poland relation 49715 missing: use national extract')
