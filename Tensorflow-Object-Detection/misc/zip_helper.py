import zipfile
import shutil
import time
from os import rename

def unzip_file(filepath, destination):
    print("Unzipping {0} to {1}".format(filepath, destination))
    with zipfile.ZipFile(filepath,"r") as zip_ref:
        zip_ref.extractall(destination)

def zip_dir(source, add_timestamp=True):
    output_filename = source
    zip = output_filename + ".zip"
    print("Zipping {0} to {1}".format(source, zip))
    shutil.make_archive(output_filename, 'zip', source)
    if add_timestamp:
        timestr = time.strftime("%Y%m%d%H%M%S")
        newName = output_filename + timestr + ".zip"
        print("Add timestamp {}".format(newName))
        print(newName)
        rename(zip, newName)
        zip = newName
    return zip


def append_it(filename, it):
    return "{0}_{2}.{1}".format(*filename.rsplit('.', 1) + it)
