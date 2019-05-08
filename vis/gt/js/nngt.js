// let width = window.innerWidth/2;
// let height = window.innerHeight/1.5;
// d3.select('#main')
// .attr('width', width)
// .attr('height', height)
// .style('width', width+'px')
// .style('height', height +'px');


var epochs = d3.range(0,1,1);
var urls = ['data/digitCap.bin', 'data/labels.bin'];
var [gl, programs] = utils.initGL(
  '#main', 
  [['shaders/teaser_vertex.glsl', 'shaders/teaser_fragment.glsl']]
);
var kwargs = { epochs };
var nngt = new TeaserRenderer(gl, programs[0], kwargs);
nngt.overlay = new TeaserOverlay(nngt);
nngt = utils.loadDataToRenderer(urls, nngt);


