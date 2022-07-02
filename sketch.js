let font; // WebGL requires fonts to be loaded manually
let canvas;
let graphics1; // stage 1
let graphics2; // stage 2
let graphics3; // rule
let rule;
const ruleArray = [];
let backArray;
let symmetry;
let ruleGenerate;
let ruleSubmit;
let ruleBack;
let caShader;
let noiseShader;
let iterSlider;
let flickering;
let brushSlider;
let lastBrushX = 0; // for drawing smooth lines
let lastBrushY = 0;
let zoom = 1;
let panX = 0;
let panY = 0;
let halfWidth;
let halfHeight;
let fillButton;
let clearButton;
let mandalaButton;
let mandalaLabel;
let mandalaNum = 1;
const lastMandala = [0, 0, 1];
let pauseButton;
let paused = false;
const fps = [];


function preload() {
  font = loadFont("arial.ttf"); // web-safe font
  caShader = loadShader("shader.vert", "ca.frag");
  noiseShader = loadShader("shader.vert", "noise.frag"); // white -> noise
}


// displays the average framerate over a given history size
function draw_fps_avg(hist = 3, bg = true, margin = 2) {
  // update the rolling window of framerates
  if(fps.push(frameRate()) > hist) {
    fps.shift();
  } else { // if the array is smaller than it should be:
    for(let i = 0; i < hist; i++) {
      fps.push(frameRate()); // grow the array up to size
    }
  }

  // average the samples
  let fpsAvg = 0;
  for(let i = 0; i < hist; i++) {
    fpsAvg += fps[i];
  }
  let fpsText = (fpsAvg / hist).toFixed(0);

  // deal with WebGL's center origin
  let halfWidth = width * .5;
  let halfHeight = height * .5;
  // draw background if necessary
  push(); // begin a new drawing state
  textFont(font, 15); // set this here so we know the height of the font
  if(bg) {
    fill(0, 127);
    noStroke();
    rect(-halfWidth, halfHeight - textAscent() - margin * 2, textWidth(fpsText) + margin * 2, textAscent() + margin * 2);
  }
  // draw framerate text in the bottom left with no decimal places
  fill(0, 200, 255, 255);
  stroke(0, 255); // stroke on text doesn't work with WebGL apparently, but i'm leaving it in.
  strokeWeight(2);
  text(fpsText, -halfWidth + margin, halfHeight - margin);
  pop(); // restore drawing state
}

// called when pause button is clicked
function toggle_pause() {
  if(!paused) {
    pauseButton.html("resume")
    paused = true;
  } else {
    pauseButton.html("pause")
    paused = false;
  }
}

// THIS PREVENT CONTEXT MENU WHEN RIGHT-CLICKING ON THE CANVAS
document.oncontextmenu = function() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height)
    return false;
}

// called when iterSlider is changed
function iterSlider_input() {
  iterText.value(iterSlider.value());
}
// called when iterText is changed
function iterText_input() {
  iterSlider.value(iterText.value());
}
function toggleFlickering() {
  if(flickering.checked()) {
    iterSlider.attribute("min", "2");
    iterSlider.attribute("step", "2");
    iterSlider.value(floor(iterSlider.value() / 2) * 2 - 2); // the -2 here is because for some reason it rounds UP during the division (floor not necessary)
    iterText.value(iterSlider.value());
  } else {
    iterSlider.attribute("min", "1");
    iterSlider.attribute("step", "1");
    iterSlider.value(iterText.value());
  }
}

// called when brushSlider is changed
function brushSlider_input() {
  brushText.value(brushSlider.value());
}
// called when brushText is changed
function brushText_input() {
  brushSlider.value(brushText.value());
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
  pauseButton.html("pause")
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
  pauseButton.html("pause")
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

  if(mandalaLabel.html() == "") {
    mandalaLabel.html(1);
  } else {
    mandalaNum++;
    mandalaLabel.html(mandalaNum);
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
    mandalaLabel.html(7);
    mandalaNum = 7;
  }

  // also unpause
  pauseButton.html("pause")
  paused = false;
}

// resets the mandala array in preparation for a new rule
function resetLastMandala() {
  for(let i = 0; i < 3; i++) {
    lastMandala[i] = 0;
  }
  lastMandala[2] = 1;
  mandalaNum = 1;
  mandalaLabel.html("");
}

function clear_cells() {
  graphics1.background(0);

  // also unpause
  pauseButton.html("pause")
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
    ruleArray.shift(); // shift out index 0
    ruleArray.push(-1); // push in index 511
  }
  if(symmetry.checked()) { // iterate through the array, get each one's 4, set all to same random number
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
  rule.value(ruleArray.join(""));
  print(rule.value());
  arrToBuffer(ruleArray, graphics3); // update shader uniform source
  resetLastMandala();
  randomize_cells_mini();
}

function submit() {
  backArray = [...ruleArray]; // update history
  const numArray = rule.value().split("").map(Number);
  for(let index = 0; index < 512; index++) {
    ruleArray[index] = numArray[index];
  }
  print(rule.value());
  arrToBuffer(ruleArray, graphics3); // update shader uniform source
  resetLastMandala();
  randomize_cells_mini();
}

// reload the previous rule
function back() {
  rule.value(backArray.join(""));
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
  canvas.position((windowWidth - width) / 2, 32); // center the window
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

  // set up controls for iterations
  iterSlider = createSlider(2, 50, 2, 2);
  iterSlider.position(10, 100);
  iterSlider.style("width", "150px");
  iterSlider.input(iterSlider_input);
  iterText = createInput(str(iterSlider.value()), "number");
  iterText.position(10, 70);
  iterText.style("width", "40px")
  iterText.input(iterText_input);
  let iterTextLabel = createP("iterations per frame");
  iterTextLabel.position(65, 57);
  iterTextLabel.style("color", "#FFFFFF");
  iterTextLabel.style("font-family", "Arial");
  flickering = createCheckbox("prevent flickering", true);
  flickering.position(15, 125);
  flickering.style("color", "#FFFFFF");
  flickering.style("font-family", "Arial");
  flickering.changed(toggleFlickering);

  // set up controls for painting
  brushSlider = createSlider(1, 100, 35);
  brushSlider.position(10, 220);
  brushSlider.style("width", "150px");
  brushSlider.input(brushSlider_input);
  brushText = createInput(str(brushSlider.value()), "number");
  brushText.position(10, 190);
  brushText.style("width", "40px")
  brushText.input(brushText_input);
  let brushTextLabel = createP("brush size (Paint|Erase)");
  brushTextLabel.position(65, 177);
  brushTextLabel.style("color", "#FFFFFF");
  brushTextLabel.style("font-family", "Arial");

  // set up a fill button
  fillButton = createButton("fill screen");
  fillButton.position(80, 10);
  fillButton.mousePressed(randomize_cells);

  // set up a mandala button
  mandalaButton = createButton("mandala");
  mandalaButton.position(165, 10);
  mandalaButton.mousePressed(mandala);
  mandalaLabel = createP("");
  mandalaLabel.position(194, 22);
  mandalaLabel.style("color", "#FFFFFF");
  mandalaLabel.style("font-family", "Arial");

  // set up a clear button
  clearButton = createButton("clear");
  clearButton.position(243, 10);
  clearButton.mousePressed(clear_cells);

  // set up a pause button
  pauseButton = createButton("pause");
  pauseButton.position(10, 10);
  pauseButton.mousePressed(toggle_pause);

  // set up symmetrical rule checkbox
  symmetry = createCheckbox("randomize with 4-fold rotational symmetry", true);
  symmetry.position(10, 575);
  symmetry.style("color", "#FFFFFF");
  symmetry.style("font-family", "Arial");

  // show framerate checkbox
  showFrames = createCheckbox("show framerate", false);
  showFrames.position(10, 600);
  showFrames.style("color", "#FFFFFF");
  showFrames.style("font-family", "Arial");

  // set up rule input/output
  rule = createElement("textarea", "00010001000011010101000001001000000000010110000111001110000010010001101000101100000101110100011000011110001100001010010001100011000000000010010001100101011010110010101111110110000000100010100011011000010100011000110010100001000001010110000010110001010011001001000101011011011001000011101101111100011010001010010010101111001011001110010101111011011101000000011111001100100001111010101100011011101010111010111001000111011111011011001111000100001000111111001110000001000111100100010111010001111100011101100111111111");
  rule.position(15, 313);
  rule.style("resize", "none");
  rule.attribute("cols", "30");
  rule.attribute("rows", "16");
  rule.attribute("maxlength", "512");
  let ruleLabel = createP("RULE:");
  ruleLabel.position(15, 270);
  ruleLabel.style("color", "#FFFFFF");
  ruleLabel.style("font-family", "Arial");
  ruleBack = createButton("back");
  ruleBack.position(68, 283);
  ruleBack.mousePressed(back);
  ruleGenerate = createButton("randomize");
  ruleGenerate.position(118, 283);
  ruleGenerate.mousePressed(generate);
  ruleSubmit = createButton("submit");
  ruleSubmit.position(202, 283);
  ruleSubmit.mousePressed(submit);

  // set up zoom controls
  canvas.mouseWheel(zoomControl);

  // submit the default rule
  submit();

  // start with full-screen noise
  randomize_cells();
}

function draw() {
  if(!paused) {
    // multiple iterations per frame
    let breaker = 0; // prevent overkill painting
    for(let i = 0; i < iterSlider.value(); i++) {
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
          graphics1.ellipse(paintX, paintY, brushSlider.value());
          graphics1.stroke(255 * (mouseButton == LEFT));
          graphics1.strokeWeight(brushSlider.value())
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
          ellipse((paintX - halfWidth + panX) * zoom, (paintY - halfHeight + panY) * zoom, brushSlider.value() * zoom);
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
  
  if(showFrames.checked()) {
    draw_fps_avg();
  }
}