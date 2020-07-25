
//Menu building variables
var canvas = document.getElementById('builderCanvas');

//********************* BABYLON ENGINE INITIALIZATION *****************

var engine = new BABYLON.Engine(canvas, true, { premultipliedAlpha: false, preserveDrawingBuffer: true, stencil: true });
var scene = new BABYLON.Scene(engine);
var hinge;
var animationGroup;
var skyboxPath = data.Skybox;
//Initial Parameters
var isOpen = true;
var isWoodBlock = true;
var hingeMaterial = "Chrome";

//Root path setup
var root;
if (window.location.hostname != "localhost") {
    root = window.location.href.replace("index.html", "");    
    if (root.includes("#")) {
        root = root.replace("#", "");
    }
}
else {
    root = window.location.origin;;
}
//Background setup
scene.clearColor = new BABYLON.Color3(1, 1, 1); //Background color


 //Prototypes
BABYLON.ArcRotateCamera.prototype.spinTo = function (whichprop, targetval, speed) {
    var ease = new BABYLON.CubicEase();
    ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    BABYLON.Animation.CreateAndStartAnimation('at4', this, whichprop, speed, 120, this[whichprop], targetval, 0, ease);
}

//Scene creation
var createScene = function () {

    // Assets loader
   var path = root + data.ModelPath;
   var model = data.Model;  

    //Adding an Arc Rotate Camera
    var camera = new BABYLON.ArcRotateCamera("Camera", (Math.PI * 1.1), (7.5 * Math.PI / 16), 4, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, false);
    camera.lowerRadiusLimit = 2.3;
    camera.upperRadiusLimit = 6;
    camera.panningSensibility = 1000;
    camera.wheelPrecision = 100;

    //Adding an hemispheric light
    var light = new BABYLON.HemisphericLight("omni", new BABYLON.Vector3(0, 2, 0), scene);
    light.intensity = 0;

    BABYLON.SceneLoader.ShowLoadingScreen = false;
    BABYLON.SceneLoader.Append(path, model, scene,
        onSuccess = function (meshes) {
            hinge = meshes;
            var aoImages = new BABYLON.Texture("", scene);
            for (meshes = 1; hinge.meshes.length > meshes; meshes++) {
                hinge.meshes[meshes].actionManager = new BABYLON.ActionManager(scene); // Pointer behavior on model hover                       
                hinge.meshes[meshes].actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function (ev) {
                }, false));
                //Preloading AO Images
                aoImages << new BABYLON.Texture(`./assets/materials/aoOpen/${hinge.meshes[meshes].name}_Mixed_AO.png`, scene);
                //Roughness and Metalness adjustments
                if (!hinge.meshes[meshes].name.includes("Wood")) {
                    hinge.meshes[meshes].material.roughness = 0.5;
                    hinge.meshes[meshes].material.metallic = 0.9;
                }
                else {
                    hinge.meshes[meshes].material.roughness = 2;
                    hinge.meshes[meshes].material.metallic = 0;
                }

            }

            //Animation handling
            hinge.animationsEnabled = true;
            animationGroup = hinge.animationGroups[0];
            animationGroup.loopAnimation = false;
            isOpen = true;
            var lastAnim = 1;

            animationGroup.onAnimationGroupPlayObservable.add(function () {
                lastAnim = 0;
            });

            animationGroup.onAnimationEndObservable.add(function () {
                if (isWoodBlock) {
                    while (lastAnim < 1) {
                        for (meshes = 1; hinge.meshes.length > meshes; meshes++) {
                            if (!hinge.meshes[meshes].name.includes("Background")) {                                
                                hinge.meshes[meshes].material.ambientTexture =
                                    new BABYLON.Texture(`./assets/materials/aoOpen/${hinge.meshes[meshes].name}_Mixed_AO.png`, scene);
                                hinge.meshes[meshes].material.ambientTexture.vAng = -Math.PI;
                                hinge.meshes[meshes].material.ambientTexture.wAng = -Math.PI;
                                
                            }
                        }
                        lastAnim++;
                    }
                }
                $("#playAnimation").css("background", " #CD3327");
            });            
            //Environemnt
            var hdrTexture = new BABYLON.CubeTexture.CreateFromPrefilteredData(skyboxPath, scene);
            scene.environmentTexture = hdrTexture;
            $("#loadingScreen").fadeOut(4000);

        },
        onProgress = function (evt) {
            //On progress function

            if (evt.lengthComputable) {
                var loadingPercentage = (evt.loaded * 100 / evt.total).toFixed();
                console.log("Loading, please wait..." + loadingPercentage + "%");
                $("#loadingText").text("Loading, please wait..." + loadingPercentage + "%");
                $("#loadingBar").css("width", `${loadingPercentage}%`);
               
                if (loadingPercentage >= 100) { }          
                    
            }
            else {

                dlCount = evt.loaded / (1024 * 1024);
                console.log("Loading, please wait..." + Math.floor(dlCount * 100.0) / 100.0 + " MB already loaded.");

            }
        }
    );
    window.addEventListener("resize", function () { engine.resize(); });
    return scene;
}


// call the createScene function
var scene = createScene();

// run the render loop
engine.runRenderLoop(function () {
    window.addEventListener("resize", function () { engine.resize(); });
    scene.render();
});


function playAnimation() {
    if (!animationGroup.isPlaying) {
        $("#playAnimation").css("background", "#DFDFDF");
        if (isOpen) {
            //Play Animation Forward
            animationGroup.start(false, -1, 4, 0);            
        }
        else {
            //Play Animation Backwards
            animationGroup.start(false, 1, 0, 4);
        }
        isOpen = !isOpen;
    }

    
}



function woodBlockState() {
    for (meshes = 1; hinge.meshes.length > meshes; meshes++) {
        if (!hinge.meshes[meshes].name.includes("Background")) {
            //Toggle the wood block visibility
            if (hinge.meshes[meshes].name.includes("Wood"))
                hinge.meshes[meshes].visibility = !hinge.meshes[meshes].visibility;

            // remove Ambient Occlusion when there is not a wood block
            hinge.meshes[meshes].material.ambientTexture = null;
        }

        $("#woodState").text(`${isWoodBlock ? "Show" : "Hide"} Wood Blocks`);

        $("#woodImage").attr("src", `./assets/layout/${isWoodBlock ? "show" : "hide"}.png`);

        
    }
    isWoodBlock = !isWoodBlock;    
    if (isWoodBlock && isOpen) {
        scene.activeCamera.spinTo("alpha", (Math.PI * 1.1), 60);
        scene.activeCamera.spinTo("beta", (7.5 * Math.PI / 16), 60);
        scene.activeCamera.spinTo("radius", 4, 60);
    }
}

function materialChange(material) {

    if (material != hingeMaterial) {
        $(`#${material}`).detach().prependTo("#materialChange");
        $(`#${material}`).css("display", "inline-block");
        
        for (meshes = 1; hinge.meshes.length > meshes; meshes++) {
            if (!hinge.meshes[meshes].name.includes("Wood") && !(hinge.meshes[meshes].name.includes("Background"))) {
                hinge.meshes[meshes].material.albedoTexture =
                    new BABYLON.Texture(`./assets/materials/baseColors/${material}.png`, scene);
                hinge.meshes[meshes].material.albedoColor = new BABYLON.Color3(1, 1, 1);
            }
        }
        hingeMaterial = material;
    }

    //Change title
    switch (material) {
        case "chrome":
            document.title = "SOSS - 518US26D";
            break;
        case "brass":
            document.title = "SOSS - 518US4";
            break;
        case "black":
            document.title = "SOSS - 518US19";
            break;
        case "nickel":
            document.title = "SOSS - 518US15";
            break;
    }



}

