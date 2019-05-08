const tesseractFigure = document.querySelector("d-figure.tesseract");
var tesseract;
tesseractFigure.addEventListener("ready", function() {
  console.log('tesseractFigure ready');
  var [gl, programs] = utils.initGL(
    '#tesseract', 
    [['shaders/tesseract_vertex.glsl', 'shaders/tesseract_fragment.glsl']]
  );
  tesseract = new TesseractRenderer(gl, programs[0]);
  tesseract.init();
});

tesseractFigure.addEventListener("onscreen", function() {
  console.log('onscreen');
  if(tesseract && tesseract.play){
    tesseract.play();
  }
});

tesseractFigure.addEventListener("offscreen", function() {
  console.log('offscreen');
  if(tesseract && tesseract.pause){
    tesseract.pause();
  }
});