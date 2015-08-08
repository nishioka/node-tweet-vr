var renderer, scene, camera, riggedHandPlugin, fadingSpheres
var sphereTTL = 7;
var sceneArea = 200;

function initScene(basisScene) {
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, sceneArea / 100,
        sceneArea * 4);
    camera.position.z = sceneArea;
    scene = basisScene;
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
    //Next line no longer needed:
    //renderer.render(scene, camera);          
    requestAnimationFrame(render);
}

function FadingSphere(position, size, meshColor) {
    //Draw the sphere at the position of the indexfinger tip position
    var geometry = new THREE.SphereGeometry(3, 8, 8);
    var material = new THREE.MeshLambertMaterial({
        color: meshColor
    });

    var mesh = new THREE.Mesh(geometry, material);

    mesh.material.ambient = mesh.material.color;

    mesh.position.copy(position)

    this.sphere = mesh;

    scene.add(this.sphere);
    fadingSpheres.push(this);

    this.ttl = sphereTTL;
    this.updateToRemove = function () {
        this.ttl--;
        this.sphere.opacity = (this.ttl / sphereTTL);
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

//Within the leap draw loop
//Leap loop to call drawing functions
Leap.loop()
    .use('riggedHand', {
        dotsMode: true,
        helper: true
    }).on('hand', function (hand) {
        var handMesh = hand.data('riggedHand.mesh');

        function createSphereAtFingerTip(fingerIndex, colorHex) {

            pos = (new THREE.Vector3()).fromArray(hand.fingers[fingerIndex].tipPosition);

            // test 3 - position the white sphere in here.
            sphere.position.copy(pos)

            new FadingSphere(pos, 3, colorHex);

        }

        createSphereAtFingerTip(0, 0xF57E20) //Thumb
        createSphereAtFingerTip(1, 0xFFCC00) //Index
        createSphereAtFingerTip(2, 0xCCCC51) //Middle
        createSphereAtFingerTip(3, 0x8FB258) //Ring
        createSphereAtFingerTip(4, 0x336699) //pinky

        if (fadingSpheres)
            fadingSpheres.forEach(removeDeadSpheres);
    })


riggedHandPlugin = Leap.loopController.plugins.riggedHand;


// test 1 - bone hand is in the correct position

Leap.loopController.use('boneHand', {
    renderer: riggedHandPlugin.renderer,
    scene: riggedHandPlugin.parent,
    camera: riggedHandPlugin.camera,
    render: function () {}
})

// test 2 - very simply positioning a sphere.

window.sphere = new THREE.Mesh(new THREE.SphereGeometry(12), new THREE.MeshBasicMaterial(0x0000ff));
riggedHandPlugin.parent.add(sphere);
Leap.loopController.on('frame', function (frame) {
    var hand;

    if (!scene)
        initScene(riggedHandPlugin.parent);
});

render();