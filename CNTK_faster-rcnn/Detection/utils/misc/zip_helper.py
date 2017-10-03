import zipfile

def unzip_file(filepath, destination):
    print("Unzipping {0} to {1}".format(filepath, destination))
    with zipfile.ZipFile(filepath,"r") as zip_ref:
        zip_ref.extractall(destination)