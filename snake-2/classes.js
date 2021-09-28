class Segment {
  constructor(x, y, len, theta) {
    this.pos1 = createVector(cos(theta) * len, sin(theta) * len);
    this.origin = createVector(x, y);
    this.delta = createVector(0, 0);
    this.len = len;
  }
    
  setPos(x, y) {
    let newPos = createVector(x, y);
    newPos.sub(this.origin);
    this.pos1 = p5.Vector.normalize(newPos).mult(this.len);
    this.origin.add(p5.Vector.sub(newPos, this.pos1));
  }
    
  display() {
    push();
    
    translate(this.origin.x, this.origin.y);
    strokeWeight(10);

    line(0, 0, this.pos1.x, this.pos1.y);
    
    pop();
  }

  debug() {
    push();
        
    stroke(0);
    strokeWeight(2);
    line(this.origin.x, this.origin.y, this.origin.x + this.pos1.x, this.origin.y + this.pos1.y);
      
    fill(255, 0, 0);
    noStroke();
    circle(this.pos1.x + this.origin.x, this.pos1.y + this.origin.y, 3);
      
    fill(0, 0, 255);
    circle(this.origin.x, this.origin.y, 3);
      
    pop();
  }

  update() {
    if (debug) {
      this.debug();
    } else {
      this.display();
    }
  }
}
  
class Head extends Segment {
  constructor(x, y, len, theta) {
    super(x, y, len, theta);
  }
    
  moveAndTurn(ang) {
    this.pos1.rotate(ang);
    this.origin = this.origin.add(p5.Vector.mult(this.pos1, speed/this.pos1.mag()));
  }
    
  checkDeath() {
    for (let i = 1; i < numSegs; i++) {
      if (checkIntersection(this.origin, p5.Vector.add(this.origin, this.pos1), segments[i].origin, p5.Vector.add(segments[i].origin, segments[i].pos1))) {
        background(255, 0, 0);
      }
    }
      
    if (this.origin.x < 0 || this.origin.x > width || this.origin.y < 0 || this.origin.y > height) {
      background(255, 0, 0);
    }
  }
    
  incLength() {
    segments.push(new Segment(segments[segments.length-1].origin.x, segments[segments.length-1].origin.y, segLen, 0));
    segments[segments.length-1].pos1 = segments[segments.length-2].pos1;
    numSegs ++;
  }
    
  display() {
    push();
    
    // head
    translate(this.origin.x + this.pos1.x/2, this.origin.y + this.pos1.y/2);
    rotate(PI - atan2(this.pos1.x, this.pos1.y));
    ellipse(0, 0, 20, 30);
    
    // eyes
    fill(0);
    circle(7, -3, 5);
    circle(-7, -3, 5);
    
    pop();
  }

  debug() {
    push();
    
    stroke(0);
    strokeWeight(2);
    line(this.origin.x, this.origin.y, this.origin.x + this.pos1.x, this.origin.y + this.pos1.y);
    
    fill(255, 0, 0);
    noStroke();
    circle(this.pos1.x + this.origin.x, this.pos1.y + this.origin.y, 3);
    
    fill(0, 0, 255);
    circle(this.origin.x, this.origin.y, 3);

    noFill();
    stroke(0);
    translate(this.origin.x + this.pos1.x/2, this.origin.y + this.pos1.y/2);
    circle(0, 0, 20);
    
    pop();
  }
}
  
class Apple {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.rad = 10;
  }
    
  findOpenPosition() {
    this.pos = createVector(random(0, width), random(0, height));

    let successful = true;
    for (let i = 0; i < segments.length; i++) {
      if (this.pos.dist(segments[i].pos1) < appleSafety + this.rad) {
        this.findOpenPosition();
        break;
      }
    }
  }

  display() {
    push();

    fill(255, 0, 0);
    stroke(0, 0, 255);

    ellipse(this.pos.x, this.pos.y, this.rad*2);
    pop();
  }

  checkEaten() {
    if (this.pos.dist(p5.Vector.add(p5.Vector.div(segments[0].pos1, 2), segments[0].origin)) < this.rad + 10) {
      background(0, 255, 0);
      this.findOpenPosition();
      for (let i = 0; i < 5; i++) {
        segments[0].incLength();
      }
      
    }
  }
}