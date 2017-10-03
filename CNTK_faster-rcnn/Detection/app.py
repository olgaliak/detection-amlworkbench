import sys
from flask import Flask, request
from server import Server
import server
from flask_cors import CORS, cross_origin

def main():
  app = Flask(__name__)
  CORS(app)
  server = Server()
  server.set_model()
  
  app.add_url_rule('/', view_func=server.server_running)
  app.add_url_rule('/predict', view_func=server.predict, methods=['POST', 'OPTIONS'])
  app.run(host= '0.0.0.0', port=80)
  print ('exiting...')
  sys.exit(0)
  
if __name__ == '__main__':
  main() 
