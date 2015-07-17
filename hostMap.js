var _map_geodata_cache = null;
var _map_cntry_center_cache = {};
var drawMap = function(canv) {

	// expects [lat, lon], returns [x/w, y/h]
	function geoCoordsToCanvasCoords(coords) {
		var result = [coords[0], coords[1]];
		result[0] += 180.0;
		result[0] /= 360.0;
		result[1] -= 90.0;
		result[1] /= -180.0;
		return result;
	}

	function stringCoordsToFloatArray(coords){
		var splitCoords = coords.split(",");
		return geoCoordsToCanvasCoords( [parseFloat(splitCoords[0]), parseFloat(splitCoords[1])] );
	}

	function convertCoordsToCanvasSpaceAndDetermineCenters(geoData) {
		geoData.forEach(function(el){
			if( el.type == 'Feature' && (el.geometry.type == 'Polygon' || el.geometry.type == 'MultiPolygon') ) {
				var polygons = el.geometry.coordinates;

				if(el.geometry.type == 'Polygon')
					polygons = new Array(el.geometry.coordinates);

				var center = [0.0, 0.0];
				var cnt = 0.0;

				if(polygons.length > 0)
					polygons.forEach(function(poly){
						if(poly[0].length > 0)
							for(var i in poly[0]) {
								poly[0][i] = geoCoordsToCanvasCoords(poly[0][i]);
								center[0] += poly[0][i][0];
								center[1] += poly[0][i][1];
								++cnt;
							}
					});

				center[0] /= cnt;
				center[1] /= cnt;

				_map_cntry_center_cache[el.properties.name.toLowerCase()] = center;
			}
		});
	};

	// Make sure we have the geometric data ready
	if(_map_geodata_cache == null) {
		// Create the cookie with the serialized data if it doesn't exist yet
		$.ajax({
			url: 'http://cleoling.com/geoData.json',
			dataType: 'json',
			cache: false,

			beforeSend: function () {
			    console.log("Loading");
			},

			error: function (jqXHR, textStatus, errorThrown) {
			    console.log(jqXHR);
			    console.log(textStatus);
			    console.log(errorThrown);
			},

			success: function (data) {
				// Parse the data!
				_map_geodata_cache = data;
				convertCoordsToCanvasSpaceAndDetermineCenters(_map_geodata_cache);
				drawMap(canv);
			},

			complete: function () {
			    console.log('Finished all tasks');
			}
		});
		return;
	}

	var map = document.getElementById("map");
	var context = canv.getContext("2d");
	
	var w = $("#map").outerWidth();
	var h = $("#map").outerHeight();
	var px = 0.00;
	var py = 0.00;
	
	// First draw the 'background'
	context.strokeStyle = '#333';
	_map_geodata_cache.forEach(function(el){
		if( el.type == 'Feature' && (el.geometry.type == 'Polygon' || el.geometry.type == 'MultiPolygon') ) {
			var polygons = el.geometry.coordinates;

			if(el.geometry.type == 'Polygon')
				polygons = new Array(el.geometry.coordinates);

			if(polygons.length > 0)
				polygons.forEach(function(poly){
					context.beginPath();

					if(poly[0].length > 0)
						for(var i in poly[0]) {
							if(i > 0)
								context.lineTo(poly[0][i][0]*w, poly[0][i][1]*h);
							else
								context.moveTo(poly[0][i][0]*w, poly[0][i][1]*h);
						}

					context.closePath();
					context.stroke();
			});
		}
	});

	$.get("getMapData.php?ulangs="+ulangs, function(stringData, status){
		if(status == 'success'){

			var linkSign = -1.0;
			var data = JSON.parse(stringData);

			data.forEach(function(hostLink){
				// Alternate between positive and negative arcs
				linkSign *= -1.0;

				var sourceHostCoords = stringCoordsToFloatArray(hostLink[0]);
				var sourceHostX = sourceHostCoords[0];
				var sourceHostY = sourceHostCoords[1];
				var targetHostCoords = stringCoordsToFloatArray(hostLink[1]);
				var targetHostX = targetHostCoords[0];
				var targetHostY = targetHostCoords[1];

				var sourceColor = hostLink[2];
				var targetColor = hostLink[3];
				var hostGradient = context.createLinearGradient(sourceHostX, sourceHostY, targetHostX, targetHostY);
				hostGradient.addColorStop(0.0, sourceColor);
				hostGradient.addColorStop(1.0, targetColor);
				context.fillStyle = hostGradient;

				/* Calculate the line width based on the reference counts
				and the canvas size */
				var b = Math.ceil((1.0*hostLink[4])/(1.0*data.length)*(w*h/10000.0));
				context.lineWidth = b;

				// This is the y-Offsets for the Bezier control points
				var dx = sourceHostX-targetHostX;
				var dy = sourceHostY-targetHostY;
				var d = linkSign*Math.round(Math.sqrt(dx*dx + dy*dy)*0.2);
				var l2r = targetHostX > sourceHostX ? 1.0 : -1.0;

				//targetHostY -= 0.25*b;
				//targetHostX *= 0.99;

				context.beginPath();
				context.moveTo(sourceHostX - l2r*0.5*b, sourceHostY);
				context.bezierCurveTo(sourceHostX - l2r*0.5*b, sourceHostY-(-l2r*linkSign*b+0.7*d), targetHostX + l2r*0.5*b, targetHostY-(-l2r*linkSign*b+0.7*d), targetHostX + l2r*0.5*b, targetHostY);
				context.lineTo(targetHostX + l2r*b, targetHostY);
				context.lineTo(targetHostX, targetHostY + linkSign*b);
				context.lineTo(targetHostX - l2r*b, targetHostY);
				context.lineTo(targetHostX - l2r*0.5*b, targetHostY);
				context.bezierCurveTo(targetHostX - l2r*0.5*b, targetHostY-(l2r*linkSign*b+0.7*d), sourceHostX + l2r*0.5*b, sourceHostY-(l2r*linkSign*b+0.7*d), sourceHostX + l2r*0.5*b, sourceHostY);
				context.lineTo(sourceHostX - l2r*0.5*b, sourceHostY);
				context.closePath();
				context.fill();
			});
		}
	});
};
