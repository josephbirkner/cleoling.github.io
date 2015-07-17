<?php
	include_once("__dbdata.php");
	include_once("langex.php");
	// establishing MySQL connection:
	$connection = mysql_connect($host, $user, $pass);
	if($connection){
		// the given languages
		$ulangs = $_GET['ulangs'];
		//$url_langs = explode(",", $ulangs);
		// get data from MySQL and save it to array:
		$query = "SELECT tlang, slang FROM `DB2139167`.`geodata`";
		$result = mysql_query($query);
		$data = array();
		$incomes = array();
		$colors = array();
		while($row = mysql_fetch_object($result)){
			$slang = $row->slang;
			$tlang = $row->tlang;
			//if($slang == $tlang || !(in_array($slang, $url_langs) && in_array($tlang, $url_langs))){
			if($slang == $tlang || !link_match($ulangs, $slang, $tlang)){
				continue;
			}
			// for each language pair exists one array entry:
			// array[AB] = (count(A->B), count(B->A))
			if(array_key_exists($slang."|".$tlang, $data)){
				$data[$slang."|".$tlang]['num_ab'] += 1;
				$xtlang = $tlang;
			}
			elseif(array_key_exists($tlang."|".$slang, $data)){
				$data[$tlang."|".$slang]['num_ba'] += 1;
				$xtlang = $slang;
			}
			else {
				$data[$slang."|".$tlang] = array();
				$data[$slang."|".$tlang]['seg_a_id'] = $slang;
				$data[$slang."|".$tlang]['seg_b_id'] = $tlang;
				$data[$slang."|".$tlang]['num_ab'] = 1;
				$data[$slang."|".$tlang]['num_ba'] = 0;
				$colors[$slang] = hashColor($slang);
				$colors[$tlang] = hashColor($tlang);
				$xtlang = $tlang;
			}
			// counting the incomes of each language:
			if(array_key_exists($xtlang, $incomes)){
				$incomes[$xtlang] += 1;
			}
			else {
				$incomes[$xtlang] = 1;
			}
		}

		// Beautify the distribution by appliying a logarithm : )
		foreach($data as &$langLink) {
			$langLink['num_ab'] = round(log($langLink['num_ab'])*1000);
			$langLink['num_ba'] = round(log($langLink['num_ba'])*1000);
		}

		// sorting the array by the sum of the incomes and outcomes:
		function sortByEntrySum($a, $b){
			return ($a['num_ab']+$a['num_ba'])-($b['num_ab']+$b['num_ba']);
		}
		usort($data, "sortByEntrySum");
		$data = array_reverse($data);
		$data = array_values($data);

		$data = link_top($ulangs, $data);

		// Append the colors to the result data
		$data[] = $colors;
		
		// echoing it as json formatted string:
		echo json_encode($data);
		mysql_close($connection);
	}

	// the colour function from the old document:
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
