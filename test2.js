var renderer, scene, camera, riggedHandPlugin, fadingSpheres
var sphereTTL = 7;
var sceneArea = 200;

function initScene() {
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, sceneArea / 100,
        sceneArea * 4);
    camera.position.z = sceneArea;
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);

    // renderer
    renderer = new THREE.WebGLRenderer({
        antialias: false
    });

    renderer.setSize(window.innerWidth, window.innerHeight);

    container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    fadingSpheres = [];
}


function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    if (fadingSpheres) {
        fadingSpheres.forEach(removeDeadSpheres);
    }
}

function FadingSphere(position, size, meshColor) {
    //Draw the sphere at the position of the indexfinger tip position
    var geometry = new THREE.SphereGeometry(3, 8, 8);
    var material = new THREE.MeshLambertMaterial({
        color: meshColor
    });

    var mesh = new THREE.Mesh(geometry, material);

    mesh.material.ambient = mesh.material.color;

    mesh.position.x = position.x;
    mesh.position.y = position.y;
    mesh.position.z = position.z;

    this.sphere = mesh;

    scene.add(this.sphere);
    fadingSpheres.push(this);

    this.ttl = sphereTTL;
    this.updateToRemove = function () {
        this.ttl--;
        return (this.ttl <= 0);
    }
}

function removeDeadSpheres(fadingSphere, number, array) {
    if (fadingSphere) {
        if (fadingSphere.updateToRemove()) {
            scene.remove(fadingSphere.sphere);
            var index = array.indexOf(fadingSphere);
            array.splice(index, 1);
        }
    }
}

function convertLeapPointToScene(position, ibox) {

    var x, y, z
    var coords = [x, y, z];
    coords.forEach(function (current, index, sourceArray) {
        current = position[index] - ibox.center[index];
        current /= ibox.size[index];
        current *= sceneArea; //TODO: Change this, do not use global variable
        sourceArray[index] = current;
    });


    coords[2] -= sceneArea;

    return new THREE.Vector3(coords[0], coords[1], coords[2]);
}

//Within the leap draw loop
//Leap loop to call drawing functions
Leap.loop(
        function (frame) {
            frame.hands.forEach(
                function (hand) {
                    var handMesh = hand.data('riggedHand.mesh');

                    function createSphereAtFingerTip(fingerIndex, colorHex) {
                        new FadingSphere(convertLeapPointToScene(hand.fingers[fingerIndex].tipPosition, frame.interactionBox), 3, colorHex);
                    }

                    createSphereAtFingerTip(0, 0xF57E20) //Thumb
                    createSphereAtFingerTip(1, 0xFFCC00) //Index
                    createSphereAtFingerTip(2, 0xCCCC51) //Middle
                    createSphereAtFingerTip(3, 0x8FB258) //Ring
                    createSphereAtFingerTip(4, 0x336699) //pinky
                }
            )
        }
    )
    .use('riggedHand')
    .use('handEntry')

riggedHandPlugin = Leap.loopController.plugins.riggedHand;

initScene();
render();