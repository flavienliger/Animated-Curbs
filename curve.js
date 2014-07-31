(function(jQuery) {
	
	var animated = [];
	var delegateLoop = false;
	
	var CurveAnimator = function(from,to,c1,c2){
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
	
	var animateCurve = function(obj, opt){
		
		this.path = new CurveAnimator(opt.start, opt.end, opt.tanStart, opt.tanEnd);
		
		this.o = obj;
		this.anim = true;
		this.time = opt.time/1000;
		this.callback = opt.callback;
		this.useAngle = opt.angle;
		this.pauseTime = 0;
		this.startTime = Date.now();
		this.transform = new Transform(obj);
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
						
			var css = 'translateX('+point.x+'px) translateY('+point.y+'px)';
			
			if(obj.useAngle){
				css += ' rotate('+angle+'deg)';
			}
			
			obj.o.css({
				WebkitTransform: css
			});
			
			obj.o.offset();
			
			if(!obj.anim){
				animated.splice(i, 1);
				obj.o.removeData('animate-curb');
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
			start: [0,0],
			end: [100,0],
			tanStart: [0,0],
			tanEnd: [100,0],
			angle: true,
			time: 1000,
			callback: function(){}
		};
		
		opt = $.extend(opt, curve);
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