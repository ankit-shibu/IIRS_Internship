var DataProcess = (function () {
    var data;

    var loadNetCDF = function (filePath) {
        console.log(filePath);
        return new Promise(function (resolve) {

             var string = Util.loadText(filePath);
             var json = JSON.parse(string);

                var NetCDF = json;
                data = {};
                
                data.dimensions = {};
                data.dimensions.lon = 720;
                data.dimensions.lat = 361;
                data.dimensions.lev = 1;

                data.lon = {};
                var i;
                var ar=[0,0.5,1,1.5,2];
                for(i=2.5;i<=359.5;i+=0.5)
                ar.push(i);
                data.lon.array = new Float32Array(ar);
                data.lon.min = 0;
                data.lon.max = 359.5;
            
                
                data.lat = {};
                var j;
                var arr =[];
                for(j=-90;j<=90;j+=0.5)
                arr.push(j);
                data.lat.array = new Float32Array(arr);
                data.lat.min = -90;
                data.lat.max = 90;

                data.lev = {};
                var h;
                if(json[0].header.surface1Value==50000)
                h=5500;
                else if(json[0].header.surface1Value==60000)
                h=6500;
                else if(json[0].header.surface1Value==70000)
                h=7500;
                else
                h=10;
                arrr=[h];
                data.lev.array = new Float32Array(arrr);
                data.lev.min = h;
                data.lev.max = h;

                data.U = {};
                var arr1=[],brr1=[];
                arr1=NetCDF[0].data;
                let min = arr1[0], max = arr1[0];
                for (let i = 360, len=arr1.length; i >= 0; i--) {
                for(let j=0;j<720;j++)
                {
                let v = arr1[i*720+j];
                brr1.push(v);
                min = (v < min) ? v : min;
                max = (v > max) ? v : max;
                }
                }
                data.U.array = new Float32Array(brr1);
                data.U.min = min;
                data.U.max = max;


                data.V = {};
                var arr2=[],brr2=[];
                arr2=NetCDF[1].data;
                let min1 = arr2[0], max1 = arr2[0];
                for (let i = 360, len=arr2.length; i >= 0; i--) {
                for(let j=0;j<720;j++)
                {
                let v = arr2[i*720+j];
                brr2.push(v);
                min1 = (v < min1) ? v : min1;
                max1 = (v > max1) ? v : max1;
                }
                }
                data.V.array = new Float32Array(brr2);
                data.V.min = min1;
                data.V.max = max1;
                resolve(data);
        });
    }

    var loadColorTable = function (filePath) {
        var string = Util.loadText(filePath);
        var json = JSON.parse(string);

        var colorNum = json['ncolors'];
        var colorTable = json['colorTable'];

        var colorsArray = new Float32Array(3 * colorNum);
        for (var i = 0; i < colorNum; i++) {
            colorsArray[3 * i] = colorTable[3 * i];
            colorsArray[3 * i + 1] = colorTable[3 * i + 1];
            colorsArray[3 * i + 2] = colorTable[3 * i + 2];
        }

        data.colorTable = {};
        data.colorTable.colorNum = colorNum;
        data.colorTable.array = colorsArray;
    }

    var loadData = async function () {
        var ncFilePath = fileOptions.dataDirectory + fileOptions.dataFile;
        await loadNetCDF(ncFilePath);

        var colorTableFilePath = fileOptions.dataDirectory + 'colorTable.json';
        loadColorTable(colorTableFilePath);

        return data;
    }

    var randomizeParticles = function (maxParticles, viewerParameters) {
        var array = new Float32Array(4 * maxParticles);
        for (var i = 0; i < maxParticles; i++) {
            array[4 * i] = Cesium.Math.randomBetween(viewerParameters.lonRange.x, viewerParameters.lonRange.y);
            array[4 * i + 1] = Cesium.Math.randomBetween(viewerParameters.latRange.x, viewerParameters.latRange.y);
            array[4 * i + 2] = Cesium.Math.randomBetween(data.lev.min, data.lev.max);
            array[4 * i + 3] = 0.0;
        }
        return array;
    }

    return {
        loadData: loadData,
        randomizeParticles: randomizeParticles
    };

})();