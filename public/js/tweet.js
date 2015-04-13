/* global THREE:false, TWEEN:false, Promise:false, HMDVRDevice:false, PositionSensorVRDevice:false, self:false, io:false */

var socket = io.connect();
$('form').submit(function() {
    socket.emit('msg', $('input').val());
    $('input').val('');
    return false;
});

var container;

var camera, scene;
var vrEffect, renderer;
var vrControl, monoControl;

var helper, axis, grid;

var objects = [];

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 3000;

    scene = new THREE.Scene();

    addAxisGrid();
    helper = true;

    // レンダーのセットアップ
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    // VR stereo rendering
    vrEffect = new THREE.VREffect(renderer);
    vrEffect.setSize(window.innerWidth, window.innerHeight);

    // renderer.autoClear = false;
    renderer.setClearColor(0x222222);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute';

    // container that fullscreen will be called on.
    container = document.getElementById('vrPeriodictable');
    container.appendChild(renderer.domElement);

    // for VR
    vrControl = new THREE.VRFlyControls(camera);

    // for not VR
    monoControl = new THREE.OrbitControls(camera, renderer.domElement);
    monoControl.rotateSpeed = 0.5;
    monoControl.minDistance = 500;
    monoControl.maxDistance = 6000;

    // ダブルクリックでfull-screen VR mode
    window.addEventListener('dblclick', function() {
        changeMode('vr');

        vrEffect.setFullScreen(true);
    }, false);

    // full-screen VR modeからの復帰
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);

    window.addEventListener('resize', onWindowResize, false);

    window.addEventListener('keydown', onkey, true);

    // enterVR button
    var enterVr = document.getElementById('enterVR');
    // when VR is not detected
    var getVr = document.getElementById('getVR');
    vrDetect().then(function() {
        // vr detected
        hide(getVr);
    }, function() {
        // displays when VR is not detected
        hide(enterVr);
        show(getVr);
    });

    enterVr.addEventListener('click', function() {
        changeMode('vr');

        vrEffect.setFullScreen(true);
    }, false);
}

socket.on('msg', function(tweet) {
    //console.log(tweet);
    // table
    var canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 160;
    var context = canvas.getContext("2d");

    // DOMオブジェクトをCanvasに描画する
    var DOMURL = self.URL || self.webkitURL || self;
    // DOMオブジェクト
    var element = document.createElement('div');
    element.className = 'element';
    element.style.backgroundColor = 'rgba(0,127,127,' + (Math.random() * 0.5 + 0.25) + ')';

    var name = document.createElement('div');
    name.className = 'name';
    name.textContent = tweet.user.name + ' @' + tweet.user.screen_name;
    element.appendChild(name);

    var text = document.createElement('div');
    text.className = 'text';
    text.textContent = tweet.text;
    element.appendChild(text);

    //    var thumbnail = document.createElement('img');
    //    thumbnail.className = 'text';
    //    thumbnail.setAttribute('src', tweet.user.profile_image_url);
    //    element.appendChild(thumbnail);

    //    var screen_name = document.createElement('div');
    //    screen_name.className = 'screen-name';
    //    screen_name.textContent = tweet.user.screen_name;
    //    element.appendChild(screen_name);
    var DOMSVG =
        "<svg version='1.1' baseProfile='full'" +
        "    xmlns='http://www.w3.org/2000/svg'" +
        "    xmlns:xlink='http://www.w3.org/1999/xlink'" +
        "    xmlns:ev='http://www.w3.org/2001/xml-events'" +
        "    width='" + canvas.width + "' height='" + canvas.height + "'>" +
        "<foreignObject width='100%' height='100%'>" +
        "<div xmlns='http://www.w3.org/1999/xhtml'>" +
        "<style>" +
        ".element {" +
        "    width: " + canvas.width + "px;" +
        "    height: " + canvas.height + "px;" +
        "    box-shadow: 0px 0px 12px rgba(0, 255, 255, 0.5);" +
        "    border: 1px solid rgba(127, 255, 255, 0.25);" +
        "    text-align: left;" +
        "}" +
        ".element .name {" +
        "    position: absolute;" +
        "    top: 5px;" +
        "    left: 5px;" +
        "    right: 0px;" +
        "    font-size: 14px;" +
        "    color: rgba(127, 255, 255, 0.75);" +
        "}" +
        ".element .text {" +
        "    position: absolute;" +
        "    top: 30px;" +
        "    left: 60px;" +
        "    right: 5px;" +
        "    font-size: 18px;" +
        "    font-weight: bold;" +
        "    color: rgba(255, 255, 255, 0.75);" +
        "    text-shadow: 0 0 10px rgba(0, 255, 255, 0.95);" +
        "}" +
        ".element .thumbnail {" +
        "    position: absolute;" +
        "    top: 30px;" +
        "    left: 5px;" +
        "}" +
        ".element .screen-name {" +
        "    position: absolute;" +
        "    top: 5px;" +
        "    left: 0px;" +
        "    right: 0px;" +
        "    font-size: 12px;" +
        "    color: rgba(127, 255, 255, 0.75);" +
        "}" +
        "</style>" +
        element.outerHTML +
        "</div>" +
        "</foreignObject>" +
        "<image xlink:href='" + tweet.user.profile_image_url + "' x='5' y='35' width='48' height='48'></image>" +
        "</svg>";

    var svg = new Blob([DOMSVG], {
        type: 'image/svg+xml;charset=utf-8'
    });
    var url = DOMURL.createObjectURL(svg);

    var image = new Image();
    image.onload = (function(url, img, ctx) {
        return function() {
            ctx.drawImage(this, 0, 0, canvas.width, canvas.height);

            // オブジェクト破棄
            DOMURL.revokeObjectURL(url);

            var geometry = new THREE.PlaneBufferGeometry(canvas.width, canvas.height);

            // 生成したcanvasをtextureとしてTHREE.Textureオブジェクトを生成
            var texture = new THREE.Texture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;

            var material = new THREE.MeshBasicMaterial({
                side: THREE.DoubleSide,
                map: texture
            });
            material.transparent = true;

            // 初期位置はランダムで配置
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = Math.random() * 2000 - 1000;
            mesh.position.y = Math.random() * 2000 - 1000;
            mesh.position.z = -2000;

            scene.add(mesh);

            objects.push({
                mesh: mesh,
                geometry: geometry,
                material: material,
                texture: texture
            });
        };
    })(url, image, context);
    image.src = url;
/*
    var converterEngine = function(input) { // fn BLOB => Binary => Base64 ?
        var uInt8Array = new Uint8Array(input),
            i = uInt8Array.length;
        var biStr = []; //new Array(i);
        while (i--) {
            biStr[i] = String.fromCharCode(uInt8Array[i]);
        }
        var base64 = window.btoa(biStr.join(''));
        console.log("2. base64 produced >>> " + base64); // print-check conversion result
        return base64;
    };

    var getImageBase64 = function(url, callback) {
        // 1. Loading file from url:
        var xhr = new XMLHttpRequest(url);
        xhr.open('GET', url, true); // url is the url of a PNG image.
        xhr.responseType = 'arraybuffer';
        xhr.callback = callback;
        xhr.onload = function(e) {
            if (this.status === 200) { // 2. When loaded, do:
                console.log("1:Loaded response >>> " + this.response); // print-check xhr response 
                var imgBase64 = converterEngine(this.response); // convert BLOB to base64
                this.callback(imgBase64); //execute callback function with data
            }
        };
        xhr.send();
    };

    //SVG DOM injection
    getImageBase64(tweet.user.profile_image_url, function(data) {
        console.log('data:image/png;base64,' + data); // replace link by data URI
    });
*/
});

function addAxisGrid() {
    // xyz-axis
    axis = new THREE.AxisHelper(2000);
    scene.add(axis);

    // GridHelper
    grid = new THREE.GridHelper(2000, 100);
    scene.add(grid);

    helper = true;
}

function removeAxisGrid() {
    scene.remove(axis);
    scene.remove(grid);

    helper = false;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    if (monoControl.enabled) {
        renderer.setSize(window.innerWidth, window.innerHeight);
    } else {
        vrEffect.setSize(window.innerWidth, window.innerHeight);
    }

    render();
}

function animate() {
    requestAnimationFrame(animate);

    //視野の外に出たtweetを削除
    for (var i = 0; i < objects.length; ++i) {
        objects[i].mesh.position.z += 1;
        if (objects[i].mesh.position.z > 4000) {
            scene.remove(objects[i].mesh);
            objects[i].geometry.dispose();
            objects[i].material.dispose();
            objects[i].texture.dispose();

            objects.splice(i, 1);
        }
    }

    //    TWEEN.update();
    render();
    if (monoControl.enabled) {
        monoControl.update();
    } else {
        vrControl.update(5);
    }
}

function render() {
    if (monoControl.enabled) {
        renderer.render(scene, camera);
    } else {
        vrEffect.render(scene, camera);
    }
}

function changeMode(mode) {
    console.log('changing mode: ' + mode);
    switch (mode) {
        case 'mono':
            monoControl.enabled = true;
            renderer.setSize(window.innerWidth, window.innerHeight);
            break;
        case 'vr':
            monoControl.enabled = false;
            vrEffect.setSize(window.innerWidth, window.innerHeight);
            break;
    }
}

function handleFullScreenChange() {
    if (document.mozFullScreenElement === null) {
        changeMode('mono');
    }
}

function show(element) {
    element.classList.remove('display-none');
}

function hide(element) {
    element.classList.add('display-none');
}

function onkey(event) {
    event.preventDefault();

    if (event.keyCode === 90) { // z
        vrControl.zeroSensor();
    } else if (event.keyCode === 70 || event.keyCode === 13) { //f or enter
        vrEffect.setFullScreen(true); //fullscreen
    } else if (event.keyCode === 72) { //h
        rotest();
        if (helper) {
            removeAxisGrid();
        } else {
            addAxisGrid();
        }
    }
}

function vrDetect() {
    var hmdDevice, positionDevice;
    return new Promise(function(resolve, reject) {
        if (navigator.getVRDevices) {
            navigator.getVRDevices().then(function(devices) {

                console.log('found ' + devices.length + ' devices');

                for (var i = 0; i < devices.length; ++i) {
                    if (devices[i] instanceof HMDVRDevice && !hmdDevice) {
                        hmdDevice = devices[i];
                        //console.log('found head mounted display device');
                    }

                    if (devices[i] instanceof PositionSensorVRDevice &&
                        devices[i].hardwareUnitId === hmdDevice.hardwareUnitId && !positionDevice) {
                        positionDevice = devices[i];
                        //console.log('found motion tracking devices');
                        break;
                    }
                }

                if (hmdDevice && positionDevice) {
                    resolve();
                    return;
                }
                reject('no VR devices found!');
            });
        } else {
            reject('no VR implementation found!');
        }
    });
}

//logs camera pos when h is pressed
function rotest() {
    console.log(camera.rotation.x, camera.rotation.y, camera.rotation.z);
}
