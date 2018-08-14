<?php

// get requested ID
$id = (int) filter_input(INPUT_GET, 'id', FILTER_SANITIZE_NUMBER_INT);

// check ID format
if(!$id){
	echo json_encode(array(
		'status' => false,
		'message' => 'Error! Bad ID format!'
	));
}

// pseudo SUCCESS element
$item_success = array(
	'status' => true,
	'item' => array(
		'id' => $id,
		'name' => 'Foo'
	),
	'message' => ''
);

// pseudo FAILED element
$item_failed = array(
	'status' => false,
	'item' => array(
		'id' => $id,
		'name' => 'Bar'
	),
	'message' => 'Error! Shame on you!'
);

// JSON test item data (random item)
echo json_encode(mt_rand(1,100) > 10 ? $item_success : $item_failed);
