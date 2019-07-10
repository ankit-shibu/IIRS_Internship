class Wind3D {
    constructor(panel, mode) {
        var options = {
            baseLayerPicker:false,
            geocoder: false,
            infoBox: false,
            fullscreenElement: 'cesiumContainer',
            scene3DOnly: true
        }
        if (mode.debug) {
            options.useDefaultRenderLoop = false;
        }

        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxM2YzMGUxNy0wZWI1LTQ0NTYtYTJhMC1iOWI4Nzc3MWM3YjUiLCJpZCI6MTE0ODQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NTkwNjE3OTZ9.VNxd-j5gf4rDBMgcivlV-MhVFirEeipleuKtHY8fxrw';

        this.viewer = new Cesium.Viewer('cesiumContainer', options);
        this.scene = this.viewer.scene;
        this.camera = this.viewer.camera;
        this.particleSystem=[];
        this.removeEventListener=false;
        var editor = new CesiumDrawing.Editor(this.viewer);

        this.panel = panel;
        this.obj=this.panel.getUserInput();
        this.viewerParameters = {
            lonRange: new Cesium.Cartesian2(),
            latRange: new Cesium.Cartesian2(),
            pixelSize: 0.0
        };
        // use a smaller earth radius to make sure distance to camera > 0
        this.globeBoundingSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, 0.99 * 6378137.0);

        $(function() {
            $("#drawPolyline").click(function() {
             tools.drawPolyline();
            });
            $("#drawPolygon").click(function() {
            tools.drawPolygon();
            });
            $("#save").click(function() {
              tools.save();
            });
          });

        this.setupEventListener();
        tools.getEditor(editor);
        // Disable the default entity double click action.
        this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.imageryLayers = this.viewer.imageryLayers;
        this.setGlobeLayer(this.panel.getUserInput());
        
        const that=this;
        this.viewModel = {
            layers : [],
            baseLayers : ['None'],
            upLayer : null,
            downLayer : null,
            selectedLayer : null,
            isSelectableLayer : function(layer) {
                return this.baseLayers.indexOf(layer) >= 0;
            },
            raise : function(layer, index) {
                that.imageryLayers.raise(layer);
                that.viewModel.upLayer = layer;
                that.viewModel.downLayer = that.viewModel.layers[Math.max(0, index - 1)];
                that.updateLayerList();
                window.setTimeout(function() { that.viewModel.upLayer = that.viewModel.downLayer = null; }, 10);
            },
            lower : function(layer, index) {
                that.imageryLayers.lower(layer);
                that.viewModel.upLayer = that.viewModel.layers[Math.min(that.viewModel.layers.length - 1, index + 1)];
                that.viewModel.downLayer = layer;
                that.updateLayerList();
                window.setTimeout(function() { that.viewModel.upLayer = that.viewModel.downLayer = null; }, 10);
            },
            remove: function(name){
                that.removeAdditionalLayerOption(name);
            },
            canRaise : function(layerIndex) {
                return layerIndex > 0;
            },
            canLower : function(layerIndex) {
                return layerIndex >= 0 && layerIndex < that.imageryLayers.length - 1;
            }
        };
        this.baseLayers = this.viewModel.baseLayers;
        
        Cesium.knockout.track(this.viewModel);
        
        this.setupLayers();
        this.updateLayerList();
        
        //Bind the viewModel to the DOM elements of the UI that call for it.
        var toolbar = document.getElementById('toolbar');
        Cesium.knockout.applyBindings(this.viewModel, toolbar);
        
        Cesium.knockout.getObservable(this.viewModel, 'selectedLayer').subscribe(function(baseLayer) {
            // Handle changes to the drop-down base layer selector.
            var activeLayerIndex = 0;
            var numLayers = that.viewModel.layers.length;
            for (var i = 0; i < numLayers; ++i) {
                if (that.viewModel.isSelectableLayer(that.viewModel.layers[i])) {
                    activeLayerIndex = i;
                    break;
                }
            }
            var activeLayer = that.viewModel.layers[activeLayerIndex];
            var show = activeLayer.show;
            var alpha = activeLayer.alpha;
            that.imageryLayers.remove(activeLayer, false);
            that.imageryLayers.add(baseLayer, numLayers - activeLayerIndex - 1);
            that.updateLayerList();
        });
    }

    setupLayers() {   
    
    this.addBaseLayerOption(
            'Natural Earth',
            undefined); 
    this.addBaseLayerOption(
            'ArcGIS World Street Maps',
            new Cesium.ArcGisMapServerImageryProvider({
                url : 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
            }));
    this.addBaseLayerOption(    
            'OpenStreetMaps',
            Cesium.createOpenStreetMapImageryProvider());
    this.addBaseLayerOption(
            'Stamen Maps',
            Cesium.createOpenStreetMapImageryProvider({
                url : 'https://stamen-tiles.a.ssl.fastly.net/watercolor/',
                fileExtension: 'jpg',
                credit: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.'
            }));

        // Create the additional layers
        this.addAdditionalLayerOption(
                'Grid',
                new Cesium.GridImageryProvider(), 1.0, false);
    }

    addBaseLayerOption(name, imageryProvider) {
        var layer;
        if (typeof imageryProvider === 'undefined') {
            layer = this.imageryLayers.get(0);
            this.viewModel.selectedLayer = layer;
        } else {
            layer = new Cesium.ImageryLayer(imageryProvider);
        }
    
        layer.name = name;
        this.baseLayers.push(layer);
    }

    
    addAdditionalLayerOption(name, imageryProvider, alpha, show) {
        var flag=1;
        for(var i=0;i<this.viewModel.layers.length;i++)
        {
            if(this.viewModel.layers[i].name==name)
            {
                flag=0;
                break;
            }
        }
        if(flag==1)
        {
        var layer = this.viewer.imageryLayers.addImageryProvider(imageryProvider);
        layer.alpha = Cesium.defaultValue(alpha, 0.5);
        layer.show = Cesium.defaultValue(show, true);
        layer.name = name;
        Cesium.knockout.track(layer, ['alpha', 'show', 'name']);
        }
    }

    removeAdditionalLayerOption(name) {
        for(var i=0;i<this.viewModel.layers.length;i++)
        {
            if(this.viewModel.layers[i].name==name)
            {
                this.viewModel.layers[i].show=false;
                this.viewer.imageryLayers.remove(this.viewModel.layers[i],true);
                break;
            }
        }
        this.updateLayerList();
    }



    updateLayerList() {
        var numLayers = this.viewer.imageryLayers.length;
        this.viewModel.layers.splice(0,this.viewModel.layers.length);
        for (var i = numLayers - 1; i >= 0; --i) {
            this.viewModel.layers.push(this.viewer.imageryLayers.get(i));
        }
    }

    addPrimitives() {
        // the order of primitives.add() should respect the dependency of primitives
        this.scene.primitives.add(this.particleSystem.particlesComputing.primitives.getWind);
        this.scene.primitives.add(this.particleSystem.particlesComputing.primitives.updateSpeed);
        this.scene.primitives.add(this.particleSystem.particlesComputing.primitives.updatePosition);
        this.scene.primitives.add(this.particleSystem.particlesComputing.primitives.postProcessingPosition);
        this.scene.primitives.add(this.particleSystem.particlesComputing.primitives.postProcessingSpeed);

        this.scene.primitives.add(this.particleSystem.particlesRendering.primitives.segments);
        this.scene.primitives.add(this.particleSystem.particlesRendering.primitives.trails);
        this.scene.primitives.add(this.particleSystem.particlesRendering.primitives.screen);
    }

    //Controls the parameters of the rendering
    updateViewerParameters() {
        var viewRectangle = this.camera.computeViewRectangle(this.scene.globe.ellipsoid);
        var lonLatRange = Util.viewRectangleToLonLatRange(viewRectangle);
        this.viewerParameters.lonRange.x = lonLatRange.lon.min;
        this.viewerParameters.lonRange.y = lonLatRange.lon.max;
        this.viewerParameters.latRange.x = lonLatRange.lat.min;
        this.viewerParameters.latRange.y = lonLatRange.lat.max;

        this.obj=this.panel.getUserInput();
        var maxParticles=this.calmaxParticles((lonLatRange.lon.max-lonLatRange.lon.min)*(lonLatRange.lat.max-lonLatRange.lat.min));
        var particlesTextureSize = Math.ceil(Math.sqrt(maxParticles));
        maxParticles = particlesTextureSize * particlesTextureSize;
        
        this.obj.maxParticles=maxParticles;
        this.obj.particlesTextureSize=particlesTextureSize;
        this.obj.lineWidth=this.calmaxwidth((lonLatRange.lon.max-lonLatRange.lon.min)*(lonLatRange.lat.max-lonLatRange.lat.min));
        console.log(this.obj);     
        var event = new CustomEvent('particleSystemChanged');
        window.dispatchEvent(event);

        var pixelSize = this.camera.getPixelSize(
            this.globeBoundingSphere,
            this.scene.drawingBufferWidth,
            this.scene.drawingBufferHeight
        );

        if (pixelSize > 0) {
            this.viewerParameters.pixelSize = pixelSize;
        }
    }

    // loads the data for a wind layer
    dataLoad() {
        DataProcess.loadData().then(
            (data) => {
                this.particleSystem = new ParticleSystem(this.scene.context, data,
                this.obj, this.viewerParameters);
                this.setupEventListeners(data);
                this.addPrimitives();
                this.scene.primitives.show=true;
    });
    }

    calmaxParticles(lonLatRange)
    {
        if(lonLatRange>400)
        return 54756;
        else if(lonLatRange>200)
        return 20756;
        else if(lonLatRange>20)
        return 5756;
        else if(lonLatRange>1)
        return 2000;
        else
        return 300;
    }

    calmaxwidth(lonLatRange)
    {
        if(lonLatRange>400)
        return 2.0;
        else if(lonLatRange>200)
        return 1.5;
        else if(lonLatRange>20)
        return 1.0;
        else if(lonLatRange>1)
        return 0.7;
        else
        return 0.3;
    }

    velocityDisplay(velocity) {
        if(velocity.format=='m/s')
        return velocity.vel;
        else if(velocity.format=='km/hr')
        return (velocity.vel*3.6).toFixed(3);
        else
        return (velocity.vel/0.514).toFixed(3);
    }

    setGlobeLayer() {
        this.viewer.imageryLayers.removeAll();
       this.viewer.terrainProvider = Cesium.createWorldTerrain({
            requestWaterMask : true, // required for water effects
            requestVertexNormals : true // required for terrain lighting
        });
    
        this.viewer.scene.globe.depthTestAgainstTerrain = true;

        this.viewer.imageryLayers.addImageryProvider(
          Cesium.createTileMapServiceImageryProvider({
          url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
        })
        );
    }
    
    setupEventListener(){
        const that = this;
        window.addEventListener('destroyParticles', function () {
            if(that.particleSystem.particlesComputing)
            {
            that.scene.primitives.show=false;
            that.particleSystem.particlesComputing.destroyParticlesTextures();
            that.show=false;
            that.updateViewerParameters();
            that.removeEventListener=false;
            that.dataLoad();
            that.scene.primitives.show=true;
            }
            else{
                console.log('doing correct');
                that.updateViewerParameters();
                that.dataLoad();
            }
         });

         window.addEventListener('primitivesRemoved', function () {
            if(that.scene.primitives.show)
            {
                that.scene.primitives.show=false;
                that.removeEventListener=true;
            }
         });

         window.addEventListener('ExtrusionChanged', function (event) {
           tools.setExtrusionHeight(event.value);
         });

         window.addEventListener('terrainStatusChanged', function (event) {
          if(event.status=='ON')
        {
            that.viewer.terrainProvider = Cesium.createWorldTerrain({
                requestWaterMask : true, // required for water effects
                requestVertexNormals : true // required for terrain lighting
            });
        
            that.viewer.scene.globe.depthTestAgainstTerrain = true;
          }
          else{
            that.viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
            this.viewer.scene.globe.depthTestAgainstTerrain = false;
        }
          console.log(that.viewer.terrainProvider);
         });


         window.addEventListener('sLayerAdded', function () {
            that.addAdditionalLayerOption('sLayer',new Cesium.WebMapServiceImageryProvider({
                url :'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?',
                layers : 'nexrad-n0r',
                credit : 'Radar data courtesy Iowa Environmental Mesonet',
                parameters : {
                    transparent : 'true',
                    format : 'image/png'
                }
            }),1.0,true);
            that.updateLayerList();
         });

         window.addEventListener('layerRemoved', function (event) {
           that.removeAdditionalLayerOption(event.name);
         });

         if(this.viewer.entities.getById('mou'))
         {
         }
         else{
         this.viewer.entities.add({
         id: 'mou',
         label: {
             show: false
         }
         });}
         var viewers=this.viewer;
         var scenes=this.scene;
         var cameras=this.camera;
         this.scene.canvas.addEventListener('mousemove', function(e) {
              var entity = viewers.entities.getById('mou');
             var ellipsoid = scenes.globe.ellipsoid;
             // Mouse over the globe to see the cartographic position 
             var cartesian = cameras.pickEllipsoid(new Cesium.Cartesian3(e.clientX, e.clientY), ellipsoid);
             if (cartesian) {
                 var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                 var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(10);
                 var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(10);
                 var x=longitudeString-Math.floor(longitudeString);

                 entity.position = cartesian;
                 entity.label.show = false;
                 entity.label.text = '(' + longitudeString + ', ' + latitudeString + ')';
                 var result = entity.label.text;  

                 document.getElementById("demo").textContent = result;
             } else {
                 entity.label.show = false;
             }
         });
    }
    setupEventListeners(data) {
        const that = this;
        var velFrmat='m/s';
        this.camera.moveStart.addEventListener(function () {
            that.scene.primitives.show = false;
        });

        this.camera.moveEnd.addEventListener(function () {
            if(!that.removeEventListener)
            {
            that.updateViewerParameters();
            that.particleSystem.applyViewerParameters(that.viewerParameters);
            that.scene.primitives.show = true;
            }
        });

        window.addEventListener('particleSystemChanged', function () {
            that.particleSystem.applyUserInput(that.obj);
         });

        var resized = false;
        window.addEventListener("resize", function () {
            if(!that.removeEventListener)
            {
            resized = true;
            CesiumDrawing.viewer=this.viewer;
            that.scene.primitives.show = false;
            that.scene.primitives.removeAll();
            }
        });

        this.scene.preRender.addEventListener(function () {
            if (resized&&!that.removeEventListener) {
                that.particleSystem.canvasResize(that.scene.context);
                resized = false;
                that.addPrimitives();
                that.scene.primitives.show = true;
            }
        });

         window.addEventListener('heightOptionsChanged', function () {
            that.show=false;
            that.scene.primitives.show=false;
            that.updateViewerParameters();
            that.dataLoad(); 
            that.scene.primitives.show=true;
            that.imageryLayers = that.viewer.imageryLayers;
        });

        window.addEventListener('velocityOptionsChanged', function () {
            var res=that.panel.getUserInput();
            velFrmat=res.velocityFormat;
        });
        if(this.viewer.entities.getById('mou1'))
        {
        }
        else{
        this.viewer.entities.add({
        id: 'mou1',
        label: {
            show: false
        }
        });}
        var viewers=this.viewer;
        var scenes=this.scene;
        var cameras=this.camera;
        this.scene.canvas.addEventListener('mousemove', function(e) {
            if(!that.removeEventListener)
            {
             var entity = viewers.entities.getById('mou1');
            var ellipsoid = scenes.globe.ellipsoid;
            // Mouse over the globe to see the cartographic position 
            var cartesian = cameras.pickEllipsoid(new Cesium.Cartesian3(e.clientX, e.clientY), ellipsoid);
            if (cartesian) {
                var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(10);
                var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(10);
                var x=longitudeString-Math.floor(longitudeString);
                var lat,lon;
                if(x<=0.25)
                lon=Math.floor(longitudeString);
                else if(x>=0.75)
                lon=Math.floor(longitudeString)+1;
                else
                lon=Math.floor(longitudeString)+0.5;
                
                var y=latitudeString-Math.floor(latitudeString);
                if(y<=0.25)
                lat=Math.floor(latitudeString);
                else if(y>=0.75)
                lat=Math.floor(latitudeString)+1;
                else
                lat=Math.floor(latitudeString)+0.5;
                
                var u=data.U.array[(lat+90)*720+(lon*2)];
                var v=data.V.array[(lat+90)*720+(lon*2)];
                var vel=Math.sqrt(u*u+v*v).toFixed(3);
                var deg=(Math.atan(v/u)* 180 / Math.PI+180).toFixed(2);
                vel=that.velocityDisplay({format:velFrmat,vel:vel});
                var velocity='('+vel+' '+velFrmat+' '+deg+'° )';
                document.getElementById("velocity").textContent = velocity;
            } else {
                entity.label.show = false;
            }
        }
        });
    }

    debug() {
        const that = this;

        var animate = function () {
            that.viewer.resize();
            that.viewer.render();
            requestAnimationFrame(animate);
        }

        var spector = new SPECTOR.Spector();
        spector.displayUI();
        spector.spyCanvases();

        animate();
    }
}
