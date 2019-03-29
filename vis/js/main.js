const width = 1000;
const height = 500;

const margin = 10;


let svg;

let sxControl, syControl, scControl;
let sxControlColorBar, syControlColorBar;
let controlRect;


let digit=0;
let parameterLb = 0;
let parameterUb = 1;

let parameters = d3.range(160).map(d=>{
  return {value: 0.5+(Math.random()-0.5)/3};
  // return {value: 1.0};
});


let sxRecon, syRecon, scRecon;
let imgRect, reconSize;





async function main(){
  const model = await initModel();
  window.model = model;
  initSvg();
  initControl();
  initControlColorbar();
  initRecon();

  let img = newImg(0, parameters.map(d=>d.value)); 
  draw(img);   
}



function initSvg(){
  svg = d3.select('svg#plot')
  .attr('width', width)
  .attr('height', height);
}


function initControl(){
  let cellWidth = 20;
  
  // parameters = numeric.sub(parameters, 0.5);
  // parameters = numeric.mul(parameters, 10);
  // parameters = parameters.map(d=>({value:d}));

  sxControl = d3.scaleLinear()
  .domain([0,16])
  .range([
    margin + width/2/2 - (cellWidth*16/2),
    margin + width/2/2 + (cellWidth*16/2)
  ]);
  syControl = d3.scaleLinear()
  .domain([0,10])
  .range([
    height/2 - (cellWidth*10/2),
    height/2 + (cellWidth*10/2)
  ]);


  scControl = d3.scaleLinear()
  .domain([0, 0.25, 0.5, 0.75, 1.0])
  .range(['#998ec3','#d8daeb','#f7f7f7','#fee0b6','#f1a340']);
  // scControl = d3.interpolateViridis;
  // scControl = d3.interpolateSpectral;
  // scControl = d3.interpolatePRGn;


  // .interpolator(d3.interpolatePuOr);
  // d3.interpolateViridis;
  // interpolateRainbow
  // interpolateSinebow
  // 
  // 
  controlRect = svg.selectAll('.controlRect')
  .data(parameters)
  .enter()
  .append('rect')
  .attr('class', 'controlRect')
  .attr('x', (d,i)=>sxControl(i%16))
  .attr('y', (d,i)=>syControl(Math.floor(i/16)))
  .attr('width', sxControl(1)-sxControl(0)-1)
  .attr('height', syControl(1)-syControl(0)-1)
  .attr('stroke-width', 1)
  .attr('stroke', '#eee')
  .attr('fill', d=>scControl(d.value));

  controlRect
  .on('mouseover', function(d,i){
    setDigit(Math.floor(i/16));
    let img = newImg(digit, parameters.map(d=>d.value));
    draw(img);

    if(d3.event.buttons == 0){
      controlRect.attr('fill', (d,j)=>{
        if (Math.floor(i/16) != Math.floor(j/16)){
          return d3.color(scControl(d.value)).darker(0.4);
        }else{
          return d3.color(scControl(d.value));
        }
      });
    }
  })
  .on('mouseout', function(d,i){
    // if(d3.event.buttons == 0){
    //   controlRect.attr('fill', d=>scControl(d.value));
    // }else{
    // }
  });


  var drag = d3.drag()
  .on('start', function(d,i){})
  .on('drag', function(d,i){
    let dy = -d3.event.dy / 20;
    setDigit(Math.floor(i/16));

    parameters[i].value += dy;
    parameters[i].value = Math.max(parameters[i].value, parameterLb);
    parameters[i].value = Math.min(parameters[i].value, parameterUb);
    d3.select(this).attr('fill', d=>scControl(d.value));


    let img = newImg(digit, parameters.map(d=>d.value));
    draw(img);
  })
  .on('end', function(d,i){});
  controlRect.call(drag);


  initControlColorbar();
  

}

function initControlColorbar(){

}



function setDigit(d){
  digit = d;
}



function initRecon(){
  reconSize = Math.min(width/2, height/2);

  sxRecon = d3.scaleLinear()
  .domain([0,28])
  .range([width/2 + (width/2-reconSize)/2, 
    width/2 + (width/2-reconSize)/2 + reconSize]);
  
  syRecon = d3.scaleLinear()
  .domain([0,28])
  .range([0+(height-reconSize)/2,
    0+(height-reconSize)/2+reconSize]);
  
  scRecon = d3.interpolateViridis;

  imgRect = svg.selectAll('.imgRect')
  .data(d3.range(784))
  .enter()
  .append('rect')
  .attr('class', 'imgRect')
  .attr('x', (d,i)=>sxRecon(i%28))
  .attr('y', (d,i)=>syRecon(Math.floor(i/28)))
  .attr('width', sxRecon(1)-sxRecon(0)+1)
  .attr('height', syRecon(1)-syRecon(0)+1); 
}



function newImg(digit, parameters){
  if(parameters===undefined){
    parameters = tf.randomUniform([10,16]);
  }else{
    parameters = parameters.map((d,j)=>{
      // return 0.5 * d * (drange[j][1]-drange[j][0]) + drange[j][0];
      let mean = dmeanstd[j][0];
      let std = dmeanstd[j][1];
      return (d-0.5)*4  *std+mean;
    });
    parameters = tf.tensor2d(parameters, [10,16]);
  }
  const dm = digitMask(digit);
  parameters = parameters.mul(dm).reshape([1,160]);
  let reconstructed = model.predict(parameters).dataSync();
  reconstructed = Array.from(reconstructed);
  return reconstructed;
}


function draw(img){
  imgRect
  .data(img)
  .attr('fill', d=>scRecon(d));
}


async function initModel(){
  return await tf.loadLayersModel('data/reconstruct/model.json');
}


masks = [];
function digitMask(digit){
  if (masks[digit] === undefined){
    let m = tf.tidy(()=>{
      const one = tf.ones([1,16]);
      const zero = tf.zeros([1,16]);
      const mask = Array(10).fill(0).map((_,j)=>{
        if(digit == j){
          return one;
        }else{
          return zero;
        }
      });
      const digitMask = tf.concat(mask);
      return digitMask;
    });
    masks[digit] = m;
  }
  return masks[digit]
}






document.addEventListener('DOMContentLoaded', main);












