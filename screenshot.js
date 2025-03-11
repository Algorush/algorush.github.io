const aScene = document.querySelector('a-scene');
const screenshotButton = document.getElementById('screenshot-button');
aScene.renderer.setPixelRatio(window.devicePixelRatio);

document.addEventListener('DOMContentLoaded', function() {

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Create the final canvas
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = screenWidth;
  finalCanvas.height = screenHeight;
  const ctx = finalCanvas.getContext('2d');

  // Function to find the video element created by MindAR
  function findMindARVideo() {
    // MindAR usually creates a video element and adds it to the DOM
    // Check multiple possible selectors
    let video = document.querySelector('video');
    return video;
  }

  const createCanvasWithScreenshot = async (aframeCanvas) => {
    let screenshotCanvas = document.querySelector('#screenshotCanvas');
    if (!screenshotCanvas) {
      screenshotCanvas = document.createElement('canvas');
      screenshotCanvas.id = 'screenshotCanvas';
      screenshotCanvas.hidden = true;
      document.body.appendChild(screenshotCanvas);
    }
    screenshotCanvas.width = aframeCanvas.width;
    screenshotCanvas.height = aframeCanvas.height;
    const ctxScreenshot = screenshotCanvas.getContext('2d');

    // Draw image from A-Frame canvas to screenshot canvas
    ctxScreenshot.drawImage(aframeCanvas, 0, 0);
    return screenshotCanvas;
  }

  // Screenshot button click event handler
  screenshotButton.addEventListener('click', function() {
    // Hide the button
    screenshotButton.style.display = 'none';
    
    async function screenshot() {
      try {
        // Find the MindAR video element
        const videoElement = findMindARVideo();
        
        if (!videoElement) {
          console.error('Failed to find video element');
          alert('Failed to find camera video stream.');
          screenshotButton.style.display = 'flex';
          return;
        }
        
        // Render one frame
        aScene.render(AFRAME.scenes[0].object3D, AFRAME.scenes[0].camera);
        const screenshotCanvas = await createCanvasWithScreenshot(
          aScene.canvas
        );

        const videoWidth = videoElement.videoWidth;
        const videoHeight = videoElement.videoHeight;
        
        const aframeWidth = aScene.canvas.width;
        const aframeHeight = aScene.canvas.height;
        
        // Use max resolution
        finalCanvas.width = Math.max(videoWidth, aframeWidth);
        finalCanvas.height = Math.max(videoHeight, aframeHeight);

        // Calculate scale to fit the screen without distortion
        const scale = Math.max(screenWidth / videoWidth, screenHeight / videoHeight);
        const newWidth = videoWidth * scale;
        const newHeight = videoHeight * scale;

        // Compute crop coordinates (center the image)
        const offsetX = (newWidth - screenWidth) / 2;
        const offsetY = (newHeight - screenHeight) / 2;

        // 1. Draw video while maintaining proportions
        ctx.drawImage(videoElement, -offsetX, -offsetY, newWidth, newHeight);

        // Then overlay A-Frame content
        ctx.drawImage(screenshotCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
        
        // Create a filename with date and time
        const date = new Date();
        const fileName = `ar-screenshot-${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.png`;
        
        // Save the image
        try {
          finalCanvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(url);
          }, 'image/png');
        } catch (e) {
          // Fallback for browsers that do not support toBlob
          const dataURL = finalCanvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = dataURL;
          link.download = fileName;
          link.click();
        }
      } catch (e) {
        console.error('Screenshot creation error:', e);
        alert('Error creating screenshot: ' + e.message);
      }
      
      // Show the button again
      screenshotButton.style.display = 'flex';
    }

    screenshot();
  });
});
