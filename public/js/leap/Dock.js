(function() {

// A few hard-coded assumptions:
// The dock is on the left, and items slide to the right
window.Dock = function(scene, planeMesh, controller, options){
  (options.moveZ === undefined) && (options.moveZ = false);
  (options.moveY === undefined) && (options.moveY = false);

  this.plane = new InteractablePlane(planeMesh, controller, options);
  var halfHeight = planeMesh.geometry.parameters.height / 2;
  var halfWidth  = planeMesh.geometry.parameters.width  / 2;

  this.plane.movementConstraints.x = function(x){
    if (x > halfWidth) return halfWidth;
    if (x < -halfHeight) return -halfHeight;
    return x;
  };

  this.mesh = planeMesh;
  this.scene = scene;
  this.controller = controller;

  this.images = [];
  this.padding = 0.003;

  this.activationDistance = 0.05; // distance an image must be drawn out to be free.
  this.imageMinHeight = -0.007;

  this.imageRemoveCallbacks = [];
  this.imageLoadCallbacks = [];

  this.interactable = true;
};

window.Dock.prototype = {

  pushImage: function(url){

    THREE.ImageUtils.loadTexture(url, undefined, function(texture){
        var height = this.mesh.geometry.parameters.height; // scale will be inherited.  Let's never scale dock so that we
        // don't have to compensate when removing item from dock.
        var scale = (height -0.02) / texture.image.height;

        var imgGeometry = new THREE.PlaneGeometry(texture.image.width * scale, texture.image.height * scale);
        var material = new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide, transparent: true});

        var imageMesh = new THREE.Mesh(imgGeometry, material);
        imageMesh.name = url;
        imageMesh.receiveShadow = true;
        this.mesh.receiveShadow = true;

        imageMesh.position.set(0, this.imageMinHeight, (this.images.length + 1) * 0.001);
        this.mesh.add(imageMesh);

        var image = new InteractablePlane(imageMesh, this.controller, {moveZ: false, moveX: false});

        image.movementConstraints.y = function(y) {
          if ( y < this.imageMinHeight) return this.imageMinHeight;
          return y
        }.bind(this);

        this.images.push(image);

        this.arrangeImages();

        image.travel( this.onImageTravel.bind(this) );
        image.release( this.onRelease.bind(this) );

        this.emit("imageLoad", image);

      }.bind(this)
    );

  },

  arrangeImages: function(){
    var imageMesh, lastImage, xPosition;

    for (var i = 0; i < this.images.length; i++){
      imageMesh = this.images[i].mesh;
      lastImage = this.images[i - 1] && this.images[i - 1].mesh;
      if (lastImage){
        xPosition = lastImage.position.x + (lastImage.geometry.parameters.width / 2) + (imageMesh.geometry.parameters.width / 2) + this.padding;
      } else {
        xPosition = - (this.mesh.geometry.parameters.width / 2) + (imageMesh.geometry.parameters.width / 2 + this.padding );
      }
      imageMesh.position.setX(xPosition);
      this.images[i].originPosition = imageMesh.position.clone();

    }
  },

  onImageTravel: function(interactablePlane, imageMesh){
    if (imageMesh.parent === this.mesh && imageMesh.position.y > this.activationDistance){

      interactablePlane.changeParent(this.scene);

      // remove constraints:
      interactablePlane.options.moveX = true;
//      interactablePlane.options.moveZ = true;
      interactablePlane.clearMovementConstraints();

      // Emit an image removed event
      this.emit('imageRemove', [interactablePlane]);

      for (var i = 0; i < this.images.length; i++){
        if (this.images[i] === interactablePlane){
          this.images.splice(i,1);
          break;
        }
      }

// this causes the images to jump down too quickly, and be grabbed.
//      this.arrangeImages();

      // this is crappy to have here
      var text = this.scene.getObjectByName("text");
      if (text) {
        text.visible = false;
      }

    }
  },

  // snap back in to position
  onRelease: function(interactablePlane){

    if (interactablePlane.mesh.parent !== this.mesh) return;

    console.assert(interactablePlane.originPosition);

    interactablePlane.mesh.position.copy(interactablePlane.originPosition);

  },

  setInteractable: function(interactable){

    this.plane.safeSetInteractable(interactable);

    for (var i =0; i < this.images.length; i++){
      this.images[i].safeSetInteractable(interactable);
    }

  },

  emit: function(eventName, data) {
    var callbacks = this[eventName + "Callbacks"];
    for (var i = 0; i < callbacks.length; i++){

      // could use arguments.slice here.
      callbacks[i].call(this, data);
    }
  },

  on: function(eventName, callback){

    var callbackKey = eventName + "Callbacks";

    this[callbackKey] || (this[callbackKey] = []);

    this[callbackKey].push(callback);

  }

}

}).call(this);