import os
import time
from PIL import Image

frames_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'frames')
capture_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'capture_images')
data_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'data_capture_images')

if not os.path.exists(capture_dir):
    os.makedirs(capture_dir)

def generate_unique_id():
    return int(time.time())

def create_images():
    frame_path = os.path.join(frames_dir, 'frame.jpg')
    
    if not os.path.exists(frame_path):
        print(f"{frame_path} does not exist.")
        return
    
    captured_images = 0

    while captured_images < 6:
        frame = Image.open(frame_path)
        image_id = generate_unique_id()

        capture_image_path = os.path.join(capture_dir, f"{image_id}-image.png")
        data_image_path = os.path.join(data_dir, f"{image_id}-image.png")
        frame.save(capture_image_path)
        frame.save(data_image_path)
        print(f"Image {image_id}-image.png saved to {capture_image_path}")

        time.sleep(1)

        captured_images += 1

    print("6 images captured and saved.")