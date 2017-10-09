from os.path import join, isfile
import glob
import os
from azure.storage.blob import BlockBlobService
import datetime

def load_file_from_blob(container, fileName, dest):
    print("Starting download of {0} to {1}...".format(fileName, dest))
    if os.path.isfile(dest):
        print("File {} already exists, skipping download from Azure Blob.".format(dest))
        return False

    blob_service = get_blob_service()
    print("container {0}, fileName {1}, dest {2}".format(container, fileName, dest))
    blob_service.get_blob_to_path(container, fileName, dest)
    return True

def get_blob_service():
  storage_account_name = os.environ['STORAGE_ACCOUNT_NAME']
  storage_account_key =  os.environ['STORAGE_ACCOUNT_KEY']
  return BlockBlobService(account_name=storage_account_name, account_key=storage_account_key)

def upload_checkpoint_files(dir_path):
    blob_service = get_blob_service()
    files = os.listdir(dir_path)
    for file in files:
        blob_service.create_blob_from_path('tf_checkpoints', file, os.path.join(dir_path, file))


def upload_checkpoint_file(file_path, file_name, add_timestamp=True):
    blob_service = get_blob_service()
    if add_timestamp:
        file_name += datetime.datetime.now().isoformat()
    print("file name {0}, file path {1}".format(file_name, file_path))
    blob_service.create_blob_from_path('tfcheckpoints', file_name , file_path)
    print("Uploaded eval model at tfcheckpoints/%s" % file_name)


def delete_existing_blobs():
  blob_service = get_blob_service()  
  generator = blob_service.list_blobs('tfcheckpoints')
  for blob in generator:
    blob_service.delete_blob('tfcheckpoints', blob.name)

