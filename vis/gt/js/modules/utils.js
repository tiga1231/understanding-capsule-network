let utils = {};

utils.CLEAR_COLOR = [.97, .97, .97];
utils.CLEAR_COLOR_SMALL_MULTIPLE = [.95, .95, .95];
utils.MIN_EPOCH = 0;
utils.MAX_EPOCH = 99;
utils.COLOR_FACTOR = 0.9;
utils.dataset = 'mnist';
utils.datasetListener = [];


utils.toDataURL = function(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var reader = new FileReader();
    reader.onloadend = function() {
      callback(reader.result);
    }
    reader.readAsDataURL(xhr.response);
  };
  xhr.open('GET', url);
  xhr.responseType = 'blob';
  xhr.send();
}



utils.embed = function(matrix, canvas){
  for(let i=0; i<matrix.length; i++){
    for(let j=0; j<matrix[0].length; j++){
      canvas[i][j] = matrix[i][j];
    }
  }
  return canvas;
}



// huh: https://eslint.org/docs/rules/guard-for-in
utils.walkObject = function(obj, f) {
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      f(key);
    }
  }
};


utils.scaleRows = function(matrix, isRowSelected, beta1, beta0){
  let selectedCount = numeric.sum(isRowSelected);
  let res = matrix.map((row,i)=>{
    row = row.slice();
    if(isRowSelected[i]){
      row = numeric.mul(row, beta1/selectedCount);
    }else{
      row = numeric.mul(row, beta0/(matrix.length-selectedCount));
    }
    return row;
  });
  return res;
};


utils.getNet = function(name) {
  let net;
  if (name == 'cifar10') {
    net = [
      {type: 'data', name: 'input', size: [32, 32]},

      {type: 'function', name: 'conv1',
       blocks: ['conv_5x5(3->10)', 'ReLU', 'maxpool_2x2']},
      {type: 'data', name: 'conv1', size: [28, 70]},

      {type: 'function', name: 'conv2',
       blocks: ['conv_5x5(10->20)', 'ReLU', 'maxpool_2x2']},
      {type: 'data', name: 'conv2', size: [20, 25]},

      {type: 'function', name: 'fc1',
       // blocks: ['flatten', 'linear(500->120)', 'ReLU', 'dropout(0.1)']},
       blocks: ['linear(500->120)', 'ReLU']},
      {type: 'data', name: 'fc1', size: [10, 12]},

      {type: 'function', name: 'fc2',
       // blocks: ['linear(120->84)', 'ReLU', 'dropout(0.5)']},
       blocks: ['linear(120->84)', 'ReLU']},
      {type: 'data', name: 'fc2', size: [7, 12]},

      {type: 'function', name: 'fc3',
       blocks: ['linear(84->10)']},
      {type: 'data', name: 'fc3', size: [2, 5]},

      {type: 'function', name: 'softmax', blocks: ['softmax']},
      {type: 'data', name: 'softmax', size: [2, 5]},

      {type: 'function', name: 'argmax', blocks: ['argmax']},
      {type: 'data', name: 'argmax', size: [1, 1]},
    ];
  } else {
    net = [
      {type: 'data', name: 'input', size: [28, 28]},

      {type: 'function', name: 'conv1',
       blocks: ['conv_5x5(1->10)', 'maxpool_2x2', 'ReLU']},
      {type: 'data', name: 'conv1', size: [24, 60]},

      {type: 'function', name: 'conv2',
       // blocks: ['conv_5x5(10->20)', 'dropout2d(0.5)', 'maxpool_2x2', 'ReLU']},
       blocks: ['conv_5x5(10->20)', 'maxpool_2x2', 'ReLU']},
      {type: 'data', name: 'conv2', size: [16, 20]},

      {type: 'function', name: 'fc1',
       // blocks: ['flatten', 'linear(320->50)', 'ReLU', 'dropout(0.2)']},
       blocks: ['linear(320->50)', 'ReLU']},
      {type: 'data', name: 'fc1', size: [5, 10]},

      {type: 'function', name: 'fc2', blocks: ['linear(50->10)', 'ReLU']},
      {type: 'data', name: 'fc2', size: [2, 5]},

      {type: 'function', name: 'softmax', blocks: ['softmax']},
      {type: 'data', name: 'softmax', size: [2, 5]},

      {type: 'function', name: 'argmax', blocks: ['argmax']},
      {type: 'data', name: 'argmax', size: [1, 1]},
    ];
  }
  return net;
};


utils.setDataset = function(datasetName, callback0) {
  // if (this.dataset != datasetName){
    this.dataset = datasetName;
    document.getElementById('dataset-option').innerText = datasetName;
    for (let callback of utils.datasetListener) {
      callback(datasetName);
    }
    if (callback0){
      callback0();
    }
  // }
};


utils.getDataset = function() {
  return this.dataset;
};


utils.addDatasetListener = function(callback) {
  utils.datasetListener.push(callback);
};


utils.clearDatasetListener = function() {
  for (let i=0; i<utils.datasetListener.length; i++) {
    utils.datasetListener.pop();
  }
};


utils.getLabelNames = function(adversarial=false) {
  let res;
  if (utils.getDataset() == 'mnist') {
    res = d3.range(10).map((i)=>'digit '+i); 
  } else if (utils.getDataset() == 'fashion-mnist') {
    res = ['T-shirt/top', 'Trouser', 'Pullover', 'Dress', 'Coat',
            'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Ankle boot'];
  } else if (utils.getDataset() == 'cifar10') {
    res = ['airplane', 'automobile', 'bird', 'cat', 'deer',
            'dog', 'frog', 'horse', 'ship', 'truck'];
  } else {
    throw new Error('Unrecognized dataset ' + utils.getDataset());
  }
  if (adversarial){
    res.push('adversarial');
  }
  return res;
};


utils.getTeaserDataURL = function() {
  return [
    'data/softmax/'+utils.getDataset()+'/softmax.bin',
    'data/softmax/'+utils.getDataset()+'/labels.bin'
    ];
};

utils.getTextureURL = function() {
  return 'data/softmax/'+utils.getDataset()+'/input.png';
};

utils.getSmallMultipleDataURL = function(methods) {
  let urls = methods.map(d=>'data/comparison/'+utils.getDataset()+'/'+d+'.bin');
  urls.push('data/comparison/'+utils.getDataset()+'/labels.bin');
  return urls;
};


utils.getLayerTransitionURL = function(datasetType='test'){
  let ds, views;
  if (utils.getDataset()=='cifar10'){
    ds = d3.range(13);
    views = d3.range(12);
  }else{
    ds = d3.range(12);
    views = d3.range(11);
  }

  let urls = ds.map(i=>'data/layer-transition-' + datasetType + '/'+utils.getDataset()+'/d'+i+'.bin')
    .concat( views.map(i=>'data/layer-transition-' + datasetType + '/'+utils.getDataset()+'/view'+i+'.bin') );
  urls.push('data/layer-transition-' + datasetType + '/'+utils.getDataset()+'/labels.bin');
  return urls;
}




utils.initGL = function(canvasid, shaderPathPairs) {
  let canvas = document.getElementById(canvasid.slice(1));
  let gl = canvas.getContext('webgl', {premultipliedAlpha: false} );
  let programs = [];
  for (let i=0; i<shaderPathPairs.length; i++) {
    programs.push(initShaders(
      gl, shaderPathPairs[i][0], shaderPathPairs[i][1]));
  }
  return [gl, programs];
};


utils.loadDataToRenderer = function(urls, renderer, callback) {
  for (let i=0; i<urls.length; i++) {
    let url = urls[i];
    utils.loadDataBin(urls[i], (buffer, url)=>{
      renderer.initData(buffer, url, i, urls.length);
    });
  }
  return renderer;
};


utils.reshape = function(array, shape) {
  let res = [];
  if (shape.length == 2) {
    for (let row=0; row<shape[0]; row++) {
      res.push([]);
      for (let col=0; col<shape[1]; col++) {
        res[res.length-1].push(array[shape[1] * row + col]);
      }
    }
  } else {
    let blocksize = math.prod(shape.slice(1));
    for (let i=0; i<shape[0]; i++) {
      res.push(
        utils.reshape(array.slice(i*blocksize, (i+1)*blocksize), shape.slice(1))
      );
    }
  }
  return res;
};


utils.cacheAll = function(urls){
  for(let url of urls){
    utils.loadDataBin(url, ()=>{});
  }
};


utils.cache = {};
utils.loadDataBin = function(url, callback) {
  if(url in utils.cache){
    callback(utils.cache[url], url);
  }else{
    let xhr = new window.XMLHttpRequest();
    let ready = false;
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 
          && xhr.status === 200
          && ready !== true) {
        if (xhr.responseType === 'arraybuffer') {
          utils.cache[url] = xhr.response;
          callback(xhr.response, url);
        } else if (xhr.mozResponseArrayBuffer !== null) {
          utils.cache[url] = xhr.mozResponseArrayBuffer;
          callback(xhr.mozResponseArrayBuffer, url);
        } else if (xhr.responseText !== null) {
          let data = String(xhr.responseText);
          let ary = new Array(data.length);
          for (let j = 0; j<data.length; j++) {
            ary[j] = data.charCodeAt(j) & 0xff;
          }
          let uint8ay = new Uint8Array(ary);
          utils.cache[url] = uint8ay.buffer;
          callback(uint8ay.buffer, url);
        }
        ready = true;
      }
    };
    xhr.open('GET', url, true);
    xhr.responseType='arraybuffer';
    xhr.send();
    }
};


utils.loadDataCsv = function(fns, renderer) {
  let promises = fns.map((fn) => d3.text(fn));
  Promise.all(promises).then(function(dataRaw) {
    renderer.initData(dataRaw);
    renderer.play();
  });
};


utils.resizeCanvas = function(canvas) {
  let DPR = window.devicePixelRatio;

  let displayWidth = DPR*canvas.clientWidth;
  let displayHeight = DPR*canvas.clientHeight;
  // Check if the canvas is not the same size.
  if (canvas.width != displayWidth ||
      canvas.height != displayHeight) {
    // Make the canvas the same size
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
  canvas.style.width = canvas.clientWidth;
  canvas.style.height = canvas.clientHeight;
};

// utils.baseColors = [
//   [166,206,227], [31,120,180],  [178,223,138],
//   [51,160,44],   [251,154,153], [227,26,28],
//   [253,191,111], [255,127,0],   [202,178,214],
//   [106,61,154],  [255,255,153], [177,89,40]
// ];

utils.baseColors = d3.schemeCategory10;
utils.baseColors.push('#444444');
utils.baseColors.push('#444444');

function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}

// utils.baseColors = [
//   '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
//   '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
//   '#bcbd22', '#17becf'
// ];

utils.baseColors = utils.baseColors.map((d)=>(hexToRgb(d)));

utils.bgColors = numeric.add( numeric.mul(utils.baseColors, 0.6), 0.95*255*0.4);


utils.createAxisPoints = function(ndim) {
  let res = math.eye(ndim)._data;
  for (let i=ndim-1; i>=0; i--) {
    res.splice(i, 0, math.zeros(ndim)._data);
  }
  return res;
};


utils.createAxisColors = function(ndim) {
  let res = d3.range(ndim*2).map(
    (d, i) => utils.baseColors[Math.floor(i/2) % utils.baseColors.length]
  );
  return res;
};


utils.linearInterpolate = function(data1, data2, p) {
  // let res = math.zeros(data1.length, data1[0].length)._data;
  // for (let i=0; i<data1.length; i++) {
  //   for (let j=0; j<data1[0].length; j++) {
  //     res[i][j] = data1[i][j]*(1-p) + data2[i][j]*(p);
  //   }
  // }
  let a = math.multiply(data1, 1-p);
  let b = math.multiply(data2, p);
  let res = math.add(a,b);
  return res;
};

utils.mix = function(data1, data2, p) {
  return utils.linearInterpolate(data1, data2, p);
};


utils.orthogonalize = function(matrix, priorityRowIndex=0) {
  // make row vectors in matrix pairwise orthogonal;
  
  function proj(u, v) {
    return numeric.mul(numeric.dot(u, v)/numeric.dot(u, u), u);
  }

  function normalize(v, unitlength=1) {
    if (numeric.norm2(v) <= 0) {
      return v;
    } else {
      return numeric.div(v, numeric.norm2(v)/unitlength);
    }
  }

  // Gram–Schmidt orthogonalization
  let priorityRow = matrix[priorityRowIndex];
  let firstRow = matrix[0];
  matrix[0] = priorityRow;
  matrix[priorityRowIndex] = firstRow;

  matrix[0] = normalize(matrix[0]);
  for (let i=1; i<matrix.length; i++) {
    for (let j=0; j<i; j++) {
        matrix[i] = numeric.sub(matrix[i], proj(matrix[j], matrix[i]));
    }
    matrix[i] = normalize(matrix[i]);
  }
  let tempRow = matrix[0];
  matrix[0] = matrix[priorityRowIndex];
  matrix[priorityRowIndex] = tempRow;
  return matrix;
};


utils.point2rect = function(points, npoint, sideLength) {
  let res = [];

  for (let i=0; i<npoint; i++) {
    let point = points[i];

    let ul = point.slice(); // upper left
    ul[0] -= sideLength/2;
    ul[1] += sideLength/2;
    let ur = point.slice();
    ur[0] += sideLength/2;
    ur[1] += sideLength/2;
    let ll = point.slice(); // lower left
    ll[0] -= sideLength/2;
    ll[1] -= sideLength/2;
    let lr = point.slice();
    lr[0] += sideLength/2;
    lr[1] -= sideLength/2;

    res.push(ur, ul, ll, ur, ll, lr);
  }

  for (let i=npoint; i<points.length; i++) {
    res.push(points[i]);
  }
  return res;
};


utils.color2rect = function(colors, npoint, ndim) {
  let pointColors = colors.slice(0, npoint)
      .map((c)=>[c, c, c, c, c, c])
      .reduce((a, b)=>a.concat(b), []);
  let axisColors = colors.slice(npoint, npoint+2*ndim);
  return pointColors.concat(axisColors);
};


utils.getTextureCoord = function(i, nRow=10, nCol=100) {
  let ul; let ur; let ll; let lr;
  let numPerRow = nCol;
  let numPerCol = nRow;
  let dx = 1/numPerRow;
  let dy = 1/numPerCol;

  ul = [dx * (i%numPerRow), dy*Math.floor(i/numPerRow)];
  ur = ul.slice();
  ur[0] += dx;
  ll = ul.slice();
  ll[1] += dy;
  lr = ul.slice();
  lr[0] += dx;
  lr[1] += dy;
  return [ur, ul, ll, ur, ll, lr];
};


utils.loadTexture = function(gl, url) {
  function isPowerOf2(x) {
    return x & (x-1) == 0;
  }

  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  let level = 0;
  let internalFormat = gl.RGBA;
  let width = 1;
  let height = 1;
  let border = 0;
  let srcFormat = gl.RGBA;
  let srcType = gl.UNSIGNED_BYTE;
  let pixel = new Uint8Array([0, 0, 255, 255]);

  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border,
                srcFormat, srcType, pixel);

  let image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
  };
  image.src = url;
  return texture;
};

utils.setTeaser = function(renderer, datasetname, epochIndex, classes, 
                           shouldAutoNextEpoch=true, timeout=0, callback=undefined) {
  utils.setDataset(datasetname, ()=>{
    renderer.setEpochIndex(epochIndex);
    if(classes.length > 0){
      renderer.overlay.selectedClasses = new Set(classes);
      renderer.overlay.onSelectLegend(classes);
    }else{
      renderer.overlay.selectedClasses = new Set();
      renderer.overlay.restoreAlpha();
    }
    
    renderer.shouldAutoNextEpoch=shouldAutoNextEpoch;
    d3.select(renderer.overlay.svg.node().parentElement)
    .select('.play-button')
    .attr('class', ()=>{
      if (renderer.shouldAutoNextEpoch) {
        return 'tooltip play-button fa fa-pause';
      } else {
        return 'tooltip play-button fa fa-play';
      }
    })
    if(callback){
      callback();
    }
  });
  // setTimeout(()=>{
    
  // }, timeout);
};

