<?php
	include_once("__dbdata.php");
	include_once("langex.php");
	$connection = mysql_connect($host, $user, $pass);
	if($connection){
		$ulangs = $_GET['ulangs'];
		//$url_langs = explode(",", $ulangs);
		$query = "SELECT slang, tlang FROM `DB2139167`.`geodata`";
		$result = mysql_query($query);
		$lmap = array();
		while($row = mysql_fetch_object($result)){
			$sl = $row->slang;
			$tl = $row->tlang;
			//if($slang == $tlang || !(in_array($slang, $url_langs) && in_array($tlang, $url_langs))){
			if($sl == $tl || !link_match($ulangs, $sl, $tl)){
				continue;
			}
			if(!array_key_exists($sl."|".$tl, $lmap)){
				$lmap[$sl."|".$tl] = 1;
			}
			else {
				++$lmap[$sl."|".$tl];
			}
		}
		while($l = current($lmap)) {
			$arr = explode("|", key($lmap));
			$lmap[key($lmap)] = $arr[0]."|".$arr[1]."|".$l."|".hashColor($arr[1]);
			next($lmap);
		}
		function sortIt($a, $b){
			$a = explode("|", $a);
			$b = explode("|", $b);
			return $a[2]-$b[2];
		}
		usort($lmap, "sortIt");
		$lmap = array_reverse($lmap);

		$lmap = link_top($ulangs, $lmap);
		
		$echo = "<table>";
		for($i = 0; $i < count($lmap); ++$i){
			$data = explode("|", $lmap[$i]);
			$echo .= "<tr><td>".$data[0]."</td><td>".$data[1]."</td><td><span style='color:".$data[3].";'>".$data[2]."</span></td></tr>";
		}
		$echo .= "</table>";
		echo $echo;
		mysql_close($connection);
	}
	function hashColor($str){
		return "#000000";
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
