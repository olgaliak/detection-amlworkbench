import sys
from sanic import Sanic
from sanic.response import json, text
from sanic.config import Config
from server import Server
import server

def main():
  app = Sanic(__name__)
  Config.KEEP_ALIVE = False

  server = Server()
  server.set_model()

  @app.route('/')
  async def test(request):
      return text(server.server_running())

  @app.route('/predict', methods=["POST",])
  def post_json(request):
      return json(server.predict(request))

  app.run(host= '0.0.0.0', port=80)
  print ('exiting...')
  sys.exit(0)

if __name__ == '__main__':
  main()