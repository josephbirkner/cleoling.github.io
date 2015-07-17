<?php
	function link_top($langex, $data){
		$langex = explode(":", $langex);
		if(count($langex) == 1){
			return $data;
		}
		if(count($langex) == 2){
			$n = $langex[1];
			if($n >= count($data)){
				return $data;
			}
			$array = array();
			for($i = 0; $i < $n; ++$i){
				$array[] = $data[$i];
			}
			return $array;
		}
		return array();
	}
	function link_match($langex, $slang, $tlang){
		if($slang == "u" || $tlang == "u"){
			return false;
		}
		$langex = explode(":", $langex);
		$langex = $langex[0];
		$langex = explode("X", $langex);
		if(count($langex) == 1){
			if($langex[0] == "[all]"){
				return true;
			}
			$langex = $langex[0];
			$langex = explode(",", $langex);
			foreach($langex as $lang){
				$param = check_lang($langex, $lang, $slang, $tlang);
				if($param){
					return true;
				}
			}
		}
		elseif(count($langex) == 2){
			if($langex[0] == "[all]"){
				$langex = $langex[1];
				$langex = explode(",", $langex);
				foreach($langex as $lang){
					$param = check_lang($langex, $lang, $slang, $tlang);
					if($param){
						return false;
					}
				}
				return true;
			}
		}
		return false;
	}
	function check_lang($langex, $lang, $slang, $tlang){
		if(substr($lang, 0, 1) == "(" && substr($lang, strlen($lang)-1, 1) == ")"){
			if(preg_match("/^".str_replace("*", "[\w]*", substr($lang, 1, strlen($lang)-2))."$/", $slang) == 1 || preg_match("/^".str_replace("*", "[\w]*", substr($lang, 1, strlen($lang)-2))."$/", $tlang) == 1){
				return true;
			}
		}
		else {
			if(preg_match("/^".str_replace("*", "[\w]*", $lang)."$/", $slang) == 1){
				foreach($langex as $lang2){
					if(substr($lang2, 0, 1) == "(" && substr($lang2, strlen($lang2)-1, 1) == ")"){
						$lang2 = substr($lang2, 1, strlen($lang2)-2);
					}
					if(preg_match("/^".str_replace("*", "[\w]*", $lang2)."$/", $tlang) == 1){
						return true;
					}
				}
			}
			elseif(preg_match("/^".str_replace("*", "[\w]*", $lang)."$/", $tlang) == 1){
				foreach($langex as $lang2){
					if(substr($lang2, 0, 1) == "(" && substr($lang2, strlen($lang2)-1, 1) == ")"){
						$lang2 = substr($lang2, 1, strlen($lang2)-2);
					}
					if(preg_match("/^".str_replace("*", "[\w]*", $lang2)."$/", $slang) == 1){
						return true;
					}
				}
			}
		}
		return false;
	}
?>