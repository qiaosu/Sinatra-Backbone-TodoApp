/*!
	Thank for:
	TimelineJS
	Version 2.17
	Designed and built by Zach Wise at VéritéCo

	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
	
*/

window.TimelineView = Backbone.View.extend({
	el: $('#timeline-container'),
	events: {
		'mouseover .marker': 'markerShowHighlight',
		'mouseout .marker': 'markerHideHighlight'
	},
	markerTemplate: _.template('<div class="marker"><div class="flag"><div class="flag-content"><div class="thumbnail thumb-plaintext"></div><h3><%= name %></h3></div></div><div class="dot"></div><div class="line"><div class="event-line"></div></div></div>'),
	cacheMarkerArr: {},
	initialize: function(config){
		_.bindAll(this);
		this.config = config;
		this.config.nav.constraint.left = this.config.nav.constraint.width / 2;
		this.config.nav.constraint.right = this.config.nav.constraint.left - Math.ceil((this.config.nav.date.end_date - this.config.nav.date.start_date)/1000/3600/24) * this.config.nav.interval.step

		this.subscribe();

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
	subscribe: function(){
		window.events.on('MARKERCREATE', this.createSingleMarker, this);
		window.events.on('MARKERREMOVE', this.removeMarker, this);
	},
	offAllSubscribes: function(){
		window.events.off('MARKERCREATE');
		window.events.off('MARKERREMOVE');
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
		var dom = this.getTemplate(data, this.markerTemplate), dateInterval, pos={}, markerDate = new Date(data.completed_at).format('isoDate'), t=0;
		dom = $(dom).appendTo($('.content', this.el));
		$(dom).attr('id', 'task_'+data.id);
		$('.thumbnail', dom).attr('id', 'thumbnail_'+data.id);

		//this.cacheMarkerArr[markerDate] = this.cacheMarkerArr[markerDate] ? this.cacheMarkerArr[markerDate]+1 : 1;
		if (!this.cacheMarkerArr[markerDate]){
			this.cacheMarkerArr[markerDate] = [];
		}
		t = this.cacheCalculate(this.cacheMarkerArr[markerDate]);
		if (t=='overflow') {return false;}
		this.cacheMarkerArr[markerDate].push(t);
		this.cacheMarkerArr[markerDate].sort();
		
		$(dom).attr('data-marker', t);

		dateInterval = Math.round((new Date(data.completed_at).valueOf() - this.config.nav.date.start_date)/1000/3600/24);
		pos.left = dateInterval * this.config.nav.interval.step + (Math.floor(t/3))*10;
		$(dom).css({
			'left': pos.left
		});
		$('.flag', dom).css({
			'top': (t)%3*50
		})
	},
	cacheCalculate: function(cache_arr){
		cache_arr = cache_arr.sort();
		var len = cache_arr.length, base = 0, tmp_arr = [], target = "", i = 0, m = 0;
		if (0 <= len && len < 3) {
			base = 0;
			tmp_arr = [0, 1, 2];
		} else if (3 <= len && len < 6) {
			base = 3;
			tmp_arr = [3, 4, 5];
		} else if (6 <= len && len < 9) {
			base = 6;
			tmp_arr = [6, 7, 8];
		} else {
			return 'overflow';
		}
		for (i = base; i < len; i++) {
			for (m=0; m<tmp_arr.length; m++) {
				if (cache_arr[i] == tmp_arr[m]){
					tmp_arr.splice(m, 1);
				}
			}
		}
		target = tmp_arr[Math.floor(Math.random()*tmp_arr.length)];
		return target;
	},
	removeMarker: function(data){
		var id = '#task_'+ (data.id || data),
			dom = $(id, this.timenav),
			cache,
			date, _self = this;
		
		if (!dom.length) { return false; }
		cache = $(dom).attr('data-marker');
		/**
		 * 删除cacheMarkerArr
		 */
		date = this.config.nav.date.start_date + Math.floor(parseInt(dom[0].style.left)/30)*24*3600*1000;
		date = new Date(date).format('isoDate');
		$.each(this.cacheMarkerArr[date], function(i, item){
			if (cache == item) {
				_self.cacheMarkerArr[date].splice(i,1);
			}
		})

		/**
		 * 删除marker
		 */
		$(dom).remove();
	},
	markerShowHighlight: function(e){
		var target = $(e.target).parents('.flag');
		target.addClass('zFront');
	},
	markerHideHighlight: function(e){
		var target = $(e.target).parents('.flag');
		target.removeClass('zFront');
	},
	getTemplate: function(data, type){
		return type(data);
	}
});