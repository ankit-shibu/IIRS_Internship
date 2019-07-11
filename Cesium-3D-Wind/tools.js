var tools = (function () {
    var editor;
    var extrusionHeight=5000;
    var Entity;
    var getEditor=function(edit)
    {
        editor=edit;
        return editor;
    }
    var setExtrusionHeight=function(height)
    {
      extrusionHeight=height;
      if(Entity===undefined)
        console.log('undefined');
      else
        {
        editor.viewer.entities.remove(Entity);
        var wyoming = editor.viewer.entities.add({
          polygon : {
            hierarchy : Entity.polygon.hierarchy,
            width : 2,
            height:25000,
            extrudedHeight: extrusionHeight,
            material : Cesium.Color.RED,
            perPositionHeight: true
          }
        });
        }
        Entity=wyoming;
        return extrusionHeight;
    }
    var positionsToGeoJSON=function ( positions, type ) {
        var coordinates = [];
        for (var i = 0; i < positions.length; i++) {
          var carto = Cesium.Cartographic.fromCartesian( positions[i] );
          coordinates.push( [Cesium.Math.toDegrees( carto.longitude ), Cesium.Math.toDegrees( carto.latitude),2500]);
        }
        if (type === "Polygon") {
          // Make sure the first and the last coordinates are the same.
          var first = coordinates[0];
          var last = coordinates[coordinates.length-1];
          if (first[0] != last[0] || first[1] != last[1] || first[2] != last[2]) {
            coordinates.push(first);
          }
          coordinates = [coordinates];
        }
        return {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: type,
                coordinates: coordinates
              }
            }
          ]
        }
      }
      function startEdit(entity) {
        console.log('start edit');
          // Editing mode is starting, so change the style.
          if (entity.polyline) {
            entity.polyline.material = Cesium.Color.YELLOW;
          }
          if (entity.polygon) {
            entity.polygon.material = Cesium.Color.YELLOW;
          }
          if (entity.corridor) {
            entity.corridor.material = Cesium.Color.YELLOW;
          }
          //updateGeoJSON( entity );
      }
      function stopEdit(entity) {
         // Editing mode is ended, so change the style.
          console.log('stop editing');
          if (entity.polyline) {
            entity.polyline.material = Cesium.Color.RED;
          }
          if (entity.polygon) {
            entity.polygon.material = Cesium.Color.RED;
          }
          if (entity.corridor) {
            entity.corridor.material = Cesium.Color.RED;
          }
         var obj=onEdit(entity);
      }
      function onEdit(entity) {
       if(entity.polyline)
       console.log(positionsToGeoJSON( entity.polyline.positions._value, "LineString"));
       else if(entity.polygon)
       console.log(positionsToGeoJSON( entity.polygon.hierarchy._value, "Polygon"));
      }

    var drawPolyline=function(){
        // Create the entity
        var entity = editor.viewer.entities.add({
            name : 'Entity ' + editor.viewer.entities.values.length,
            polyline : {
                positions: new DynamicProperty([]),
                width : 2,
                height:25000,
                extrudedHeight:35000,
                material : Cesium.Color.RED
            }
        });
        console.log(entity);
        Entity=entity;
        entity.polyline.height=20000;
        CesiumDrawing.extendEntity(entity);
        entity.inProgress = true;
        editor.createPositionsHandler( entity, entity.polyline.positions._value );
        entity.startEdit.addEventListener(startEdit);
        entity.stopEdit.addEventListener(stopEdit);
        entity.edited.addEventListener(onEdit);
      }
      var drawPolygon=function() {
        console.log('polygon');
        // Create the entity
        var entity = editor.viewer.entities.add({
            name : 'EntityPolygon',
            polygon : {
              hierarchy: new DynamicProperty([]),
              material : Cesium.Color.RED,
              height:25000,
              perPositionHeight: true
            }
        });
        Entity=entity;
        entity.polygon.extrudedHeight=extrusionHeight;        

        CesiumDrawing.extendEntity( entity );
        editor.createPositionsHandler( entity, entity.polygon.hierarchy._value );
        entity.startEdit.addEventListener(startEdit);
        entity.stopEdit.addEventListener(stopEdit);
        entity.edited.addEventListener(onEdit);
      }

      function download(data, filename, type) {
        var file = new Blob([data], {type: type});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
                    url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);  
            }, 0); 
        }
    }

      function save() {
        var result=" ";
        if(Entity.polyline)
        {
        result=JSON.stringify(positionsToGeoJSON( Entity.polyline.positions._value, "LineString"));
        download(JSON.stringify(positionsToGeoJSON( Entity.polyline.positions._value, "LineString")),"LineString.json","json");
        }
        else if(Entity.polygon)
        {
          result=JSON.stringify(positionsToGeoJSON( Entity.polygon.hierarchy._value, "Polygon"));
          download(JSON.stringify(positionsToGeoJSON(Entity.polygon.hierarchy._value, "Polygon")),"Polygon.json","json");
        }
        console.log(result);
        document.getElementById("display-body").textContent = result;

      }

      return {
        getEditor:getEditor,
        setExtrusionHeight:setExtrusionHeight,
        drawPolyline:drawPolyline,
        drawPolygon:drawPolygon,
        save:save,
    }
})();