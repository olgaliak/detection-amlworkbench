try:
    import matplotlib
    matplotlib.use('agg')
    import matplotlib.pyplot as plt
except ImportError:
    print("Library matplotlib missing. Can't plot.")

import pandas as pd
from PIL import Image
from io import BytesIO
from tensorboard.backend.event_processing import event_accumulator
from azureml.logging import get_azureml_logger

#matplotlib.style.use('ggplot')

def record_results(eval_path):
    print("Starting logging results, using eval dir {0}".format(eval_path))
    ea = event_accumulator.EventAccumulator(eval_path,
      size_guidance={ # see below regarding this argument
       event_accumulator.COMPRESSED_HISTOGRAMS: 500,
       event_accumulator.IMAGES: 30,
       event_accumulator.AUDIO: 4,
       event_accumulator.SCALARS: 0,
       event_accumulator.HISTOGRAMS: 1 })
    ea.Reload()

    # Plot mAP vs Interations
    df = pd.DataFrame(ea.Scalars('Precision/mAP@0.5IOU'))
    max_vals = df.loc[df["value"].idxmax()] # max value of mAP

    fig = plt.figure(figsize=(6, 5), dpi=75)
    plt.plot(df["step"], df["value"])
    plt.plot(max_vals["step"], max_vals["value"], "g+", mew=2, ms=10)
    plt.title("Precision")
    plt.ylabel("mAP")
    plt.xlabel("interations")
    fig.savefig("./outputs/mAP.png", bbox_inches='tight')

    # Plot detection resuts for model with max mAP
    IMAGE_ID = "image-1" # Use blurry image as a baseline across runs
    IMG_OUTPUT = "./outputs/kittiwake.png"
    match = [x for x in ea.Images(IMAGE_ID) if x.step == max_vals["step"]]
    if (len(match) >0):
        img_encoded = match[0].encoded_image_string
        img_file = BytesIO(img_encoded)
        img = Image.open(img_file)
        print(img.size)
        img.save(IMG_OUTPUT, "PNG")
    else:
        message = "Did not find images summary for step {0} with max mAP {1}. Need increase event_accumulator.IMAGES?"
        print(message.format(max_vals["step"], max_vals["value"]) )

    run_logger = get_azureml_logger()
    run_logger.log("max_mAP",  max_vals["value"])
    run_logger.log("max_mAP_interation#", max_vals["step"])
    print("Done logging resuts")