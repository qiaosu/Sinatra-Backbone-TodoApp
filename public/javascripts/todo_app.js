/** 
 * 常量命名空间 
 */
window.STATICS = {};
window.STATICS.keysMap = {
	ENTER: 13
} 

window.events = _.clone(Backbone.Events);

/** 
 * App-View
 * 页面级View, 请保持唯一, 且作为入口. 
 */
window.AppView = Backbone.View.extend({
	el: $('#J_app'),
	t: null,
	events: {
		'click #J_listRenameCancel': 'listRenameHide',
		'click #J_listRenamePrepare': 'listRenameShow',
		'click #J_listRenameBtn': 'listUpdate',
		'click #J_listDeleteCancel': 'listDeleteHide',
		'click #J_listDeletePrepare': 'listDeleteShow',
		'click #J_listDeleteBtn': 'listDestroy',
		'click .sidebar-nav .nav-list a': 'listSelect',
		'click #J_globalAlert .close': 'closeGlobalNotice'
	},
	suscribe: function(){
		window.events.on('TIMELINEINIT', this.timelineInit, this);
	},
	/** 
	 * 初始化
	 * 选择第一条list作为激活的list 
	 */
	initialize: function(){
		var _id = $(this.el).find('.sidebar-nav li:first').attr('data-id');
		if (window.STATICS) {window.STATICS.currentList = _id;}

		this.suscribe();

		var _notice = $('.global-notice').text().trim();
		if (_notice) {
			this.initGlobalNotice(_notice);
		}
	},
	/**
	 * 隐藏重命名面板
	 */
	listRenameHide: function(e){
		$('#J_listRename', '.list-admin').addClass('fn-hide');
		e.preventDefault();
		e.stopPropagation();
	},
	/**
	 * 展示重命名面板
	 */
	listRenameShow: function(e){
		$('.alert', '.list-admin').addClass('fn-hide');
		$('#J_listRename', '.list-admin').removeClass('fn-hide');
		e.preventDefault();
		e.stopPropagation();
	},
	/**
	 * 隐藏删除面板
	 */
	listDeleteHide: function(e){
		$('#J_listDestroy', '.list-admin').addClass('fn-hide');
		e.preventDefault();
		e.stopPropagation();
	},
	/**
	 * 展示删除面板
	 */
	listDeleteShow: function(e){
		$('.alert', '.list-admin').addClass('fn-hide');
		$('#J_listDestroy', '.list-admin').removeClass('fn-hide');
		e.preventDefault();
		e.stopPropagation();
	},
	/**
	 * 更新list名称
	 */
	listUpdate: function(e){
		var _target = $(e.target),
			_id = window.STATICS.currentList,
			_actionUrl = '/list/'+_id;
		$('#J_listRenameForm').attr('action',_actionUrl);
		$('#J_listRenameForm')[0].submit();
		e.preventDefault();
		e.stopPropagation();
	},
	/** 
	 * 销毁list 
	 */
	listDestroy: function(e){
		var _target = $(e.target),
			_id = window.STATICS.currentList,
			_actionUrl = '/list/'+_id;
		$('#J_listDestroyForm').attr('action',_actionUrl);
		$('#J_listDestroyForm')[0].submit();
		e.preventDefault();
		e.stopPropagation();
	},
	/** 
	 * 选中一个list 
	 */
	listSelect: function(e){
		var _target = $(e.target),
			_text = $(_target).text().trim(),
			_id = _target.parents('.nav-item').attr('data-id');
		if (_id != window.STATICS.currentList) {
			window.STATICS.currentList = _id;
			/** 
			 * 清除tasksView的事件代理, 然后移除tasksView, 否则会有重复绑定问题. 
			 */
			window.tasksView.undelegateEvents();
			window.timelineView.offAllSubscribes();
			window.tasksView = new window.TasksView();

			_target.parents('.nav-item').addClass('active').siblings().removeClass('active');

			$('#J_currentAdminList').text(_text);
			$('input[name*="list"]' ,'#J_listRenameForm').attr('value', _text);

			$('.alert', '.list-admin').each(function(i,item){
				if (!$(item).hasClass('fn-hide')) {
					$(item).addClass('fn-hide');
				}
			})
		}
		e.preventDefault();
		e.stopPropagation();
	},
	initGlobalNotice: function(notice){
		$('#J_globalAlert').append($('<span>'+notice+'</span>'));
		$('#J_globalAlert').removeClass('fn-hide');
		this.t = setTimeout(function(){
			$('#J_globalAlert').fadeOut('slow');
		},5000);
	},
	closeGlobalNotice: function(e){
		$('#J_globalAlert').addClass('fn-hide');
		clearTimeout(this.t);
	},
	timelineInit: function(listId, status){
		var data = status, start, end;
		data = this.prepareTimelineData(data);

		start = $('.nav-list li[data-id="'+listId+'"]', this.el).attr('data-create');
		
		if (!$('#timeline-container').length){return false;}
		/**
		 * init timeline
		 */
		window.timelineView = new window.TimelineView({
			nav: {
				constraint: {
					width: 1170
				},
				date: {
					start_date: (new Date(start).valueOf() - 1000 * 3600 * 24 * 20),
					end_date: (new Date().valueOf() + 1000 * 3600 * 24 * 20)
				},
				interval: {
					unit: 'day',
					step: 30
				}
			},
			data: data
		});
	},
	prepareTimelineData: function(data){
		var result = [];
		for (var item in data) {
			if (data[item]['completed_at']){
				result.push(data[item]);
			}
		}
		/**
		 * sort
		 */
		result = _.sortBy(result, function(item){ return new Date(item['completed_at'])})
		return result;
	}
})

window.appView = new window.AppView();

