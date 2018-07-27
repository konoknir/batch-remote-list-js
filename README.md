# Batch Remote List JS
JQuery plugin for remote list batch processing via ajax.

Screenshot of generated form and some processed data:

![BatchRemoteList example screenshot](/example.png?raw=true)

# Install via npm
You can install it via npm
> npm i batch-remote-list-js

# Usage

Insert jQuery
```html
<script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
```

Then insert BatchRemoteList js file
```html
<script src="/your/path/to/js/batch-remote-list-js/jquery.batch-remote-list.js"></script>
```

Add translation file if you need
```html
<script src="/your/path/to/js/batch-remote-list-js/i18n/ru.js"></script>
```

Place container for the form and configure batch process
```html
<div id="batch-process-container"></div>

<script>
	$("#batch-process-container").BatchRemoteList({
		
		// ajax URL for getting total number of elements
		// you can omit this by directly setting count value, e.g. "total_count: 100"
		// 
		// otherwise expected response is JSON: 
		//    status: bool
		//    count: int
		//    message: string (error message)
		// 
		// id={itemID} param is added to the request (starting item ID) e.g. /ajax/list/count?id=1
		// 
		// e.g. if you use SQL on backend:
		// you should append SQL rule something like "AND table_id >= {itemID}" to get proper items count
		
		ajax_url_count: '/ajax/list/count',
		
		// ajax URL for processing items
		// 
		// id={itemID} param is added to every request (starting item ID) e.g. /ajax/list/item?id=1
		// 
		// again, if you use SQL on backend:
		// script should append SQL rule something like "AND table_id >= {itemID}" to load an item from list
		//
		// expected response is JSON: 
		//    status: bool, 
		//    item: { id: int, whatever_you_like: mixed } (depends on your callbacks settings but it must contain "id"), 
		//    message: string (error message)
		//
		// if everything goes well, response.item.id + 1 is requested as next item
		// this repeats until the whole list is processed or limit is hit (when it's non-zero value)
		// also you can stop the script whenever you like by pressing the stop button
		
		ajax_url_item: '/ajax/list/item',
		
		// configure callbacks
		// default behavior is to print response to console
		callbacks: {

			// called if response JSON response.status is true and response.item is set
			// returned result is appended to result container
			item_process: function(item){
				// for example:
				return '<div class="item">' + 
					'<div class="name">#' + item.id + ' - ' + item.name + ': </div>' + 
					'<div class="status">' + item.some_status + '</div>' + 
				'</div>';
			},
			
			// called if response JSON response.status is false
			// you can use response.message to print error message
			item_error: function(response){
				// for example:
				return '<div class="item err">' + 
					'<div class="name">' + 
						(response.item ? '#' + response.item.id + ' - ' + response.item.name :  'Unknown item') + 
					': </div>' +
					'<span class="item-msg">' + (response.message || 'Unknown error') + '</span>'
				'</div>';
			}

		}
	});
</script>
```

Here is the list of default options you can override via constructor like in example above (for single instance) or via $.BatchRemoteList.setDefaults (applied to all instances)

```javascript
// default css classes
classes: {
	// you can set your own classes or use css rules to adjust the look
	form: 'bp-form',
	table : 'bp-form-table',
	td_label : 'bp-form-label',
	td_input : 'bp-form-input',
	submit_container: 'bp-form-submit-container',
	result_container: 'bp-result',
	list_container: 'bp-container-list',
	stats_container: 'bp-stats',
	finish_stats: 'bp-finish-stats'
},
// localized messages
messages: {
	start_process : 'Start',
	stop_process : 'Stop',
	start_from_id : 'Start from ID',
	limit_process : 'Limit',
	process_stopped : 'Batch process stopped',
	finish : 'Finish',
	start_time : 'Start time',
	error : 'Error',
	unknown_error : 'Unknown error',
	data_count_empty : 'Data empty (items were not found)',
	data_count_total : 'Found items',
	data_process_left : 'Items left',
	ajax_fail : 'Remote resource failed',
	limit_exceeded : 'Limit exceeded',
	item_not_found : 'Item was not found'
},
// backend URLs
ajax_url_count: '/ajax/batch-remote-list/count',
ajax_url_item:  '/ajax/batch-remote-list/item',
// time in ms to wait before calling another item request (throttle)
request_throttle: 500,
// set "item_process" and "item_error" callbacks
callbacks: {}
```
