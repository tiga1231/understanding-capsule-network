const smFigure0 = document.querySelector("d-figure#smallmultiple0");
let sm0;

smFigure0.addEventListener("ready", function() {
  console.log('smFigure0 ready');
  let [gl, programs] = utils.initGL(
    '#sm0', 
    [['shaders/smallmultiple_vertex.glsl', 'shaders/smallmultiple_fragment.glsl']]
  );
  let kwargs = { 
    epochs: [2,5,14,30,98,99], 
    methods: ['tsne', 'dynamic_tsne', 'umap', 'pca', 'random1', 'random2', 'manual']
  };

  let urls = utils.getSmallMultipleDataURL(kwargs.methods);

  sm0 = new SmallMultipleRenderer(gl, programs[0], kwargs);
  sm0.overlay = new SmallMultipleOverlay(sm0);
  sm0 = utils.loadDataToRenderer(urls, sm0);

  utils.addDatasetListener(function(){
    let urls = utils.getSmallMultipleDataURL(kwargs.methods);
    sm0.isDataReady = false;
    for(let k of sm0.methods){
      sm0.dataObj[k] = undefined;
    }
    sm0 = utils.loadDataToRenderer(urls, sm0);
    sm0.overlay.initLegend(utils.baseColors.slice(0,10), utils.getLabelNames());
  });
  window.addEventListener('resize', ()=>{
    sm0.resize();
    sm0.overlay.resize();
  });
}); 