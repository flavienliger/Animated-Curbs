(function(jQuery) {
	
	'use strict';
	
	var animated = {},
		baseID = 1,
		cssPrefixes = ['-webkit-', '-moz-', '-o-', ''],
		delegateLoop = false;
	
	/**
	 * Make svg curbs
	 * @params {Array} curve - array of point [start][tang1][tang2][end][tang1][tang2][end]...
	 */
	var CurveAnimator = function(curve){
				
		this.path = document.createElementNS('http://www.w3.org/2000/svg','path');
		
		var path = 'M'+curve[0].join(',')+' ';
		
		// generate curbs
		for(var i=0; i<curve.length-1; i++){
			if(i==0 || i%3 == 0){
				path += ' C';	
			}
			
			path += curve[i+1].join(',')+' ';
		}
		
		this.path.setAttribute('d',path);
		this.len = this.path.getTotalLength();
	};
	
	/**
	 * Return position in percent
	 * @params {Number} percent
	 * @return {Number}
	 */	
	CurveAnimator.prototype.pointAt = function(percent){
		return this.path.getPointAtLength(this.len*percent);
	};
	
	
	/**
	 * Return if string contain += or -=
	 * @params {String} obj - element to check
	 * @return {Number} - 0 none, 1 +=, 2 -=
	 */	
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

	
	/**
	 * Make animate
	 * @params {jQuery} obj
	 * @params {Number} id - position in animated
	 * @params {Object} opt - option
	 */	
	var animateCurve = function(obj, id, opt){
		
		$.extend(this, opt);
		
		this.id = id;
		this.css = { left: 0, top: 0, angle: 0 };
		this.o = obj;
		this.anim = true;
		this.pauseTime = 0;
		this.startTime = Date.now();
		this.baseTransform = new Transform(obj);
		this.hasTransform = this.baseTransform.hasTransform();
		
		this.path = new CurveAnimator(this.getCurve(opt.curve));
	};

	/**
	 * Parse curve point and update path
	 * @params {Array} curve
	 * @return {Array}
	 */	
	animateCurve.prototype.getCurve = function(curve){
		
		var pos = [
			parseInt(this.o.css('left')), 
			parseInt(this.o.css('top'))
		];
		
		if(this.hasTransform){
			pos[0] += this.baseTransform.get('translateX');
			pos[1] += this.baseTransform.get('translateY');
		}
		
		var point = 0;
		
		for(var p=0; p<curve.length; p++){
			
			for(var i = 0; i<2; i++){
				
				var egal = hasEgal(curve[p][i]);
				
				if(egal){
					curve[p][i] = parseInt(curve[p][i].substr(2));
					
					if(point == 0){
						curve[p][i] = pos[i] + curve[p][i] * egal;
					}
					else if(point == 3){
						curve[p][i] = curve[p-3][i] + curve[p][i] * egal;
					}
					else if(point == 1){ 
						curve[p][i] = curve[p-1][i] + curve[p][i] * egal;
					}
					else if(point == 2){
						curve[p][i] = curve[p-2][i] + curve[p][i] * egal;
					}
				}
			}
			
			point++;
			if(point>=4)
				point = 1;
		}
		
		return curve;
	};
	
	/**
	 * Pause
	 */	
	animateCurve.prototype.pause = function(){
		
		this.pauseTime = Date.now();
		this.anim = false;	
	};

	/**
	 * Play
	 */	
	animateCurve.prototype.play = function(){
		
		this.startTime += Date.now()-this.pauseTime;
		this.anim = true;	
	};

	/**
	 * Stop
	 */	
	animateCurve.prototype.stop = function(){
		this.anim = false;	
		delete animated[this.id];
		this.o.removeData('curve-ID');
		
		if(this.cssTrans)
			this.setTransform();
		
		this.callback.apply(this.o);
	};
	
	/**
	 * Remove transform and Set top/left
	 */	
	animateCurve.prototype.setTransform = function(){
		var trans;
		// has transform
		if(this.hasTransform){
			// and angle
			if(this.css.angle){
				this.baseTransform.set('rotateZ', this.css.angle);	
			}
			trans = this.baseTransform.getCssFormat();
		}
		// has angle
		else if(this.css.angle){
			trans = 'rotate('+this.css.angle+'deg)';	
		}

		for(var i=0, css={}; i<cssPrefixes.length; i++)
			css[cssPrefixes[i]+'transform'] = trans;
		
		css['top'] = parseInt(this.o.css('top')) + this.css.top;
		css['left'] = parseInt(this.o.css('left')) + this.css.left;
		
		this.o.css(css);
		
		this.o.offset();
	};
	
	/**
	 * Main loop refresh
	 */	
	var loop = function(){
		
		for(var key in animated){
			var obj = animated[key];
			
			if(!obj.anim) continue;
			
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
			
			var property = 'translateX('+point.x+'px) translateY('+point.y+'px)';
			
			if(obj.useAngle){
				var angle = Math.atan2(p2.y-p1.y,p2.x-p1.x)*180/Math.PI;
				obj.css.angle = angle;
				property += ' rotate('+angle+'deg)';
			}
			else if(obj.hasTransform){
				property += ' rotate('+obj.baseTransform.get('rotateZ')+'deg)';
			}
			
			obj.css.left = point.x;
			obj.css.top = point.y;
						
			for(var i=0, css={}; i<cssPrefixes.length; i++)
				css[cssPrefixes[i]+'transform'] = property;
			
			obj.o.css(css);
			
			obj.o.offset();
			
			// end
			if(!obj.anim){
				obj.stop();
			}
		}
		
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
	
	/**
	 * Pause
	 */	
	jQuery.fn.curvePause = function(){
		var id;
		
		this.each(function(){
			id = $(this).data('curve-ID');
			if(animated[id])
				animated[id].pause();
		});
		
		return this;
	};
	
	/**
	 * Play
	 */	
	jQuery.fn.curvePlay = function(){
		var id;
		
		this.each(function(){
			id = $(this).data('curve-ID');
			if(animated[id])
				animated[id].play();
		});
		
		return this;
	};
	
	/**
	 * Stop
	 */	
	jQuery.fn.curveStop = function(){
		var id;
		
		this.each(function(){
			id = $(this).data('curve-ID');
			if(animated[id])
				animated[id].stop();
		});
		
		return this;
	};
	
	/**
	 * Main function
	 * @params {Array} aCurve
	 * @params {Object} [aOption]
	 * @params {Number} aTime
	 * @params {Function} aCallback
	 */	
	jQuery.fn.animateCurve = function(aCurve, aOption, aTime, aCallback){
		
		var opt = {
			curve: [],
			useAngle: true,
			time: 1000,
			cssTrans: true,
			callback: function(){}
		};
		
		opt.curve = aCurve||opt.curve;
		if(typeof aOption === 'number'){
			opt.time = aOption||opt.time;
			opt.callback = aTime||opt.callback;
		}
		else{
			opt.cssTrans = aOption.cssTrans!==undefined? aOption.cssTrans:opt.cssTrans;
			opt.useAngle = aOption.useAngle!==undefined? aOption.useAngle:opt.useAngle;
			opt.time = aTime||opt.time;
			opt.callback = aCallback||opt.callback;
		}
		
		opt.time /= 1000;
		
		var animate;
		
		this.each(function(a, b){
			
			if(!$(this).data('curve-ID')){
			
				animate = new animateCurve($(this), baseID, opt);
				$(this).data('curve-ID', baseID);
				animated[baseID] = animate;
				baseID ++;
			}
		});
		
		return this;
	};
	
})(jQuery);