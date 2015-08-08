(function () {
    'use strict';

    var VRClientReady = false;
    var VRClientFocused = true;
    //var fadingSpheres = [];
    //var sphereTTL = 7;

    function initCursor() {
        window.cursor = new VRCursor('mono');

        window.cursor.init(window.renderer.domElement, window.camera, window.scene);

        window.cursor.ready.then(function () {
            window.scene.add(window.cursor.layout);
            window.cursor.cursor.position.setZ(-0.35);
            window.cursor.cursor.material.color.setHex(0x81d41d);
            window.cursor.enable();
            console.log('cursor', window.cursor);
        });

        VRClient.onFocus = function () {
            VRClientFocused = true;

            window.cursor.enable();

            var connection = Leap.loopController.connection;
            if (!connection) {
                return;
            }

            connection.reportFocus(true);
        };

        VRClient.onBlur = function () {
            VRClientFocused = false;

            window.cursor.disable();

            var connection = Leap.loopController.connection;
            if (!connection) {
                return;
            }

            connection.reportFocus(false);
        };
    }

    initCursor();

    // Connect to localhost and start getting frames
    Leap.loop();

    // Docs: http://leapmotion.github.io/leapjs-plugins/main/transform/
    Leap.loopController.use('transform', {

        // This matrix flips the x, y, and z axis, scales to meters, and offsets the hands by -8cm.
        vr: true,
        position: new THREE.Vector3(1, 0, 0),
        effectiveParent: window.camera
    });

    Leap.loopController.use('handHold'); // Model(HandやFinger, Pointable)にframeを跨ぐデータの保持機構を提供する
    Leap.loopController.use('handEntry'); // handオブジェクトの検出(handFound)・消失(handLost)イベントを追加する
    Leap.loopController.use('screenPosition');

    Leap.loopController.use('riggedHand', {
        dotsMode: true,
        helper: true,
        parent: window.scene,
        camera: window.camera,
        renderer: window.modeVR ? window.vrEffect : window.renderer,
        //scale: 0.25,
        positionScale: 1,
        offset: new THREE.Vector3(0, -1, 0),
        renderFn: function () {},
        /*
                materialOptions: {
                    wireframe: true
                },
        */
        boneLabels: function (boneMesh, leapHand) {
            if (boneMesh.name.indexOf('Finger_03') === 0) {
                return leapHand.pinchStrength;
            }
        },
        boneColors: function (boneMesh, leapHand) {
            if ((boneMesh.name.indexOf('Finger_0') === 0) || (boneMesh.name.indexOf('Finger_1') === 0)) {
                return {
                    hue: 0.6,
                    saturation: leapHand.pinchStrength,
                    lightness: 0.8
                };
            }
        },
        checkWebGL: true
    });


    // Docs: http://leapmotion.github.io/leapjs-plugins/main/bone-hand/
    /*
        Leap.loopController.use('boneHand', {
            scene: window.scene,
            opacity: 0.7,

            arm: true
        });
    */

    Leap.loopController.connect();

    // This is fairly important - it prevents the framerate from dropping while there are no hands in the frame.
    // Should probably default to true in LeapJS.
    Leap.loopController.loopWhileDisconnected = true;

    Leap.loopController.on('streamingStarted', function () {
        console.log('Leap Motion Controller streaming');

        var connection = this.connection;
        this.connection.on('focus', function () {
            if (!VRClientReady) {
                return;
            }

            connection.reportFocus(VRClientFocused);
        });

    });

    // VR Cursor events
    var events = {
        clickEvent: {
            type: 'click'
        },
        mouseMoveEvent: {
            type: 'mousemove'
        },
        mouseOverEvent: {
            type: 'mouseover'
        },
        mouseOutEvent: {
            type: 'mouseout'
        },
        mouseDownEvent: {
            type: 'mousedown'
        }
    };

    var rayLineGeometry = new THREE.Geometry();
    rayLineGeometry.vertices.push(new THREE.Vector3(0,  0, 0));
    rayLineGeometry.vertices.push(new THREE.Vector3(0, 0, 4000));
    var rayLine = new THREE.Line(rayLineGeometry, new THREE.LineBasicMaterial(0xff0000));
    window.scene.add(rayLine);
    
    window.objectMouseOver = null;

    Leap.loopController.on('frame', function (frame) {
        var hand = frame.hands[0];
        if (hand) {
            var prevJoint = new THREE.Vector3().fromArray(hand.indexFinger.distal.prevJoint);
            var nextJoint = new THREE.Vector3().fromArray(hand.indexFinger.distal.nextJoint);
            rayLine.position.copy(prevJoint);
            //console.log('rayLine.position', rayLine.position);
            rayLine.up = new THREE.Vector3(0,1,0); //Y axis up
            rayLine.lookAt(nextJoint);

            var ray = new THREE.Raycaster(prevJoint, nextJoint.sub(prevJoint).normalize());
            var intersects = ray.intersectObjects(window.objects);

            var intersected;
            var objectMouseOver = window.objectMouseOver;

            //RayにのっているObjectがない場合は、保持中のObjectでmouseoutイベントを発生させる
            if (intersects.length === 0 && window.objectMouseOver !== null) {
                window.objectMouseOver.dispatchEvent(events.mouseOutEvent);
                //console.log('intersected(mouseOut)', this.objectMouseOver);
                window.objectMouseOver = null;
            }

            for (var i = 0; i < intersects.length; ++i) {
                intersected = intersects[i].object;
                //console.log('intersected:', intersected);

                //Rayにのっているのが保持中のObjectの場合はイベントを発生させない
                if (intersected !== objectMouseOver) {
                    if (objectMouseOver !== null) {
                        objectMouseOver.dispatchEvent(events.mouseOutEvent);
                        //console.log('intersected(mouseOut)', objectMouseOver);
                    }
                    if (intersected !== null) {
                        if (intersected.allAncestors(function () { return this.visible; })) {
                            intersected.dispatchEvent(events.mouseOverEvent);
                            //console.log('intersected(mouseOver)', intersected);
                        }
                    }
                    window.objectMouseOver = intersected;

                }
            }
        }
    });

}).call(this);