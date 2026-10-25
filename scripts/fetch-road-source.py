#!/usr/bin/env python3
"""Fetch real Geofabrik PBF; refuse changed inputs. No game/runtime dependency.
Initialize only after network access is available; never fabricate a source lock.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import urlparse
from urllib.request import urlopen

SOURCES = {
    'demo': 'https://download.geofabrik.de/europe/poland/malopolskie-latest.osm.pbf',
    'poland': 'https://download.geofabrik.de/europe/poland-latest.osm.pbf',
}


def digest(path, algorithm='sha256'):
    value = hashlib.new(algorithm)
    with Path(path).open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def checked_url(url):
    parsed = urlparse(url)
    if (parsed.scheme != 'https' or parsed.hostname != 'download.geofabrik.de'
            or parsed.username or parsed.password or parsed.port is not None):
        raise ValueError('Source must use HTTPS at download.geofabrik.de')
    return url


def download(url, target, opener=urlopen):
    # Destination is always a temporary sibling; failed downloads never replace cache.
    with opener(checked_url(url), timeout=60) as response:
        resolved = checked_url(response.geturl())
        with Path(target).open('wb') as output:
            for block in iter(lambda: response.read(1024 * 1024), b''):
                output.write(block)
        return {
            'resolvedUrl': resolved,
            'lastModified': response.headers.get('Last-Modified'),
            'etag': response.headers.get('ETag'),
        }


def acquire(scope, cache, lock_path, initialize=False, opener=urlopen):
    cache, lock_path = Path(cache), Path(lock_path)
    if initialize and lock_path.exists():
        raise ValueError('Refusing to overwrite an existing source lock')
    expected = None
    if not initialize:
        expected = json.loads(lock_path.read_text(encoding='utf-8'))
        if (expected['scope'] != scope or expected['requestedUrl'] != SOURCES[scope]
                or not re.fullmatch(r'[a-f0-9]{64}', expected['sha256'])):
            raise ValueError('Invalid or incompatible source lock')
    cache.mkdir(parents=True, exist_ok=True)
    destination = cache / f'{scope}.osm.pbf'
    if expected and destination.exists() and digest(destination) == expected['sha256']:
        return expected, destination
    url = expected['resolvedUrl'] if expected else SOURCES[scope]
    with tempfile.TemporaryDirectory(prefix='road-fetch-', dir=cache) as temporary:
        temporary = Path(temporary)
        artifact = temporary / 'source.pbf'
        metadata = download(url, artifact, opener)
        checksum = digest(artifact)
        if artifact.stat().st_size == 0:
            raise ValueError('Empty source artifact')
        if expected:
            if checksum != expected['sha256'] or artifact.stat().st_size != expected['bytes']:
                raise ValueError('SHA-256/size mismatch; cache and lock preserved')
            result = expected
        else:
            official = temporary / 'official.md5'
            download(metadata['resolvedUrl'] + '.md5', official, opener)
            # Geofabrik publishes the PBF digest as a standard md5sum line.
            match = re.fullmatch(r'\s*([a-fA-F0-9]{32})(?:\s+\*?[^\r\n]+)?\s*',
                                 official.read_text(encoding='ascii'))
            if not match or match.group(1).lower() != digest(artifact, 'md5'):
                raise ValueError('Official MD5 mismatch; no source lock created')
            result = {
                'format': 1, 'scope': scope, 'requestedUrl': SOURCES[scope],
                **metadata, 'sha256': checksum, 'bytes': artifact.stat().st_size,
                'officialMd5': match.group(1).lower(),
                'license': 'ODbL-1.0', 'attribution': '© OpenStreetMap contributors',
            }
            lock_path.parent.mkdir(parents=True, exist_ok=True)
            # Exclusive creation prevents an initialization race from changing a lock.
            with lock_path.open('x', encoding='utf-8') as output:
                output.write(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
        os.replace(artifact, destination)
    return result, destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--scope', choices=SOURCES, required=True)
    parser.add_argument('--cache', type=Path, default=Path('/tmp/pixelcargo-roads'))
    parser.add_argument('--lock', type=Path, required=True)
    parser.add_argument('--initialize-lock', action='store_true')
    args = parser.parse_args()
    result, path = acquire(args.scope, args.cache, args.lock, args.initialize_lock)
    print(json.dumps({'path': str(path), **result}, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
