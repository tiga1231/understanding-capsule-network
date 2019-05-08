const seFigure = document.querySelector("d-figure.nngt-single-epoch");
var se;

seFigure.addEventListener("ready", function() {
  console.log('nngt-single-epoch ready');
  var epochs = [99,];
  var urls = utils.getTeaserDataURL();
  var [gl, programs] = utils.initGL(
    '#nngt-single-epoch', 
    [['shaders/teaser_vertex.glsl', 'shaders/teaser_fragment.glsl']]
  );
  var kwargs = { epochs, shouldAutoNextEpoch:false };
  se = new TeaserRenderer(gl, programs[0], kwargs);
  se.overlay = new TeaserOverlay(se);
  se = utils.loadDataToRenderer(urls, se);

  utils.addDatasetListener(function(){
    var urls = utils.getTeaserDataURL();
    se = utils.loadDataToRenderer(urls, se);
    se.overlay.initLegend(
      utils.baseColors.slice(0,10), utils.getLabelNames());
    if(utils.getDataset() == 'cifar10'){
      se.setColorFactor(0.0);
    }else{
      se.setColorFactor(utils.COLOR_FACTOR);
    }
  });
  
  window.addEventListener('resize', ()=>{
    se.overlay.resize();
    se.setFullScreen(se.isFullScreen);
  });
});

seFigure.addEventListener("onscreen", function() {
  console.log('se onscreen');
  if(se && se.play){
    se.play();
  }
});

seFigure.addEventListener("offscreen", function() {
  console.log('se offscreen');
  if(se && se.pause){
    se.pause();
  }
});