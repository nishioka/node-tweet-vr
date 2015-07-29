(function () {
    'use strict';

    function initCursor() {
        // must be global so that blur and focus can access it in app.js
        window.cursor = new VRCursor('mono');

        // can't customize position of cursor without messing things up.
        // note: VRCursor will have to be upgraded in order to allow always being in front of mesh.
        window.cursor.init(window.renderer.domElement, window.camera, window.scene);

        window.cursor.ready.then(function () {
            window.scene.add(window.cursor.layout);
            window.cursor.cursor.position.setZ(-0.35);
            window.cursor.cursor.material.color.setHex(0x81d41d);
            window.cursor.enable();
            console.log('cursor', window.cursor);
        });
/*

        // enable or disable cursor on VRclient focus & blur callbacks
        VRClient.onBlur = function () {
            window.cursor.disable();
        };

        VRClient.onFocus = function () {
            window.cursor.enable();
        };
*/
    }

    // Connect to localhost and start getting frames
    Leap.loop();

    // Docs: http://leapmotion.github.io/leapjs-plugins/main/transform/
    Leap.loopController.use('transform', {

        // This matrix flips the x, y, and z axis, scales to meters, and offsets the hands by -8cm.
        vr: true,

        // This causes the camera's matrix transforms (position, rotation, scale) to be applied to the hands themselves
        // The parent of the bones remain the scene, allowing the data to remain in easy-to-work-with world space.
        // (As the hands will usually interact with multiple objects in the scene.)
        effectiveParent: window.camera
    });

    // Docs: http://leapmotion.github.io/leapjs-plugins/main/bone-hand/
    Leap.loopController.use('boneHand', {

        // If you already have a scene or want to create it yourself, you can pass it in here
        // Alternatively, you can pass it in whenever you want by doing
        // Leap.loopController.plugins.boneHand.scene = myScene.
        scene: window.scene,
        opacity: 0.7,

        arm: true
    });

    Leap.loopController.use('twoHandRecognizer');

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

    var VRClientReady = false;
    var VRClientFocused = true;
    VRClient.onFocus = function () {
        VRClientFocused = true;

        window.cursor.enable();

        var connection = Leap.loopController.connection;
        if (!connection) { return; }

        connection.reportFocus(true);
    };

    VRClient.onBlur = function () {
        VRClientFocused = false;

        window.cursor.disable();

        var connection = Leap.loopController.connection;
        if (!connection) { return; }

        connection.reportFocus(false);
    };

    initCursor();

/*
    var zDepth = -0.39;

    var gridMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        specular: 0x000000,
        // Note: the current gridlines have too much transparency in-grained for this to look good.
        //transparent: true,
        //opacity: 1,
        map: THREE.ImageUtils.loadTexture('img/Grid-03.png')
    });

    var grid = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        gridMat
    );
    grid.name = 'grid';
    window.scene.add(grid);

    grid.rotation.set(-Math.PI / 2, 0, 0);
    grid.position.set(0, -1.23, zDepth - 0.02);
*/

    var handArrow1 = new HandArrow(window.scene);
    var handArrow2 = new HandArrow(window.scene);

    Leap.loopController.on('twoHand.start', function (hand1, hand2) {
        console.log('twoHand.start');
        if (handArrow1.mesh !== undefined) {
            handArrow1.mesh.visible = true;
        }
        if (handArrow2.mesh !== undefined) {
            handArrow2.mesh.visible = true;
        }
    });

    Leap.loopController.on('twoHand.update', function (hand1, hand2) {
        console.log('twoHand.update');
        handArrow1.update(hand1.palmPosition, hand2.palmPosition);
        handArrow2.update(hand2.palmPosition, hand1.palmPosition);
    });

    Leap.loopController.on('twoHand.end', function () {
        console.log('twoHand.end');
        if (handArrow1.mesh !== undefined) {
            handArrow1.mesh.visible = false;
        }
        if (handArrow2.mesh !== undefined) {
            handArrow2.mesh.visible = false;
        }
    });

    /*
        window.controller = controller = new Leap.Controller({
            background: true
        });

        controller.use('riggedHand', {
            parent: window.scene,
            camera: window.camera,
            scale: 0.25,
            positionScale: 6,
            offset: new THREE.Vector3(0, -2, 0),
            renderFn: function () {},
            boneColors: function (boneMesh, leapHand) {
                return {
                    hue: 0.6,
                    saturation: 0.2,
                    lightness: 0.8
                };
            }
        });

        controller.use('playback', {
            recording: 'pinch-and-move-57fps.json.lz',
            loop: false
        });

        controller.connect();

        controller.on('frame', function (frame) {
            var hand, handMesh, offsetDown, offsetForward, pos;
            if (!frame.hands[0]) {
                return;
            }
            hand = frame.hands[0];
            handMesh = hand.data('riggedHand.mesh');
            if (hand.pinchStrength > 0.5) {
                pos = Leap.vec3.clone(hand.palmPosition);
                offsetDown = Leap.vec3.clone(hand.palmNormal);
                Leap.vec3.multiply(offsetDown, offsetDown, [30, 30, 30]);
                Leap.vec3.add(pos, pos, offsetDown);
                offsetForward = Leap.vec3.clone(hand.direction);
                Leap.vec3.multiply(offsetForward, offsetForward, [30, 30, 30]);
                Leap.vec3.add(pos, pos, offsetForward);
                handMesh.scenePosition(pos, scope.light1position);
            }
            return extraOutput.innerHTML = scope.light1position.toArray().map(function (num) {
                return num.toPrecision(2);
            });
        });
    */

}).call(this);