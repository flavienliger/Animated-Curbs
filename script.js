var curve = new CurveAnimator(
  [50,300], [350,300],// position gauche/droite
  [50,100], [350,100] // croche gauche/droite
);

var o = document.getElementById('img');

curve.animate(2, function(point,angle){
  o.style.webkitTransform = 'translateX('+point.x+'px) translateY('+point.y+'px) rotate('+angle+'deg)';
});