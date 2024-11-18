import os
import shutil
from datetime import datetime

save_model = os.path.join(os.path.dirname(__file__), '..', 'static', '3dmodel')
data_model = os.path.join(os.path.dirname(__file__), '..', 'static', 'data_3dmodel')
capture_images = os.path.join(os.path.dirname(__file__), '..', 'static', 'capture_images')
data_capture_images = os.path.join(os.path.dirname(__file__), '..', 'static', 'data_capture_images')
clean_image = os.path.join(os.path.dirname(__file__), '..', 'static', 'clean_images')

def clean_and_backup_directories():
    # Define source and destination directories
    dirs_to_backup_and_clean = {
        save_model: data_model,
        capture_images: data_capture_images,
        clean_image: None  # No backup needed for this directory
    }

    # Loop through the directories
    for src_dir, backup_dir in dirs_to_backup_and_clean.items():
        # Ensure the source directory exists
        if os.path.exists(src_dir):
            # If a backup directory is specified, move files to the backup location
            if backup_dir:
                os.makedirs(backup_dir, exist_ok=True)  # Ensure the backup directory exists
                for filename in os.listdir(src_dir):
                    src_file = os.path.join(src_dir, filename)
                    if os.path.isfile(src_file):  # Only move files, not subdirectories
                        # Create a unique filename with a timestamp
                        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                        unique_filename = f"{timestamp}_{filename}"
                        shutil.move(src_file, os.path.join(backup_dir, unique_filename))
            
            # Now clean the original directory
            for filename in os.listdir(src_dir):
                file_path = os.path.join(src_dir, filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.unlink(file_path)  # Delete the file or link
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)  # Delete the directory
                except Exception as e:
                    print(f'Failed to delete {file_path}. Reason: {e}')
        else:
            print(f"Directory {src_dir} does not exist.")