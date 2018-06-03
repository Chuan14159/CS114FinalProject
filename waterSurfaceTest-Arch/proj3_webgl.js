/* 
 * Initializing GL object
 */
var gl;
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if ( !gl ) alert("Could not initialise WebGL, sorry :-(");

    gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError, validateNoneOfTheArgsAreUndefined);
}


/*
 * Initializing cloth mesh shaders 
 */
var shaderProgram;
function createShader(vs_id, fs_id) {
    var shaderProg = createShaderProg(vs_id, fs_id);

    shaderProg.vertexPositionAttribute = gl.getAttribLocation(shaderProg, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProg.vertexPositionAttribute);
    shaderProg.vertexNormalAttribute = gl.getAttribLocation(shaderProg, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProg.vertexNormalAttribute);        

    shaderProg.pMatrixUniform = gl.getUniformLocation(shaderProg, "uPMatrix");
    shaderProg.mvMatrixUniform = gl.getUniformLocation(shaderProg, "uMVMatrix");
    shaderProg.nMatrixUniform = gl.getUniformLocation(shaderProg, "uNMatrix");
    shaderProg.lightPosUniform = gl.getUniformLocation(shaderProg, "uLightPos");

    return shaderProg;
}

function initShaders() {
    shaderProgram = createShader("shader-vs", "shader-fs");
    gl.useProgram(shaderProgram);    
}


var mvMatrixStack = [];
/**
* Routine for pushing a current model view matrix to a stack for hieroarchial modeling
* @return None
*/
function mvPushMatrix() {
    var copy = mat4.create(mvMatrix);
    mvMatrixStack.push(copy);
}


/**
* Routine for popping a stored model view matrix from stack for hieroarchial modeling
* @return None
*/
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
    	throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

/*
 * Initializing and updating buffers
 */
var vertexPositionBuffer, vertexNormalBuffer, indexBuffer, wireIndexBuffer;
function initBuffers(createBuffers) {
    if ( createBuffers ) {
        vertexPositionBuffer = gl.createBuffer();
        vertexNormalBuffer = gl.createBuffer();        
        indexBuffer = gl.createBuffer();
        wireIndexBuffer = gl.createBuffer();        
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertexPosition), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertexNormal), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(clothIndex), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(clothWireIndex), gl.STATIC_DRAW); 

      
}

function updateBuffers() {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertexPosition), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertexNormal), gl.DYNAMIC_DRAW);
}


//function switchShaders(isSkybox){
//    gl.uniform1f(gl.getUniformLocation(shaderProgram, "uIsSkybox"), isSkybox);
//}
/**
* Function to setup the cubemap texture for the skybox a.
* @return None
*/


function resetMesh() {
    initMesh();
    initBuffers(false);
}


/*
 * Main rendering code 
 */

// Basic rendering parameters
var mvMatrix = mat4.create();                   // Model-view matrix for the main object
var pMatrix = mat4.create();                    // Projection matrix

// Lighting control
var lightMatrix = mat4.create();                // Model-view matrix for the point light source
var lightPos = vec3.create();                   // Camera-space position of the light source

// Animation related variables
var rotY = 0.0;                                 // object rotation
var rotY_light = 0.0;                           // light position rotation

var transVec = vec3.create();

function setUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    var nMatrix = mat4.transpose(mat4.inverse(mvMatrix));
    gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);

    gl.uniform3fv(shaderProgram.lightPosUniform, lightPos);
}

var drawMode;
function drawScene() {
    gl.useProgram(shaderProgram);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(50, gl.viewportWidth/gl.viewportHeight, 0.1, 100.0, pMatrix);

    mat4.identity(lightMatrix);

    //light animation
    
    mat4.rotateY(lightMatrix, rotY);
    
    
    mat4.translate(lightMatrix, [0.0, 0.5, -10.0]);
    //mat4.rotateX(lightMatrix, 0.3);
    mat4.rotateY(lightMatrix, rotY_light);
    
    lightPos.set([0.0, 2.5, 3.0]);
    mat4.multiplyVec3(lightMatrix, lightPos);
    
    mat4.identity(mvMatrix);
    
    mvPushMatrix();
    mat4.translate(mvMatrix, [0.0, -0.1, -2.0]);
    //mat4.rotateX(mvMatrix, 0.3);
    
    mat4.rotateX(mvMatrix, 0.2);
    
    //cam animation
    
    mat4.rotateY(mvMatrix, rotY);
    mat4.translate(mvMatrix, transVec);
    
    setUniforms();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

    // Normal mode
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);        
    gl.drawElements(gl.TRIANGLES, clothIndex.length, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix();

}

/**************skybox code*********/

function getSkyboxShader(gl, id) {
      var shaderScript = document.getElementById(id);
      if (!shaderScript) {
          return null;
      }

      var str = "";
      var k = shaderScript.firstChild;
      while (k) {
          if (k.nodeType == 3)
              str += k.textContent;
          k = k.nextSibling;
      }

      var shader;
      if (shaderScript.type == "x-shader/x-fragment") {
          shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (shaderScript.type == "x-shader/x-vertex") {
          shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
          return null;
      }

      gl.shaderSource(shader, str);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          alert(gl.getShaderInfoLog(shader));
          return null;
      }

      return shader;
  }

var skyboxShaderProgram;
  function initSkyboxShaders() {
    var skyboxFragmentShader = getSkyboxShader(gl, "skybox-shader-fs");
    var skyboxVertexShader = getSkyboxShader(gl, "skybox-shader-vs");

    skyboxShaderProgram = gl.createProgram();
    gl.attachShader(skyboxShaderProgram, skyboxVertexShader);
    gl.attachShader(skyboxShaderProgram, skyboxFragmentShader);
    gl.linkProgram(skyboxShaderProgram);

    if (!gl.getProgramParameter(skyboxShaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }

    gl.useProgram(skyboxShaderProgram);

    skyboxShaderProgram.vertexPositionAttribute = gl.getAttribLocation(skyboxShaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(skyboxShaderProgram.vertexPositionAttribute);

    skyboxShaderProgram.pMatrixUniform = gl.getUniformLocation(skyboxShaderProgram, "uPMatrix");
    skyboxShaderProgram.mvMatrixUniform = gl.getUniformLocation(skyboxShaderProgram, "uMVMatrix");
    skyboxShaderProgram.samplerUniform = gl.getUniformLocation(skyboxShaderProgram, "uSampler");
  }

function setMatrixUniforms() {
    gl.uniformMatrix4fv(skyboxShaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(skyboxShaderProgram.mvMatrixUniform, false, mvMatrix);
 }

 function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

var cubeVertexPositionBuffer;
var cubeVertexIndexBuffer;

function initSkyboxBuffers() {
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,cubeVertexPositionBuffer);
    var vertices = [
    // Front face
    -10.0, -10.0,  10.0,
     10.0, -10.0,  10.0,
     10.0,  10.0,  10.0,
    -10.0,  10.0, 10.0,

    // Back face
    -10.0, -10.0, -10.0,
    -10.0,  10.0, -10.0,
     10.0,  10.0, -10.0,
     10.0, -10.0, -10.0,

    // Top face
    -10.0,  10.0, -10.0,
    -10.0,  10.0,  10.0,
     10.0,  10.0,  10.0,
     10.0,  10.0, -10.0,
    // Bottom face
    -10.0, -10.0, -10.0,
     10.0, -10.0, -10.0,
     10.0, -10.0,  10.0,
    -10.0, -10.0,  10.0,

    // Right face
     10.0, -10.0, -10.0,
     10.0,  10.0, -10.0,
     10.0,  10.0,  10.0,
     10.0, -10.0,  10.0,

    // Left face
    -10.0, -10.0, -10.0,
    -10.0, -10.0,  10.0,
    -10.0,  10.0,  10.0,
    -10.0,  10.0, -10.0
  ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = 24;

    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    var cubeVertexIndices = [
      0, 1, 2,      0, 2, 3,    // Front face
      4, 5, 6,      4, 6, 7,    // Back face
      8, 9, 10,     8, 10, 11,  // Top face
      12, 13, 14,   12, 14, 15, // Bottom face
      16, 17, 18,   16, 18, 19, // Right face
      20, 21, 22,   20, 22, 23  // Left face
    ]
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices),gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = 36;
}

function initSkyboxCubeMap(){
    cubeTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);

    var cubeImage = new Image();
    cubeImage.onload = function() {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImage); 
        
    }
    cubeImage.src = "skybox/pos-x.JPG";
    
    var cubeImage1 = new Image();
    cubeImage1.onload = function() {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImage1); 
        
    }
    cubeImage1.src = "skybox/neg-x.JPG";
    
    var cubeImage2 = new Image();
    cubeImage2.onload = function() {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImage2); 
        
    }
    cubeImage2.src = "skybox/pos-y.JPG";
    
    var cubeImage3 = new Image();
    cubeImage3.onload = function() {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImage3); 
        
    }
    cubeImage3.src = "skybox/neg-y.JPG";
    
    var cubeImage4 = new Image();
    cubeImage4.onload = function() {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImage4); 
        
    }
    cubeImage4.src = "skybox/pos-z.JPG";
    
    var cubeImage5 = new Image();
    cubeImage5.onload = function() {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImage5); 
        
    }
    cubeImage5.src = "skybox/neg-z.JPG";
    //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR); 
}

function drawSkybox() {
    gl.useProgram(skyboxShaderProgram);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(50, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);

    //mat4.translate(mvMatrix, [2.0, 5.0, 0.0]);
    //mat4.rotate(mvMatrix, degToRad(90), [0, 1, 0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(skyboxShaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
    gl.uniform1i(skyboxShaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems,gl.UNSIGNED_SHORT,0);
}
/*****************endskybox code*************/


var lastTime = 0;
var rotSpeed = 60, rotSpeed_light = 60;
var rotating = false, rotating_light = false;
var animated = true;

/*****handling keys*******/
var keyCode = [0,0,0,0];
function getKeyCode() {
    document.onkeydown = keyDown;
    document.onkeyup = keyUp;
}

function keyDown(event){
    //console.log(event.keyCode);
    if (event.keyCode == "87") { //W
        keyCode[0] = 1;
    }
    if (event.keyCode == "65") { //A
        keyCode[1] = 1;
    }
    if (event.keyCode == "83") { //S
        keyCode[2] = 1;
    }
    if (event.keyCode == "68") { //D
        keyCode[3] = 1;
    }
}

function keyUp(event){
    if (event.keyCode == "87") { //W
        keyCode[0] = 0;
    }
    if (event.keyCode == "65") { //A
        keyCode[1] = 0;
    }
    if (event.keyCode == "83") { //S
        keyCode[2] = 0;
    }
    if (event.keyCode == "68") { //D
        keyCode[3] = 0;
    }
}

function handleKey(){ //cam transform tick
    //console.log(keyCode);
    var transition = vec3.create();
    if (keyCode[0] == 1) { //W
        vec3.add(transition, [Math.sin(Math.PI/2-(rotY+Math.PI/2)),0,Math.cos(Math.PI/2-(rotY+Math.PI/2))]);
    }
    if (keyCode[1] == 1) { //A
        rotY -= 0.02;
    }
    if (keyCode[2] == 1) { //S
        vec3.subtract(transition, [Math.sin(Math.PI/2-(rotY+Math.PI/2)),0,Math.cos(Math.PI/2-(rotY+Math.PI/2))]);
    }
    if (keyCode[3] == 1) { //D
        rotY += 0.02;
    }
    vec3.scale(transition,0.02);
    vec3.add(transVec,transition);
}


function tick() {
    requestAnimationFrame(tick);

    var timeNow = new Date().getTime();
    if ( lastTime != 0 ) {
      var elapsed = timeNow - lastTime;
      if ( rotating )
        rotY += rotSpeed*0.0175*elapsed/1000.0;
      if ( rotating_light )
        rotY_light += rotSpeed_light*0.0175*elapsed/1000.0;
        handleKey();
      
    }
    lastTime = timeNow;  
    drawScene();   
    drawSkybox();

    if ( animated ) {
        var timeStep = 0.001;
        var n = Math.ceil(0.01/timeStep);
        for ( var i = 0; i < n; ++i ) simulate(timeStep);
        computeNormals();
        updateBuffers();
    }
}

function webGLStart() {
    var canvas = $("#canvas0")[0];

    meshResolution = 30;
    mass = 1.0;
    restLength = vec3.create();
    K = vec3.create([25000.0, 25000.0, 25000.0]);
    Cd = 0.5;
    uf = vec3.create([0.0, 0.0, 1.0]);
    Cv = 0.5;    

    initGL(canvas);


    initMesh();
    initShaders();
    initBuffers(true);

    initSkyboxShaders();
    initSkyboxBuffers();
    initSkyboxCubeMap();
    

    
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    drawMode = 0;

    tick();
}
