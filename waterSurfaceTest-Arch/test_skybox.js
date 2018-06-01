var gl;
  function initGL(canvas) {
    try {
      gl = canvas.getContext("experimental-webgl");
      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;
    } catch(e) {
    }
    if (!gl) {
      alert("Could not initialise WebGL, sorry :-( ");
    }
  }

function getShader(gl, id) {
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

var shaderProgram;
  function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    console.log("Vertex attrib: ", shaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    //shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    //gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    // Enable vertex normals
    //shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    //gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    //shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    //gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
  }

  function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  var nehe;
function initTexture()
{
	nehe = gl.createTexture();
	nehe.image = new Image();
	nehe.image.onload=function(){
		handleLoadedTexture(nehe)
	}
	nehe.image.src = "neg-x.JPG"
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var mvMatrixStack = [];

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
  }

  function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
  }

  function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
 }

 function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

var cubeVertexPositionBuffer;
var cubeVertexIndexBuffer;

function initBuffers() {
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

function initCubeMap(){
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

function drawScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	//mat4.perspective(pMatrix,degToRad(90), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
	mat4.identity(mvMatrix);

	//mat4.translate(mvMatrix, [-2.0, -1.0, -10.0]);

	//mvPushMatrix();
	//mat4.rotate(mvMatrix, degToRad(rCube), [1, 0, 0]);
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems,gl.UNSIGNED_SHORT,0);
	//mvPopMatrix();
}

var rCube = 0;

function tick()
{
	requestAnimationFrame(tick);
	drawScene();
	//animate();
}

var lastTime = 0;
  function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
      var elapsed = timeNow - lastTime;

      //rPyramid += (90 * elapsed) / 1000.0;
      rCube += (75 * elapsed) / 1000.0;
    }
    lastTime = timeNow;
  }

  

function webGLStart() {
    var canvas = document.getElementById("skybox-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    //initTexture();
    initCubeMap();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //drawScene();
    tick();
  }