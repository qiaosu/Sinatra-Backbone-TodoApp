window.TimelineView = Backbone.View.extend({
	el: $('#timeline-container'),
	events: {},
	initialize: function(){
		this.drag = new _.Drag({
			'handler': $('.timenav', this.el)
		})
		console.log('timeline.');
	}
})

window.timelineView = new window.TimelineView();