function LayerTransitionOverlay(renderer, kwargs) {
  this.renderer = renderer;
  let canvas = renderer.gl.canvas;
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;
  let that = this;
  this.selectedClasses = new Set();

  let figure = d3.select('d-figure.'+renderer.gl.canvas.id);

  // let directManipulationMode = 'rotation';
  this.directManipulationMode = 'rotation';

  this.hasAdversarial = false;
  utils.walkObject(kwargs, (k) => {
    this[k] = kwargs[k];
  });

  this.layerSliderOffsetY = 30;

  this.onLayerSliderInput = function(value){
      renderer.setLayer(value);
      // renderer.render(0);
      renderer.shouldAutoNextLayer = false;
      // renderer.shouldAutoNextEpoch = false;
      renderer.layerFrame = Math.max(0, renderer.layer2frame(value) - 1);
      that.layerPlayButton.attr('class', 'play-button fa fa-play');
  };

  this.layerSlider = figure
    .insert('input', ':first-child')
    .attr('type', 'range')
    .attr('class', 'slider')
    .attr('min', 0)
    .attr('max', renderer.nlayer-1)
    .attr('value', renderer.nlayer-1)
    .attr('step', 0.005)
    .style('top', 'calc(100% - 71px)')
    .style('width', '70%')
    .on('input', function() {
      let value = +d3.select(this).property('value');
      that.onLayerSliderInput(value);
    })
    .on('change', function() {
      // once slider dragging finished, snap to closest integer value 
      let value = +d3.select(this).property('value');
      value = Math.round(value);
      renderer.setLayer(value);
      renderer.layerFrame = Math.max(0, renderer.layer2frame(value) - 1);
      // renderer.render(0);
    });


  this.epochSlider = figure
    .insert('input', ':first-child')
    .attr('type', 'range')
    .attr('class', 'slider')
    .attr('min', 0)
    .attr('max', renderer.nepoch-1)
    .attr('value', renderer.nepoch-1)
    .attr('step', 0.005)
    .style('width', '70%')
    .on('input', function() {
      let value = +d3.select(this).property('value');
      renderer.setEpoch(value);
      renderer.render(0);
      // renderer.shouldAutoNextLayer = false;
      renderer.shouldAutoNextEpoch = false;
      that.epochPlayButton.attr('class', 'play-button fa fa-play');
      renderer.epochFrame = renderer.epoch2frame(value);
    })
    .on('change', function() {
      // once slider dragging finished, snap to closest integer value 
      let value = +d3.select(this).property('value');
      value = Math.round(value);
      renderer.setEpoch(value);
      renderer.epochFrame = renderer.epoch2frame(value);
      renderer.render(0);
    });


  this.objectSizeSlider = figure
    .insert('input', ':first-child')
    .attr('type', 'range')
    .attr('class', 'slider ')
    .attr('min', 0.2)
    .attr('max', 5.0)
    .attr('value', 1.0)
    .attr('step', 0.01)
    .style('top', '20px')
    .style('left', '83%')
    .style('width', '15%')
    .on('input', function() {
      let value = d3.select(this).property('value');
      // if(that.dmax0 === undefined){
      //   that.dmax0 = renderer.dataObj.dmax;
      // }
      renderer.dataObj.viewFactor = value;
    });


  this.grandtourButton = d3.select('d-figure.'+renderer.gl.canvas.id)
    // .insert('div', ':first-child')
    .insert('i', ':first-child')
    // .attr('class', 'teaser-grandtourButton tooltip fas fa-random')
    // .attr('class', 'teaser-grandtourButton tooltip fas fa-route')
    .attr('class', 'teaser-grandtourButton tooltip fas fa-globe-americas')
    // .append('button')
    // .text('pause grand tour')
    .on('mouseover', function() {
      d3.select(this).style('opacity', 0.7);
    })
    .on('mouseout', function() {
      if (renderer.shouldPlayGrandTour) {
        d3.select(this).style('opacity', 0.7);
      }else{
        d3.select(this).style('opacity', 0.3);
      }
    });

  this.grandtourButton.append('span')
    .attr('class', 'tooltipText')
    .text('Pause Grand Tour');

  this.grandtourButton
    .on('click', function() {
      renderer.shouldPlayGrandTour = !renderer.shouldPlayGrandTour;
      // let figureNode = d3.select(this).node()
      // .parentNode.parentNode.parentNode;
      if (renderer.shouldPlayGrandTour) {
        d3.select(this).select('span')
        .text('Pause Grand Tour');
        d3.select(this).style('opacity', 0.7);

      } else {
        d3.select(this).select('span')
        .text('Play Grand Tour');
        d3.select(this).style('opacity', 0.3);
      }
    });


  this.layerPlayButton = figure
    .insert('i', ':first-child')
    .attr('class', renderer.shouldAutoNextLayer ? 
      'play-button  fa fa-pause': 'play-button fa fa-play')
    .style('top', 'calc(100% - 80px)')
    .on('mouseover', function() {
      d3.select(this).style('opacity', 1);
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 0.7);
    })
    .on('click', function() {
      renderer.shouldAutoNextEpoch = false;
      that.epochPlayButton.attr('class', 'play-button fa fa-play');

      renderer.shouldAutoNextLayer = !renderer.shouldAutoNextLayer;
      if (renderer.shouldAutoNextLayer) {
        d3.select(this).attr('class', 'play-button fa fa-pause');
      } else {
        d3.select(this).attr('class', 'play-button fa fa-play');
      }
    });


  this.epochPlayButton = figure
    .insert('i', ':first-child')
    .attr('class', renderer.shouldAutoNextLayer ? 
      'play-button  fa fa-pause': 'play-button fa fa-play')
    .on('mouseover', function() {
      d3.select(this).style('opacity', 1);
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 0.7);
    })
    .on('click', function(){
      renderer.shouldAutoNextLayer = false;
      that.layerPlayButton.attr('class', 'play-button fa fa-play');

      renderer.shouldAutoNextEpoch = !renderer.shouldAutoNextEpoch;
      if (renderer.shouldAutoNextEpoch) {
        d3.select(this).attr('class', 'play-button fa fa-pause');
      } else {
        d3.select(this).attr('class', 'play-button fa fa-play');
      }
    });

  



  this.svg = figure
    .insert('svg', ':first-child')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height);

  this.layerIndicator = this.svg.append('text')
    .attr('id', 'layerIndicator')
    .attr('text-anchor', 'middle')
    .text('0');

  this.epochIndicator = this.svg.append('text')
    .attr('id', 'epochIndicator')
    .attr('text-anchor', 'middle')
    .text('0');


  //developer options start =================
  let devOptionsNode = document.createElement('div');
  figure.node().parentNode.insertBefore(devOptionsNode, figure.node().nextSibling);
  this.devOptions = d3.select(devOptionsNode);

  this.dmOption = this.devOptions.append('div')
  .attr('class', 'dmOption');
  this.dmOption.append('span')
  .text('Manipulation mode: ');

  this.dmRadioButtons = this.dmOption
  .selectAll('.dmOption_i')
  .data(['rotation', 'ortho_procrustes', 'proj_procrustes', 'PCA'])
  .enter()
  .append('input')
  .attr('class', 'dmOption_i')
  .attr('type', 'radio')
  .attr('name', 'dmMode')
  .text(d=>d)
  .style('margin-left', '10px')
  .on('change', (d)=>{
    this.directManipulationMode = d;
  });

  this.dmOption
  .select('.dmOption_i')
  .attr('checked', 'checked');

  // dmRadioButtons labels
  this.dmRadioButtons
  .each(function(d){
    var t = document.createElement('label');
    this.parentNode.insertBefore(t, this.nextSibling);
    d3.select(t)
    .attr('class', 'dmOptionLabel_i')
    .text(d);   
  })
  .on('change', (d)=>{
    this.directManipulationMode = d;
  });
  //developer options end =================






  //canvas scales, brush  
  this.sx = d3.scaleLinear()
    .domain([-width/height, width/height])
    .range([0, width]);
  this.sy = d3.scaleLinear()
    .domain([1,-1])
    .range([0, height]);


  this.brush = d3.brush();
  this.svg.append('g')
    .attr('class', 'brush')
    .call(this.brush);

  this.centroidHandle = this.svg
    .selectAll('g.brush')
    .selectAll('.centroidHandle')
    .data([0])
    .enter()
    .append('circle')
    .attr('class', 'centroidHandle')
    .attr('r', 20)
    .attr('fill', '#777')
    .attr('fill-opacity', 0.1)
    .attr('stroke', 'orange')
    .call(
      d3.drag()
      .on('start', ()=>{

      })
      .on('drag', ()=>{
        this.brush.hide();

        // direct manipulation
        let [dx,dy] = [d3.event.dx, d3.event.dy];
        let [x,y] = [d3.event.x, d3.event.y];
        dx = this.sx.invert(dx)-this.sx.invert(0);
        dy = this.sy.invert(dy)-this.sy.invert(0);
        x = this.sx.invert(x);
        y = this.sy.invert(y);
        if(dx==0 && dy==0){
          return;
        }

        // if(renderer.layerIndex < renderer.nlayer-1){
        //   let prod = numeric.prod(
        //     renderer.dataObj.viewDeterminants.slice(0, Math.floor(renderer.layerIndex-1))
        //   );
        //   // let prod = renderer.dataObj.viewDeterminants[Math.floor(renderer.layerIndex)];
        //   if (prod < 0){
        //     dx = -dx;
        //     dy = -dy;
        //   }
        // }

        let dmax = this.renderer.dataObj.dmax;
        // let viewFactor = this.renderer.dataObj.viewFactor || 1;

        let selectedPoints = this.renderer.currentData
        .filter((d,i)=>{
          return this.renderer.isPointBrushed[i] && this.renderer.isClassSelected[i];
        });

        if (selectedPoints.length>0){

          let centroid = math.mean(selectedPoints, 0);
          let norm = numeric.norm2(centroid);
          let isPointSelected = numeric.mul(
            this.renderer.isPointBrushed,
            this.renderer.isClassSelected
          );

          if(this.directManipulationMode=='rotation'){
            //// method 1
            //// planar rotation
            centroid = numeric.dot([centroid], this.renderer.gt.matrix)[0];
            let centroid2 = centroid.slice();
            centroid2[0] += norm*dx;
            centroid2[1] += norm*dy;
            centroid = numeric.div(centroid, numeric.norm2(centroid));
            centroid2 = numeric.div(centroid2, numeric.norm2(centroid2));
            let basis = [centroid.slice(), centroid2.slice()];
            let cos = Math.min(1, numeric.dot(basis[0], basis[1]));
            let sin = Math.sqrt(1-cos*cos);
            for(let i=2; i<centroid.length; i++){
              let r = d3.range(centroid.length).map(j=>i==j?1:0);
              basis.push(r);
            }
            basis = utils.orthogonalize(basis);
            let rot = math.eye(centroid.length)._data;
            rot[0][0] = cos;
            rot[0][1] = sin;
            rot[1][0] = -sin;
            rot[1][1] = cos;
            let dmatrix = numeric.transpose(basis);
            dmatrix = numeric.dot(dmatrix, rot);
            dmatrix = numeric.dot(dmatrix, basis);
            this.renderer.gt.matrix = numeric.dot(
              this.renderer.gt.matrix,  dmatrix
            );

          }else{
            

            let x1 = this.renderer.currentData;
            x1 = numeric.dot(x1, this.renderer.gt.matrix);
            let x2 = x1.map((row, i)=>{
              row = row.slice();
              if(isPointSelected[i]){
                let l = numeric.norm2(row);
                row[0] += dx*l*1;
                row[1] += dy*l*1;
                // row[0] += dx;
                // row[1] += dy;
              }
              return row;
            });


            
            if(this.directManipulationMode=='ortho_procrustes'){

              //// method 2
              //// orthogonal procrustes
              let beta1 = 0.2;
              let beta0 = 1-beta1;

              // scale to control weights in procrustes
              x1 = utils.scaleRows(x1, isPointSelected, beta1, beta0);
              x2 = utils.scaleRows(x2, isPointSelected, beta1, beta0);
                
              let k = numeric.dot(numeric.transpose(x2), x1);
              let epsilon = numeric.diag(new Array(k.length).fill(1e-6));
              k = numeric.add(k, epsilon);

              let svd = numeric.svd(k);
              let u = svd.U;
              let v = svd.V;
              let ut = numeric.transpose(u);

              let dmatrix = numeric.dot(v, ut);


              this.renderer.gt.matrix = numeric.dot(
                this.renderer.gt.matrix,  dmatrix
              );

            }else if(this.directManipulationMode=='proj_procrustes'){
            
              //// method 3
              //// projection procrustes
              let beta1 = 0.6;
              let beta0 = 1-beta1;
              let projDim = 4;
              x2 = x2.map((row, i)=>{
                row = row.slice();
                for(let j=projDim; j<row.length; j++){
                  row[j] = 0;
                }
                return row;
              });

              // scale to control weights in procrustes
              x1 = utils.scaleRows(x1, isPointSelected, beta1, beta0);
              x2 = utils.scaleRows(x2, isPointSelected, beta1, beta0);

              let dmatrix;
              let diff = 1e9;
              for (let iter=0; iter<12; iter++){
                let k = numeric.dot(numeric.transpose(x2), x1);
                let svd = numeric.svd(k);
                let u = svd.U;
                let v = svd.V;
                dmatrix = numeric.dot(v, numeric.transpose(u));
                let x1rotated = numeric.dot(x1, dmatrix);

                diff = numeric.norm1(numeric.sub(
                    x1rotated.map(row=>row.slice(2)), 
                    x2.map(row=>row.slice(2))
                  ));
                // console.log(diff);
                if(diff < 1e-2){
                  break;
                }
                x2 = x2.map((row,i)=>{
                  for(let j=2; j<row.length; j++){
                    row[j] = x1rotated[i][j];
                  }
                  return row;
                });
              }
              // console.log('diff', diff);
              this.renderer.gt.matrix = numeric.dot(
                this.renderer.gt.matrix,  dmatrix
              );
            
            }else if(this.directManipulationMode=='PCA'){
              let pcaDim = 3;
              let beta1 = 0.5;
              let beta0 = 1-beta1;

              x2 = x2.map((row, i)=>row.slice(0, pcaDim));

              // scale to control weights in procrustes
              x1 = utils.scaleRows(x1, isPointSelected, beta1, beta0);
              x2 = utils.scaleRows(x2, isPointSelected, beta1, beta0);

              let k = numeric.dot(numeric.transpose(x2), x1);
              let svd = numeric.svd(numeric.transpose(k));
              let u = svd.U.map(r=>r.slice(0,pcaDim));
              let v = svd.V;
              let dmatrix2 = numeric.dot(u, numeric.transpose(v));
              let matrix2 = numeric.dot(this.renderer.gt.matrix, dmatrix2);
              for(let i=0; i<this.renderer.gt.matrix.length; i++){
                for(let j=0; j<pcaDim; j++){
                  this.renderer.gt.matrix[i][j] = matrix2[i][j];
                }
              }
              this.renderer.gt.matrix = utils.orthogonalize(this.renderer.gt.matrix, 0);

            }
          }
          
          


        }
      })
      .on('end', ()=>{
      })
    );

  this.centroidHandle.reposition = function(x,y){
    this.attr('cx', x)
      .attr('cy', y)
  };

  

  this.brush.hide = ()=>{
    this.svg.select('g.brush>.selection')
    .style('fill-opacity', 0.01)
    .style('stroke-opacity', 0.01);
  };

  this.brush.fade = ()=>{
    this.svg.select('g.brush>.selection')
    .style('fill-opacity', 0.01);
  };

  this.brush.show = ()=>{
    this.svg.select('g.brush>.selection')
    .style('fill-opacity', 0.3)
    .style('stroke-opacity', null);

  };

  this.brush
    .on('start', ()=>{
      this.brush.show();
        // this.controller.onBrushStart();
    })
    .on('brush', ()=>{
      if(d3.event.selection){
        this.shouldShowCentroid = true;

        let [x0, y0] = d3.event.selection[0];
        let [x1, y1] = d3.event.selection[1];
        [y0,y1] = [y1,y0];
        
        this.centroidHandle.reposition((x0+x1)/2,(y0+y1)/2);
        
        let r = Math.min(Math.abs(x1-x0),Math.abs(y1-y0))/3;
        r = Math.max(r, 12);
        r = Math.min(r, 30);
        this.centroidHandle.attr('r', r);

        x0 = this.sx.invert(x0);
        x1 = this.sx.invert(x1);
        y0 = this.sy.invert(y0);
        y1 = this.sy.invert(y1);

        let isPointBrushed = this.renderer.pointsNormalized.map(d=>{
          let xInRange = x0<d[0] && d[0]<x1;
          let yInRange = y0<d[1] && d[1]<y1;
          return xInRange && yInRange;
        });
        this.renderer.isPointBrushed = isPointBrushed;
      }
    })
    .on('end', ()=>{
      this.brush.fade();
      if(d3.event.selection){
        
      }else{ //brush cleared
        // this.shouldShowCentroid = false;

        let isPointBrushed = this.renderer.pointsNormalized.map(d=>{
          return true;
        });
        this.renderer.isPointBrushed = isPointBrushed;
      }
    });

  


  this.initLegend = function(){
    //legend
    if(this.legend_sx === undefined){ //if first called
      this.legend_sx = d3.scaleLinear()
        .domain([0, 1])
        .range([width-130, width-10]);

      this.legend_sy = d3.scaleLinear()
        .domain([0, 1])
        .range([150, height-130]);

      let onMouseOver = (_, i)=>{
        let classes = new Set(this.selectedClasses);
        if (!classes.has(i)) {
          classes.add(i);
        }
        this.onSelectLegend(classes);
      };

      let onMouseOut = ()=>this.restoreSelectedClasses();

      let onClick = (_, i)=>{
        if (this.selectedClasses.has(i)) {
          this.selectedClasses.delete(i);
        } else {
          this.selectedClasses.add(i);
        }
        this.onSelectLegend(this.selectedClasses);
        if (this.selectedClasses.size == renderer.dataObj.ndim) {
          this.selectedClasses = new Set();
        }
      };

      let classCount = utils.getLabelNames(this.hasAdversarial).length;

      this.legendText = this.svg.selectAll('.legendText')
        .data(utils.getLabelNames(this.hasAdversarial))
        .enter()
        .append('text')
        .attr('class', 'legendText')
        .attr('alignment-baseline', 'middle')
        .attr('fill', '#333')
        .attr('x', this.legend_sx(0.3))
        .attr('y', (l, i)=>this.legend_sy((i+0.5)/classCount))
        .text((l)=>l)
        .on('mouseover', onMouseOver)
        .on('mouseout', onMouseOut)
        .on('click', onClick);


      this.legendRect = this.svg.selectAll('.legendRect')
        .data(utils.baseColors.slice(0, classCount))
        .enter()
        .append('rect')
        .attr('class', 'legendRect')
        .attr('fill', (c, i)=>'rgb('+c+')')
        .attr('x', this.legend_sx(0))
        .attr('y', (c, i)=>this.legend_sy(i/classCount))
        .attr('width', (this.legend_sy(1)-this.legend_sy(0))/classCount )
        .attr('height', (this.legend_sy(1)-this.legend_sy(0))/classCount)
        .on('mouseover', onMouseOver)
        .on('mouseout', onMouseOut)
        .on('click', onClick);
    }else{//if called on dataset change
      this.legendText
        .data(utils.getLabelNames(this.hasAdversarial))
        .text(d=>d);
    }
    

  };

  this.initLegend();




  



  this.controlOptionGroup = d3.select('d-figure.'+renderer.gl.canvas.id)
    .insert('div', ':first-child');


  this.modeOption = this.controlOptionGroup
    .insert('div', ':first-child')
    .attr('class', 'form-group modeOption');

  this.modeOption.append('label')
    .attr('for', 'modeOption')
    .text('Display instances as: ');

  let select = this.modeOption.append('select')
    .attr('id', 'modeOption')
    .on('change', function() {
      let mode = d3.select(this).property('value');
      renderer.setMode(mode);
    });

  select.selectAll('option')
    .data(['point', 'image'])
    .enter()
    .append('option')
    .text((d)=>d);



  this.init = function(){
    this.layerSliderSx = d3.scaleLinear()
      .domain([0,this.renderer.nlayer-1])
      //TODO: get this range from slider.style.left, and *.width
      .range([this.svg.attr('width') * 0.15 + 10, 
        this.svg.attr('width') * 0.85 - 10]);

    this.layerIndicator
    .attr('x', this.layerSliderSx(math.mean(this.layerSliderSx.domain())) )
    .attr('y', height-this.layerSliderOffsetY - 40);

    this.epochIndicator
    .attr('x', this.layerSliderSx(math.mean(this.layerSliderSx.domain())) )
    .attr('y', height-30);

 
    this.svg.selectAll('.layerSliderLandmark') 
    .data(this.landmarkSizes || d3.range(this.renderer.nlayer))
    .enter()
    .append('circle')
    .attr('class', 'layerSliderLandmark');

    this.svg.selectAll('.layerSliderLandmark') 
    .attr('cx', (d,i)=>this.layerSliderSx(i))
    .attr('cy', height-this.layerSliderOffsetY - 30)
    .attr('r', d=>d)
    .attr('fill', '#d3d3d3');

  };




  this.onSelectLegend = function(classes) {
    if (typeof(classes) === 'number') {
      classes = [classes];
    }
    classes = new Set(classes);

    for (let i=0; i<this.renderer.npoint; i++) {
      if (classes.has(this.renderer.dataObj.labels[i])) {
        this.renderer.isClassSelected[i] = true;
      } else {
        this.renderer.isClassSelected[i] = false;
      }
    }
    this.svg.selectAll('.legendRect')
      .attr('opacity', (d, j)=>{
        if (!classes.has(j)) {
          return 0.1;
        } else {
          return 1.0;
        }
      });
    this.renderer.render(0);
  };

  this.restoreSelectedClasses = function() {
    let classes = new Set(this.selectedClasses);
    if (classes.size == 0) {
      for (let i=0; i<renderer.npoint; i++) {
        this.renderer.isClassSelected[i] = true;
      }
    } else {
      for (let i=0; i<renderer.npoint; i++) {
        if (classes.has(renderer.dataObj.labels[i])) {
          this.renderer.isClassSelected[i] = true;
        } else {
          this.renderer.isClassSelected[i] = false;
        }
      }
    }

    this.svg.selectAll('.legendRect')
      .attr('opacity', (d, i)=>{
        if (classes.size == 0) {
          return 1.0;
        } else {
          return classes.has(i) ? 1.0:0.1;
        }
      });
  };



  this.play = function(){
    return;
  };

  this.pause = function(){
    return;
  };

  this.redrawCentroidHandle = function(){
    //draw brush centroid
    if(this.shouldShowCentroid){
      
      let isPointSelected = this.renderer.isClassSelected.map((c,i)=>{
        return this.renderer.isPointBrushed[i] && this.renderer.isClassSelected[i];
      });

      let selectedPoints = this.renderer.pointsNormalized
        .filter((d,i)=>{
          return isPointSelected[i];
        });

      if (selectedPoints.length>0){
        let centroid = math.mean(selectedPoints, 0);
        let cx = this.sx(centroid[0]);
        let cy = this.sy(centroid[1]);
        this.centroidHandle.reposition(cx, cy);
      }else{
        this.centroidHandle.reposition(-999, -999);
      }
    }else{
      this.centroidHandle.reposition(-999, -999);
    }
  };

  this.redrawLayerSlider = function(){

    this.layerSliderSx = d3.scaleLinear()
    .domain([0,this.renderer.nlayer-1])
    //TODO: get this range from slider.style.left, and *.width
    .range([this.svg.attr('width') * 0.15 + 10, 
      this.svg.attr('width') * 0.85 - 10]);

    this.layerSlider
    .attr('max', renderer.nlayer-1)

    this.svg.selectAll('.layerSliderLandmark') 
    .data(this.landmarkSizes || d3.range(this.renderer.nlayer))
    .exit().remove();

    this.svg.selectAll('.layerSliderLandmark') 
    .data(this.landmarkSizes || d3.range(this.renderer.nlayer))
    .enter()
    .append('circle')
    .attr('class', 'layerSliderLandmark');

    this.svg.selectAll('.layerSliderLandmark') 
    .attr('cx', (d,i)=>this.layerSliderSx(i))
    .attr('cy', height-this.layerSliderOffsetY - 30)
    .attr('r', d=>d)
    .attr('fill', '#d3d3d3');
  };
}