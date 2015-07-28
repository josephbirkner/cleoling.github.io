<html>
	<!-- "THOU SHALT SCROLL IN PURSUIT OF ANSWERS"- The Web -->
	<head>
		<title>Interlingual Connections on the Web</title>
		<script type="text/javascript">
			var ulangs = 'de,en,fr,pl,ru,nl,tr,zh-cn,vi';
			var ulangx = 'German,English,French,Polish,Russian,Dutch,Turkish,Simplified Chinese,Vietnamese';
		</script>
		<script type='text/javascript' src='https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'></script>
		<!--<script type='text/javascript' src='//code.jquery.com/jquery-1.11.2.min.js'></script>-->
		<script type="text/javascript" src="biweightedCircularGraph.js"></script>
		<script type="text/javascript" src="hostMap.js"></script>
		<link rel="stylesheet" href="style.css">
		<meta name="keywords" content="Computational, Interlingual, Connections, Link, Map">
		<meta charset="UTF-8">
		<meta name="author" content="Tillmann Doenicke" >
		<script type="text/javascript">
			$(function() {
				// Stick the #nav to the top of the window
				var nav = $('#navWrap');
				var navHomeY = nav.offset().top;
				var isFixed = false;
				var $w = $(window);
				$w.scroll(function() {
					var scrollTop = $w.scrollTop();
					var shouldBeFixed = scrollTop > navHomeY;
					if (shouldBeFixed && !isFixed) {
						nav.css({
							position: 'fixed',
							top: 0//,
							//left: nav.offset().left//,
							//width: nav.width()
						});
						isFixed = true;
						$('#content-separator').css('height', $('#navWrap').outerHeight()+'px');
					}
					else if (!shouldBeFixed && isFixed){
						nav.css({position: 'static'});
						isFixed = false;
						$('#content-separator').css('height', '0px');
					}
				});
			});
		</script>
		<!-- BEGIN Third Party Code -->
		<script type="text/javascript" src="jquery.tokeninput.js"></script>
		<link rel="stylesheet" type="text/css" href="token-input.css" />
		<script type="text/javascript">
			$(document).ready(function () {
				$("#my-text-input").tokenInput("getLangs.php");
			});
		</script>
		<!-- END Third Party Code -->
		<script type="text/javascript">
			
			var canvasResizeTimer = null;
			function resizeAndRedrawMap() {
				var canvas = document.getElementById('map'),
				context = canvas.getContext('2d');
				canvas.width = window.innerWidth*0.95;
				canvas.height = canvas.width/2;
				/**
				 * Your drawings need to be inside this function otherwise they will be reset when 
				 * you resize the browser window and the canvas goes will be cleared.
				 */
				drawMap(canvas);
				canvasResizeTimer = null;
			}
			function redrawChartAndTable() {
				$.get('getChartData.php?ulangs='+ulangs, function(data, status){
					if(status == "success"){
						var array = JSON.parse(data);
						drawCircularChart(document.getElementById('c'), 10, 30, [350, 350], 300, array);
					}
				});
				$.get("getTable.php?ulangs="+ulangs, function(data, status){
					if(status == "success"){
						document.getElementById("responseFrame").innerHTML = data;
					}
				});
			}
			$(document).ready(function(){
				redrawChartAndTable();
				
				// resize the canvas to fill browser window dynamically
				window.addEventListener('resize', function () {
					document.getElementById('navWrap').style.width = "100%";
					if(canvasResizeTimer == null)
						canvasResizeTimer = setTimeout(resizeAndRedrawMap, 500, false);
					else
						canvasResizeTimer.clearTimeout();
				});
				resizeAndRedrawMap();
				
			});
		</script>
	</head>
	<body style="width:window.innerWidth;">
		<div id="header">
			<h1 align='center'>Interlingual Connections on the Web</h1>
			<h4 align='center'>Who's linking to whome, about what, where, in which language?</h4>
			<div id="navWrap">
				<div id="nav">
					<ul class="site-menu">
						<li><a href="" class="smoothScroll">Top</a></li>
						<li><a href="#horb" class="smoothScroll">Orb</a></li>
						<li><a href="#htable" class="smoothScroll">Table</a></li>
						<li><a href="#hmap" class="smoothScroll">Map</a></li>
						<li><a href="#hapi" class="smoothScroll">API</a></li>
						<li><a href="#hcode" class="smoothScroll">Code</a></li>
						<li><a href="#habout" class="smoothScroll">About</a></li>
					</ul>
					<br>
					<div id="my-text-input" class="token-input-dropdown"></div>
				</div>
			</div>
		</div>
		<div id='content-separator'></div>
		<div class="separable-section">
			<h2 class='section-headline' id="horb">Orb</h2>
			<div align="left">
				<canvas id="c" width="700px" height="700px" />
			</div>
		</div>
		<div class="separable-section">
			<h2 class='section-headline' id="htable">Raw Data</h2>
			<div id="responseFrame"></div>
		</div>
		<div class="separable-section">
			<h2 class='section-headline' id="hmap">Map</h2>
			<canvas id="map" width="800" height="400">
			</canvas>
		</div>
		<div class="separable-section">
			<h2 class='section-headline' id="hapi">API</h2>
			<h2 class='section-headline' id="hcode">Code</h2>
			<h2 class='section-headline' id="habout">About</h2>
			<h3>Authors</h3>
			<a href="http://josephbirkner.com/" target="_blank">Joseph Birkner</a> & <a href="http://tilly-doe.blogspot.de/" target="_blank">Tillmann Dönicke</a><br />
			Students of B. Sc. Natural Language Processing<br />
			<a href="http://www.ims.uni-stuttgart.de/index.en.html" target="_blank">Institute for Natural Language Processing (IMS)</a><br />
			<a href="http://www.uni-stuttgart.de/home/index.en.html" target="_blank">University of Stuttgart</a><br /><br />
			You can contact us via the following addresses:
			<ul>
				<li>joseph.birkner@ims.uni-stuttgart.de</li>
				<li>tillmann.doenicke@ims.uni-stuttgart.de</li>
				<li>info@cleoling.com</li>
			</ul>
			<h3>History</h3>
			<ul>
				<li>2015
					<ul>
						<li>January: The second annual Computational Linguistics Unconference (<a href="http://www.clunc.eu/" target="_blank">clunc</a>) took place in Stuttgart. After a one-night-programming shift we won the hackathon with our project titled <q>HackGeoLing</q>, which was the first prototype of this project. The hurrily created slides of the presentation you can download <a href="HackGeoLing.pdf" download>here</a>.</li>
						<li>March: After doing a Python course we wrote a totally new crawler which was originally in PHP to do not have encoding problems anymore.</li>
						<li>May: We worked out a new idea how two present the crawled data in a better way than with a map. After some mathematical discussions we created the orb, which does not have the countries-are-not-languages problem.</li>
						<li>June: We fought a battle against Ajax requests&mdash;and won! Because of we don't have permission to use the Google API, we get our map coordinates from OpenStreetMap now (Take that, Google!). Furthermore the orb got a logarithmic scale, because English always took too much scale place. <nobr>&mdash; &mdash;</nobr> The orb now has beautiful colours! Same is now being worked on for the arrows of the map. Also one more thing: We can interactively display languages now! (Have a look at the new input bar in the menu.) <nobr>&mdash; &mdash;</nobr> We started working on a new vector-based, interactive concept for the map and advanced query expressions for our API.</li>
					</ul>
				</li>
			</ul>
			<!--<h3>Why <q>Cleopatra</q>?</h3>-->
			<h3>Thanks</h3>
			Our special credits go to:
			<ul>
				<li>1<sup>st</sup> language detector: <a href="https://pecl.php.net/package/TextCat" target="_blank">TextCat</a></li>
				<li>1<sup>st</sup> crawler: <a href="http://phpcrawl.cuab.de/" target="_blank">PHPCrawl</a>
				<li>2<sup>nd</sup> crawler: <a href="http://scrapy.org/" target="_blank">Scrapy</a>
				<li><a href="http://loopj.com/jquery-tokeninput/" target="_blank">jQuery Tokeninput</a> by <a href="http://loopj.com/" target="_blank">James Smith</a></li>
				<li><a href="http://www.ipligence.com/free-ip-database" target="_blank">IPligence Lite Free</a> by <a href="http://www.ipligence.com/" target="_blank">IPligence</a></li>
				<li><a href="https://nominatim.openstreetmap.org/" target="_blank">Nominatim</a> by <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a></li>
				<li><a href="http://www.naturalearthdata.com/downloads/110m-cultural-vectors/" target="_blank">1:110m Cultural Vectors</a> by <a href="http://www.naturalearthdata.com/" target="_blank">Natural Earth</a></li>
				<li><a href="http://ogre.adc4gis.com/" target="_blank">ESRI to GeoJSON Shapefile Converter</a></li>
				<li><a href="http://www.clunc.eu/" target="_blank">clunc</a> by <a href="http://www.aexea.de/" target="_blank">Aexea</a></li>
			</ul>			
		</div>
	</body>
</html>
