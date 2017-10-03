# Bird Detection with Azure ML Workbench

Object detection using Faster R-CNN APIs in CNTK and Tensorflow.

## Train

If you are using `az ml`, to push models to Azure Blob Storage, add the following to your .runconfig file:

```
EnvironmentVariables:
  "STORAGE_ACCOUNT_NAME": "<YOUR_AZURE_STORAGE_ACCOUNT_NAME>"
  "STORAGE_ACCOUNT_KEY": "<YOUR_AZURE_STORAGE_ACCOUNT_KEY>"
```

To train on different pre-trained models, use this command below:
This submits multiple jobs on each registered pre-trained model in a row

```
  python Detection/FasterRCNN/run_sweep_parameters.py <your_context_name>
```

You can also switch the base model by giving an input argument like 

```
az ml experiment submit -c <your_context_name> Detection/FasterRCNN/run_faster_rcnn.py AlexNet
az ml experiment submit -c <your_context_name> Detection/FasterRCNN/run_faster_rcnn.py VGG16
```

## Predict

### CNTK

Run a prediction web service:

```
$ cd CNTK_faster-rcnn/Detection/
$ docker build -t cmcntk .
$ docker run -v /:/cmcntk -p 80:80 -it cmcntk:latest
# note this will persist the model files in /

```
Now you should have a service running on 
http://localhost

To get prediction of an image:
1. In the same storage account, upload your test image into a container named `data`
2. Make a POST request against the running prediction web service by providing the path of the file in the Azure blob storage container, e.g. birds/testimages/IMG_0010.JPG

```
$ curl -X POST http://<locahost or a public ip>/predict -H 'content-type: application/json' -d '{"filename": "birds/testimages/IMG_0010.JPG"}'

```

### TensorFlow


