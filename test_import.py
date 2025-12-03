import sys
import os

# Open a file for logging
with open('import_log.txt', 'w') as log_file:
    # Add the local libs directory to the Python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    libs_path = os.path.join(current_dir, "libs")
    sys.path.insert(0, libs_path)

    log_file.write(f"Python executable: {sys.executable}\n")
    log_file.write(f"Python version: {sys.version}\n")
    log_file.write(f"Current directory: {current_dir}\n")
    log_file.write(f"Libs path: {libs_path}\n")
    log_file.write(f"Python path: {sys.path}\n")

    try:
        import pyfcm
        log_file.write(f"Successfully imported pyfcm from {pyfcm.__file__}\n")
    except ImportError as e:
        log_file.write(f"Error importing pyfcm: {e}\n")
        
        # Try to find the pyfcm package in the libs directory
        if os.path.exists(os.path.join(libs_path, "pyfcm")):
            log_file.write("pyfcm directory exists in libs, but could not be imported.\n")
            log_file.write("Files in pyfcm directory:\n")
            for file in os.listdir(os.path.join(libs_path, "pyfcm")):
                log_file.write(f"  - {file}\n")
        else:
            log_file.write("pyfcm directory does not exist in libs.\n") 