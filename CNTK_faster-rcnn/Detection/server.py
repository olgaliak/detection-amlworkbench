import json
from predict import get_result, get_model

class Server:
  model = None

  def set_model(self):
    self.model = get_model()

  def server_running(self):
    return 'Server is running...'

  def predict(self, request):
    incoming = request.json
    filename  = incoming['filename']
    print (filename)
    prediction = get_result(filename, self.model)
    print (prediction)
    return prediction