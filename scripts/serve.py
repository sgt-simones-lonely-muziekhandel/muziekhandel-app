"""Serve the game locally: python3 scripts/serve.py [port], then open http://localhost:8765.

Like `python3 -m http.server`, but it tells the browser to check every file for a newer version
each time. Without that the browser keeps old copies of the scripts for a while, so after a
change (or a git pull) it can run a mix of old and new code even after a normal refresh.
"""
import functools
import http.server
import os
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    handler = functools.partial(NoCacheHandler, directory=root)
    print(f'Serving the game on http://localhost:{port}')
    http.server.ThreadingHTTPServer(('', port), handler).serve_forever()
