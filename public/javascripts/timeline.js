window.TimelineView = Backbone.View.extend({
	el: $('#timeline-container'),
	events: {},
	initialize: function(config){
		_.bindAll(this);
		this.config = config;
		this.timenav = $(this.el).find('.timenav');

		// MAKE TIMELINE DRAGGABLE/TOUCHABLE
		this.drag = new _.Drag();
		this.drag.createPanel('#timeline-container .navigation', this.timenav, this.config.nav.constraint, false);

		// MOUSE EVENTS
		$('.navigation', this.el).on('DOMMouseScroll', this.onMouseScroll);
		$('.navigation', this.el).on('mousewheel', this.onMouseScroll);

		console.log('timeline.');
	},
	onMouseScroll: function(e) {
		var delta		= 0,
			scroll_to	= 0;
		if (!e) {
			e = window.event;
		}
		if (e.originalEvent) {
			e = e.originalEvent;
		}
		if (e.wheelDelta) {
			delta = e.wheelDelta/6;
		} else if (e.detail) {
			delta = -e.detail*12;
		}
		if (delta) {
			if (e.preventDefault) {
				 e.preventDefault();
			}
			e.returnValue = false;
		}
		// Webkit
		if (typeof e.wheelDeltaX != 'undefined' ) {
			delta = e.wheelDeltaY/6;
			if (Math.abs(e.wheelDeltaX) > Math.abs(e.wheelDeltaY)) {
				delta = e.wheelDeltaX/6;
			} else {
				delta = e.wheelDeltaY/6;
			}
		}
		
		// Stop from scrolling too far
		
		scroll_to = $(this.timenav).position().left + delta;
		
		if (scroll_to > this.config.nav.constraint.left) {
			scroll_to = this.config.width/2;
		} else if (scroll_to < this.config.nav.constraint.right) {
			scroll_to = this.config.nav.constraint.right;
		}
		
		//$(this.timenav).stop();
		//$(this.timenav).animate({"left": scroll_to}, config.duration/2, "linear");
		$(this.timenav).css("left", scroll_to);	
	}
})

window.timelineView = new window.TimelineView({
	nav: {
		constraint: {
			left: 0,
			right: -562.2222222222022,
			right_max: 0,
			right_min: -1282.2222222222022
		}
	},
	width: 1170
});