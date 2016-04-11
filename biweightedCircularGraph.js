var drawCircularChart = function(canvas, gap_size, border_size, center, radius, data)
{
    var MIN_EDGE_ARC = 4.0; // Minimum width of an incoming connection in degrees

    normDegAngle = function(angle) {
        angle %= 360.0;
        if(angle < 0.0)
            angle = 360 - angle;
        return angle;
    };
    degToArc = function(deg_angle){
        return (deg_angle / 180.0) * Math.PI;
    };
	polarToEuclidean = function(center, radius, angle){
        angle = normDegAngle(angle);
		cx = center[0];
		cy = center[1];
		if(angle <= 90){
			px = cx + Math.cos(degToArc(90.0 - angle)) * radius;
			py = cy - Math.sin(degToArc(90.0 - angle)) * radius;
		}
		else if(angle <= 180){
			px = cx + Math.cos(degToArc(angle - 90.0)) * radius;
			py = cy + Math.sin(degToArc(angle - 90.0)) * radius;
		}
		else if(angle <= 270){
			px = cx - Math.cos(degToArc(270.0 - angle)) * radius;
			py = cy + Math.sin(degToArc(270.0 - angle)) * radius;
		}
		else if(angle <= 360){
			px = cx - Math.cos(degToArc(angle - 270.0)) * radius;
			py = cy - Math.sin(degToArc(angle - 270.0)) * radius;
		}
        else {
            px = 0;
            py = 0;
            console.log("shit data: "+angle);
        }
		return [px, py];
	};

	/************************************************************************
	Sum up total references and references per entity, compile perSegmentData
	*************************************************************************/

	var totalRefs = 0.0;
	var perSegmentData = {};// Each langData map entry will be a mapping of
	                        // segId -> {
	                        // 	share,         // The total number of references for this entity
	                        // 	seg_start,     // The start of the entity's segment (degrees)
	                        // 	seg_end,       // The end of the entity's segment (degrees)
	                        // 	incoming,      // Ordered Map from segId -> {
	                        // 	               // 	share,     // The incoming segId's reference points
	                        // 	               // 	seg_start, // The incoming edges low boundary (degrees)
	                        // 	               // 	seg_end,   // The incoming edges high boundary (degrees)
	                        // 	               // }
	                        // 	incoming_order,// Listof incoming segId's in order of clockwise appearance
	                        // 	color,         // The segments color
                            //  index          // The segments index (clockwise)
	                        // }
    
    var segIndexCount = 0;

	for (var i = 0; i < (data.length - 1); ++i) // Omit the last element, which contains extra per-segment data
	{
		// Create new entries if necessary
		var seg_a = perSegmentData[data[i].seg_a_id];
		if(typeof(seg_a) == "undefined")
            perSegmentData[data[i].seg_a_id] = seg_a = {share: 0.0, seg_start: 0.0, seg_end: 0.0, incoming: {}, incoming_order: [], color: data[data.length - 1][data[i].seg_a_id], index: segIndexCount++};

		var seg_b = perSegmentData[data[i].seg_b_id];
		if(typeof(seg_b) == "undefined")
			perSegmentData[data[i].seg_b_id] = seg_b = {share: 0.0, seg_start: 0.0, seg_end: 0.0, incoming: {}, incoming_order: [], color: data[data.length - 1][data[i].seg_b_id], index: segIndexCount++};
        
        if( (data[i].seg_b_id in seg_a.incoming) || (data[i].seg_a_id in seg_b.incoming) ) {
            console.log("WARNING: Duplicate relation "+data[i].seg_b_id+" <--> "+data[i].seg_a_id+" !");
            continue;
        }
        
		totalRefs += data[i].num_ab + data[i].num_ba;
		seg_a.share += data[i].num_ba;
		seg_b.share += data[i].num_ab;
		seg_a.incoming[data[i].seg_b_id] = {share: data[i].num_ba, seg_start: 0.0, seg_end: 0.0};
		seg_b.incoming[data[i].seg_a_id] = {share: data[i].num_ab, seg_start: 0.0, seg_end: 0.0};
		seg_a.incoming_order.unshift(data[i].seg_b_id);
		seg_b.incoming_order.unshift(data[i].seg_a_id);
	}

    /// This is the amount of arc available after deducing the gaps between the segments
	var totalAvailArc = 360.0 - segIndexCount * gap_size;

    /***************************************
    Perform a corrective iteration: For every edge where either ends count
    of references amounts to less than MIN_EDGE_ARC degrees, increase refs
    by the required amount
    ***************************************/

    var minRefsPerEdgeEnd = Math.floor(totalRefs/totalAvailArc * MIN_EDGE_ARC);
    for (var segId in perSegmentData) {
        var segData = perSegmentData[segId];
        for (var i = 0; i < segData.incoming_order.length; ++i) {
            var segIncEdgeData = segData.incoming[segData.incoming_order[i]];
            if(segIncEdgeData.share < minRefsPerEdgeEnd) {
                var addedRefs = minRefsPerEdgeEnd - segIncEdgeData.share; // This is def. at least 1
                console.log('adding '+addedRefs+' to '+segIncEdgeData.share+'. Total refs are '+totalRefs);
                segIncEdgeData.share += addedRefs;
                segData.share += addedRefs;
                totalRefs += addedRefs;
            }
        };
    };

    /***************************************
    Determine segment and edge degree boundaries
    ***************************************/

    var prevSegmentEnd = 0.0; // degrees
	for (var segId in perSegmentData) {
		var segData = perSegmentData[segId];

		// determine segment arc length
		var segArc = segData.share/totalRefs * totalAvailArc;
		segData.seg_start = prevSegmentEnd + gap_size;
		segData.seg_end = prevSegmentEnd = segData.seg_start + segArc;
        
        // sort incoming order by segment index
        var modSegCount = function(n) {var ret = n % segIndexCount; return ret < 0 ? segIndexCount + ret : ret;};
        segData.incoming_order.sort(
            function(a, b){ return modSegCount(perSegmentData[b].index - segData.index) - modSegCount(perSegmentData[a].index - segData.index)});
		
		// determine incoming edge arc widths
		var thisSegPrevIncArcEnd = segData.seg_start;
		for (var i = 0; i < segData.incoming_order.length; ++i) {
			var segIncEdgeData = segData.incoming[segData.incoming_order[i]];
			var incEdgeArc = segIncEdgeData.share/segData.share * segArc;
			segIncEdgeData.seg_start = thisSegPrevIncArcEnd;
			segIncEdgeData.seg_end = thisSegPrevIncArcEnd = segIncEdgeData.seg_start + incEdgeArc;
		};
	};

	/**************
	Draw everything
	***************/
    
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.1;
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    var getTangentIntersectionFromAngles = function(a, b) {
        var startPoint = polarToEuclidean(center, radius, a);
        var endPoint = polarToEuclidean(center, radius, b);
        
        // Slopes from center outwards
        var mStart = (startPoint[1] - center[1])/(startPoint[0] - center[0]);
        var mEnd = (endPoint[1] - center[1])/(endPoint[0] - center[0]);
        
        // Tangent slopes
        var mStart = -1/mStart;
        var mEnd = -1/mEnd;
        
        // y = mx + n ...
        var nStart = -mStart * startPoint[0] + startPoint[1];
        var nEnd = -mEnd * endPoint[0] + endPoint[1];
        
        // Intersection ..
        var xResult = (nEnd - nStart) / (mStart - mEnd);
        var yResult = mEnd * xResult + nEnd;
        console.log([xResult, yResult]);
        return [xResult, yResult];
    }
    
    /**
    @param a The smaller angle. Will be mod'd by 360
    @param b The larger angle. Will be mod'd by 360
    @param clockwise True if circle shoudl be drawn from a upto b or the other way around
    */
    var arcToWithAnglesAndRadius = function(context, a, b, radius, clockwise) {
        if(typeof(arcToWithAnglesAndRadius.circleApproximation) == 'undefined') {
            /// Speed up calculations by storing 360 Points around origin (0,0)
            /// of a circle with radius 1.
            arcToWithAnglesAndRadius.circleApproximation = new Array(360);
            for(var angle = 0.0; angle < 360; ++angle)
                arcToWithAnglesAndRadius.circleApproximation[angle] = polarToEuclidean([0,0], 1, angle);
        }

        a = normDegAngle(a);
        b = normDegAngle(b);
        if(b < a) b += 360; // Important corner-case.

        if(clockwise) {
            var bPoint = polarToEuclidean(center, radius, b);
            for(var angle = Math.ceil(a); angle < b; ++angle)
                context.lineTo(
                    arcToWithAnglesAndRadius.circleApproximation[angle % 360][0]*radius + center[0],
                    arcToWithAnglesAndRadius.circleApproximation[angle % 360][1]*radius + center[1]
                );
            context.lineTo(bPoint[0], bPoint[1]);
        }
        else {
            var aPoint = polarToEuclidean(center, radius, a);
            for(var angle = Math.floor(b); angle > a; --angle)
                context.lineTo(
                    arcToWithAnglesAndRadius.circleApproximation[angle % 360][0]*radius + center[0],
                    arcToWithAnglesAndRadius.circleApproximation[angle % 360][1]*radius + center[1]
                );
            context.lineTo(aPoint[0], aPoint[1]);
        }
    };
    
    // draw segments
    for (var segKey in perSegmentData) {
        var segData = perSegmentData[segKey];
        var segStartOuter = polarToEuclidean(center, radius, segData.seg_start);
        var segStartInner = polarToEuclidean(center, radius - border_size, segData.seg_start);
        var segEndOuter = polarToEuclidean(center, radius, segData.seg_end);
        var segEndInner = polarToEuclidean(center, radius - border_size, segData.seg_end);
        
        // draw background
        ctx.fillStyle = segData.color;
        ctx.beginPath();
        ctx.moveTo(segStartInner[0], segStartInner[1]);
        arcToWithAnglesAndRadius(ctx, segData.seg_start, segData.seg_end, radius - border_size, true);
        ctx.lineTo(segEndOuter[0], segEndOuter[1]);
        arcToWithAnglesAndRadius(ctx, segData.seg_start, segData.seg_end, radius, false);
        ctx.lineTo(segStartInner[0], segStartInner[1]);
        ctx.closePath();
        ctx.fill();
        
        // draw arc
        ctx.beginPath();
        ctx.arc(center[0], center[1], radius, degToArc(segData.seg_start-90.0), degToArc(segData.seg_end-90.0), false);
        ctx.stroke();
        
        // draw delimiters
        ctx.beginPath();
        ctx.moveTo(segStartOuter[0], segStartOuter[1]);
        ctx.lineTo(segStartInner[0], segStartInner[1]);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(segEndOuter[0], segEndOuter[1]);
        ctx.lineTo(segEndInner[0], segEndInner[1]);
        ctx.stroke();

        // draw labels
        var textPosition = polarToEuclidean(center, radius + 20, (segData.seg_start + segData.seg_end)/2.0);
        ctx.fillText(segKey, textPosition[0], textPosition[1]);
    }

    radius -= border_size - 0.7;

    /**
    Calculates the smallest azimut between two polar corrdinates.
    */
    var azimutBtwnAngles = function(a, b) {
        a = normDegAngle(a);
        b = normDegAngle(b);
        if(a > b) a = b + (b=a, 0);
        return Math.min(b - a, 360.0 - b + a);
    }

    /**
    When drawing a bezier between two points on the edge of a cricle,
    the control coordinates for that bezier are on a smaller circle
    around the same center. The radius of that smaller circle is
    a function of the azimut between the two points.
    */
    var ctrlCoordRadiusForBezierBtwnAzimut = function(azimut) {
        var offset = 10.0;
        var lo_r = radius * 0.1;
        var hi_r = radius * 0.9;
        //                ___ r = 80%
        // a = 15 deg    /    a = 165
        // r = 90% _____/
        if(azimut - offset > 180 - offset)
            return lo_r;
        else if(azimut < offset)
            return hi_r;
        else
            return hi_r - (hi_r - lo_r) * ((azimut - offset) / (180.0 - offset));
    };

    // draw edges
	for(var i = 0; i < (data.length - 1); ++i) {
        var segAData = perSegmentData[data[i].seg_a_id];
        var segBData = perSegmentData[data[i].seg_b_id];
		var incBData = segAData.incoming[data[i].seg_b_id];
		var incAData = segBData.incoming[data[i].seg_a_id];
        
        var azimutBStartAEnd = azimutBtwnAngles(incBData.seg_start, incAData.seg_end);
        var azimutAStartBEnd = azimutBtwnAngles(incAData.seg_start, incBData.seg_end);
        var ctrlCoordRadiusBStartAEnd = ctrlCoordRadiusForBezierBtwnAzimut(azimutBStartAEnd);
        var ctrlCoordRadiusAStartBEnd = ctrlCoordRadiusForBezierBtwnAzimut(azimutAStartBEnd);
        
		var incBStartCoords = polarToEuclidean(center, radius, incBData.seg_start);
        var incBStartCtrlCoords = polarToEuclidean(center, ctrlCoordRadiusBStartAEnd, incBData.seg_start);
		var incBEndCoords = polarToEuclidean(center, radius, incBData.seg_end);
        var incBEndCtrlCoords = polarToEuclidean(center, ctrlCoordRadiusAStartBEnd, incBData.seg_end);
		var incAStartCoords = polarToEuclidean(center, radius, incAData.seg_start);
        var incAStartCtrlCoords = polarToEuclidean(center, ctrlCoordRadiusAStartBEnd, incAData.seg_start);
		var incAEndCoords = polarToEuclidean(center, radius, incAData.seg_end);
        var incAEndCtrlCoords = polarToEuclidean(center, ctrlCoordRadiusBStartAEnd, incAData.seg_end);

        var outerAzimut = 0.0;
        var innerAzimut = 0.0;
        var innerRelativeToOuterAzimutStartsAt = 0.0;
        var innerRelativeToOuterAzimutEndsAt = 0.0;
        var edgeGradient = null;
        var gradientStartColor = '';
        var gradientEndColor = '';

        if(azimutBStartAEnd > azimutAStartBEnd) {
            edgeGradient = ctx.createLinearGradient(incBStartCoords[0], incBStartCoords[1], incAEndCoords[0], incAEndCoords[1]);
            outerAzimut = azimutBStartAEnd;
            innerAzimut = azimutAStartBEnd;
            innerRelativeToOuterAzimutStartsAt = innerRelativeToOuterAzimutEndsAt = incBData.seg_end - incBData.seg_start;
            innerRelativeToOuterAzimutEndsAt += innerAzimut;
            gradientStartColor = segAData.color;
            gradientEndColor = segBData.color;
        }
        else {
            edgeGradient = ctx.createLinearGradient(incAStartCoords[0], incAStartCoords[1], incBEndCoords[0], incBEndCoords[1]);
            outerAzimut = azimutAStartBEnd;
            innerAzimut = azimutBStartAEnd;
            innerRelativeToOuterAzimutStartsAt = innerRelativeToOuterAzimutEndsAt = incAData.seg_end - incAData.seg_start;
            innerRelativeToOuterAzimutEndsAt += innerAzimut;
            gradientStartColor = segBData.color;
            gradientEndColor = segAData.color;
        }
        
        // For cases where innerAzimut ~= outerAzimut ~= 180deg we need to clamp
        if(innerRelativeToOuterAzimutEndsAt > outerAzimut)
            innerRelativeToOuterAzimutEndsAt = outerAzimut;

        edgeGradient.addColorStop(innerRelativeToOuterAzimutStartsAt/outerAzimut, gradientStartColor);
        edgeGradient.addColorStop(innerRelativeToOuterAzimutEndsAt/outerAzimut, gradientEndColor);
        ctx.fillStyle = edgeGradient;
        
        // draw poly
		ctx.beginPath();
		ctx.moveTo(incBStartCoords[0], incBStartCoords[1]);
		ctx.bezierCurveTo(incBStartCtrlCoords[0], incBStartCtrlCoords[1], incAEndCtrlCoords[0], incAEndCtrlCoords[1], incAEndCoords[0], incAEndCoords[1]);
		arcToWithAnglesAndRadius(ctx, incAData.seg_start, incAData.seg_end, radius, false);
		ctx.bezierCurveTo(incAStartCtrlCoords[0], incAStartCtrlCoords[1], incBEndCtrlCoords[0], incBEndCtrlCoords[1], incBEndCoords[0], incBEndCoords[1]);
        arcToWithAnglesAndRadius(ctx, incBData.seg_start, incBData.seg_end, radius, false);
		ctx.closePath();
        ctx.fill();
        
        // draw beziers
        ctx.beginPath();
		ctx.moveTo(incBStartCoords[0], incBStartCoords[1]);
		ctx.bezierCurveTo(incBStartCtrlCoords[0], incBStartCtrlCoords[1], incAEndCtrlCoords[0], incAEndCtrlCoords[1], incAEndCoords[0], incAEndCoords[1]);
 		ctx.stroke();
        
        ctx.beginPath();
		ctx.moveTo(incAStartCoords[0], incAStartCoords[1]);
		ctx.bezierCurveTo(incAStartCtrlCoords[0], incAStartCtrlCoords[1], incBEndCtrlCoords[0], incBEndCtrlCoords[1], incBEndCoords[0], incBEndCoords[1]);
        ctx.stroke();
	}
};

