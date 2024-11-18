// Video and canvas setup
const videoElement = document.getElementById('webcam');
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const frameInterval = 1000;  // 1 frame per second
const restartButton = document.querySelector('.button.restart');
const continueButton = document.querySelector('.button.continue');
const exitButton = document.querySelector('.button.exit');

let captureInterval;
let stream;
let frameCount = 0; 
let restartCount = 0;

continueButton.disabled = true;
exitButton.disabled = true;

// Event listeners for the buttons
document.querySelector('.button.start').addEventListener('click', startWebcam);
document.querySelector('.button.stop').addEventListener('click', stopWebcam);
// document.querySelector('.button.continue').addEventListener('click', continueProcess);
// document.querySelector('.button.restart').addEventListener('click', restartProcess);
document.querySelector('.button.exit').addEventListener('click', exitProcess);

// Function to capture a frame from the webcam (for display purposes)
function captureFrame() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;

    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Convert the frame to a Blob and send it to the server
    canvas.toBlob(function(blob) {
        const formData = new FormData();
        formData.append('frame', blob, 'frame.jpg');

        fetch('/save-frame', {
            method: 'POST',
            body: formData
        }).then(response => response.json())
          .then(data => console.log(data.message))
          .catch(error => console.error('Error sending frame to server:', error));
    }, 'image/jpeg');
}

// Function to start the webcam and capture frames
function startWebcam() {
    document.querySelector('.button.start').disabled = true;
    document.querySelector('.button.stop').disabled = true;
    frameCount = 0; // Reset frame count at the start
    navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: 250 },
            height: { ideal: 200 }
        }
    }).then(function(mediaStream) {
        stream = mediaStream;
        videoElement.srcObject = stream;
        videoElement.play();

        // Start capturing frames at the specified interval
        captureInterval = setInterval(() => {
            if (frameCount < 20) {  // Limit to 10 frames
                captureFrame();
                frameCount++;
            } else {
                clearInterval(captureInterval);
            }
        }, frameInterval);

        first3DModel(6000);
    }).catch(function(error) {
        console.error('Error accessing webcam:', error);
        alert('Unable to access your webcam. Error: ' + error.message);
    });
}

// Function to stop the webcam
function stopWebcam() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        clearInterval(captureInterval);
    }
    console.log("Capture stopped after reaching the frame limit or manually stopping");
}

// Add event listener for the "continue" button
continueButton.addEventListener('click', continueProcess);
function continueProcess() {
    console.log('Continue process triggered');
    
    // Logic to handle continuing the process
}
// Restart: Restarts the process of capturing frames
restartButton.addEventListener('click', restartProcess);
// Restart process function
function restartProcess() {
    restartCount += 1;
    console.log(`Restart process triggered, count: ${restartCount}`);
    
    if (restartCount === 1) {
        // First restart - show messages and start new 3D object reconstruction
        showMessage("We are going to reconstruct your second object", 10000)
            .then(() => showMessage("Grab another object from the table and start the reconstruction. Show it to the camera, rotate and focus only on the object", 10000))
            .then(() => {
                hideMessage();
                second3DModel(); // Clean images on the server
                startWebcam(); // Start new reconstruction
                return showMessage("We are almost done", 20000); // Assume 20s for reconstruction
            })
            .then(() => {
                hideMessage();
                return showMessage("Here is the second object", 1000);
            })
            .then(() => showMessage("We are gonna test your knowledge. Let's reconstruct one more object. Try to capture all angles as best as you think", 10000))
            .then(() => showMessage("Click the restart button for the last object", 10000))
            .then(() => hideMessage());

    } else if (restartCount === 2) {
        // Second restart - show final messages
        showMessage("Thanks for helping with creating objects", 5000)
            .then(() => {
                hideMessage();
                second3DModel(); // Clean images on the server
                startWebcam(); // Start new reconstruction
                return showMessage("We are almost done", 20000); 
            })
            .then(() => showMessage("Here is your last object. I hope you'll do well with 3D Reconstruction in the future", 5000))
            .then(() => {
                // Disable the restart button and enable the continue button
                restartButton.disabled = true;
                continueButton.disabled = false;
            });
    }
}

// Exit: Completely exit the process and reset everything
function exitProcess() {
    console.log('Exit process triggered');
    stopWebcam();
    clear3DScene();
}

function hideMessage() {
    instructionText.style.display = "none";
}
// Function to display messages with delays
function showMessage(text, delay) {
    return new Promise((resolve) => {
        setTimeout(() => {
            instructionText.innerText = text;
            instructionText.style.display = "block";
            resolve();
        }, delay);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    // Lighting and camera setup
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 2;
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, 2, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    
    let loadedMeshes = [];
    // Function to load the model
    function loadModel() {
        BABYLON.SceneLoader.ImportMesh("", "static/3dmodel/", "3dmodel.glb", scene, function (newMeshes) {
            console.log("Model loaded!", newMeshes);
            loadedMeshes = newMeshes;
        }, function (progress) {
            console.log("Loading progress:", progress);
        }, function (error) {
            console.error("Error loading model:", error);
        });
    }

    // Function to remove the model from the scene
    function removeModel() {
        loadedMeshes.forEach(mesh => {
            mesh.dispose();
        });
        loadedMeshes = []; // Clear the loaded meshes array
        console.log("Model removed from scene.");
    }

    // Poll the server to check if the model is ready or if it has been removed
    function checkModelReady() {
        fetch('/check-model-ready')
            .then(response => response.json())
            .then(data => {
                if (data.model_ready && loadedMeshes.length === 0) {
                    // Model is ready and not already loaded; load it
                    loadModel();
                } else if (!data.model_ready && loadedMeshes.length > 0) {
                    // Model is no longer available; remove it from the scene
                    removeModel();
                } else {
                    console.log("Model not ready yet. Retrying...");
                }
            })
            .catch(error => {
                console.error("Error checking model status:", error);
            });
    }
    // Start polling every 1 second
    const pollInterval = setInterval(checkModelReady, 1000);

    // Resize the engine when the window is resized
    window.addEventListener("resize", () => {
        engine.resize();
    });

    // Render the scene
    engine.runRenderLoop(() => {
        scene.render();
    });
});

setTimeout(() => {
    document.getElementById('instructionText').innerText = "Click on the start webcam to start the reconstruction";
}, 6000); // Change text after 5 seconds


document.querySelector('.button.start').addEventListener('click', () => {
    document.getElementById('instructionText').style.display = "none";
    startWebcam();
});

document.querySelector('.button.start').addEventListener('click', function() {
    document.getElementById('instructionText').style.display = "none";

    startWebcam();

    setTimeout(function() {
        document.getElementById('instructionText').innerText = "Grab an object from the table and show it to the camera";
        document.getElementById('instructionText').style.display = "block";
        
        setTimeout(function() {
            document.getElementById('instructionText').style.display = "none";

            setTimeout(function() {
                document.getElementById('instructionText').innerText = "Let's start the reconstruction together!";
                document.getElementById('instructionText').style.display = "block";

                setTimeout(function() {
                    document.getElementById('instructionText').style.display = "none";

                    // First additional message
                    setTimeout(function() {
                        document.getElementById('instructionText').innerText = "Here is your first 3D Model Reconstruction Object!.";
                        document.getElementById('instructionText').style.display = "block";

                        setTimeout(function() {
                            document.getElementById('instructionText').style.display = "none";

                            // Second additional message
                            setTimeout(function() {
                                document.getElementById('instructionText').innerText = "You think that you can do it better. Click on Restart to keep going!";
                                document.getElementById('instructionText').style.display = "block";

                                document.querySelector('.button.restart').addEventListener('click', function hideMessage() {
                                    document.getElementById('instructionText').style.display = "none";
                                    // Remove this event listener after it's triggered once
                                    document.querySelector('.button.restart').removeEventListener('click', hideMessage);
                                });
                                
                            }, 1000); // Delay before showing the second additional message
                            
                        }, 5000); // Duration of first additional message

                    }, 1000); // Delay before showing the first additional message

                }, 20000); // Duration of "Let's start the reconstruction together!" message
                
            }, 1000); // Delay before showing "Let's start the reconstruction together!" message
            
        }, 6000); // Duration of "Grab an object from the table..." message
        
    }, 500); // Delay before showing "Grab an object from the table..." message
});

function first3DModel(delay) {
    setTimeout(() => {
        fetch('/first-attempt', { 
            method: 'POST' 
        })
            .then(response => response.json())
            .then(data => console.log(data.message))
            .catch(error => console.error('Error activating function:', error));
    }, delay);
}

function second3DModel(delay) {
    setTimeout(() => {
        fetch('/second-attempt', { 
            method: 'POST' 
        })
            .then(response => response.json())
            .then(data => console.log(data.message))
            .catch(error => console.error('Error activating function:', error));
    }, delay);
}