jQuery Animate Curve
======

Based of __[animate curves](http://phrogz.net/SVG/animation_on_a_curve.html)__.

Animate object along a curve, for define a curve, we need start point, tangent first point, tangent second point, and the end point.

- Simple used :
```js
$(obj).animateCurve([start, tan1, tan2, end], options, time, callback);
```

- Pause, Play, Stop worked :
```js
$(obj).curvePause();
$(obj).curvePlay();
$(obj).curveStop();
```

- Example :
```js
$(obj).animateCurve([
    // first curve
    [0,0],               // start
    ['-=100', '+=100'],  // tan 1
    ['-=100','+=150'],   // tan 2
    [0, '+=200'],        // end

    // second curve
    ['+=100', '+=100'],  // tan 1
    ['+=100','+=150'],   // tan 2
    [0, '+=200']         // end
], 
// option
{
    // update transform rotate
    useAngle: false, 
    // set top/left at the end of curve
    cssTrans: false
}, 
// time
3000, 
// callback
function(){
    next();
});
```

Deps
========

- jQuery
- __[Transform](https://github.com/flavienliger/Transform-Css)__ - personal lib for css transform
- rAF - requestAnimFrame polyfill for old navigator
