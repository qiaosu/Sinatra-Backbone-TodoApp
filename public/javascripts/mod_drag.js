!function(name, definition) {
    _[name] = definition();
}('Drag', function() {
    function Drag() {
        var drag = {
            element:        "",     //handler
            element_move:   "",     //实际移动元素
            constraint:     "",     //约束{left, right, right_min, right_max}
            sliding:        false,
            pagex: {
                start:      0,
                end:        0
            },
            left: {
                start:      0,
                end:        0
            },
            time: {
                start:      0,
                end:        0
            },
            touch:          false,
            ease:           "easeOutExpo"
        },
        dragevent = {
            down:       "mousedown",
            up:         "mouseup",
            leave:      "mouseleave",
            move:       "mousemove"
        },
        mousedrag = {
            down:       "mousedown",
            up:         "mouseup",
            leave:      "mouseleave",
            move:       "mousemove"
        },
        touchdrag = {
            down:       "touchstart",
            up:         "touchend",
            leave:      "mouseleave",
            move:       "touchmove"
        };
        
        this.createPanel = function(drag_object, move_object, constraint, touch) {
            drag.element        = drag_object;
            drag.element_move   = move_object;
            
            if ( constraint != null && constraint != "") {
                drag.constraint = constraint;
            } else {
                drag.constraint = false;
            }
            if ( touch) {
                drag.touch = touch;
            } else {
                drag.touch = false;
            }
            console.log("TOUCH" + drag.touch);
            if (drag.touch) {
                dragevent = touchdrag;
            } else {
                dragevent = mousedrag;
            }
            
            makeDraggable(drag.element, drag.element_move);
        }
        
        this.updateConstraint = function(constraint) {
            console.log("updateConstraint");
            drag.constraint = constraint;
        }
        
        var makeDraggable = function(drag_object, move_object) {
            
            /**
             * 绑定drag事件
             */
            $(drag_object).on(dragevent.down, {element: move_object, delement: drag_object}, onDragStart);
            $(drag_object).on(dragevent.up, {element: move_object, delement: drag_object}, onDragEnd);
            $(drag_object).on(dragevent.leave, {element: move_object, delement: drag_object}, onDragLeave);

            // MOUSE EVENTS
            $(drag_object).on('DOMMouseScroll', onMouseScroll);
            $(drag_object).on('mousewheel', onMouseScroll);
            
        }
        this.cancelSlide = function(e) {
            $(drag.element).off(dragevent.move, onDragMove);
            return true;
        }
        var onDragLeave = function(e) {
            $(e.data.delement).off(dragevent.move, onDragMove);
            if (!drag.touch) {
                e.preventDefault();
            }
            e.stopPropagation();
            if (drag.sliding) {
                drag.sliding = false;
                dragEnd(e.data.element, e.data.delement, e);
                return false;
            } else {
                return true;
            }
        }
        
        var onDragStart = function(e) {
            dragStart(e.data.element, e.data.delement, e);
            if (!drag.touch) {
                e.preventDefault();
            }
            e.stopPropagation();
            return true;
        }
        
        var onDragEnd = function(e) {
            if (!drag.touch) {
                e.preventDefault();
            }
            e.stopPropagation();
            if (drag.sliding) {
                drag.sliding = false;
                dragEnd(e.data.element, e.data.delement, e);
                return false;
            } else {
                return true;
            }
        }
        var onDragMove = function(e) {
            dragMove(e.data.element, e);
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        var dragStart = function(elem, delem, e) {
            if (drag.touch) {
                console.log("IS TOUCH")
                $(elem).css('-webkit-transition-duration', '0');
                drag.pagex.start = e.originalEvent.touches[0].screenX;
            } else {
                drag.pagex.start = e.pageX;
            }
            drag.left.start = getLeft(elem);
            drag.time.start = new Date().getTime();
            
            $(elem).stop();
            $(delem).on(dragevent.move, {element: elem}, onDragMove);

        }
        var dragEnd = function(elem, delem, e) {
            $(delem).off(dragevent.move, onDragMove);
            dragMomentum(elem, e);
        }
        var dragMove = function(elem, e) {
            drag.sliding = true;
            if (drag.touch) {
                drag.pagex.end = e.originalEvent.touches[0].screenX;
            } else {
                drag.pagex.end = e.pageX;
            }
            drag.left.end = getLeft(elem);
            $(elem).css('left', -(drag.pagex.start - drag.pagex.end - drag.left.start));
        }
        var dragMomentum = function(elem, e) {
            var drag_info = {
                    left:           drag.left.end,
                    left_adjust:    0,
                    change: {
                        x:          0
                    },
                    time:           (new Date().getTime() - drag.time.start) * 10,
                    time_adjust:    (new Date().getTime() - drag.time.start) * 10
                },
                multiplier = 3000;
                
            if (drag.touch) {
                multiplier = 6000;
            }
            
            drag_info.change.x = multiplier * (Math.abs(drag.pagex.end) - Math.abs(drag.pagex.start));
            
            
            drag_info.left_adjust = Math.round(drag_info.change.x / drag_info.time);
            
            drag_info.left = Math.min(drag_info.left + drag_info.left_adjust);
            
            if (drag.constraint) {
                if (drag_info.left > drag.constraint.left) {
                    drag_info.left = drag.constraint.left;
                    if (drag_info.time > 5000) {
                        drag_info.time = 5000;
                    }
                } else if (drag_info.left < drag.constraint.right) {
                    drag_info.left = drag.constraint.right;
                    if (drag_info.time > 5000) {
                        drag_info.time = 5000;
                    }
                }
            }
            
            $(elem).triggerHandler("DRAGUPDATE", [drag_info]);

            
            if (drag_info.time > 0) {
                if (drag.touch) {
                    //$(elem).css('-webkit-transition-property', 'left');
                    //$(elem).css('-webkit-transition-duration', drag_info.time);
                    //$(elem).css('left', drag_info.left);
                    
                    //$(elem).animate({"left": drag_info.left}, drag_info.time, "easeOutQuad");
                    $(elem).animate({"left": drag_info.left}, {duration: drag_info.time, easing: "easeOutExpo" });
                    //$(elem).css('webkitTransition', '');
                    //$(elem).css('webkitTransition', '-webkit-transform ' + drag_info.time + 'ms cubic-bezier(0.33, 0.66, 0.66, 1)');
                    //$(elem).css('webkitTransform', 'translate3d(' + drag_info.left + 'px, 0, 0)');

                } else {
                    $(elem).animate({"left": drag_info.left}, {duration: drag_info.time, easing: drag.ease });
                }
            }
            
        }
        var getLeft = function(elem) {
            return parseInt($(elem).css('left').substring(0, $(elem).css('left').length - 2), 10);
        }
        var onMouseScroll = function(e) {
            var delta       = 0,
                scroll_to   = 0,
                timenav = $(drag.element).find('.timenav');
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
            scroll_to = $(timenav).position().left + delta;
            
            if (scroll_to > drag.constraint.left) {
                scroll_to = drag.constraint.width/2;
            } else if (scroll_to < drag.constraint.right) {
                scroll_to = drag.constraint.right;
            }
            
            //$(this.timenav).stop();
            //$(this.timenav).animate({"left": scroll_to}, config.duration/2, "linear");
            $(timenav).css("left", scroll_to); 
        }
    }

    return Drag;
});