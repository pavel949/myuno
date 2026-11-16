"""Local denying proxy: never resolves or connects to an upstream host."""
from contextlib import contextmanager
from socketserver import BaseRequestHandler, ThreadingTCPServer
from threading import Thread
from urllib.parse import urlparse

@contextmanager
def denying_proxy():
 requests=[]
 class Handler(BaseRequestHandler):
  def handle(self):
   self.request.settimeout(3)
   try:
    line=self.request.recv(8192).split(b'\r\n',1)[0].decode('ascii','replace')
    parts=line.split()
    method=parts[0] if parts else 'EMPTY'
    target=parts[1] if len(parts)>1 else ''
    authority=target if method=='CONNECT' else urlparse(target).netloc
    requests.append({'requestLine':f'{method} {authority} [path omitted]','action':'denied locally; no upstream connection'})
    self.request.sendall(b'HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\nConnection: close\r\n\r\n')
   except OSError:pass
 class Server(ThreadingTCPServer):
  allow_reuse_address=True
  daemon_threads=True
 server=Server(('127.0.0.1',0),Handler)
 thread=Thread(target=server.serve_forever,daemon=True);thread.start()
 class Guard:
  url=f'http://127.0.0.1:{server.server_address[1]}'
 guard=Guard();guard.requests=requests
 try:yield guard
 finally:server.shutdown();server.server_close();thread.join(timeout=3)
