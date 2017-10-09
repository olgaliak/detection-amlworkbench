import os
import argparse
from misc.azure_utils import load_file_from_blob
from misc.zip_helper import unzip_file
from object_detection.train_eval import main as train_obj
from misc.results_logger import record_results

BLOB = "tfobj"
MODELS_ZIP = "models.zip"
TRAIN_DATA_ZIP = "kw_train_eval.zip"
data_path = os.path.join(os.environ['AZUREML_NATIVE_SHARE_DIRECTORY'], "kw_data")

load_file_from_blob(BLOB, MODELS_ZIP, data_path + MODELS_ZIP)
unzip_file(data_path + MODELS_ZIP, data_path)

load_file_from_blob(BLOB, TRAIN_DATA_ZIP, data_path + TRAIN_DATA_ZIP)
unzip_file(data_path + TRAIN_DATA_ZIP, data_path)
print("Starting training")
train_obj("")

# Get directory where all TF logging events are
parser = argparse.ArgumentParser()
parser.add_argument('--eval_dir', type=str)
args = parser.parse_known_args()
result_dir = args[0].eval_dir
print("Eval dir {0}".format(result_dir))
record_results(result_dir)