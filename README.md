# GPU-2D-CA
 Made with p5.js
 
 Try it here: https://one-lemon.com/projects/GPU-2D-CA/

 This project can simulate every possible 2D cellular automaton that uses a 3x3 kernel. How?
 
 First, it takes a 512-digit binary number and creates a 512x1 texture of black and white pixels based on the 0s and 1s respectively. Then, the grid of initially randomized cells is processed by a fragment shader. The shader looks at each pixel and its 8 neighbors, and extracts a binary number from their states. For instance: if only the top-left and bottom-right are white, the number would be 000010001 or 17. The shader would then read the 512x1 texture passed in as a uniform and get the color at (17/512, .5). That is the color the current cell should switch to according to the current "rule".
 
 To prove it works, here's the rule for Conway's Game of Life: 
00000001000101100001011001101000000101100110100001101000100000000001011001101000011010001000000001101000100000001000000000000000000101100110100001101000100000000110100010000000100000000000000001101000100000001000000000000000100000000000000000000000000000000001011101111110011111101110100001111110111010001110100010000000011111101110100011101000100000001110100010000000100000000000000001111110111010001110100010000000111010001000000010000000000000001110100010000000100000000000000010000000000000000000000000000000

Only 1-2% of randomly generated rules are even remotely interesting, but that makes finding a weird one more exciting! You can also try editing a few bits at a time to see how a small change can have a big effect... or no effect!
