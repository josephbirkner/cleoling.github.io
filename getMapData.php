<?php
	include_once("__dbdata.php");
	$connection = mysql_connect($host, $user, $pass);
	if($connection){
		$url_langs = explode(",", $_GET['ulangs']);
		$query = "SELECT scntry, tcntry, tlang, slang FROM `DB2139167`.`geodata`";
		$result = mysql_query($query);
		$links = array(); // A link is a tuple of: (source coords, target coords, semi-random arrow color, source country + target country)
		$cmap = array(); // (country name->coords)
		$lmap = array(); // (source country + target country->link count) 
		while($row = mysql_fetch_object($result)){
			$slang = $row->slang;
			$tlang = $row->tlang;
			if($slang == $tlang || !(in_array($slang, $url_langs) && in_array($tlang, $url_langs))){
				continue;
			}
			$sc = $row->scntry;
			$tc = $row->tcntry;
			if($sc == $tc)
				continue;
			
			if(!array_key_exists($sc, $cmap)){
				$cmap[$sc] = getCoordinates($sc);
				echo $sc;
			}
			if(!array_key_exists($tc, $cmap)){
				$cmap[$tc] = getCoordinates($tc);
				echo $tc;
			}
			if(!array_key_exists($sc.$tc, $lmap)){
				$lmap[$sc.$tc] = 1;
			}
			else {
				++$lmap[$sc.$tc];
			}
			$links[] = array($cmap[$sc], $cmap[$tc], hashColor($slang), hashColor($tlang), $sc.$tc);
		}
		// Beautify the distribution by appliying a logarithm : )
		/*foreach($lmap as &$elem) {
			$elem = round(log($elem)*1000)/1000;
		}*/
		for($i = 0; $i < count($links); ++$i){
			$links[$i][4] = $lmap[$links[$i][4]];
		}
		function sortByLmap($a, $b){
			return $a[4]-$b[4];
		}
		usort($links, "sortByLmap");
		$links = array_reverse($links);
		echo json_encode($links);
		mysql_close($connection);
	}
	/**
	 * Source: https://colinyeoh.wordpress.com/2013/02/12/simple-php-function-to-get-coordinates-from-address-through-google-services/
	 */
	function getCoordinatesX($address){
		$address = str_replace(" ", "+", $address); // replace all the white space with "+" sign to match with google search pattern
		$url = "http://maps.google.com/maps/api/geocode/json?sensor=false&address=$address";
		$response = file_get_contents($url);
		$json = json_decode($response,TRUE); //generate array object from the response from the web
		return ($json['results'][0]['geometry']['location']['lat'].",".$json['results'][0]['geometry']['location']['lng']);
	}
	
	function getCoordinates($address){
		$address = str_replace(" ", "+", $address);
		$url = "http://nominatim.openstreetmap.org/search?q=$address&format=json";
		$response = file_get_contents($url);
		$json = json_decode($response,TRUE);
		return ($json[0]['lat'].",".$json[0]['lon']);
	}
	
	function hashColor($str){
		$h = "";
		for($i = 0; $i < 4; ++$i){
			$h .= ord(strtoupper(substr($str, $i)));
		}
		$h = dechex($h);
		while(strlen($h) < 6){
			$h .= (substr($h, -1)+1)%9;
		}
		$h = "#".substr($h, 0, 6);
		return $h;
	}
?>
