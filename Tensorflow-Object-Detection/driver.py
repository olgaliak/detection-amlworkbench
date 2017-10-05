import json
import tensorflow as tf
import numpy as np
import os
from PIL import Image
import urllib.request

PATH_TO_LABELS = os.path.join("./pascal_label_map.pbtxt")

def init():

    global detection_graph

    detection_graph = tf.Graph()
    with detection_graph.as_default():
        od_graph_def = tf.GraphDef()
        with tf.gfile.GFile('frozen_inference_graph.pb', 'rb') as fid:
            serialized_graph = fid.read()
            od_graph_def.ParseFromString(serialized_graph)
            tf.import_graph_def(od_graph_def, name='')

def load_image_into_numpy_array(image):
  (im_width, im_height) = image.size
  return np.array(image.getdata()).reshape(
      (im_height, im_width, 3)).astype(np.uint8)

def process_bounding_box(box):
    ymin, xmin, ymax, xmax = box
    (left, right, top, bottom) = (xmin * 850, xmax * 850, ymin * 850, ymax * 850)
    return (left, right, top, bottom)

def run(input_string):
    try:
        input_list = json.loads(input_string)
    except ValueError:
        return "Bad input: Expecting a json encoded list of lists."

    with detection_graph.as_default():
        with tf.Session(graph=detection_graph) as sess:
            # Definite input and output Tensors for detection_graph
            image_tensor = detection_graph.get_tensor_by_name('image_tensor:0')
            # Each box represents a part of the image where a particular object was detected.
            detection_boxes = detection_graph.get_tensor_by_name('detection_boxes:0')
            # Each score represent how level of confidence for each of the objects.
            # Score is shown on the result image, together with the class label.
            detection_scores = detection_graph.get_tensor_by_name('detection_scores:0')
            detection_classes = detection_graph.get_tensor_by_name('detection_classes:0')
            num_detections = detection_graph.get_tensor_by_name('num_detections:0')

            urllib.request.urlretrieve(input_list['input'], "image.jpg")
            image = Image.open("./image.jpg")
            # the array based representation of the image will be used later in order to prepare the
            # result image with boxes and labels on it.
            image_np = load_image_into_numpy_array(image)
            # Expand dimensions since the model expects images to have shape: [1, None, None, 3]
            image_np_expanded = np.expand_dims(image_np, axis=0)
            # Actual detection.
            (boxes, scores, classes, num_detections) = sess.run(
            [detection_boxes, detection_scores, detection_classes, num_detections],
            feed_dict={image_tensor: image_np_expanded})

            boxes, scores, classes, num_detections = map(np.squeeze, [boxes, scores, classes, num_detections])

            results = []

            for i in range(int(num_detections)):
                if scores[i] < 0.05:
                    continue
                left, right, top, bottom = process_bounding_box(boxes[i])
                results.append([left, right, top, bottom])

            return '{"output":' + '"'  + json.dumps(results) + '"}'
