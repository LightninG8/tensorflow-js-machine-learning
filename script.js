const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');

// Проверьт, поддерживается ли доступ к веб-камере.
function getUserMediaSupported() {
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
}

// Если веб-камера поддерживается, добавьте прослушиватель событий к кнопке, когда пользователь
// хочет активировать его для вызова функции enableCam, которую мы будем
// определение на следующем шаге
if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia()не поддерживается в вашем браузере');
}

  // Включите просмотр веб-камеры в реальном времени и начните классификацию.
  function enableCam(event) {
    // Продолжайте только после завершения загрузки COCO-SSD.
    if (!model) {
      return;
    }
    
    // Скрыть кнопку после нажатия.
    event.target.classList.add('removed');  
    
    // getUsermedia параметры, чтобы получить видео, но не аудио.
    const constraints = {
      video: true
    };
  
    // Активация потока веб-камеры.
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      video.srcObject = stream;
      video.addEventListener('loadeddata', predictWebcam);
    });
  }

  // Сохраняем полученную модель в глобальной области видимости нашего приложения.
var model = undefined;

// Прежде чем мы сможем использовать класс COCO-SSD, мы должны дождаться его завершения
// Модели машинного обучения могут быть большими и занимать некоторое время
// чтобы получить все необходимое для запуска.
// Примечание: cocoSsd - это внешний объект, загруженный из нашего index.html
// импорт тега скрипта, поэтому игнорируйте любые предупреждения в Glitch
cocoSsd.load().then(function (loadedModel) {
  model = loadedModel;
  // Показать демонстрационный раздел, теперь модель готова к использованию.
  demosSection.classList.remove('invisible');
});

var children = [];

function predictWebcam() {
// Теперь приступим к классификации кадра в потоке. 
model.detect(video).then(function (predictions) {
    // Удаляем любое выделение, которое мы сделали в предыдущем кадре.
    for (let i = 0; i < children.length; i++) {
      liveView.removeChild(children[i]);
    }
    children.splice(0);
    
    // Теперь давайте перебираем прогнозы и выводим их на экран в реальном времени, если
     // у них высокий показатель достоверности.    
     for (let n = 0; n < predictions.length; n++) {
      // Если мы более чем на 66% уверены, что правильно классифицировали его, нарисуйте его!
      if (predictions[n].score > 0.66) {
        const p = document.createElement('p');
        p.innerText = predictions[n].class  + ' - with ' 
            + Math.round(parseFloat(predictions[n].score) * 100) 
            + '% confidence.';
        p.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: '
            + (predictions[n].bbox[1] - 10) + 'px; width: ' 
            + (predictions[n].bbox[2] - 10) + 'px; top: 0; left: 0;';

        const highlighter = document.createElement('div');
        highlighter.setAttribute('class', 'highlighter');
        highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
            + predictions[n].bbox[1] + 'px; width: ' 
            + predictions[n].bbox[2] + 'px; height: '
            + predictions[n].bbox[3] + 'px;';

        liveView.appendChild(highlighter);
        liveView.appendChild(p);
        children.push(highlighter);
        children.push(p);
      }
    }
    
    // Вызов этой функции еще раз, чтобы предсказывать, когда браузер будет готов.
    window.requestAnimationFrame(predictWebcam);
  });}
