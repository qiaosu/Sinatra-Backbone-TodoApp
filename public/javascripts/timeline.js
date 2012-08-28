window.TimelineView = Backbone.View.extend({
	el: $('#timeline-container'),
	events: {},
	initialize: function(){
		// MAKE TIMELINE DRAGGABLE/TOUCHABLE
		this.drag = new _.Drag();
		this.drag.createPanel('#timeline-container .navigation', $(this.el).find('.timenav'), {
			left: 0,
			right: -562.2222222222022,
			right_max: 0,
			right_min: -1282.2222222222022
		}, false);

		// MOUSE EVENTS
		$('#timeline-container .navigation').on('DOMMouseScroll', this.onMouseScroll);
		$('#timeline-container .navigation').on('mousewheel', this.onMouseScroll);

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
		scroll_to = VMM.Lib.position($timenav).left + delta;
		
		if (scroll_to > config.nav.constraint.left) {
			scroll_to = config.width/2;
		} else if (scroll_to < config.nav.constraint.right) {
			scroll_to = config.nav.constraint.right;
		}
		
		//VMM.Lib.stop($timenav);
		//VMM.Lib.animate($timenav, config.duration/2, "linear", {"left": scroll_to});
		VMM.Lib.css($timenav, "left", scroll_to);	
	}
})

window.timelineView = new window.TimelineView();