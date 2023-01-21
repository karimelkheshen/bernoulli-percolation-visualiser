import http.server
import socketserver
import socket

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(0)
    try:
        # doesn't even have to be reachable
        s.connect(('10.254.254.254', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP


# Define the server address and port
HOST_NAME = "0.0.0.0" # Listen on all available network interfaces
PORT_NUMBER = 8000

# Create a new handler
class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_my_headers()
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    def send_my_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")

# Create a new server
with socketserver.TCPServer((HOST_NAME, PORT_NUMBER), MyHandler) as httpd:
    print(f"Server running at http://{get_ip()}:{PORT_NUMBER}")
    httpd.serve_forever()
