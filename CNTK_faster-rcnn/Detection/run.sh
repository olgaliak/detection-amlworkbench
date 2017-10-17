#!/bin/bash
source /root/anaconda3/bin/activate root
pip install easydict
pip install azure-ml-api-sdk==0.1.0a9
pip install sanic
python3 /app/app.py
