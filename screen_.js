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

  const VIDEO_CONSTRAINTS = {
    video: {
      facingMode: "environment",
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    }
  };

  async function initializeVideo() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
      videoElement = findVideoEl();
      
      if (!videoElement) {
        return false;
      }
      
      videoElement.srcObject = stream;
      await new Promise(resolve => videoElement.onloadedmetadata = resolve);
      
      await videoElement.play();
      
      if (window.mindarThree) {
        await window.mindarThree.start();
      }
      
      return true;
    } catch (error) {
      showNotification(`Error: ${error.message}`);
      return false;
    }
  }

  initializeVideo();

  actionButton.addEventListener('touchstart', () => {
    pressTimer = setTimeout(() => {
      startRecording();
    }, 500);
  });

  actionButton.addEventListener('touchend', () => {
    clearTimeout(pressTimer);
    if (!isRecording) {
      switchToPhotoMode();
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
    try {
      videoElement = findVideoEl();
      if (!videoElement) {
        return;
      }

      finalCanvas.width = videoElement.videoWidth;
      finalCanvas.height = videoElement.videoHeight;
      
      ctx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      ctx.drawImage(videoElement, 0, 0, finalCanvas.width, finalCanvas.height);
      
      aScene.renderer.render(aScene.object3D, aScene.camera);
      
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      ctx.drawImage(aScene.renderer.domElement, 0, 0, finalCanvas.width, finalCanvas.height);
      
      finalCanvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ar-screenshot-${Date.now()}.jpeg`;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/jpeg');
  
    } catch (error) {
      showNotification(`Error: ${error.message}`);
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
