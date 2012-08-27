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
		console.log('timeline.');
	}
})

window.timelineView = new window.TimelineView();