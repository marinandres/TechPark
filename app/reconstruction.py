import requests
import os

def generate_3d_model_from_image(cleaned_image_path, model_save_path, api_key):
    """
    Generates a 3D model from a cleaned image using the Stability AI API.

    Parameters:
    - cleaned_image_path: Path to the cleaned image file.
    - model_save_path: Path where the 3D model will be saved.
    - api_key: API key for authorization.
    """
    response = requests.post(
        "https://api.stability.ai/v2beta/3d/stable-fast-3d",
        headers={
            "authorization": f"Bearer {api_key}",
        },
        files={
            "image": open(cleaned_image_path, "rb")
        },
        data={},
    )

    if response.status_code == 200:
        os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
        with open(model_save_path, 'wb') as file:
            file.write(response.content)
    else:
        raise Exception(str(response.json()))

# file_path = os.path.join(os.path.dirname(__file__), '..','static', 'clean_images', 'cleaned_image.png')
# save_model_path = os.path.join(os.path.dirname(__file__), '..','static', '3dmodel', '3dmodel.glb')
# api_key = "sk-1gMZIT2IM788RqEOw4Orhu7eCAazcFctbitl0QWwsclKJf0z"

# generate_3d_model_from_image(file_path, save_model_path, api_key)
