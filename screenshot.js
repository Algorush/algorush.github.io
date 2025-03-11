document.addEventListener('DOMContentLoaded', function() {
    const screenshotButton = document.getElementById('screenshot-button');
    const notification = document.getElementById('notification');
    const aScene = document.querySelector('a-scene');
    // Создаем новый canvas для комбинирования
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = window.innerWidth;
    finalCanvas.height = window.innerHeight;
    const ctx = finalCanvas.getContext('2d');

    // Функция, которая находит видео элемент, созданный MindAR
    function findMindARVideo() {
      // MindAR обычно создает видео элемент и добавляет его в DOM
      // Проверяем несколько возможных селекторов
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

      // draw image from Aframe canvas to screenshot canvas
      ctxScreenshot.drawImage(aframeCanvas, 0, 0);
      return screenshotCanvas;
    }

    // Обработчик нажатия на кнопку скриншота
    screenshotButton.addEventListener('click', function() {
      // Скрываем кнопку
      screenshotButton.style.display = 'none';
      
      async function screenshot() {
        try {
          // Находим видео элемент MindAR
          const videoElement = findMindARVideo();
          
          if (!videoElement) {
            console.error('Не удалось найти видео элемент');
            alert('Не удалось найти видео-поток камеры.');
            screenshotButton.style.display = 'flex';
            return;
          }
          
          // render one frame
          aScene.render(AFRAME.scenes[0].object3D, AFRAME.scenes[0].camera);
          const screenshotCanvas = await createCanvasWithScreenshot(
            aScene.canvas
          );
        
          
          // Сначала рисуем видео с камеры
          ctx.drawImage(videoElement, 0, 0, finalCanvas.width, finalCanvas.height);
          
          // Затем накладываем A-Frame контент
          ctx.drawImage(screenshotCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
          
          // Создаем имя файла с датой и временем
          const date = new Date();
          const fileName = `ar-screenshot-${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.png`;
          
          // Сохраняем изображение
          try {
            finalCanvas.toBlob(function(blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              link.click();
              URL.revokeObjectURL(url);
              
              notification.style.display = 'block';
              setTimeout(() => {
                notification.style.display = 'none';
              }, 2000);
            }, 'image/png');
          } catch (e) {
            // Запасной вариант для браузеров, которые не поддерживают toBlob
            const dataURL = finalCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = fileName;
            link.click();
            
            notification.style.display = 'block';
            setTimeout(() => {
              notification.style.display = 'none';
            }, 2000);
          }
        } catch (e) {
          console.error('Ошибка создания скриншота:', e);
          alert('Ошибка при создании скриншота: ' + e.message);
        }
        
        // Показываем кнопку обратно
        screenshotButton.style.display = 'flex';
      }

      screenshot();
    });
  });