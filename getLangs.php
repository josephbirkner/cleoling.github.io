<?php
	$q = "";
	if(isset($_GET['q'])){
		$q = $_GET['q'];
	}
	$o = "+";
	$langs = array(
	"[all]X", "<span style='font-variant:small-caps;'>All Languages</span>",
	"af", "Afrikaans",
	"ar", "Arabic",
	"bg", "Bulgarian",
	"bn", "Bengali",
	"cs", "Czech",
	"da", "Danish",
	"de", "German",
	"el", "Greek",
	"en", "English",
	"es", "Spanish",
	"et", "Estonian",
	"fa", "Persian",
	"fi", "Finnish",
	"fr", "French",
	"gu", "Gujarati",
	"he", "Hebrew",
	"hi", "Hindi",
	"hr", "Croatian",
	"hu", "Hungarian",
	"id", "Indonesian",
	"it", "Italian",
	"ja", "Japanese",
	"kn", "Kannada",
	"ko", "Korean",
	"lt", "Lithuanian",
	"lv", "Latvian",
	"mk", "Macedonian",
	"ml", "Malayalam",
	"mr", "Marathi",
	"ne", "Nepali",
	"nl", "Dutch",
	"no", "Norwegian",
	"pa", "Punjabi",
	"pl", "Polish",
	"pt", "Portuguese",
	"ro", "Romanian",
	"ru", "Russian",
	"sk", "Slovak",
	"sl", "Slovene",
	"so", "Somali",
	"sq", "Albanian",
	"sv", "Swedish",
	"sw", "Swahili",
	"ta", "Tamil",
	"te", "Telugu",
	"th", "Thai",
	"tl", "Tagalog",
	"tr", "Turkish",
	"uk", "Ukrainian",
	"ur", "Urdu",
	"vi", "Vietnamese",
	"zh-cn", "Simplified Chinese",
	"zh-tw", "Traditional Chinese"
	);
	$languages = array();
	$temp = array();
	if(str_replace("*", "", $q) !== $q){
		$temp0 = array();
		$temp0["id"] = "";
		$temp0["name"] = $q;
		if(substr($q, 0, 1) == $o){
			$temp0["name"] = substr($q, 1);
		}
		for($i = 0; $i < count($langs); $i += 2){
			$temp["id"] = $langs[$i];
			$temp["name"] = $langs[$i+1];
			if(substr($q, 0, 1) == $o){
				$temp["id"] = "(".$temp["id"].")";
			}
			if(preg_replace("/^".strtolower(str_replace(array($o, "*"), array("", "[\w]*"), $q))."$/", "", strtolower($langs[$i+1])) == ""){
				$temp0["id"] .= $temp["id"].",";
				$languages[] = $temp;
			}
		}
		if("," == substr($temp0["id"], strlen($temp0["id"])-1)){
			$temp0["id"] = substr($temp0["id"], 0, strlen($temp0["id"])-1);
		}
		if($temp0["id"] == ""){
			$temp0["id"] = $q;
			if(substr($q, 0, 1) == $o){
				$temp0["id"] = "(".substr($q, 1).")";
			}
		}
		$languages[] = $temp0;
		echo json_encode($languages);
	}
	else {
		for($i = 0; $i < count($langs); $i += 2){
			$temp["id"] = $langs[$i];
			$temp["name"] = $langs[$i+1];
			$qx = $q;
			if(substr($q, 0, 1) == $o){
				$temp["id"] = "(".$temp["id"].")";
				$qx = substr($qx, 1);
			}
			if(str_replace(strtolower($qx), "", strtolower($langs[$i+1])) !== strtolower($langs[$i+1])){
				$languages[] = $temp;
			}
		}
		echo json_encode($languages);
	}
?>