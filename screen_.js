document.addEventListener('DOMContentLoaded', function() {
  const actionButton = document.getElementById('action-button');
  var videoElement;
  const notification = document.getElementById('notification');
  const aScene = document.querySelector('a-scene');
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  let pressTimer;

  // Create the final canvas
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = screenWidth;
  finalCanvas.height = screenHeight;
  const ctx = finalCanvas.getContext('2d');

  let mediaRecorder;
  let recordedChunks = [];
  let isRecording = false;

  window.onerror = function(message, source, lineno, colno, error) {
    notification.style.display = 'block';
    notification.textContent = `Ошибка: ${message} (${lineno}:${colno})`;
  };

  function findVideoEl() {
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
    ctxScreenshot.drawImage(aframeCanvas, 0, 0);
    return screenshotCanvas;
  }

  actionButton.addEventListener('touchstart', () => {
    pressTimer = setTimeout(() => {
      startRecording();
    }, 500);
  });

  actionButton.addEventListener('touchend', () => {
    clearTimeout(pressTimer);
    if (!isRecording) {
      screenshot();
    } else {
      stopRecording();
    }
  });

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      actionButton.classList.remove('recording');
    }
  }

  function record() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function drawFrame() {
    ctx.drawImage(videoElement, 0, 0, finalCanvas.width, finalCanvas.height);
    ctx.drawImage(aScene.canvas, 0, 0, finalCanvas.width, finalCanvas.height);
    requestAnimationFrame(drawFrame);
  }

  async function startRecording() {
    try {
      videoElement = findVideoEl();
      if (!videoElement) throw new Error('AR video stream not found.');
  
      finalCanvas.width = videoElement.videoWidth;
      finalCanvas.height = videoElement.videoHeight;
  
      const stream = finalCanvas.captureStream();
      mediaRecorder = new MediaRecorder(stream);
      recordedChunks = [];
  
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) recordedChunks.push(event.data);
      };
  
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ar-video-${Date.now()}.mp4`;
        link.click();
        URL.revokeObjectURL(url);
        actionButton.classList.remove('recording');
      };
  
      drawFrame();
      mediaRecorder.start();
      isRecording = true;
      actionButton.classList.add('recording');
    } catch (error) {
      showNotification(`Error: ${error.message}`);
    }
  }

  async function switchToPhotoMode() {
    stopRecording();
    try {
      const constraints = { video: { width: 4000, height: 3000 } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const photoTrack = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(photoTrack);
      const blob = await imageCapture.takePhoto();
      saveBlob(blob, `ar-photo-${Date.now()}.png`);
      photoTrack.stop();
    } catch (error) {
      showNotification(`Error: ${error.message}`);
    }
  }
  
  async function screenshot() {
    await switchToPhotoMode();
    try {    
      videoElement = findVideoEl();
      if (!videoElement) {
        console.error('Failed to find video element');
        alert('Failed to find camera video stream.');
        return;
      }
      aScene.renderer.render(aScene.object3D, aScene.camera);
      const screenshotCanvas = await createCanvasWithScreenshot(aScene.canvas);
      ctx.drawImage(videoElement, 0, 0, finalCanvas.width, finalCanvas.height);
      ctx.drawImage(screenshotCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
      finalCanvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ar-screenshot-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (e) {
      console.error('Screenshot creation error:', e);
      showNotification('Error creating screenshot: ' + e.message);
    }
  }

  function showNotification(message) {
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }

});
