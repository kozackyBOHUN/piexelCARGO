"""Transport/integrity tests only: bytes below are NOT road data or a PBF fixture."""
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location('road_fetch', Path(__file__).with_name('fetch-road-source.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Response(io.BytesIO):
    headers = {'Last-Modified': 'fixture-only'}

    def __init__(self, data, url):
        super().__init__(data)
        self.url = url

    def geturl(self):
        return self.url


class FetchTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.cache, self.lock = self.root/'cache', self.root/'lock.json'
        self.data = b'integrity-test-bytes-not-geographic-data'
        self.requests = []

    def open(self, url, timeout):
        self.requests.append(url)
        value = (hashlib.md5(self.data).hexdigest() + '  source.osm.pbf\n').encode() if url.endswith('.md5') else self.data
        return Response(value, url)

    def initialize(self):
        return module.acquire('demo', self.cache, self.lock, True, self.open)

    def test_initialize_checks_official_digest_and_writes_sha_lock(self):
        result, path = self.initialize()
        self.assertEqual(result['sha256'], hashlib.sha256(self.data).hexdigest())
        self.assertEqual(path.read_bytes(), self.data)
        self.assertEqual(len(self.requests), 2)
        self.assertEqual(json.loads(self.lock.read_text()), result)

    def test_verified_cache_does_not_request_network(self):
        first, path = self.initialize()
        self.requests.clear()
        self.assertEqual(module.acquire('demo', self.cache, self.lock, opener=self.open), (first, path))
        self.assertEqual(self.requests, [])

    def test_existing_lock_cannot_be_reinitialized(self):
        self.initialize()
        original = self.lock.read_bytes()
        with self.assertRaisesRegex(ValueError, 'overwrite'):
            self.initialize()
        self.assertEqual(self.lock.read_bytes(), original)

    def test_changed_source_preserves_previous_cache_and_lock(self):
        _, path = self.initialize()
        original = self.lock.read_bytes()
        path.write_bytes(b'previous-incomplete-cache')
        self.data = b'changed-upstream'
        with self.assertRaisesRegex(ValueError, 'mismatch'):
            module.acquire('demo', self.cache, self.lock, opener=self.open)
        self.assertEqual(self.lock.read_bytes(), original)
        self.assertEqual(path.read_bytes(), b'previous-incomplete-cache')

    def test_wrong_official_md5_does_not_publish_artifact_or_lock(self):
        def incorrect(url, timeout):
            return Response(b'0'*32 if url.endswith('.md5') else self.data, url)
        with self.assertRaisesRegex(ValueError, 'MD5 mismatch'):
            module.acquire('demo', self.cache, self.lock, True, incorrect)
        self.assertFalse(self.lock.exists())
        self.assertFalse((self.cache/'demo.osm.pbf').exists())

    def test_access_denial_does_not_create_lock(self):
        def denied(url, timeout):
            raise HTTPError(url, 403, 'Forbidden', {}, None)
        with self.assertRaises(HTTPError):
            module.acquire('demo', self.cache, self.lock, True, denied)
        self.assertFalse(self.lock.exists())

    def test_scope_mismatch_rejected(self):
        self.initialize()
        with self.assertRaisesRegex(ValueError, 'incompatible'):
            module.acquire('poland', self.cache, self.lock, opener=self.open)

    def test_untrusted_protocol_or_destination_rejected(self):
        for url in ['http://download.geofabrik.de/test', 'https://example.com/test',
                    'https://user@download.geofabrik.de/test']:
            with self.assertRaises(ValueError):
                module.checked_url(url)

    def test_interrupted_download_does_not_replace_cache(self):
        _, path = self.initialize()
        path.write_bytes(b'previous-cache')
        class Interrupted(Response):
            def read(self, size):
                raise OSError('connection interrupted')
        def broken(url, timeout):
            return Interrupted(self.data, url)
        with self.assertRaisesRegex(OSError, 'interrupted'):
            module.acquire('demo', self.cache, self.lock, opener=broken)
        self.assertEqual(path.read_bytes(), b'previous-cache')
        self.assertTrue(self.lock.exists())


if __name__ == '__main__':
    unittest.main()
