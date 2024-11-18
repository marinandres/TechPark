import torch
import numpy as np
import os
from PIL import Image
from transformers import AutoModelForImageSegmentation
from torchvision import transforms
from torch.amp import autocast

# torch.set_num_threads(1)
torch.cuda.empty_cache()

birefnet = AutoModelForImageSegmentation.from_pretrained('ZhengPeng7/BiRefNet', trust_remote_code=True)
torch.set_float32_matmul_precision('high')
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
birefnet.to(device)
birefnet.eval()

print(device)

def get_first_image_path(directory):
    files = [f for f in os.listdir(directory) if f.endswith('.png')]
    if files:
        return os.path.join(directory, files[5])
    else:
        return None 

def extract_object(birefnet, imagepath, save_path=None):

    image_size = (512, 512)
    transform_image = transforms.Compose([
        transforms.Resize(image_size),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    image = Image.open(imagepath).convert("RGB")
    input_images = transform_image(image).unsqueeze(0).to(device)

    with torch.no_grad():
        with autocast(device_type='cuda', dtype=torch.float16):  # Enable mixed precision
            preds = birefnet(input_images)[-1].sigmoid().cpu()

    pred = preds[0].squeeze()
    pred_pil = transforms.ToPILImage()(pred)
    mask = pred_pil.resize(image.size)
    image.putalpha(mask)

    if save_path:
        image.save(save_path)

    return image, mask

def process_and_save_image(capture_images_dir, clean_images_dir):
    imagepath = get_first_image_path(capture_images_dir)

    if imagepath:
        save_path = os.path.join(clean_images_dir, 'cleaned_image.png')

        extract_object(birefnet, imagepath=imagepath, save_path=save_path)
        print(f"Processed image saved to: {save_path}")
    else:
        print("No PNG images found in the capture_images folder.")

# capture_images_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'capture_images')
# clean_images_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'clean_images')

# process_and_save_image(capture_images_dir, clean_images_dir)
