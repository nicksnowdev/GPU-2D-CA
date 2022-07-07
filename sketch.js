/// <reference path="../../TSDef/p5/global.d.ts" />

let pane;
const controls = {
  iterations: 2,
  noFlicker: true,
  brushSize: 35,
  rule: "00010001000011010101000001001000000000010110000111001110000010010001101000101100000101110100011000011110001100001010010001100011000000000010010001100101011010110010101111110110000000100010100011011000010100011000110010100001000001010110000010110001010011001001000101011011011001000011101101111100011010001010010010101111001011001110010101111011011101000000011111001100100001111010101100011011101010111010111001000111011111011011001111000100001000111111001110000001000111100100010111010001111100011101100111111111",
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




function preload() {
  caShader = loadShader("vert.glsl", "ca_frag.glsl");
  noiseShader = loadShader("vert.glsl", "noise_frag.glsl"); // white -> noise
}




// THIS PREVENT CONTEXT MENU WHEN RIGHT-CLICKING ON THE CANVAS
document.oncontextmenu = function() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height)
    return false;
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
  pane.refresh();
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
  canvas = createCanvas(512, 512, WEBGL); // 3D mode to allow shaders
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
  controlsContainer.style("left", "10px"); // left or right
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
  randomize_cells();
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