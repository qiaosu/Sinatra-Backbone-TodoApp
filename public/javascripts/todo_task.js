/** 
 * Task-Model 
 * TODO: 加数据校验
 */
window.TaskModel = Backbone.Model.extend({
	attributes: {
		'id': null,
		'name': "",
		'completed_at': null,
		'annotations': 0
	},
	initialize: function(){}
});

/** 
 * Task-Collection 
 */
window.TasksCollection = Backbone.Collection.extend({
	model: window.TaskModel,
	url: "/list",
	initialize: function(){}
});

/** 
 * Task-View
 * TODO: 在appView中生成实例 
 */
window.TasksView = Backbone.View.extend({
	el: $('#J_lists'),
	events: {
		'click .J_taskComplete': 'taskUpdate',
		'click .J_taskActive': 'taskUpdate',
		'click #J_addTask': 'mainBtnSubmit',
		'click .J_taskDelete': 'taskDestroy',
		'keypress #J_inputTask': 'checkAutoSubmit',
		'click .J_taskAnnotate': 'toggleAnnotations',
		'click .J_annoteSubmit': 'annoteCreate'
	},
	/** 
	 * 模板文件: views/template.haml 
	 */
	taskTemplate: $('#J_taskTemplate') ? _.template($('#J_taskTemplate').html()) : null,
	/** 
	 * 初始化方法
	 * 1. 生成对应的Collection实例
	 * 2. 从服务端获取初始化数据
	 * 3. 渲染数据
	 */
	initialize: function(){
		var _self = this;
		this.model = new window.TasksCollection();
		this.model.url = this.model.url + '/' + window.STATICS.currentList;
		this.showLoading();
		this.model.fetch({
			'success': function(res, status, xhr){
				_self.renderAllTask(res, status, xhr);
				window.events.trigger('TIMELINEINIT', window.STATICS.currentList, status);
			},
			'error': _self.error
		});
	},
	/** 
	 * Task Update
	 * type: PUT 
	 */
	taskUpdate: function(e){
		var _target = $(e.target),
			_id = _target.parents('.task').attr('id'),
			_model, value, _self=this;
		_model = this.model.get(_id);
		_model.url = '/task/'+_id;
		e.preventDefault();
		$.ajax({
			url: _model.url,
			type: 'POST',
			beforeSend: function(xhr) {
          		xhr.setRequestHeader('X-HTTP-Method-Override', 'PUT');
        	},
			success: function(res, status, xhr){
				_self.renderTask(res, status, xhr);
				_model.fetch();
			},
			error: _self.error
		});
	},
	/** 
	 * 按钮触发任务提交 
	 */
	mainBtnSubmit: function(e){
		var _target = $(e.target),
			_name = $('#J_inputTask').attr('value'),
			_actionUrl = '/'+ window.STATICS.currentList,
			_self = this;
		if (_name == "") {return false;}
		if (_actionUrl) {
			_self.taskCreate(_actionUrl, _name)
		}
		e.preventDefault();
	},
	/** 
	 * 键盘触发任务提交 
	 */
	checkAutoSubmit: function(e){
		if (e.keyCode != window.STATICS.keysMap['ENTER']){ return; }
		if ($('#J_inputTask').val() == ""){ return false; }
		var _name = $('#J_inputTask').attr('value'),
			_actionUrl = '/'+ window.STATICS.currentList,
			_self = this;
		if (_actionUrl) {
			_self.taskCreate(_actionUrl, _name)
		}
		e.preventDefault();
	},
	/** 
	 * Task-Create
	 * type: POST 
	 */
	taskCreate: function(url, name){
		var _self = this;
		$.ajax({
			url: url,
			type: 'POST',
			data: {
				'task': {
					'name': name
				}
			},
			success: function(res, status, xhr){
				_self.appendTask(res, status, xhr);
			},
			error: _self.error
		});
	},
	/** 
	 * 渲染单条任务 
	 */
	renderTask: function(res, status, xhr){
		res = eval('('+res+')');
		var _id = res.id;
		var _dom = $(this.getTemplate(res, this.taskTemplate));
		if (res.completed_at) {
			_dom.find('span.task-content').addClass('completed');
			window.events.trigger('MARKERCREATE', res);
		} else {
			window.events.trigger('MARKERREMOVE', res);
		}
		$(this.el).find('#'+_id).html(_dom.children());
	},
	/** 
	 * 渲染任务集合, 根据list 
	 */
	renderAllTask: function(res, status, xhr){
		var _dom = "", _target = $(this.el).find('ul.tasks');
		_target.empty();
		this.hideLoading();
		for (var i in status){
			_dom = $(this.getTemplate(status[i], this.taskTemplate));
			_dom.attr('id', status[i].id);
			if (status[i].completed_at) {
				_dom.find('span.task-content').addClass('completed');
			}
			_target.append(_dom);
		}		
	},
	/** 
	 * 在列表最后追加渲染一条task 
	 */
	appendTask: function(res, status, xhr){
		var _target = $(this.el).find('ul.tasks');
		res = eval('('+res+')');
		this.model.add(res);
		var _id = res.id;
		var _dom = $(this.getTemplate(res, this.taskTemplate));
		_dom.attr('id', _id);
		_target.append(_dom);
		$('#J_inputTask').attr('value',"");
	},
	/** 
	 * 销毁任务
	 * type: DELETE 
	 */
	taskDestroy: function(e){
		var _target = $(e.target),
			_id = _target.parents('.task').attr('id'),
			_actionUrl = '/task/'+ _id,
			_self = this;
		$.ajax({
			url: _actionUrl,
			type: 'POST',
			beforeSend: function(xhr) {
          		xhr.setRequestHeader('X-HTTP-Method-Override', 'DELETE');
        	},
			success: function(res, status, xhr){
				_self.removeTask(res, status, xhr);
			},
			error: _self.error
		});
		e.preventDefault();
	},
	/** 
	 * 在collection中移除任务, 并移除对应dom 
	 */
	removeTask: function(res, status, xhr){
		var _id = res;
		var _target = $(this.el).find('li#'+_id);
		window.events.trigger('MARKERREMOVE', res);
		this.model.remove(this.model.get(_id));
		_target.remove();
	},
	/** 
	 * 批注部分, 需增加对应的model. 
	 */
	/**
	 * 显示批注
	 */
	showAnnotations: function(id){
		$(this.el).find('.annotations').addClass('fn-hide');
		$(this.el).find('#'+id).find('.annotations').removeClass('fn-hide');
	},
	/**
	 * 隐藏批注
	 */
	hideAnnotations: function(id){
		$(this.el).find('#'+id).find('.annotations').addClass('fn-hide');
	},
	/**
	 * 切换批注显示隐藏
	 */
	toggleAnnotations: function(e){
		var _target = $(e.target),
			_item = _target.parents('.task'),
			_id = _item.attr('id');
		this.getAnnotations(_id);
		if (_item.find('.annotations').hasClass('fn-hide')) {
			this.showAnnotations(_id);
		} else {
			this.hideAnnotations(_id);
		}
	},
	/**
	 * 请求批注
	 */
	getAnnotations: function(id){
		var url = '/annotation/'+id, 
			root = $(this.el).find('#'+id).find('.annotations'),
			_self = this;
		root.children().remove();
		$(root).append('<div class="loading">批注加载中...</div>');
		$.ajax({
			url: url,
			type: 'GET',
			success: function(res, status, xhr){
				_self.renderAnnotations(id, eval('('+res+')'));
			},
			error: _self.error
		});
	},
	renderAnnotations: function(id, data){
		var root = $(this.el).find('#'+id).find('.annotations');
		$(root).find('.loading').remove();
		if (data.length>0){
			_.each(data, function(item){
				root.append('<div class="annotation md-show">'+item.content+'</div>');
			});
		}
		root.append($('#md-editor-container').html());
	},
	appendAnnotation: function(id, data){
		var _root = $(this.el).find('#'+id),
			_target = _root.find('.md-editor');
		if (data !== ""){
			_target.before('<div class="annotation md-show">'+data.content+'</div>');
		}
		var index = _root.find('.J_taskAnnotate span').text();
		index = parseInt(index) ? parseInt(index) : 0;
		index = index + 1;
		_root.find('.J_taskAnnotate span').text(index);
		_root.find('.md-editor textarea').attr('value', '');
	},
	annoteCreate: function(e){
		var _target = $(e.target),
			_item = _target.parents('.md-editor'),
			_id = _item.parents('.task').attr('id');
			_content = _item.children('textarea').attr('value'),
			_self = this;
		if (_content == "") return false;
		var url = '/new/annotation';
		$.ajax({
			url: url,
			type: 'POST',
			data: {
				'task': _id,
				'content': _content
			},
			success: function(res, status, xhr){
				_self.appendAnnotation(_id, eval('('+res+')'));
			},
			error: _self.error
		});
	},
	showLoading: function(){
		$('#J_loading').show();
	},
	hideLoading: function(){
		$('#J_loading').fadeOut();
	},
	/** 
	 * 获得task的dom模板 
	 */
	getTemplate: function(data, type){
		return type(data);
	},
	/** 
	 * 通用报错 
	 */
	error: function(res, status, xhr){
		console && console.log && console.log(res, status);
	}
});

window.tasksView = new window.TasksView();