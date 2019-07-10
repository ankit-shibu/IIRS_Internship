var demo = Cesium.defaultValue(demo, false);

var show=true;

// alter the location of the data file for the wind layer
var fileOptions = {
    dataDirectory: demo ? 'https://raw.githubusercontent.com/RaymanNg/3D-Wind-Field/master/data/' : '../data/',
    dataFile: "demo10.json",
    glslDirectory: demo ? '../Cesium-3D-Wind/glsl/' : 'glsl/'
}


const defaultParticleSystemOptions = {
    maxParticles:500,
    particleHeight: 10.0,
    fadeOpacity: 0.938,
    dropRate: 0.003,
    dropRateBump: 0.01,
    speedFactor: 4.6,
    lineWidth: 0.5
}

const heightLayers = [
    {height:10,dataFile:'demo10.json'},
    {height:5500, dataFile:'demo5500.json'},
    {height:6500, dataFile:'demo6500.json'},
    {height:7500, dataFile:'demo7500,json'}
]

class Panel {
    constructor() {
        this.maxParticles = defaultParticleSystemOptions.maxParticles;
        this.particleHeight = defaultParticleSystemOptions.particleHeight;
        this.fadeOpacity = defaultParticleSystemOptions.fadeOpacity;
        this.dropRate = defaultParticleSystemOptions.dropRate;
        this.dropRateBump = defaultParticleSystemOptions.dropRateBump;
        this.speedFactor = defaultParticleSystemOptions.speedFactor;
        this.lineWidth = defaultParticleSystemOptions.lineWidth;
        this.ExtrudedHeight=5000;

       var heights = [];
        heightLayers.forEach(function (layer) {
            heights.push(layer.height);
        });

        var velocity = ['m/s','km/hr','knots'];
        var terrain = ['ON','OFF'];

       this.velFormat=velocity[0];
       this.Terrain="ON";
       this.Heights=heights[0];

        const that = this;

        var onParticleDestroy = function () {
            for (var i = 0; i < heightLayers.length; i++) {
                if (that.Heights == heightLayers[i].height) {
                    that.particleHeight = heightLayers[i].height;
                    break;
                }
            }
            fileOptions.dataFile='demo'+that.Heights+'.json';
            console.log(fileOptions.dataFile);
            var event = new CustomEvent('destroyParticles');
            window.dispatchEvent(event);
        }

        var removePrimitives=function(){
            var event;
            event = new CustomEvent('primitivesRemoved');
            window.dispatchEvent(event);
        }

        var addLayer=function(value){
            var event;
            if(value=='sLayer')
            {
            event = new CustomEvent('sLayerAdded');
            window.dispatchEvent(event);
            }
        }

        var removeLayer=function(value){
            var event;
            event = new CustomEvent('layerRemoved');
            event.name=value;
            window.dispatchEvent(event);
        }

        var onTerrainProviderChange=function(){
            event = new CustomEvent('terrainStatusChanged');
            event.status=that.Terrain;
            window.dispatchEvent(event);
        }

        var onExtrudedHeightChange=function(){
            event = new CustomEvent('ExtrusionChanged');
            event.value=that.ExtrudedHeight;
            window.dispatchEvent(event);
        }

        var onVelocityOptionsChange = function () {
            for (var i = 0; i < velocity.length; i++) {
                if (that.velFormat == velocity[i]) {
                    that.velocityFormat = velocity[i];
                    break;
                }
            }
            var event = new CustomEvent('velocityOptionsChanged');
            window.dispatchEvent(event);
        }

        window.onload = function () {
            var gui = new dat.GUI({ autoPlace: false });
            gui.add(that,'velFormat',velocity).onFinishChange(onVelocityOptionsChange); 
            gui.add(that,'Terrain',terrain).onFinishChange(onTerrainProviderChange);
            gui.add(that, 'ExtrudedHeight',2000, 500000, 10).onFinishChange(onExtrudedHeightChange);
            gui.close();
            var panelContainer = document.getElementsByClassName('cesium-widget').item(0);
            gui.domElement.classList.add('myPanel');
            panelContainer.appendChild(gui.domElement);  

        
            $('input[type=radio]').change(function() {
                if(this.value!='none')
                {
                that.Heights=this.value;
                onParticleDestroy();
                }else{
                removePrimitives();
                }
            });

            $('input[type=checkbox]').change(function() {
                // this will contain a reference to the checkbox   
                if (this.checked) {
                    addLayer(this.value);
                } else {
                    removeLayer(this.value);
                }
            });
        };
    }

    getUserInput() {
        // make sure maxParticles is exactly the square of particlesTextureSize
         var particlesTextureSize = Math.ceil(Math.sqrt(this.maxParticles));
            this.maxParticles = particlesTextureSize * particlesTextureSize;
        //var obj=this.updateUserInput()
        return {
            particlesTextureSize: particlesTextureSize,
            maxParticles: this.maxParticles,
            particleHeight: this.particleHeight,
            fadeOpacity: this.fadeOpacity,
            dropRate: this.dropRate,
            dropRateBump: this.dropRateBump,
            speedFactor: this.speedFactor,
            lineWidth: this.lineWidth,
            velocityFormat: this.velocityFormat
        }
    }
}
