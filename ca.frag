#ifdef GL_ES
precision mediump float; // precision for all floats in this shader
#endif

varying vec2 vTexCoord;

uniform sampler2D u_texture; // own texture must be manually passed in as a uniform
uniform vec2 u_texel;
uniform sampler2D u_rule;
uniform float u_ruleTexelW;

void main() {
    vec2 uv = vTexCoord;
    // the texture is loaded upside down by default and must be flipped
    uv.y = 1.0 - uv.y;

    float index = 0.0; // accumulates until we've found the index of the rule to check for the output

    index += pow(2.0, 0.0) * texture2D(u_texture, vec2(mod(uv.x - u_texel.x, 1.0), mod(uv.y - u_texel.y, 1.0))).r;
    index += pow(2.0, 1.0) * texture2D(u_texture, vec2(mod(uv.x, 1.0), mod(uv.y - u_texel.y, 1.0))).r;
    index += pow(2.0, 2.0) * texture2D(u_texture, vec2(mod(uv.x + u_texel.x, 1.0), mod(uv.y - u_texel.y, 1.0))).r;
    index += pow(2.0, 3.0) * texture2D(u_texture, vec2(mod(uv.x + u_texel.x, 1.0), mod(uv.y, 1.0))).r;
    index += pow(2.0, 4.0) * texture2D(u_texture, vec2(mod(uv.x + u_texel.x, 1.0), mod(uv.y + u_texel.y, 1.0))).r;
    index += pow(2.0, 5.0) * texture2D(u_texture, vec2(mod(uv.x, 1.0), mod(uv.y + u_texel.y, 1.0))).r;
    index += pow(2.0, 6.0) * texture2D(u_texture, vec2(mod(uv.x - u_texel.x, 1.0), mod(uv.y + u_texel.y, 1.0))).r;
    index += pow(2.0, 7.0) * texture2D(u_texture, vec2(mod(uv.x - u_texel.x, 1.0), mod(uv.y, 1.0))).r;
    index += pow(2.0, 8.0) * texture2D(u_texture, vec2(mod(uv.x, 1.0), mod(uv.y, 1.0))).r;

    gl_FragColor = texture2D(u_rule, vec2((index + 0.5) * u_ruleTexelW, 0.5)); // .5 centers the sampler on the pixel to prevent antialiasing issues
}