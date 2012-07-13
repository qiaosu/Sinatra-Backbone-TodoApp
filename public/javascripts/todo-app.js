/** 
 * 常量命名空间 
 */
window.STATICS = {};
window.STATICS.keysMap = {
	ENTER: 13
} 

/** 
 * Task-Model 
 * TODO: 加数据校验
 */
window.TaskModel = Backbone.Model.extend({
	attributes: {
		'id': null,
		'name': "",
		'completed_at': null
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
		'keyup #J_inputTask': 'checkAutoSubmit'
	},
	/** 
	 * 模板文件: views/template.haml 
	 */
	taskTemplate: _.template($('#J_taskTemplate').html()),
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
		this.model.fetch({
			'success': function(res, status, xhr){
				_self.renderAllTask(res, status, xhr);
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
				_model.fetch();
				_self.renderTask(res, status, xhr);
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
		if (e.keyCode != window.STATICS.keysMap['ENTER']){ return false; }
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
		}
		$(this.el).find('#'+_id).html(_dom.children());
	},
	/** 
	 * 渲染任务集合, 根据list 
	 */
	renderAllTask: function(res, status, xhr){
		var _dom = "", _target = $(this.el).find('ul.tasks');
		_target.empty();
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
	},
	/** 
	 * 在collection中移除任务, 并移除对应dom 
	 */
	removeTask: function(res, status, xhr){
		var _id = res;
		var _target = $(this.el).find('li#'+_id);
		this.model.remove(this.model.get(_id));
		_target.remove();
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

/** 
 * App-View
 * 页面级View, 请保持唯一, 且作为入口. 
 */
window.AppView = Backbone.View.extend({
	el: $('#J_app'),
	events: {
		'click #J_listEdit': 'listEdit',
		'click .J_listRemove': 'listDestroy',
		'click .sidebar-nav .nav-list a': 'listSelect'
	},
	/** 
	 * 初始化
	 * 选择第一条list作为激活的list 
	 */
	initialize: function(){
		var _id = $(this.el).find('.sidebar-nav li:first').attr('data-id');
		if (window.STATICS) {window.STATICS.currentList = _id;}
	},
	/** 
	 * 进入/退出list编辑状态 
	 */
	listEdit: function(e){
		var _stat = $(e.target).attr('data-state');
		if (_stat === 'hide') {
			$('.sidebar-nav .nav-list i').removeClass('fn-hide');
			$(e.target).attr('data-state','show');
			$(e.target).text('back');
		}
		if (_stat === 'show') {
			$('.sidebar-nav .nav-list i').addClass('fn-hide');
			$(e.target).attr('data-state','hide');
			$(e.target).text('edit');
		}
	},
	/** 
	 * 销毁list 
	 */
	listDestroy: function(e){
		var _target = $(e.target),
			_id = _target.parents('.nav-item').attr('data-id'),
			_actionUrl = '/list/'+_id;
		$('#J_listDestroy').attr('action',_actionUrl);
		$('#J_listDestroy')[0].submit();
		e.preventDefault();
		e.stopPropagation();
	},
	/** 
	 * 选中一个list 
	 */
	listSelect: function(e){
		var _target = $(e.target),
			_id = _target.parents('.nav-item').attr('data-id');
		if (_id != window.STATICS.currentList) {
			window.STATICS.currentList = _id;
			/** 
			 * 清除tasksView的事件代理, 然后移除tasksView, 否则会有重复绑定问题. 
			 */
			window.tasksView.undelegateEvents();
			window.tasksView = new window.TasksView();
			_target.parents('.nav-item').addClass('active').siblings().removeClass('active');
		}
		e.preventDefault();
		e.stopPropagation();
	}
})

window.appView = new window.AppView();

window.tasksView = new window.TasksView();