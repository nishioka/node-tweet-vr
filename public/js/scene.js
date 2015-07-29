(function () {
    'use strict';

    var socket = io.connect();
    $('form').submit(function () {
        socket.emit('msg', $('input').val());
        $('input').val('');
        return false;
    });

    var container;

    var modeVR = false;
    var helper, axis, grid;

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var XHTML_NS = 'http://www.w3.org/1999/xhtml';
    var XLINK_NS = 'http://www.w3.org/1999/xlink';

    window.objects = [];

    function addAxisGrid() {
        // X軸:赤, Y軸:緑, Z軸:青
        axis = new THREE.AxisHelper(2000);
        window.scene.add(axis);

        // GridHelper
        grid = new THREE.GridHelper(2000, 100);
        window.scene.add(grid);

        helper = true;
    }

    function removeAxisGrid() {
        window.scene.remove(axis);
        window.scene.remove(grid);

        helper = false;
    }

    function animate() {
        TWEEN.update();

        if (modeVR) {
            // Update VR headset position and apply to camera.
            window.vrControl.update(5);
            // Render the scene through the VREffect.
            window.vrEffect.render(window.scene, window.camera);
        } else {
            window.mouseControl.update();
            window.renderer.render(window.scene, window.camera);
        }

        window.cursor && window.cursor.update();
        Arrows.update();

        // keep looping
        requestAnimationFrame(animate);

        //視野の外に出たtweetを削除
        /*
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
        */
    }

    function onWindowResize() {
        window.camera.aspect = window.innerWidth / window.innerHeight;
        window.camera.updateProjectionMatrix();

        if (modeVR) {
            window.vrEffect.setSize(window.innerWidth, window.innerHeight);
        } else {
            window.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    function show(element) {
        element.classList.remove('display-none');
    }

    function hide(element) {
        element.classList.add('display-none');
    }

    //logs camera pos when h is pressed
    function rotest() {
        console.log(window.camera.rotation.x, window.camera.rotation.y, window.camera.rotation.z);
    }

    function onkey(event) {
        event.preventDefault();

        if (event.keyCode === 90) { // z
            window.vrControl.zeroSensor();
        } else if (event.keyCode === 70 || event.keyCode === 13) { //f or enter
            window.vrEffect.setFullScreen(true); //fullscreen
        } else if (event.keyCode === 72) { //h
            rotest();
            if (helper) {
                removeAxisGrid();
            } else {
                addAxisGrid();
            }
        }
    }

    function init() {
        window.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        window.camera.position.z = 2000;

        window.scene = new THREE.Scene();

        addAxisGrid();
        helper = true;

        // レンダーのセットアップ
        window.renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        // VR stereo rendering
        window.vrEffect = new THREE.VREffect(window.renderer);
        window.vrEffect.setSize(window.innerWidth, window.innerHeight);

        // renderer.autoClear = false;
        window.renderer.setClearColor(0x222222);
        //renderer.setSize(window.innerWidth, window.innerHeight);
        //renderer.domElement.style.position = 'absolute';

        // container that fullscreen will be called on.
        container = document.getElementById('vrContainer');
        container.appendChild(window.renderer.domElement);

        // for VR
        window.vrControl = new THREE.VRFlyControls(window.camera);

        // for not VR
        window.mouseControl = new THREE.OrbitControls(window.camera, window.renderer.domElement);
        window.mouseControl.rotateSpeed = 0.5;
        window.mouseControl.minDistance = 500;
        window.mouseControl.maxDistance = 6000;

        window.addEventListener('resize', onWindowResize, false);

        window.addEventListener('keydown', onkey, true);

        // enterVR button
        var enterVr = document.getElementById('enterVR');
        // when VR is not detected
        var getVr = document.getElementById('getVR');
        VRClient.getVR.then(function () {
            // vr detected
            getVr.classList.add('display-none');
        }, function () {
            // displays when VR is not detected
            enterVr.classList.add('display-none');
            getVr.classList.remove('display-none');
        });

        // ダブルクリックでfull-screen VR mode
        window.addEventListener('dblclick', function () {
            modeVR = true;
            window.vrEffect.setFullScreen(true);
            //window.cursor.setMode('centered'); //視線カーソル
            window.cursor.setMode('hides');
        }, false);

        // full-screen VR modeからの復帰時の処理
        document.addEventListener('mozfullscreenchange', function () {
            if (document.mozFullScreenElement === null) {
                modeVR = false;
                window.cursor.setMode('mono');
            }
        });

        requestAnimationFrame(animate);
    }

    socket.on('msg', function (tweet) {
        //console.log(tweet);
        var canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 160;
        var context = canvas.getContext('2d');

        // SVGの作成
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttributeNS(null, 'version', '1.1');
        svg.setAttribute('xmlns', SVG_NS);
        svg.setAttribute('xmlns:xlink', XLINK_NS);
        svg.setAttribute('width', canvas.width);
        svg.setAttribute('height', canvas.height);

        // DOMをforeignObjectでSVGに描画
        var object = document.createElementNS(SVG_NS, 'foreignObject');
        object.setAttribute('width', '100%');
        object.setAttribute('height', '100%');
        svg.appendChild(object);

        // DOMオブジェクトの作成
        var html = document.createElementNS(XHTML_NS, 'div');
        html.setAttribute('xmlns', XHTML_NS);
        object.appendChild(html);

        var element = document.createElementNS(XHTML_NS, 'div');
        element.style.backgroundColor = 'rgba(0,127,127,' + (Math.random() * 0.5 + 0.25) + ')';
        //element.style.width = canvas.width;
        //element.style.height = canvas.height;
        element.style.boxShadow = '0px 0px 12px rgba(0, 255, 255, 0.5)';
        element.style.border = '1px solid rgba(127, 255, 255, 0.25)';
        element.style.textAlign = 'left';
        html.appendChild(element);

        var name = document.createElementNS(XHTML_NS, 'div');
        name.textContent = tweet.user.name + ' @' + tweet.user.screen_name;
        name.style.position = 'absolute';
        name.style.top = '5px';
        name.style.left = '5px';
        name.style.right = '0px';
        name.style.fontSize = '14px';
        name.style.color = 'rgba(127, 255, 255, 0.75)';
        element.appendChild(name);

        var text = document.createElementNS(XHTML_NS, 'div');
        text.textContent = tweet.text;
        text.style.position = 'absolute';
        text.style.top = '30px';
        text.style.left = '60px';
        text.style.right = '5px';
        text.style.fontSize = '18px';
        text.style.fontWeight = 'bold';
        text.style.color = 'rgba(255, 255, 255, 0.75)';
        text.style.textShadow = '0px 0px 10px rgba(0, 255, 255, 0.95)';
        element.appendChild(text);

        var thumbnail = document.createElementNS(SVG_NS, 'image');
        thumbnail.setAttribute('xlink:href', tweet.user.profile_image_url);
        thumbnail.setAttribute('x', 5);
        thumbnail.setAttribute('y', 35);
        thumbnail.setAttribute('width', 48);
        thumbnail.setAttribute('height', 48);
        svg.appendChild(thumbnail);

        var svgBlob = new Blob([svg.outerHTML], {
            type: 'image/svg+xml;charset=utf-8'
        });
        //console.log('blob', svgBlob);

        // SVGをCanvasに描画する
        var DOMURL = self.URL || self.webkitURL || self;
        var url = DOMURL.createObjectURL(svgBlob);
        //console.log('url', url);
        var image = new Image();
        image.onload = (function (url, img, ctx) {
            return function () {
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
                mesh.position.z = Math.random() * 2000 - 1000;
                //mesh.position.z = -2000;

                mesh.addEventListener('click', function (event) {
                    console.log('click', event.target.name + ' user:' + tweet.user.screen_name, this);
/*
                    if (this.clickMap) {
                        this.setMap(this.clickMap);
                    }

                    this.clicked = true;

                    if (this.options.onClick) {
                        this.options.onClick(event);
                    }
*/

                }, false);

                mesh.addEventListener('mouseover', function (event) {
                    //console.log('mouseover', event.target.name + ' user:' + tweet.user.screen_name, this);
                    this.material.color.setRGB(1, 0, 0);
                }, false);

                mesh.addEventListener('mouseout', function (event) {
                    //console.log('mouseout', event.target.name + ' user:' + tweet.user.screen_name, this);
                    this.material.color.setRGB(1, 1, 1);
                }, false);

                window.scene.add(mesh);

                window.objects.push(mesh);
                /*
                window.objects.push({
                    mesh: mesh,
                    geometry: geometry,
                    material: material,
                    texture: texture
                });
                */
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

    init();

}).call(this);