function LayerTransitionRenderer(gl, program, kwargs) {
  this.animId = null;
  this.gl = gl;
  this.program = program;
  utils.walkObject(kwargs, (k) => {
    this[k] = kwargs[k];
  });

  this.dataObj = {};
  this.epochIndex = this.nepoch-1;
  this.layerIndex = this.nlayer-2; //the layer before softmax
  this.layerIndexPrev = undefined;

  this.mode = 'point';

  this.colorFactor = utils.COLOR_FACTOR;
  this.isFullScreen = false;
  this.isDataReady = false;

  this.dataObj.dataTensor = [];
  this.dataObj.views = [];
  this.dataObj.viewDeterminants = [];

  this.alphas = new Array(this.npoint).fill(255);
  this.isPointBrushed = new Array(this.npoint).fill(true);
  this.isClassSelected = new Array(this.npoint).fill(true);


  this.frame2layer = function(frame){
    frame = frame % (this.framesBetweenLayer * (this.nlayer-1));
    let layerIndex = math.floor(frame / this.framesBetweenLayer);
    frame = frame % this.framesBetweenLayer;
    let layerProgress = Math.min(1, frame / this.framesForLayerTransition);
    let layer = layerIndex + layerProgress;
    return layer;
  }


  this.frame2epoch = function(frame){
    frame = frame % (this.framesBetweenEpoch * (this.nepoch-1));
    let epochIndex = math.floor(frame / this.framesBetweenEpoch);
    frame = frame % this.framesBetweenEpoch;
    let epochProgress = Math.min(1, frame / this.framesForEpochTransition);
    let epoch = epochIndex + epochProgress;
    return epoch;
  }


  this.layer2frame = function(layer){
    let frame = Math.floor(layer) * this.framesBetweenLayer;
    let p = layer - Math.floor(layer);
    frame += p * this.framesForLayerTransition;
    if(layer == this.nlayer-1){
      frame -= 1;
    }
    return frame;
  };


  this.epoch2frame = function(epoch){
    let frame = Math.floor(epoch) * this.framesBetweenEpoch;
    let p = epoch - Math.floor(epoch);
    frame += p * this.framesForEpochTransition;
    if(epoch == this.nepoch-1){
      frame -= 1;
    }
    return frame;
  };


  this.initData = (buffer, url, urlIndex, urlCount) => {

    let dataRegex = url.match(/\/d(\d+)\.bin/);
    let viewRegex = url.match(/\/view(\d+)\.bin/);

    if (dataRegex !== null) {
      let layerIndex = parseInt(dataRegex[1]);
      let arr = new Float32Array(buffer);
      let ndim = arr.length / (this.npoint*this.nepoch);
      
      this.dataObj.dataTensor[layerIndex] = utils.reshape(arr, 
        [this.nepoch, this.npoint, ndim]);

    }else if(viewRegex !== null){
      let viewIndex = parseInt(viewRegex[1]);
      let arr = new Float32Array(buffer);
      let ndim = Math.sqrt(arr.length);
      this.dataObj.views[viewIndex] = utils.reshape(arr, [ndim, ndim]);

      this.dataObj.viewDeterminants[viewIndex] = numeric.det(this.dataObj.views[viewIndex]);

    }else{ //labels
      let arr = new Int8Array(buffer);
      this.dataObj.labels = Array.from(arr);
    }

    this.isDataReady = true;
    for (let i=0; i<this.nlayer; i++){
      if (this.dataObj.dataTensor[i] === undefined){
        this.isDataReady = false;
        break;
      }
      if (i!==this.nlayer-1 && this.dataObj.views[i] === undefined){
        this.isDataReady = false;
        break;
      }
    }

    if (this.isDataReady){
      this.initGL(this.dataObj);
      if(this.animId == null){
        this.play();
      }
    }

    if (this.isDataReady && this.isPlaying===undefined) {
        // renderer.isPlaying===undefined indicates the renderer on init
        // otherwise it is reloading other dataset
        this.isPlaying = true;
        this.play();
        this.overlay.init();
      }
  };


  // this.setFullScreen = function(shouldSet) {
  //   this.isFullScreen = shouldSet;
  //   let canvas = this.gl.canvas;
  //   let canvasSelection = d3.select('#'+canvas.id);

  //   d3.select(canvas.parentNode)
  //     .classed('fullscreen', shouldSet);

  //   if (shouldSet) {
  //     canvasSelection
  //       .attr('width', window.innerWidth)
  //       .attr('height', window.innerHeight)
  //       .classed('fullscreen', true);
  //   } else {
  //     canvasSelection
  //       .attr('width', 1000)
  //       .attr('height', 1000)
  //       .classed('fullscreen', false);
  //   }
  //   utils.resizeCanvas(canvas);
  //   gl.viewport(0, 0, canvas.width, canvas.height);
  // };


  this.setMode = function(mode='point') {
    this.mode = mode;
    if (mode === 'point') {
      gl.uniform1i(this.modeLoc, 0);
    } else if (mode === 'image') {
      gl.uniform1i(this.modeLoc, 1);
    }
  };


  this.initGL = function(dataObj) {
    let gl = this.gl;
    let program = this.program;
    // init
    utils.resizeCanvas(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(...utils.CLEAR_COLOR, 1.0);

    
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE, gl.ONE_MINUS_SRC_ALPHA
    );
    
    // gl.enable(gl.DEPTH_TEST);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    this.colorBuffer = gl.createBuffer();
    this.colorLoc = gl.getAttribLocation(program, 'a_color');

    this.positionBuffer = gl.createBuffer();
    this.positionLoc = gl.getAttribLocation(program, 'a_position');

    this.textureCoordBuffer = gl.createBuffer();
    this.textureCoordLoc = gl.getAttribLocation(program, 'a_textureCoord');

    this.pointSizeLoc = gl.getUniformLocation(program, 'point_size');
    


    let textureCoords = [];
    for (let i=0; i<this.npoint; i++) {
      textureCoords.push(...utils.getTextureCoord(i));
    }
    for (let i=0; i<this.ndim*2; i++) {
      textureCoords.push([0, 0]);
    }

    if (this.textureCoordLoc !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.STATIC_DRAW);
      gl.vertexAttribPointer(this.textureCoordLoc, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.textureCoordLoc);
    }
    
    let texture = utils.loadTexture(
      gl, utils.getTextureURL());
    this.samplerLoc = gl.getUniformLocation(program, 'uSampler');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.samplerLoc, 0);



    this.isDrawingAxisLoc = gl.getUniformLocation(program, 'isDrawingAxis');

    this.modeLoc = gl.getUniformLocation(program, 'mode');
    this.setMode(this.mode);

    this.colorFactorLoc = gl.getUniformLocation(program, 'colorFactor');
    this.setColorFactor(this.colorFactor);

    if (this.gt === undefined || this.gt.ndim != this.ndim) {
      let gt = new GrandTour(0);
      this.gt = gt;
    }
  };



  this.shouldPlayGrandTour = true;
  this.shouldAutoNextEpoch = false;
  this.shouldAutoNextLayer = false;
  this.shouldRender = true;
  // this.t = 1e4;


  this.framesForEpochTransition = 10; //total #frames for transition only
  this.framesBetweenEpoch = 60; //total #frames between epoch transition (trans+pause)

  this.framesForLayerTransition = 45; //total #frames for transition only
  this.framesBetweenLayer = 90; //total #frames between layer transition (trans+pause)
  // this.epochFrame = this.framesBetweenEpoch * this.epochIndex-1;
  this.epochFrame = this.epoch2frame(this.epochIndex);
  this.layerFrame = this.layer2frame(this.layerIndex);

  this.setLayer = function(l){
    this.setLayerEpoch(l, this.epochIndex);
  };

  this.setEpoch = function(e){
    this.setLayerEpoch(this.layerIndex, e);
  };

  this.setLayerEpoch = function(l, e){
    

    e = Math.max(0,e);

    if (this.dataObj.norms === undefined){//lazy init
      this.dataObj.norms = this.dataObj.dataTensor.map((tensor, layer)=>{
        tensor = tensor[tensor.length-1]; //last epoch
        //l_2 norm
        let norms = tensor.map((d,i)=>math.norm(d));
        // l_inf norm
        // let norms = tensor.map((d,i)=>math.abs(d));
        let max = math.max(norms);
        return max;
      });
    }else{//on dataset changed
      for(let i=0; i<this.nlayer; i++){
        if (this.dataObj.norms[i] == undefined 
          && this.dataObj.dataTensor[i] !== undefined){
          let lastEpochIndex = this.dataObj.dataTensor[i].length-1;
          let tensor = this.dataObj.dataTensor[i][lastEpochIndex];
          this.dataObj.norms[i] = math.max(tensor.map((d,i)=>math.norm(d)));
        }
      }
    }


    this.layerIndex = l;
    this.epochIndex = e;

    let l0 = Math.max(Math.floor(l), 0);
    let l1 = Math.max(Math.ceil(l), 0);
    let pl = l - l0;

    let e0 = Math.max(Math.floor(e), 0);
    let e1 = Math.max(Math.ceil(e), 0);
    let pe = e - e0;


    if(this.normalizeView && this.dataObj.norms){
      this.dataObj.dmax = this.dataObj.norms[l0]*(1-pl) + this.dataObj.norms[l1]*pl;
      this.dataObj.dmax = this.dataObj.dmax || 1;
    }
    //overlay display
    this.overlay.layerSlider.property('value', l);
    this.overlay.epochSlider.property('value', e);

    let dist0 = l - Math.floor(l);
    let dist1 = Math.ceil(l) - l;

    if(dist0 < 0.1){
      this.overlay.layerIndicator.text(Math.floor(l));
    }else if(dist1 < 0.1){
      this.overlay.layerIndicator.text(Math.ceil(l));
    }else{
      this.overlay.layerIndicator.text(
        ''+Math.floor(l)+' -> '
        + this.layerNames[Math.floor(l)]
        +' -> '+Math.ceil(l));
    }

    this.overlay.epochIndicator.text('epoch: ' + Math.round(e) + '/' + (this.nepoch-1));


  };

  


  this.play = function() {
    let dt = 0;
    if (this.shouldPlayGrandTour 
        || this.shouldAutoNextEpoch
        || this.shouldAutoNextLayer) {
      
      if (this.shouldPlayGrandTour) {
        dt = 1/60;
      } else {
        dt = 0;
      }
      if (this.shouldAutoNextLayer){
        this.layerFrame += 1;
      }
      if (this.shouldAutoNextEpoch) {
        this.epochFrame += 1;
      }
      let layer = this.frame2layer(this.layerFrame);
      let epoch = this.frame2epoch(this.epochFrame);
      this.setLayerEpoch(layer, epoch);
    }
    
    this.render(dt);
    this.overlay.redrawCentroidHandle();
    // this.overlay.redrawAxis();
    this.animId = requestAnimationFrame(this.play.bind(this));
  };

  this.setColorFactor = function(f) {
    this.colorFactor = f;
    this.gl.uniform1f(this.colorFactorLoc, f);
  };


  this.setPointSize = function(s) {
    this.pointSize = s;
    gl.uniform1f(this.pointSizeLoc, s * window.devicePixelRatio);
  };
  


  this.pause = function() {
    if(this.animId){
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    console.log('paused');    
  };


  this.render = function(dt) {
    

    let dataObj = this.dataObj;
    let dataTensor = dataObj.dataTensor;

    let layer = this.layerIndex;
    let prevLayer = this.layerIndexPrev;
    let epoch = this.epochIndex;

    if(dataTensor[Math.floor(layer)] === undefined){
      return;
    }

    
    let ndim;
    if(Math.floor(layer) !== this.nlayer-1){
      if(this.dataObj.views[Math.floor(layer)]){
        ndim = this.dataObj.views[Math.floor(layer)].length;
      }else{
        return;
      }
    }else{
      if(this.dataObj.views[Math.floor(layer)-1]){
        ndim = this.dataObj.views[Math.floor(layer)-1].length;
      }else{
        return;
      }
    }

    let labels = dataObj.labels || new Array(this.npoint).fill(0);
    let gl = this.gl;
    let gt = this.gt;
    let program = this.program;
    // 
    let data0 = dataTensor[Math.floor(layer)][Math.floor(epoch)];
    this.currentData = data0; //this is a reference used in direct manipulation in overlay.js

    let points;

    gt.setNdim(ndim);
    //internal view change in grand tour
    if (Math.floor(prevLayer) < Math.floor(layer) 
      && Math.floor(layer) !== this.nlayer-1 ){
      
      // let view = dataObj.views[Math.floor(layer)];
      // view = math.transpose(view);
      // let matrix = this.gt.getMatrix();
      // matrix = math.multiply(view, matrix);
      // this.gt.setMatrix(matrix);
      for(let l=Math.floor(prevLayer)+1; l<=Math.floor(layer); l++){
        console.log('forward');
        let view = dataObj.views[l];
        view = math.transpose(view);
        ndim = view.length;
        gt.setNdim(ndim);
        let matrix = this.gt.getMatrix();
        matrix = math.multiply(view, matrix);
        this.gt.setMatrix(matrix);        
      }
      
    }else if(Math.floor(prevLayer) > Math.floor(layer)
      && Math.floor(prevLayer) !== this.nlayer-1){
      console.log('backward');
      // let view = dataObj.views[Math.floor(layer+1)];
      // let matrix = this.gt.getMatrix();
      // let submatrix = matrix.slice(0,view.length).map(row=>row.slice(0,view[0].length));
      // submatrix = math.multiply(view, submatrix);
      // matrix = utils.embed(submatrix, matrix);
      // this.gt.setMatrix(matrix);
      for(let l=Math.floor(prevLayer); l>Math.floor(layer); l--){
        let view = dataObj.views[l];
        let matrix = this.gt.getMatrix();
        let submatrix = matrix.slice(0,view.length).map(row=>row.slice(0,view[0].length));
        submatrix = math.multiply(view, submatrix);
        matrix = utils.embed(submatrix, matrix);
        this.gt.setMatrix(matrix);
      }
    }


    //interpolation between layers
    let points0, points1;
    let view0;
    if(Math.floor(layer) <= this.nlayer-2){
        let data1 = dataTensor[Math.ceil(layer)][Math.floor(epoch)];
        this.currentData = data1;
        view0 = this.dataObj.views[Math.floor(layer)];
        view0 = view0.slice(0,data0[0].length);
        let points0 = gt.project(data0, dt, view0);
        let points1 = gt.project(data1, 0);
        points = utils.mix(
          points0, points1,//points1.slice(0,this.npoint),
          layer-Math.floor(layer)
        );
    }else{
      points = gt.project(data0, dt);
    }

    // interpolation between epochs
    let points_e0, points_e1;
    if(Math.floor(epoch) != Math.ceil(epoch)){
      points_e0 = points;
      if(Math.floor(layer) != Math.ceil(layer)){
        let data01 = dataTensor[Math.floor(layer)][Math.ceil(epoch)];
        let data11 = dataTensor[Math.ceil(layer)][Math.ceil(epoch)];
        let points01 = gt.project(data01, 0, view0);
        let points11 = gt.project(data11, 0);
        points_e1 = utils.mix(points01, points11, layer-Math.floor(layer));
        points = utils.mix(points_e0, points_e1, epoch-Math.floor(epoch));
      }else{
        let data01 = dataTensor[Math.floor(layer)][Math.ceil(epoch)];
        let points_e1 = gt.project(data01, 0, view0);
        points = utils.mix(points_e0, points_e1, epoch-Math.floor(epoch));
      }
      
    }
    this.points = points;
    points = points.map((row)=>row.map( d=>
      d/dataObj.dmax * (dataObj.viewFactor || 1)
    ));
    this.pointsNormalized = points;
  

    let bgColors = labels.map((d)=>utils.bgColors[d]);
    let colors = labels.map((d)=>utils.baseColors[d]);
    // colors = colors.concat(utils.createAxisColors(ndim));
    colors = colors.map((c, i)=>[c[0], c[1], c[2], 255]);
    


    // dataObj.colors = colors;

    let colorBuffer = this.colorBuffer;
    let positionBuffer = this.positionBuffer;
    let colorLoc = this.colorLoc;
    let positionLoc = this.positionLoc;

    //// square viewport
    // gl.viewport(
    //   (gl.canvas.width-gl.canvas.height)/2, 0, 
    //   gl.canvas.height, gl.canvas.height 
    // );

    ////full canvas viewport
    gl.viewport(
      0, 0, 
      gl.canvas.width, gl.canvas.height 
    );

    

    

    //sort by z
    let pointIndexPairs = points.map((p,i)=>[p,i])
    .sort((a,b)=>b[0][2]-a[0][2]);
    points = pointIndexPairs.map(d=>d[0]);
    let colors_tmp = colors.map((_,i)=>{
      if (i<pointIndexPairs.length){
        return colors[pointIndexPairs[i][1]];
      }else{
        return colors[i];
      }
    });
    colors = colors_tmp;
    let bgColors_tmp = bgColors.map((_,i)=>{
      if (i<pointIndexPairs.length){
        return bgColors[pointIndexPairs[i][1]];
      }else{
        return bgColors[i];
      }
    });
    bgColors = bgColors_tmp;





    if (this.mode == 'image') {
      let textureCoords = [];
      for (let i=0; i<this.npoint; i++) {
        textureCoords.push(
          ...utils.getTextureCoord(pointIndexPairs[i][1]));
      }
      // for (let i=0; i<this.ndim*2; i++) {
      //   textureCoords.push([0, 0]);
      // }
      if (this.textureCoordLoc !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.textureCoordLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.textureCoordLoc);
      }
      points = utils.point2rect(points, this.npoint, 1/20);
      colors = utils.color2rect(colors, dataObj.npoint, this.ndim);
      bgColors = utils.color2rect(bgColors, dataObj.npoint, this.ndim);
    }


    //fix aspect ratio
    //shrink z direction to fit in viewing box;
    points = points.map((row)=>row.map((d,i)=>{
      if (i == 0){
        return d / (gl.canvas.width / gl.canvas.height);
      }else if(i==2){
        return d / 100;
      }else{
        return d;
      }
    }));


    gl.clearColor(...utils.CLEAR_COLOR, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    


    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Uint8Array(flatten(colors)), gl.STATIC_DRAW);
    gl.vertexAttribPointer(colorLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
    gl.enableVertexAttribArray(colorLoc);
    
    let c0 = bgColors.map((c, i)=>[c[0], c[1], c[2], 50]);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(flatten(c0)), gl.STATIC_DRAW);

    let c1;

    this.isPointSelected = numeric.mul(
      this.isPointBrushed, 
      this.isClassSelected
    );
      
      
    this.alphas = this.isPointSelected.map(
      (seleted,i)=>seleted ? 255:0
    );
    let alphas = this.alphas.map((_,i)=>{
      if (i<pointIndexPairs.length){
        return this.alphas[pointIndexPairs[i][1]];
      }else{
        return this.alphas[i];
      }
    });



    if (this.mode === 'point') {
      gl.uniform1i(this.isDrawingAxisLoc, 0);
      gl.uniform1f(this.pointSizeLoc, this.pointSize * window.devicePixelRatio);
      gl.drawArrays(gl.POINTS, 0, this.npoint);
      c1 = colors.map((c, i)=>[
        c[0], c[1], c[2], 
        // this.alphas[i]
        alphas[i]
      ]);
    } else if (this.mode === 'image') {
      // console.warn('not implemented');
      // 
      gl.drawArrays(gl.TRIANGLES, 0, 6*this.npoint);
      c1 = colors.map((c, i)=>[
        c[0], c[1], c[2],
        alphas[Math.floor(i/6)]
      ]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(flatten(c1)), gl.STATIC_DRAW);



    if (this.mode === 'point') {
      gl.uniform1i(this.isDrawingAxisLoc, 0);
      gl.drawArrays(gl.POINTS, 0, this.npoint);
      
      //draw axis
      // gl.uniform1i(this.isDrawingAxisLoc, 1);
      // gl.drawArrays(gl.LINES, this.npoint, ndim*2);
      
    } else {
      if(utils.getDataset() == 'cifar10'){
        this.setColorFactor(0.0);
      }else{
        this.setColorFactor(utils.COLOR_FACTOR);
      }
      
      gl.uniform1i(this.isDrawingAxisLoc, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6*this.npoint);
      //draw axis
      // this.setMode('point');
      // gl.uniform1i(this.isDrawingAxisLoc, 1);
      // gl.drawArrays(gl.LINES, this.npoint*6, this.ndim*2);
      this.setMode('image');
    }
    this.layerIndexPrev = this.layerIndex;
    return;
  };
}
