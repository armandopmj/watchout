

var gameOptions = {
  height : 450,
  width : 1200,
  nEnemies : 30,
  padding : 35
};

var gameStats = {
  score : 0,
  bestScore : 0
}

var axes = {
  x : d3.scale.linear().domain([0,100]).range([0,gameOptions.width]),
  y : d3.scale.linear().domain([0,100]).range([0,gameOptions.height])
}
var gameBoard = d3.select(".container").select('svg')
                  .attr('width', gameOptions.width)
                  .attr('height', gameOptions.height)

var updateScore = function() {
  d3.select('#current-score')
    .text(gameStats.score.toString());
}

var updateBestScore = function () {
  gameStats.bestScore = _.max([gameStats.bestScore, gameStats.score]);
  d3.select('#best-score').text(gameStats.bestScore.toString());
}

var Player = function( gameOptions ) {
  this.path = 'm-7.5,1.62413c0,-5.04095 4.08318,-9.12413 9.12414,-9.12413c5.04096,0 9.70345,5.53145 11.87586,9.12413c-2.02759,2.72372 -6.8349,9.12415 -11.87586,9.12415c-5.04096,0 -9.12414,-4.08318 -9.12414,-9.12415z';
  this.fill = '#ff6600';
  this.x = 0;
  this.y = 0;
  this.angle = 0;
  this.r = 5;

  this.gameOptions = gameOptions;

}

Player.prototype.render = function(to){
  this.el = to.append("image")
    .attr("xlink:href","4.gif")
    .attr("width", 50)
    .attr("height", 50)
    .attr("overflow", "visible");


  this.el.append('svg:path')
         .attr('d', this.path)
         .attr('fill', this.fill);

  this.transform( {
    x: this.gameOptions.width * 0.5,
    y: this.gameOptions.height * 0.5
  } );
  this.setupDragging();
  return this; //Correct???
} ;

Player.prototype.getX = function(){ return this.x; };

Player.prototype.setX = function(x){
  var minX = this.gameOptions.padding;
  var maxX = this.gameOptions.width - this.gameOptions.padding;
  this.x = x <= minX ? minX : x >= maxX ? maxX : x;
};

Player.prototype.getY = function(){ return this.y; };

Player.prototype.setY = function(y){
  var minY = this.gameOptions.padding;
  var maxY = this.gameOptions.height - this.gameOptions.padding;
  this.y = y <= minY ? minY : y >= maxY ? maxY : y;
};

Player.prototype.transform = function(opts){
    this.angle = opts.angle || this.angle;
    this.setX( opts.x || this.x );
    this.setY( opts.y || this.y );

    //Correct???
    var arg = "rotate(" + this.angle + "," + this.getX() + "," + this.getY() + ") " +
      "translate(" + this.getX() + "," + this.getY() + ")";
    this.el.attr('transform', arg );
}

Player.prototype.moveAbsolute = function(x,y){
  var x = x;
  var y = y;
  this.transform({x:x, y:y});
}

Player.prototype.moveRelative = function(dx,dy){
  var dx = dx;
  var dy = dy;
  //Correct???
  this.transform({
    x: this.getX()+dx,
    y: this.getY()+dy,
    angle: 0
  });
}

Player.prototype.setupDragging = function() {
  //creating a closure scope to for drag move to retain this binding to player object
  var _this = this;
  var dragMove = function() {
    _this.moveRelative( d3.event.dx, d3.event.dy );
  }

  var drag = d3.behavior.drag()
          .on('drag', dragMove)
  this.el.call( drag );
}

var players = [];
players.push( new Player(gameOptions).render(gameBoard) );

var createEnemies = function(){
  var enemies = [];
  for(var i = 0; i < gameOptions.nEnemies; i++){
    enemies.push({id:i , x : Math.random() * 100, y : Math.random() * 100 });
  }

  return enemies;
};

var render = function(enemy_data){
  var enemies = gameBoard.selectAll('circle.enemy')
                         .data(enemy_data, function(d){ return d.id;
                          });
//This is where we change the enemy look
  enemies.enter()
        .append("circle")
        .attr("xlink:href", "pokeball.gif")
        .attr("position", "relitive")
        .attr("width", 50 + "px")
        .attr("height", 50 + "px")
        .attr('class', 'enemy')
        .attr('cx', function(enemy){return axes.x(enemy.x);})
        .attr('cy', function(enemy){return axes.y(enemy.y);})
        .attr("fill", "red");

  enemies.exit()
         .remove();


  var checkCollision = function(enemy, collidedCallback){
    return _.each(players, function(player){
      var radiusSum =  parseFloat(enemy.attr('r')) + player.r;
      var xDiff = parseFloat(enemy.attr('cx')) - player.x;
      var yDiff = parseFloat(enemy.attr('cy')) - player.y;
      var separation = Math.sqrt( Math.pow(xDiff,2) + Math.pow(yDiff,2) );
      if(separation < radiusSum){
        return collidedCallback( player, enemy );
      }
    });
  };

  var onCollision = function() {
    updateBestScore();
    gameStats.score = 0;
    updateScore();
  };

  var tweenWithCollisionDetection = function(endData){
    //debugger;
    var enemy = d3.select(this);
    var startPos = {
      x : parseFloat( enemy.attr('cx') ),
      y : parseFloat( enemy.attr('cy') )
    };

    var endPos = {
      x: axes.x(endData.x),
      y: axes.y(endData.y)
    };

    return function(t){
      // debugger;
      checkCollision( enemy, onCollision );
      var enemyNextPos = {
        x : startPos.x + (endPos.x - startPos.x) * t,
        y : startPos.y + (endPos.y - startPos.y) * t
      };
      return enemy.attr('cx', enemyNextPos.x)
                  .attr('cy', enemyNextPos.y);
    };
  };

  enemies.transition()
          .ease('poly(10)')
          .duration(2000)
          .attr('r', function(d){ return Math.floor(Math.random() * 30) + 1})
          .style('fill', function(d){
              var colors = [ "red", "blue", "green", "yellow", "white", "purple" ];
              return colors[ Math.floor(Math.random() * 6) ];
          })
          .tween('custom', tweenWithCollisionDetection);

};

var play = function() {
  var gameTurn = function() {
    var newEnemyPositions = createEnemies();
    render(newEnemyPositions);
  };

  var increaseScore = function() {
    gameStats.score += 1;
    return updateScore();
  };

  gameTurn();
  setInterval(gameTurn, 2000);
  setInterval(increaseScore, 50);
};

play();
























