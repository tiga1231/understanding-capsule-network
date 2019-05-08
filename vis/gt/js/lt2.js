const lt2Figure = document.querySelector("d-figure.lt2");
let lt2;

lt2Figure.addEventListener("ready", function() {
  console.log('lt2 ready');
  let [gl, programs] = utils.initGL(
    '#lt2', 
    [['shaders/layertransition_vertex.glsl', 
    'shaders/layertransition_fragment.glsl']]
  );

  let urls = utils.getLayerTransitionURL('test');

  lt2 = new LayerTransitionRenderer(gl, programs[0], {
    nlayer: urls.length/2,
    layerNames: [
    'Conv', 'MaxPool', 'ReLU',
    'Conv', 'MaxPool', 'ReLU',
    'Linear', 'ReLU',
    'Linear', 'ReLU',
    'Softmax'],
    nepoch: 100,
    npoint: 1000,
    pointSize: 6.0,
    normalizeView: true,
    isOnScreen:true
  });

  const S=4, L=6; //small, large
  lt2.overlay = new LayerTransitionOverlay(lt2, {
      landmarkSizes: [L,S,S,L,S,S,L,S,L,S,L,L],
    });
  
  lt2 = utils.loadDataToRenderer(urls, lt2);

  window.addEventListener('resize', ()=>{
      // sm0.resize();
      // sm0.overlay.resize();
  });


  utils.addDatasetListener(function (){
    if (!lt2.isOnScreen){
      return;
    }
    lt2.pause();
    lt2.overlay.pause();

    var urls = utils.getLayerTransitionURL('test');

    lt2.nlayer = urls.length/2;

    lt2.dataObj.norms = undefined;
    lt2.dataObj.dataTensor = [];
    lt2.dataObj.views = [];
    lt2 = utils.loadDataToRenderer(urls, lt2);


    lt2.overlay.initLegend();

    if(utils.getDataset()=='cifar10'){
      lt2.layerNames = [
      'Conv', 'ReLU', 'MaxPool',
      'Conv', 'ReLU', 'MaxPool',
      'Linear', 'ReLU',
      'Linear', 'ReLU',
      'Linear',
      'Softmax'
      ];
      lt2.overlay.landmarkSizes = [L,S,S,L,S,S,L,S,L,S,L,L,L];
    }else{
      lt2.layerNames = [
      'Conv', 'MaxPool', 'ReLU',
      'Conv', 'MaxPool', 'ReLU',
      'Linear', 'ReLU',
      'Linear', 'ReLU',
      'Softmax'
      ];
      lt2.overlay.landmarkSizes = [L,S,S,L,S,S,L,S,L,S,L,L];
    }
    lt2.overlay.redrawLayerSlider();

    
  });

});

lt2Figure.addEventListener("onscreen", function() {
  console.log('lt2 onscreen');
  if(lt2 && lt2.isDataReady && lt2.play){
    lt2.play();
    lt2.overlay.play();
    lt2.isOnScreen = true;
  }
});

lt2Figure.addEventListener("offscreen", function() {
  console.log('lt2 offscreen');
  if(lt2 && lt2.pause){
    lt2.pause();
    lt2.overlay.pause();
    lt2.isOnScreen = false;
  }
});