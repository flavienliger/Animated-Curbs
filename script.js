var svg   = document.querySelector('svg'),
	path  = document.querySelector('path');
var svgNS = svg.namespaceURI;
var pt    = svg.createSVGPoint();
var p1s   = path.pathSegList, m1 = p1s.getItem(0), c1 = p1s.getItem(1);

var curve = new CurveAnimator(
  [50,300], [350,300],// position gauche/droite
  [50,100], [350,100] // croche gauche/droite
);

var o = document.getElementById('img');

curve.animate(2, function(point,angle){
  o.style.webkitTransform = 'translateX('+point.x+'px) translateY('+point.y+'px) rotate('+angle+'deg)';
});

var lastCurve = CurveAnimator.lastCreated;
var p2s = lastCurve.path.pathSegList, 
	m2 = p2s.getItem(0), 
	c2 = p2s.getItem(1);

m1.x  = m2.x;  m1.y  = m2.y;
c1.x  = c2.x;  c1.y  = c2.y;
c1.x1 = c2.x1; c1.y1 = c2.y1;
c1.x2 = c2.x2; c1.y2 = c2.y2;