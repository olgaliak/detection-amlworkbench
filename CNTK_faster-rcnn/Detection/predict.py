# Copyright (c) Microsoft. All rights reserved.

# Licensed under the MIT license. See LICENSE.md file in the project root
# for full license information.
# ==============================================================================

import os, sys
import numpy as np
import argparse
#from flask import jsonify
import json
from utils.od_utils import train_object_detector, evaluate_single_image, filter_results
from utils.config_helpers import merge_configs
from utils.misc.azure_utils import load_file_from_blob

available_detectors = ['FastRCNN', 'FasterRCNN']

def get_detector_name(args):
    detector_name = None
    default_detector = 'FasterRCNN'
    if len(args) != 2:
        print("Please provide a detector name as the single argument. Usage:")
        print("    python predict.py <detector_name>")
        print("Available detectors: {}".format(available_detectors))
    else:
        detector_name = args[1]
        if not any(detector_name == x for x in available_detectors):
            print("Unknown detector: {}.".format(detector_name))
            print("Available detectors: {}".format(available_detectors))
            detector_name = None

    if detector_name is None:
        print("Using default detector: {}".format(default_detector))
        return default_detector
    else:
        return detector_name

def get_configuration(detector_name):
    # load configs for detector, base network and data set
    if detector_name == "FastRCNN":
        from FastRCNN.FastRCNN_config import cfg as detector_cfg
    elif detector_name == "FasterRCNN":
        from FasterRCNN.FasterRCNN_config import cfg as detector_cfg
    else:
        print('Unknown detector: {}'.format(detector_name))

    # for VGG16 base model use:         
    from utils.configs.VGG16_config import cfg as network_cfg
    # for AlexNet base model use:       from utils.configs.AlexNet_config import cfg as network_cfg
    #from utils.configs.AlexNet_config import cfg as network_cfg
    # for Pascal VOC 2007 data set use: from utils.configs.Pascal_config import cfg as dataset_cfg
    from utils.configs.CM_config import cfg as dataset_cfg

    return merge_configs([detector_cfg, network_cfg, dataset_cfg, {'DETECTOR': detector_name}])

def get_model():
    cfg = get_configuration('FasterRCNN')#os.environ["DETECTOR_NAME"])
    # train and test
    eval_model = train_object_detector(cfg)
    return eval_model

def get_result(filename, eval_model):
    names = filename.split('/')
    name = names[len(names)-1]
    print (name)
    data_path = os.environ['AZUREML_NATIVE_SHARE_DIRECTORY'] + '/output'
    if os.path.isdir(data_path) == False:
      os.makedirs(data_path)
    img_path = ''
    if load_file_from_blob(os.environ['STORAGE_ACCOUNT_NAME'], \
                        os.environ['TESTIMAGESCONTAINER'], filename, data_path + '/' + name) is True:
      print (name)
    img_path=data_path + '/' + name
    print (img_path)
    #print('detector_name: {}'.format(os.environ["DETECTOR_NAME"]))
    #print('img_path: {}'.format(img_path))
    cfg = get_configuration('FasterRCNN')#os.environ["DETECTOR_NAME"])
    
    # detect objects in single image
    regressed_rois, cls_probs = evaluate_single_image(eval_model, img_path, cfg)
    bboxes, labels, scores = filter_results(regressed_rois, cls_probs, cfg)

    # write detection results to output
    fg_boxes = np.where(labels > 0)
    print("#bboxes: before nms: {}, after nms: {}, foreground: {}".format(len(regressed_rois), len(bboxes), len(fg_boxes[0])))
    result = []
    for i in fg_boxes[0]:
        #print("{:<12} (label: {:<2}), score: {:.3f}, box: {}".format(
                       #cfg["DATA"].CLASSES[labels[i]], labels[i], scores[i], [int(v) for v in bboxes[i]]))
        result.append({'label':cfg["DATA"].CLASSES[labels[i]], 'score':'%.3f'%(scores[i]), 'box':[int(v) for v in bboxes[i]]})

    return json.dumps(result)