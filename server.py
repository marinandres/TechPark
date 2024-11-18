from flask import Flask, render_template, send_from_directory, request, jsonify
# from app.image_capturing import create_images
# from app.image_cleaning import process_and_save_image
# from app.reconstruction import generate_3d_model_from_image
# from app.restart import clean_and_backup_directories
import time
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

capture_images_dir = os.path.join(os.path.dirname(__file__), 'static', 'capture_images')
clean_images_dir = os.path.join(os.path.dirname(__file__), 'static', 'clean_images')
file_path = os.path.join(os.path.dirname(__file__), 'static', 'clean_images', 'cleaned_image.png')
save_model_path = os.path.join(os.path.dirname(__file__), 'static', '3dmodel', '3dmodel.glb')
api_key = "sk-1gMZIT2IM788RqEOw4Orhu7eCAazcFctbitl0QWwsclKJf0z"

start_time = None
# This one have to be update
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/start-recording', methods=['POST'])
def start_recording():
    global start_time
    start_time = time.time()
    return jsonify({"message": "Recording started"})

@app.route('/save-frame', methods=['POST'])
def save_frame():
    frame = request.files['frame']
    frame_path = os.path.join('static/frames', f'frame.jpg')
    frame.save(frame_path)
    return jsonify({"message": "Frame saved successfully"})

# @app.route('/first-attempt', methods=['POST'])
# def first_3d_model():
#     create_images()
#     print("Images Captured")
#     process_and_save_image(capture_images_dir, clean_images_dir)
#     print("Image Cleaned")
#     generate_3d_model_from_image(file_path, save_model_path, api_key)
#     print("Image 3D Model")
#     return jsonify({"message": "Frame saved successfully"})

# @app.route('/second-attempt', methods=['POST'])
# def second_3d_model():
#     clean_and_backup_directories()
#     return jsonify({"message": "Frame saved successfully"})

@app.route('/check-model-ready', methods=['GET'])
def check_model_ready():
    model_ready = os.path.exists(save_model_path)
    return jsonify({"model_ready": model_ready})

if __name__ == '__main__':

    app.run(debug=True, host='0.0.0.0', port=5000)