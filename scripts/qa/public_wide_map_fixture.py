"""Tiny deterministic PMTiles v3 fixture; no production map bytes or network."""
import json
import re
import struct


def _varints(*values):
    result = bytearray()
    for value in values:
        while value >= 128:
            result.append((value & 127) | 128)
            value >>= 7
        result.append(value)
    return bytes(result)


def _field(number, body):
    return _varints((number << 3) | 2, len(body)) + body


def build_archive():
    # One z0 vector tile, overscaled at all display zooms. A synthetic
    # rectangle in the water layer exercises MVT decoding without glyph IO.
    geometry = _varints(9, 0, 0, 26, 8192, 0, 0, 8192, 8191, 0, 15)
    feature = _varints(24, 3) + _field(4, geometry)
    layer = _field(1, b'water') + _field(2, feature) + _varints(40, 4096, 120, 2)
    tile = _field(3, layer)
    # Root directory: entry count, tile ID delta, run length, length, offset+1.
    directory = _varints(1, 0, 1, len(tile), 1)
    metadata = json.dumps({'vector_layers': [{'id': 'water', 'fields': {}}]}).encode('utf-8')
    metadata_offset = 127 + len(directory)
    tile_offset = metadata_offset + len(metadata)
    header = struct.pack(
        '<7sB11Q6B4iB2i',
        b'PMTiles', 3, 127, len(directory), metadata_offset, len(metadata),
        tile_offset, 0, tile_offset, len(tile), 1, 1, 1,
        1, 1, 1, 1, 0, 0, # clustered, no compression, MVT, min/max zoom
        -1800000000, -850000000, 1800000000, 850000000, 0, 0, 0,
    )
    return header + directory + metadata + tile, tile_offset


def range_response(archive, value):
    """Return exact HTTP byte-range semantics for PMTiles FetchSource."""
    match = re.fullmatch(r'bytes=([0-9]+)-([0-9]+)', value or '')
    if match:
        start, end = (int(part) for part in match.groups())
        if start <= end and start < len(archive):
            end = min(end, len(archive) - 1)
            return 206, f'bytes {start}-{end}/{len(archive)}', archive[start:end + 1]
    return 416, f'bytes */{len(archive)}', b''
