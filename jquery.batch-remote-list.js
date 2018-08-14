/**
 * Batch Remote List
 * JQuery plugin for executing remote batch operations
 * @author Dmitriy Lukin <ldi@email.cz>
 * 
 * Set default config
 * 
 * $.BatchRemoteList.setDefaults({
 *   classes : {
 *     form: 'my-class'
 *   }
 *   messages : {
 *     start_process : 'Just start it!'
 *   }
 * });
 * 
 * Set messages only
 * 
 * $.BatchRemoteList.setDefaultMessages({
 *   'start_process' : 'Just start it!'
 * });
 *
 * Example of i18n/ru.js:
 * 
 * $.BatchRemoteList.setDefaultMessages({
 *   'start_process' : 'Начать обработку',
 *   'stop_process' : 'Остановить обработку',
 *   'start_from_id' : 'Начать обработку с ID',
 *   'limit_process' : 'Лимит обработки',
 *   'process_stopped' : 'Процесс был остановлен',
 *   'finish' : 'Конец',
 *   'start_time' : 'Начало обработки',
 *   'error' : 'Ошибка',
 *   'unknown_error' : 'Неизвестная ошибка',
 *   'data_count_empty' : 'Нет данных для обработки...',
 *   'data_count_total' : 'Всего данных на обработке',
 *   'data_process_left' : 'Осталось обработать',
 *   'ajax_fail' : 'Ошибка обработки запроса',
 *   'limit_exceeded' : 'Достигнут лимит',
 *   'item_not_found' : 'Элемент не найден'
 * });
 * 
*/
(function( $ ){
	// check conflicts
	if(typeof $.BatchRemoteList !== 'undefined'){
		return console.log('BatchRemoteList jQuery plugin init conflict error! Exiting...');
	}

	// init constructor
	$.BatchRemoteList = function(container, options){
		var t = this;

		t.container = $(container);
		t.options = options;
		t.config = {};

		t.form = $('<div>');
		t.formTable = $('<table>');
		t.inputItemId = $('<input type="number" value="1">');
		t.inputProcessLimit = $('<input type="number" min="0">');
		t.resultContainer = $('<div>');
		t.containerList = $('<div>');
		t.finishStatsContainer = $('<div>');
		
		t.submitButton = $('<button type="button">').click(function(e){
			t.init_process(this, e);
		});

		// init plugin
		t.init();
	};

	$.BatchRemoteList.prototype = {
		defaults: {
			classes: {
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
				data_count_total : 'Items total',
				data_process_left : 'Items left',
				ajax_fail : 'Remote resource failed',
				limit_exceeded : 'Limit exceeded',
				item_not_found : 'Item was not found',
				data_process_success: 'Items done',
				data_process_failed: 'Items failed'
			},
			ajax_url_count: '/ajax/batch-remote-list/count',
			ajax_url_item:  '/ajax/batch-remote-list/item',
			request_throttle: 500,
			callbacks: {}
		},
		init: function() {
			// extend config
			$.extend(true, this.config, this.defaults, this.options);

			// init callbacks
			this.initCallbacks();

			// build container
			this.buildContainer();

			return this;
		},
		initCallbacks: function(){
			var t = this;

			var allowed_replacements = ['item_process', 'item_error'];
			
			var set_callback = function(callback_name){
				if(t.config.callbacks[callback_name] && typeof t.config.callbacks[callback_name] === 'function'){
					t[callback_name] = t.config.callbacks[callback_name];
				}
			};

			for(var i in allowed_replacements){
				set_callback(allowed_replacements[i]);
			}
		},
		curtime: function(){
			// return time in local format
			return new Date().toLocaleString();
		},
		buildContainer: function(){
			// clean and build
			this.container.html('').append(
				this.buildForm(),
				this.buildResultContainer(),
				this.buildFinishStatsContainer()
			);
		},
		buildResultContainer: function( total_count ){
			// clean and build
			return this.resultContainer.html('').addClass(this.config.classes.result_container);
		},
		buildFinishStatsContainer: function(){
			// clean and build
			return this.finishStatsContainer.html('').addClass(this.config.classes.finish_stats);
		},
		buildForm: function(){
			// clean and build
			return this.form.addClass(this.config.classes.form).html('').append(
				this.formTable.addClass(this.config.classes.table).append(
					$("<tr>").append(
						$("<td>").text(this.getMessage('start_from_id') + ': ').addClass(this.config.classes.td_label),
						$("<td>").append(this.inputItemId).addClass(this.config.classes.td_input)
					),
					$("<tr>").append(
						$("<td>").text(this.getMessage('limit_process') + ': ').addClass(this.config.classes.td_label),
						$("<td>").append(this.inputProcessLimit).addClass(this.config.classes.td_input)
					)
				),
				$("<div>").append(this.submitButton.text(this.getMessage('start_process'))).addClass(this.config.classes.submit_container)
			);
		},
		buildContainerList: function(){
			// clean and add class
			return this.containerList.html('').addClass(this.config.classes.list_container);
		},
		getMessage: function(messageCode){
			// get multilanguage message or message code
			return this.config.messages[messageCode] || messageCode;
		},
		init_process: function(ob, event){
			var submit_button = $(ob);
			var inst = this;

			var container = this.resultContainer;
			var process_id = this.inputItemId.val();
			var process_limit = this.inputProcessLimit.val();
			var container_list = this.containerList;
			var finish_stats_container = this.finishStatsContainer;

			var process_counter = 0;
			var count_left = $("<span>");
			var count_success = $("<span>");
			var count_failed = $("<span>");
			
			var end_process = function(custom){
				if(custom){
					finish_stats_container.append('<div>' + custom + '</div>');
				}
				submit_button.data('process-list-status', 'stopped');
				finish_stats_container.append('<div>'+ inst.getMessage('finish') +': ' + inst.curtime() + '</div>');
				submit_button.text(inst.getMessage('start_process'));
			};

			var stop_process = function(){
				end_process(inst.getMessage('process_stopped'));
			};

			var start_process = function(){
				// clean result and finish containers
				container.html('');
				finish_stats_container.html('');

				submit_button.data('process-list-status', 'processing');
				submit_button.text(inst.getMessage('stop_process'));

				// if total count is provided from config
				if(inst.config.total_count){
					init_result_container( inst.config.total_count );
					return;
				}

				// get total count via ajax
				$.get(inst.config.ajax_url_count, {id: process_id}, function(data){

					if(!data.status){
						return end_process(inst.getMessage('error') + "! " + (data.message || inst.getMessage('unknown_error')));
					}

					var count = data.count || 0;

					if(count == 0 || isNaN(count)){
						return end_process(inst.getMessage('data_count_empty'));
					}

					init_result_container(count);

					process_list( process_id );

				}, 'json').fail(function() {
					end_process(inst.getMessage('ajax_fail') + " (" + inst.config.ajax_url_count + ")");
				});
			};

			var init_result_container = function(count){
				container.html('').append(
					$('<div>').addClass(inst.config.classes.stats_container).html('').append(
						'<div>' + inst.getMessage('start_time') + ': ' + inst.curtime() + '</div>',
						'<div>' + inst.getMessage('data_count_total') + ': ' + count + '</div>',
						$('<div>' + inst.getMessage('data_process_left') + ': </div>').append(count_left.text(count)),
						$('<div>' + inst.getMessage('data_process_success') + ': </div>').append(count_success.text('0')),
						$('<div>' + inst.getMessage('data_process_failed') + ': </div>').append(count_failed.text('0'))
					),
					inst.buildContainerList()
				);
			};

			var count_failed_increase = function(){
				count_failed.text( + count_failed.text() + 1 );
			}

			var count_success_increase = function(){
				count_success.text( + count_success.text() + 1 );
			}
			
			var process_list = function(element_id) {

				if(submit_button.data('process-list-status') == 'stopped'){
					return;
				}

				if(count_left.text() == 0){
					return end_process();
				}

				if(process_limit > 0 && process_counter >= process_limit){
					return end_process(inst.getMessage('limit_exceeded') + ' ('+process_limit+')');
				}

				$.get(inst.config.ajax_url_item, {id: element_id || 1}, function(data){


					if(!data.status){
						count_failed_increase();
						container_list.append(inst.item_error(data));
					} else {
						count_success_increase();
						container_list.append(inst.item_process(data.item));
					}

					if(!data.item){
						return end_process(inst.getMessage('item_not_found'));
					}

					// increase process counter
					process_counter++;
					count_left.text(count_left.text() - 1);
					
					setTimeout(function(){ 
						process_list( + data.item.id + 1 );
					}, inst.config.request_throttle);

				}, 'json').fail(function() {
					end_process(inst.getMessage('ajax_fail') + " (" + inst.config.ajax_url_item + ")");
				});

			};

			// button action based on status
			if(submit_button.data('process-list-status') == 'processing'){
				stop_process();
			} else {
				start_process();
			}
		},
		item_process: function(item){ 
			console.log('item_process item: ', item);
		},
		item_error: function(response){
			console.log('item_error response: ', response);
		}
	};

	$.BatchRemoteList.setDefaults = function(options){
		$.extend(true, $.BatchRemoteList.prototype.defaults, options);
	};

	$.BatchRemoteList.setDefaultMessages = function(messages){
		$.extend($.BatchRemoteList.prototype.defaults.messages, messages);
	};

	$.fn.BatchRemoteList = function(settings) {
		return this.each(function() {
			new $.BatchRemoteList(this, settings);
		});
	};
})( jQuery );
