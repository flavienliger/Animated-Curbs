(function(jQuery) {
	
	var animated = [];
	var delegateLoop = false;
	
	var CurveAnimator = function(from,to,c1,c2){
		
		if(arguments.length == 1){
			var data = arguments[0];
			
			from = data.start;
			to = data.end;
			c1 = data.tanStart;
			c2 = data.tanEnd;
		}
		
		this.path = document.createElementNS('http://www.w3.org/2000/svg','path');
		if (!c1) c1 = from;
		if (!c2) c2 = to;
		this.path.setAttribute('d','M'+from.join(',')+'C'+c1.join(',')+' '+c2.join(',')+' '+to.join(','));
		this.updatePath();
	};

	CurveAnimator.prototype.pointAt = function(percent){
		return this.path.getPointAtLength(this.len*percent);
	};

	CurveAnimator.prototype.updatePath = function(){
		this.len = this.path.getTotalLength();
	};

	CurveAnimator.prototype.setStart = function(x,y){
		var M = this.path.pathSegList.getItem(0);
		M.x = x; M.y = y;
		this.updatePath();
		return this;
	};

	CurveAnimator.prototype.setEnd = function(x,y){
		var C = this.path.pathSegList.getItem(1);
		C.x = x; C.y = y;
		this.updatePath();
		return this;
	};

	CurveAnimator.prototype.setStartDirection = function(x,y){
		var C = this.path.pathSegList.getItem(1);
		C.x1 = x; C.y1 = y;
		this.updatePath();
		return this;
	};

	CurveAnimator.prototype.setEndDirection = function(x,y){
		var C = this.path.pathSegList.getItem(1);
		C.x2 = x; C.y2 = y;
		this.updatePath();
		return this;
	};
	
	var hasEgal = function(obj){
		
		var obj = String(obj);
		
		if(obj.indexOf('+=') != -1){
			return 1;
		}
		else if(obj.indexOf('-=') != -1){
			return -1;	
		}
		return 0;
	};
	
	var getCurve = function(obj, curve){
		
		var pos = { x: parseInt(obj.css('left')), y: parseInt(obj.css('top')) };
		
		var coord = ['x', 'y'];
		
		for(var key in curve){
			
			for(var i = 0; i<2; i++){
				
				var egal = hasEgal(curve[key][i]);
				
				if(egal){
					curve[key][i] = curve[key][i].substr(2);
					
					if(key == 'start'){
						curve.start[i] = pos[coord[i]] + parseInt(curve.start[i]) * egal;
					}
					else if(key == 'end'){
						curve.end[i] = pos[coord[i]] + parseInt(curve.end[i]) * egal;
					}
					else if(key == 'tanStart'){ 
						curve.tanStart[i] = parseInt(curve.start[i]) + parseInt(curve.tanStart[i]) * egal;
					}
					else if(key == 'tanEnd'){
						curve.tanEnd[i] = parseInt(curve.end[i]) + parseInt(curve.tanEnd[i]) * egal;
					}
				}
			}
		}
		console.log(curve.start, curve.end)
		return curve;
	};
	
	var animateCurve = function(obj, opt){
		
		var curve = opt.curve;
		
		this.o = obj;
		this.anim = true;
		this.time = opt.time/1000;
		this.callback = opt.callback;
		this.useAngle = curve.angle;
		this.pauseTime = 0;
		this.startTime = Date.now();
		this.baseTransform = new Transform(obj);
		// to false /!\
		this.hasTransform = this.baseTransform.hasTransform();
		
		this.path = new CurveAnimator(getCurve(obj, curve));
	};
	
	animateCurve.prototype.pause = function(){
		
		this.pauseTime = Date.now();
		this.anim = false;	
	};

	animateCurve.prototype.play = function(){
		
		this.startTime += Date.now()-this.pauseTime;
		this.anim = true;	
	};

	animateCurve.prototype.stop = function(){
		this.anim = false;	
	};
	
	var loop = function(){
		
		animated.forEach(function(obj, i){
			
			if(!obj.anim) return false;
			
			var now = Date.now();
			var elapsed = (now-obj.startTime)/1000;
			var percent = elapsed/obj.time;
			
			if (percent>=1){
				percent = 1;
				obj.anim = false;
			}
			
			var curve = obj.path;
			var p1 = curve.pointAt(percent-0.01),
				p2 = curve.pointAt(percent+0.01);
			
			var point = curve.pointAt(percent);
			var angle = Math.atan2(p2.y-p1.y,p2.x-p1.x)*180/Math.PI;
			
			var css = {
				translateX: point.x,
				translateY: point.y,
				rotate: obj.useAngle? angle: 0
			};
			
			var trans = new Transform(css);
			
			// add to previous transform
			if(obj.hasTransform){
				trans.add(obj.baseTransform.get(true));
			}
			
			obj.o.css({
				WebkitTransform: trans.getCssFormat()
			});
			
			obj.o.offset();
			
			// end
			if(!obj.anim){
				animated.splice(i, 1);
				obj.o.removeData('animate-curb');
				
				// comment this /!\
				obj.o.css({
					WebkitTransform: obj.hasTransform? obj.baseTransform.getCssFormat(): '',
					top: parseInt(obj.o.css('top')) + css.translateY,
					left: parseInt(obj.o.css('left')) + css.translateX
				});
				obj.o.offset();
				obj.callback.apply(obj.o);
			}
		});
		
		if(!delegateLoop){
			requestAnimationFrame(loop);
		}
	};
	
	loop();
	
	/**
	 * Use Animate loop or not
	 * @params {Boolean} [aLoop=true] - delegate bool
	 */
	jQuery.animateCurveDelegate = function(aLoop){
		var l = aLoop!=undefined? aLoop: true;
		
		if(!l && delegateLoop){
			delegateLoop = false;
			loop();
		}
		delegateLoop = l;
	};
	
	/**
	 * Call loop if delegate
	 */
	jQuery.animateCurveLoop = function(){
		if(delegateLoop)
			loop();	
	};
	
	jQuery.fn.curvePause = function(){
		var obj;
		
		this.each(function(){
			obj = $(this).data('animate-curb');
			if(obj)
				obj.pause();
		});
	};
	
	jQuery.fn.curvePlay = function(){
		var obj;
		
		this.each(function(){
			obj = $(this).data('animate-curb');
			if(obj)
				obj.play();
		});
	};
	
	jQuery.fn.curveStop = function(){
		var obj;
		
		this.each(function(){
			obj = $(this).data('animate-curb');
			if(obj)
				obj.stop();
		});
	};
	
	jQuery.fn.animateCurve = function(curve, aTime, aCallback){
		
		var opt = {
			curve: {
				start: [0,0],
				end: [100,0],
				tanStart: [0,0],
				tanEnd: [100,0],
				angle: true
			},
			time: 1000,
			callback: function(){}
		};
		
		opt.curve = $.extend(opt.curve, curve);
		opt.time = aTime||opt.time;
		opt.callback = aCallback||opt.callback;
		
		var animate;
		
		this.each(function(){
			animate = new animateCurve($(this), opt);
			$(this).data('animate-curb', animate);
			animated.push(animate);
		});
		
	};
	
})(jQuery);