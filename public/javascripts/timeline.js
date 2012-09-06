window.TimelineView = Backbone.View.extend({
	el: $('#timeline-container'),
	events: {},
	markerTemplate: _.template('<div class="marker"><div class="flag"><div class="flag-content"><div class="thumbnail thumb-youtube"></div><h3><%= name %></h3></div></div><div class="dot"></div><div class="line"><div class="event-line"></div></div></div>'),
	cacheMarkerArr: {},
	initialize: function(config){
		_.bindAll(this);
		this.config = config;
		this.config.nav.constraint.left = this.config.nav.constraint.width / 2;
		this.config.nav.constraint.right = this.config.nav.constraint.left - Math.ceil((this.config.nav.date.end_date - this.config.nav.date.start_date)/1000/3600/24) * this.config.nav.interval.step

		/**
		 * 构建dom
		 */
		this.build(config);

		this.timenav = $('.timenav', this.el);

		/**
		 * draggble初始化
		 */
		this.drag = new _.Drag();
		this.drag.createPanel('#timeline-container .navigation', this.timenav, this.config.nav.constraint, false);
	},
	appendAndGetElement: function(append_to_element, tag, cName, content) {
		var e,
			_tag		= "<div>",
			_class		= "",
			_content	= "",
			_id			= "";
		if (tag != null && tag != "") {
			_tag = tag;
		}
		if (cName != null && cName != "") {
			_class = cName;
		}
		if (content != null && content != "") {
			_content = content;
		}
		if( typeof($) != 'undefined' ){
			e = $(tag);
			e.addClass(_class);
			e.html(_content);
			$(append_to_element).append(e);
		}
		return e;
	},
	empty: function(){
		$(this.el).empty();
		this.cacheMarkerArr = {};
	},
	build: function(config){
		this.empty();

		$layout 					= this.appendAndGetElement($(this.el), "<div>", "navigation");
		$timenav					= this.appendAndGetElement($layout, "<div>", "timenav");
		$content					= this.appendAndGetElement($timenav, "<div>", "content");
		$time						= this.appendAndGetElement($timenav, "<div>", "time");
		$timeintervalminor			= this.appendAndGetElement($time, "<div>", "time-interval-minor");
		$timeintervalminor_minor	= this.appendAndGetElement($timeintervalminor, "<div>", "minor");
		$timeintervalmajor			= this.appendAndGetElement($time, "<div>", "time-interval-major");
		$timeinterval				= this.appendAndGetElement($time, "<div>", "time-interval");
		$timebackground				= this.appendAndGetElement($layout, "<div>", "timenav-background");
		$timenavline				= this.appendAndGetElement($timebackground, "<div>", "timenav-line");
		$timenavindicator			= this.appendAndGetElement($timebackground, "<div>", "timenav-indicator");
		$timeintervalbackground		= this.appendAndGetElement($timebackground, "<div>", "timenav-interval-background", "<div class='top-highlight'></div>");

		this.buildInterval();
		/**
		 * completed todo tasks.
		 */
		this.buildMarkers(config.data);

	},
	buildInterval: function(){
		var i = this.config.nav.date.start_date, len = this.config.nav.date.end_date, step = 1000*3600*24*4;

		/**
		 * 横轴
		 */
		$('.minor', this.el).css({
			'width': Math.abs(this.config.nav.constraint.left) + Math.abs(this.config.nav.constraint.right) + 1200,
			'left': -600
		})

		/**
		 * 引导线
		 */
		var left = $('.timenav-indicator', this.el)[0].offsetLeft;
		$('.timenav-indicator', this.el).css({
			'left': left-10
		});

		for (i; i<len; i=i+step){
			this.createIntervalElement(i, 'day');
		}
	},
	/**
	 * 构建Interval的Dom元素
	 */
	createIntervalElement: function(date, type){
		var pos = {
			left: Math.ceil((date.valueOf()-this.config.nav.date.start_date)/1000/3600/24) * this.config.nav.interval.step
		}, tag = "", target, dom;
		switch(type) {
			case "day": 
				tag = new Date(date).format('mmm. d');
				target = $('.time-interval', this.el)[0];
				dom = $('<div>'+tag+'</div>');
				$(target).append(dom);
				break;
			case "month":
				tag = new Date(date).format('mmm');
				break;
		}
		$(dom).css({
			'left': pos.left,
			'opacity': 100,
			'textIndent': -$(dom).width()/2
		})
	},
	buildMarkers: function(dataArr){
		for (var item in dataArr) {
			this.createSingleMarker(dataArr[item]);
		}
	},
	createSingleMarker: function(data){
		var dom = this.getTemplate(data, this.markerTemplate), dateInterval, pos={}, markerDate = new Date(data.completed_at).format('isoDate');
		dom = $(dom).appendTo($('.content', this.el));
		$(dom).attr('id', 'task_'+data.id);
		$('.thumbnail', dom).attr('id', 'thumbnail_'+data.id);

		this.cacheMarkerArr[markerDate] = this.cacheMarkerArr[markerDate] ? this.cacheMarkerArr[markerDate]+1 : 1;

		dateInterval = Math.round((new Date(data.completed_at).valueOf() - this.config.nav.date.start_date)/1000/3600/24);
		pos.left = dateInterval * this.config.nav.interval.step + (Math.floor((this.cacheMarkerArr[markerDate]-1)/3))*10;
		$(dom).css({
			'left': pos.left
		});
		$('.flag', dom).css({
			'top': (this.cacheMarkerArr[markerDate]-1)%3*50
		})
	},
	getTemplate: function(data, type){
		return type(data);
	}
});