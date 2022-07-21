/// <reference path="C:/Users/nicsn/projects/resources/p5_definitions/global.d.ts" />

let pane;
const controls = {
  iterations: 2,
  noFlicker: true,
  brushSize: 35,
  rule: "00000111010101000100111011011001000010000000110000011001001101110111111000010001110011111111011111001100011111101001010001001101010001000000001111000111001100000001011001000101110111100100001101100011000011111011011100101001000101101001100101011101101111110000010001000100011011110100000001011100011000010011101100000110011111101110000111101101101011110101101101000010010101110100010000001100001011011110101101010100001011001011001100000000011010110000010010011100100101011100110000010110001100010010110010110011",
  symmetry: true
}
let canvas;
let graphics1; // stage 1
let graphics2; // stage 2
let graphics3; // rule
let ruleText; // the p5.element
const ruleArray = [];
let backArray;
let caShader;
let noiseShader;
let lastBrushX = 0; // for drawing smooth lines
let lastBrushY = 0;
let zoom = 1;
let panX = 0;
let panY = 0;
let halfWidth;
let halfHeight;
let paused = false;
let pauseBtn;
let iterSld;
let mandalaBtn;
let mandalaNum = 1;
const lastMandala = [0, 0, 1];
let presetSlct;




function preload() {
  caShader = loadShader("vert.glsl", "ca_frag.glsl");
  noiseShader = loadShader("vert.glsl", "noise_frag.glsl"); // white -> noise
}




// THIS PREVENT CONTEXT MENU WHEN RIGHT-CLICKING ON THE CANVAS
document.oncontextmenu = function() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height)
    return false;
}

function windowResized() {
  resizeCanvas(floor(windowHeight * .8 * .5) * 2, floor(windowHeight * .8 * .5) * 2);
  graphics1.resizeCanvas(width, height);
  graphics2.resizeCanvas(width, height);
  halfWidth = width * .5;
  halfHeight = height * .5;
}

// if called, attempts to eliminate interpolation on the canvas argument
function noInterp(canvas) {
  canvas.style("image-rendering", "-moz-crisp-edges");
  canvas.style("image-rendering", "-webkit-crisp-edges");
  canvas.style("image-rendering", "pixelated");
  canvas.style("image-rendering", "crisp-edges");
  return canvas; // allows you to easily wrap this function around createCanvas or createGraphics
}

function randomize_cells() {
  graphics1.loadPixels();
  for(let y = 0; y < height; y++) {
    for(let x = 0; x < width; x++) {
      index = (x + y * width) * 4;
      val = random(1).toFixed(0) * 255;
      graphics1.pixels[index + 0] = val;
      graphics1.pixels[index + 1] = val;
      graphics1.pixels[index + 2] = val;
    }
  }
  graphics1.updatePixels();

  // also unpause
  pauseBtn.title = "pause";
  paused = false;
}

// smaller square of random cells instead of full screen
// gives better idea of what's interesting
function randomize_cells_mini() {
  clear_cells();
  graphics1.loadPixels();
  for(let y = floor(height / 3); y < 2 * height / 3; y++) {
    for(let x = floor(width / 3); x < 2 * width / 3; x++) {
      index = (x + y * width) * 4;
      val = random(1).toFixed(0) * 255;
      graphics1.pixels[index + 0] = val;
      graphics1.pixels[index + 1] = val;
      graphics1.pixels[index + 2] = val;
    }
  }
  graphics1.updatePixels();

  // also unpause
  pauseBtn.title = "pause";
  paused = false;
}

// literally only used for this ridiculous mandala function
// assumes you've already loaded pixels
// x and y arguments are relative to the center of the canvas
function setPxArrOffCenter(x, y, val, surf) {
  let ind = floor((width / 2 + x + (height / 2 + y) * width)) * 4;
  surf.pixels[ind + 0] = val;
  surf.pixels[ind + 1] = val;
  surf.pixels[ind + 2] = val;
}

// iterate through 7 different kernels to spawn a mandala
// lastMandala is an array of bits that count from 0-7, and each bit enables or disables a group of pixels in the kernel
function mandala() {
  let rand1 = lastMandala[0];
  let rand2 = lastMandala[1]; // fyi, this used to be random and i'm too lazy to change the variable names
  let rand3 = lastMandala[2];
  clear_cells();
  graphics1.loadPixels();
  setPxArrOffCenter(-1, -1, 255 * rand1, graphics1);
  setPxArrOffCenter(0, -1, 255 * rand2, graphics1);
  setPxArrOffCenter(1, -1, 255 * rand1, graphics1);
  setPxArrOffCenter(-1, 0, 255 * rand2, graphics1);
  setPxArrOffCenter(0, 0, 255 * rand3, graphics1);
  setPxArrOffCenter(1, 0, 255 * rand2, graphics1);
  setPxArrOffCenter(-1, 1, 255 * rand1, graphics1);
  setPxArrOffCenter(0, 1, 255 * rand2, graphics1);
  setPxArrOffCenter(1, 1, 255 * rand1, graphics1);
  graphics1.updatePixels();

  if(mandalaNum >= 7) {
    mandalaNum = 0;
  }

  if(mandalaBtn.title == "mandala" ) {
    mandalaBtn.title = "mandala " + "1";
    print("check")
  } else {
    mandalaNum++;
    mandalaBtn.title = "mandala " + str(mandalaNum);
  }

  if(lastMandala[2] == 0) {
    lastMandala[2] = 1;
  } else if(lastMandala[1] == 0) {
    lastMandala[1] = 1;
    lastMandala[2] = 0;
  } else if(lastMandala[0] == 0) {
    lastMandala[0] = 1;
    lastMandala[1] = 0;
    lastMandala[2] = 0;
  } else {
    resetLastMandala();
    mandalaBtn.title = "mandala " + "7";
    mandalaNum = 7;
  }

  // also unpause
  pauseBtn.title = "pause"
  paused = false;
}

// resets the mandala array in preparation for a new rule
function resetLastMandala() {
  for(let i = 0; i < 3; i++) {
    lastMandala[i] = 0;
  }
  lastMandala[2] = 1;
  mandalaNum = 1;
  mandalaBtn.title = "mandala";
}

function clear_cells() {
  graphics1.background(0);

  // also unpause
  pauseBtn.title = "pause";
  paused = false;
}

// this function kind of got away from me, but it works. the whole zoomcheck thing is messy but whatever.
function zoomControl(event) {
  let zoomCheck = zoom;
  if(event.deltaY < 0) {
    zoom = min(16, zoom * 2);
    if(zoomCheck != zoom) { // only center the zoom if a zoom adjustment actually occurred
      panX -= (mouseX - halfWidth) / zoom;
      panY -= (mouseY - halfHeight) / zoom;
    }
  } else {
    zoom = max(1, zoom * .5);
    if(zoomCheck != zoom) { // only center the zoom if a zoom adjustment actually occurred
      panX += (mouseX - halfWidth) / zoom * .5;
      panY += (mouseY - halfHeight) / zoom * .5;
    }
  }
  if(zoomCheck != zoom) {
    panX = min(max(-halfWidth / zoom * (zoom - 1), panX), halfWidth / zoom * (zoom - 1)); // auto-adjust panning when zooming out
    panY = min(max(-halfHeight / zoom * (zoom - 1), panY), halfHeight / zoom * (zoom - 1));
  }
}

// this is a built-in function
function mouseDragged(event) {
  if(mouseButton == CENTER) {
    panX = min(max(-halfWidth / zoom * (zoom - 1), panX + event.movementX / zoom), halfWidth / zoom * (zoom - 1));
    panY = min(max(-halfHeight / zoom * (zoom - 1), panY + event.movementY / zoom), halfHeight / zoom * (zoom - 1));
  }
  return true;
}

// rule functions:
// returns an array of NINE binary digits representing a decimal number input
function decToBinArray(dec) {
  const binArray = dec.toString(2).split("");
  let zeroes = 9 - binArray.length;
  for(let fill = 0; fill < zeroes; fill++) { // fill with leading zeroes
    binArray.unshift(0);
  }
  return binArray.map(Number);
}
// returns a decimal number derived from an array of binary digits
function binArrayToDec(bin) {
  let sum = 0;
  let count = 0;
  for(let dig = bin.length - 1; dig >= 0; dig--) {
    sum += (2 ** count) * bin[dig];
    count++;
  }
  return sum;
}
// takes an array and returns a new version with the last 8 digits moved left by 2 and wrapped around to the end, leaving index 0 untouched
function rotateForSym(arr) {
  return [arr[0], ...arr.slice(3, 9), ...arr.slice(1, 3)];
}

function generate() {
  backArray = [...ruleArray]; // update history
  // clear and initialize to -1s
  for(let i = 0; i < 512; i++) {
    ruleArray[i] = -1;
  }
  if(controls.symmetry) { // iterate through the array, get each one's 4, set all to same random number
    for(let i = 0; i < 512; i++) {
      if(ruleArray[i] == -1) {
        const state2 = rotateForSym(decToBinArray(i));
        const state3 = rotateForSym(state2);
        const state4 = rotateForSym(state3);
        let val = random([0, 1]);
        ruleArray[i] = val;
        ruleArray[binArrayToDec(state2)] = val;
        ruleArray[binArrayToDec(state3)] = val;
        ruleArray[binArrayToDec(state4)] = val;
      }
    }
  } else { // iterate through the array, setting each index to random 0 or 1
    for(let i = 0; i < 512; i++) {
      ruleArray[i] = random([0, 1]);
    }
  }
  controls.rule = ruleArray.join("");
  ruleText.value(controls.rule);
  print(controls.rule);
  arrToBuffer(ruleArray, graphics3); // update shader uniform source
  resetLastMandala();
  randomize_cells_mini();
}

function submit() {
  backArray = [...ruleArray]; // update history
  controls.rule = ruleText.value();
  const numArray = controls.rule.split("").map(Number);
  for(let index = 0; index < 512; index++) {
    ruleArray[index] = numArray[index];
  }
  print(controls.rule);
  arrToBuffer(ruleArray, graphics3); // update shader uniform source
  resetLastMandala();
  randomize_cells_mini();
}

// reload the previous rule
function back() {
  controls.rule = backArray.join("");
  ruleText.value(controls.rule);
  pane.refresh();
  submit();
}

// draws rule 1s and 0s to a graphics buffer arr.length x 1
function arrToBuffer(arr, buffer) {
  buffer.loadPixels();
  for(let x = 0; x < arr.length; x++) {
    index = x * 4;
    val = arr[x] * 255;
    buffer.pixels[index + 0] = val;
    buffer.pixels[index + 1] = val;
    buffer.pixels[index + 2] = val;
  }
  buffer.updatePixels();
}


function setup() {
  pixelDensity(1); // account for high-density displays
  canvas = createCanvas(floor(windowHeight * .8 * .5) * 2, floor(windowHeight * .8 * .5) * 2, WEBGL); // 3D mode to allow shaders
  canvas.position(0, 10, "relative");
  canvas.style("border-style", "solid");
  canvas.style("border-color", "gray");
  background(0); // initialize
  halfWidth = width * .5;
  halfHeight = height * .5;
  graphics1 = createGraphics(width, height); // create a 2D graphics buffer
  graphics1.background(0); // initialize
  graphics2 = createGraphics(width, height, WEBGL); // create a 3D graphics buffer
  graphics2.background(0); // initialize
  graphics3 = createGraphics(512, 1); // 2D buffer for rule (just 1 line of pixels)
  graphics3.background(0); // initialize

  // make rule array the right size
  for(let i = 0; i < 512; i++) {
    ruleArray.push(0);
  }

  // set up gui
  // define where the control panel should go
  const controlsContainer = createDiv();
  controlsContainer.id("controlsContainer");
  controlsContainer.style("position", "fixed"); // always visible, even when scrolling
  controlsContainer.style("top", "10px");
  controlsContainer.style("right", "10px"); // left or right
  controlsContainer.style("width", "320px");
  // create a pane as a child of the previously created div
  pane = new Tweakpane.Pane({container: document.getElementById("controlsContainer"), title: "controls", expanded: true});
  pane.registerPlugin(TweakpaneEssentialsPlugin); // add plugin for fpsgraph
  pane.addSeparator();
  pauseBtn = pane.addButton({title: "pause"}); // create pause button
  pauseBtn.on("click", () => { // alternatively, use () => yourFunc(anArg, anotherArg) to call any function with arguments
    if(!paused) {
      paused = true;
      pauseBtn.title = "resume";
    } else {
      paused = false;
      pauseBtn.title = "pause";
    }
  });
  pane.addSeparator();

  pane.addButton({title: "clear"}).on("click", () => clear_cells());
  pane.addButton({title: "fill"}).on("click", () => randomize_cells());
  mandalaBtn = pane.addButton({title: "mandala"}).on("click", () => mandala());
  iterSld = pane.addInput(controls, "iterations", {min: 2, max: 50, step: 2});
  pane.addInput(controls, "noFlicker", {label: "prevent flickering"}).on("change", () => {
    if(controls.noFlicker) {
      iterSld.dispose();
      controls.iterations = floor(controls.iterations / 2.0) * 2;
      iterSld = pane.addInput(controls, "iterations", {index: 6, min: 2, max: 50, step: 2});
    } else {
      iterSld.dispose();
      iterSld = pane.addInput(controls, "iterations", {index: 6, min: 1, max: 50, step: 1});
    }
  });
  pane.addInput(controls, "brushSize", {min: 1, max: 100, step: 1});
  const ruleControls = pane.addFolder({title: "rule", expanded: true});
  ruleControls.addInput(controls, "rule", {label: "----- preset ----->", options: {
    init: "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    game_of_life: "00000001000101100001011001101000000101100110100001101000100000000001011001101000011010001000000001101000100000001000000000000000000101100110100001101000100000000110100010000000100000000000000001101000100000001000000000000000100000000000000000000000000000000001011101111110011111101110100001111110111010001110100010000000011111101110100011101000100000001110100010000000100000000000000001111110111010001110100010000000111010001000000010000000000000001110100010000000100000000000000010000000000000000000000000000000",
    nice_still_lifes: "00000001011100000100000100011000001110011101111100100110011000100010100000110110000101100111100000010100010011101110000100110010001000001001111110110110000110111001110100111010111011011111100001100110111100000010101010000110001110111110011000100000110000001100110001100011111111000111000001111001110100100110010011111100111011101010111111011110010100100000110110001110001000100111001100111010100110101111010100011111110110010010100001110101110100000001101011100010000110100100001110101111110011101000100101000100",
    write_your_name: "00000101001100000000110101111110001001111000110000000001000101000100011101010001111010010011111000101010111111111111110011110000001000111100000001001011111110101100011101110111110111110110011001100110010001100111011000111010010001100111110000001010001000000001010001101000001010110011000101001001100101011000010100000011011000001001010010010101100011000100000110011010011101100000101100101110000000011000000000011101110000000001111001101010011010011000011101110101001011000110100100010011001000010111000111011111",
    streaking_paint: "00000110010101110110001000010010111000111101001101000100111010010010111100010111110100011110000101101010100010000000001000100001001110011000101010101101110100011011101011111001111110001110010100110000110001001011010111001101000010111101100100010000010011001001111110111010110010010101100000011000010111001110110010110100100101110001101010011100011001001101001011100111100000101101110100101101010110011110100011100000011010101000111111000110000010010001011111111010001110110101110111011110010000011110110011101001",
    thermal_vision: "10010101000010010101110001001100001000000000010111000111000011100100111100011101110110100101000100011101000101001001101100000101000000001000010101000100000001000000000000000100000011100001100011011000000101000111101111101101000100000000001010101101100001000111101110001101110001101001100010110101000101011011100101011111100111000101001101101101101101101100001101011101101101100100000011000100100010010001101101001100000001000011111101111110001011101101001011111111101101100111100000011100001110001011101010101000",
    magma_cooling: "00000111010101000100111011011001000010000000110000011001001101110111111000010001110011111111011111001100011111101001010001001101010001000000001111000111001100000001011001000101110111100100001101100011000011111011011100101001000101101001100101011101101111110000010001000100011011110100000001011100011000010011101100000110011111101110000111101101101011110101101101000010010101110100010000001100001011011110101101010100001011001011001100000000011010110000010010011100100101011100110000010110001100010010110010110011",
    division_decay: "11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111",
    mandala_tiles_7: "10010111011110100110101111111010010011111011110110010100100000110110101011010100101101011010110011101010110010001110010110010000011111110110000111001010110010001110010010001001111010010001101011100110011110010010110000000110110100000001011000110000101010000011011011011000011010101111011011111010010010001010000100100110011010111010000110000111110001011110111110111001000111111001011111001111110010111110010011100101010110100111011111000011001101101010001010000100010101010111111101010001101101100000111111100101",
    mandala_strobe: "01001100000101101100101000010000000000100000110100011110101001101101100000010101100100001000000101110010001010010000000100010101000101000100011100000000111000000001001001100001110010010000111100100010000110001011100110010111100100001001010100101111101101110001000100001101001100100011111001100111000001111100111100101111000100011101110100110011111101000111010111011111101111101011000000001111110101110000111010011110010101010010010001001111110011011101101001010101111111101111101001110010110001011011101010011010",
    mandala_square_variety: "01001000000000001101000101100011000100010001011001100111010100101000101000011110000100100110100000011111110000110111001010001001000000110001110101010110010111000100010000001001001110001101011100001101111001100010100011011001011110100001101101000011101101110110111010010000100011101100001010000100011010000000011100110011110001100110010011111100101100111101100001000100000100001100011011000101001001110110101100000001001111001010000110010100000000100010000000000111000010111000100001010101100110000001010011101001",
    mandala_pause_4: "10100010110000000110010010100001110011110100010100010101011001000010110011110111011110010000011110100011101100110011011101101111110010100100001010111001111111110101101101000101000010100101111100000001010111000011110101111101000011111101001101101111011101111100110100100000101010010011110101110011101001100010010100110011110000011001010010010100001110110010001111011110111110110110111100101010111110110000001111011111111101011010010001011110110000000100011111000111011010110110110100110111110010000101010111001101",
    mandala_nice_pattern: "01011101010010001000101100011010000111000000011010100010011100101110000001010010101000111111110101010111010011001100011110010101000001010001111110011110010001000001010000000000010111011000000011000110100000100010011111000111011110001000110000000101100001011001010001101001011111010010001101001101111100001100011001011111011011001110111111111011011011010001010111100011011001101001110000101011001001011011111000111100111011101101101100110001011001111001110101100011000111011101001001011010001111011101111010111011",
    sandy: "10110010111010010111011011010001110011001100011111010100010011010010111011111111011111101101000111001101000111100000001000111111111011000001000011111100000101111000100100110111010011111110101110011011000110010011101101100011001010110111010111111101011111101100110100010110101110010001110101010101010010000111110011110101110100011110111110110011010011100000011100011011111011110101101100011000000010100011110101011101000110000000010011010011010101010110111111001011110111000111011110001111100011110101101101011111",
    desication: "10000000011000110000000001110100000110111000010100100110110010000010001100010110000101000000001100111000101010010010100101110100001100100100110011010001101010101100001101110010010010010010110100010010110100000110100110010110100011000110010110100110000100101101101100011001110101001110100100010000011110011111001101101011100011100010101001001000001100111001101011010101100100000110111101000010001011110111001101000011011111011001111110100110001011111111100110111101000000111011100100011101111100011111011111111111",
    molten_crystals: "00010001000011010101000001001000000000010110000111001110000010010001101000101100000101110100011000011110001100001010010001100011000000000010010001100101011010110010101111110110000000100010100011011000010100011000110010100001000001010110000010110001010011001001000101011011011001000011101101111100011010001010010010101111001011001110010101111011011101000000011111001100100001111010101100011011101010111010111001000111011111011011001111000100001000111111001110000001000111100100010111010001111100011101100111111111",
    concavity_battle: "00000100010101010011110101000100010110110000101101111110001111000111011110001101110111110100110000111111001100100110111000110011000010000101111011000100111111110001001101110111100100111111101000111100110110101101110011100011001000111111111010101001011001010100110101000101111011100100110101001110000100110000101001111100111111111100001111101010111100110111111001000101100010010110111100001100010101101101111111000011000101010000100000110100100111000101000100110010110100111001010100101101110010101110111101000101",
    diamonds: "10010000011111010011001001110110011110011100111111111011011110010011001110111010000000101101001101011110101111010011100111000100001011111001111011110101011010001101101001010110110111101010110010111010110111111110001110111100011011001010100010110110000010010101110001011100101110010010010101101010000110011100100000010001111100011000100010000010011110110010010011110110010010000100111100001010110000001000011110110001010001100100110010110110010110011010110100110011110000110010000100000111000010110111010101011111",
    squares: "00000000010001110110011101110110010111010110010000111111101110110011111111110100011111001010100101011000110110010111100010100110000111110010111111101010000010110111110110000100010110100001010100010110110011111110100110111000110100011100101110010110110110110100110001000111100110000011011100111111011001100111110010101011111100010111110010110011010001100010010110111001001011111101100000010011111110111010110110101100011110101101011101001011101001100001101111001001111011000111011011110100101101001101001010101000",
    glider_entropy: "00000000000011000000001000100101001100101011001110101100000000100001000100000100000101011011011001100001110101100000111001111000001001101111100100000011100101101110010110001100001001111100100010000001101100001100111001100010001101100100010001100000100000000001011100011010001111101110111001111111111111111110000011010000010001111101101011101100100000101110100110010000101010111111001001011111111010000101100110001111011000011010010110011011000100111110100011000010011000000110011011001101010111110000000001110011",
  }}).on("change", () => {
    ruleText.value(controls.rule);
    submit();
  })
  ruleControls.addSeparator();
  ruleControls.addInput(controls, "symmetry", {label: "generate rules with rotational symmetry"});
  ruleControls.addButton({title: "previous"}).on("click", () => back());
  ruleControls.addButton({title: "generate new"}).on("click", () => generate());
  ruleControls.addButton({title: "submit/refresh"}).on("click", () => submit());
  // create p5.element text area and duct tape it to tweakpane
  ruleText = createElement("textarea", controls.rule);
  ruleText.parent(document.getElementsByClassName("tp-brkv tp-fldv_c")[0]); // gets a specific part of the pane, found by going through inspect element
  ruleText.position(37, 4, "relative"); // i measured it, this is dead center with a pane width of 320.
  ruleText.style("resize", "none");
  ruleText.style("overflow", "hidden");
  ruleText.attribute("cols", "30");
  ruleText.attribute("rows", "16");
  ruleText.attribute("maxlength", "512");

  pane.addSeparator();
  const stats = pane.addFolder({title: "stats", expanded: false});
  fpsGraph = stats.addBlade({view: "fpsgraph", label: "fps"});

  // set up zoom controls
  canvas.mouseWheel(zoomControl);

  // submit the default rule
  submit();

  // start with full-screen noise
  randomize_cells_mini();
}

function draw() {
  fpsGraph.begin();

  if(!paused) {
    // multiple iterations per frame
    let breaker = 0; // prevent overkill painting
    for(let i = 0; i < controls.iterations; i++) {
      // draw graphics1 to graphics2 through the shader
      graphics2.push();
      graphics2.fill(255);
      graphics2.noStroke();
      graphics2.shader(caShader); // set the shader
      caShader.setUniform("u_texture", graphics1); // pass in the buffer as a uniform sampler2D
      caShader.setUniform("u_texel", [1 / width, 1 / height]);
      caShader.setUniform("u_rule", graphics3);
      caShader.setUniform("u_ruleTexelW", 1 / 512);
      graphics2.rect(-halfWidth, -halfHeight, width, height); // a container (the size of graphics1) to draw through the shader
      graphics2.pop(); // this resets the shader, otherwise need to call resetShader()

      // paint!
      // this has to go on graphics1 because it's 2D. painting on the 3D one is a disaster.
      graphics1.clear();
      let paintX = (mouseX - halfWidth) / zoom + halfWidth - panX; // the half vars cancel out at zoom = 1
      let paintY = (mouseY - halfHeight) / zoom + halfHeight - panY;
      let painted = 0;
      if(!breaker && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        breaker = 1; // prevent running this section 100 times a frame
        // paint the lines
        if(mouseIsPressed && (mouseButton == LEFT || mouseButton == RIGHT)) {
          painted = 1;
          graphics1.push();
          graphics1.fill(255 * (mouseButton == LEFT)); // white on LMB, black on RMB
          graphics1.noStroke();
          graphics1.ellipse(paintX, paintY, controls.brushSize);
          graphics1.stroke(255 * (mouseButton == LEFT));
          graphics1.strokeWeight(controls.brushSize)
          graphics1.line(lastBrushX, lastBrushY, paintX, paintY);
          graphics1.pop();
        }
        lastBrushX = paintX;
        lastBrushY = paintY;
        // only run this extra shader pass if something was painted
        if(painted) {
          // draw the paint from graphics1 to graphics2 through the noise shader
          graphics2.push();
          graphics2.fill(255);
          graphics2.noStroke();
          graphics2.shader(noiseShader); // set the shader
          noiseShader.setUniform("u_texture", graphics1); // pass in the buffer as a uniform sampler2D
          noiseShader.setUniform("u_targetTexture", graphics2) // pass in graphics2 for blending
          noiseShader.setUniform("u_time", millis() * .001); // randomize the noise, lol
          graphics2.rect(-halfWidth, -halfHeight, width, height); // a container (the size of graphics1) to draw through the shader
          graphics2.pop(); // this resets the shader, otherwise need to call resetShader()
        } else { // also hide the brush outline while painting
          // draw the brush shape
          push();
          noFill();
          stroke(255);
          strokeWeight(2);
          // i haven't wrapped my head around this calculation, all i know is i have to multiply zoom back in here for
          // the ellipse to draw in the right location.
          ellipse((paintX - halfWidth + panX) * zoom, (paintY - halfHeight + panY) * zoom, controls.brushSize * zoom);
          pop();
        }
      }
      // draw final state of the automaton back to graphics1 as an image
      graphics1.image(graphics2, 0, 0);
      if(painted) {
        graphics1.filter(THRESHOLD); // prevent gray values from creeping in (need to fix texture filtering)
      }
    }
  }
  // draw graphics2 to the canvas with desired zoom
  // having this outside the pause check lets you zoom and pan while paused
  texture(graphics2);
  rect((-halfWidth + panX) * zoom, (-halfHeight + panY) * zoom, width * zoom, height * zoom);

  fpsGraph.end();
}