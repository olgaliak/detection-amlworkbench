# Bird Detection with Azure ML Workbench

Object detection using Faster R-CNN APIs in CNTK and Tensorflow.

## Train

If you are using `az ml`, to push models to Azure Blob Storage, add the following to your .runconfig file:

```
EnvironmentVariables:
  "STORAGE_ACCOUNT_NAME": "<YOUR_AZURE_STORAGE_ACCOUNT_NAME>"
  "STORAGE_ACCOUNT_KEY": "<YOUR_AZURE_STORAGE_ACCOUNT_KEY>"
```
### CNTK
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
### Tensorflow
Here is how to submit training experiment using Tensorflow Object Detection APIs:

```
az ml experiment submit -c <your_context_name> tf_train_eval.py --logtostderr --train_dir=/azureml-share/traindir_no_aug  \
--input_type image_tensor --pipeline_config_path=./kw_data/faster_rcnn_resnet101_no_aug.config   \
--eval_every_n_steps=500 --eval_dir=/azureml-share/eval_no_aug
```

Use different config files in ./kw_data to train with different parameters.
Change _eval_every_n_steps_if you'd like to run evaluation more oftem

> Note: you will need to update conda_dependancies.yaml to point to the location of  TF object detection dist packages.

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
$ curl -X POST http://<localhost or a public ip>/predict -H 'content-type: application/json' -d '{"filename": "birds/testimages/IMG_0010.JPG"}'

```

### TensorFlow

Register provider:

```
az provider register -n Microsoft.MachineLearningCompute
```

Create environment:

VM: 
```
az ml env setup -l [Azure Region, e.g. eastus2] -n [your environment name] [-g [existing resource group]]
```

Azure Container Service (ACS) Kubernetes cluster: 

```
az ml env setup --cluster -n [your environment name] -l [Azure region e.g. eastus2] [-g [resource group]]
```

Set environment:

```
az ml env set -n [environment name] -g [resource group]
```

Create model management:

```
az ml account modelmanagement create -l [Azure region, e.g. eastus2] -n [your account name] -g [resource group name] --sku-instances [number of instances, e.g. 1] --sku-name [Pricing tier for example S1]
```

Create the web service:

```
az ml service create realtime --model-file [model file/folder path] -f [scoring file e.g. score.py] -n [your service name] -s [schema file e.g. service_schema.json] -r [runtime for the Docker container e.g. spark-py or python] -c [conda dependencies file for additional python packages] -d [additional files]
```

To test the service:

```
curl -X POST -H "Content-Type:application/json" --data {"input": "[IMAGE URL]"} http://<localhost or a public ip>/score
```

## Data Credit
The data  used in experiments was collected by [Dr. Rachael Orben](https://rachaelorben.dunked.com/red-legged-kittiwake-incubation) of Oregon State University and Abram Fleishman of San Jose State University and [Conservation Metrics](http://conservationmetrics.com), Inc.
It was collected as part of a large project investigating early breeding season responses of red-legged kittiwakes to changes in prey availability and linkages to the non-breeding stage in the Bering Sea, Alaska.


