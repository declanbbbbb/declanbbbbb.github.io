class Piece {
  constructor (x, y, team) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.moves;
    this.code;
  }

  checkMove(x, y, move) {
    let nx = x + move[0];
    let ny = y + move[1];
    
    if (!(nx < 0 || nx > 7 || ny < 0 || ny > 7)) {
      if (pieces[ny][nx] === 0) {
        return nx >= 0 && nx <= 7 && ny >= 0 && ny <= 7;
      }
    }
    // TODO: fix lol
    return nx >= 0 && nx <= 7 && ny >= 0 && ny <= 7 && pieces[ny][nx].team === -this.team;
    // return nx < 0 || nx > 7 || ny < 0 || ny > 7 || pieces[ny][nx] === 0;
  }

  getPossibleMoves() {
    let possibleMoves = [];

    for (let i = 0; i < this.moves.length; i++) {
      if (this.checkMove(this.x, this.y, this.moves[i])) {
        possibleMoves.push(this.moves[i]);
      }
    }

    return possibleMoves;
  }

  move(x, y) {
    pieces[y][x] = this;
    pieces[this.y][this.x] = 0;
    this.x = x;
    this.y = y;

    round++;
    turn = -turn;
    this.hasMoved = true;
  }

  display() {
    push();

    stroke(255, 0, 0);
    fill((1 - (this.team/2 + 0.5)) * 255);
    circle(this.x*scx + scx/2, this.y*scy + scy/2, 20);

    stroke(255);
    textAlign(CENTER, CENTER);
    fill(0);
    text(this.name, this.x*scx + scx/2, this.y*scy + scy/2);
    pop();
  }
}

class FreePiece extends Piece {
  constructor(x, y, team) {
    super(x, y, team);
    this.moves; // the moves a free piece can initally make
  }

  getPossibleMoves() {
    // this checks the initial moves a free piece can make
    let possibleMoves = [];

    for (let fm of this.moves) {
      if (this.checkMove(this.x, this.y, fm)) {
        possibleMoves.push(fm);
      }
    }

    let num = possibleMoves.length;
    let out = [];

    for (let f = 0; f < num; f++) {
      for (let i = 1; i < 8; i++) {
        let curMove = [possibleMoves[f][0]*i, possibleMoves[f][1]*i];

        if (this.checkMove(this.x, this.y, curMove)) {
          if (pieces[this.y + curMove[1]][this.x + curMove[0]].team === -this.team) {
            out.push(curMove);
            break;
          } else {
            out.push(curMove);
          }
          
        } else {
          break;
        }
        
      }
    }
    return out;
  }
}

// here come the different pieces
// I split the pieces into two categories: step pieces and free pieces
// step: pawn, knight, king
// free: bishop, rook, queen

class Pawn extends Piece {
  constructor(x, y, team) {
    super(x, y, team);
    this.moves = [
      [ 1,  1], [-1,  1],
      [ 0,  1], [ 0,  2]
    ];
    this.name = 'pawn';
    this.hasMoved = false;
  }

  checkMove(x, y, move) {
    // overloaded to include that pawns can not take from in front of them
    let nx = x + move[0];
    let ny = y + move[1];
    
    return nx >= 0 && nx <= 7 && ny >= 0 && ny <= 7 && pieces[ny][nx] === 0;
    // return nx < 0 || nx > 7 || ny < 0 || ny > 7 || pieces[ny][nx] === 0;
  }

  checkFlank(x, y, move) {
    // overloaded to include that pawns can not take from in front of them
    let nx = x + move[0];
    let ny = y + move[1];
    
    if (nx >= 0 && nx <= 7 && ny >= 0 && ny <= 7) {
      if (pieces[ny][nx] !== 0) {
        return pieces[ny][nx].team === -this.team;
      }
    }
    return false;
    // return nx < 0 || nx > 7 || ny < 0 || ny > 7 || pieces[ny][nx] === 0;
  }

  // checkSideTakes() {
  //   // TODO this seems redundant
  //   let nx = this.x + 1;
  //   let ny = this.y + 1;
    
  //   let out = [];
  //   out.push(nx >= 0 && nx <= 7 && ny >= 0 && ny <= 7 && pieces[ny][nx] === 0);

  //   if (nx >= 0 && nx <= 7 && ny >= 0 && ny <= 7) {
  //     if (pieces[ny][nx] !== 0) {
  //       out.push([1, 1]);
  //     }
  //   }

  //   nx -= 2;

  //   if (nx >= 0 && nx <= 7 && ny >= 0 && ny <= 7) {
  //     if (pieces[ny][nx] !== 0) {
  //       out.push([-1, 1]);
  //     }
  //   }

  //   return out;
  // }

  getPossibleMoves() {
    // TODO check for enemies and en passant
    let possibleMoves = [];

    for (let i = 0; i < this.moves.length - this.hasMoved; i++) {
      if (i > 1) {
        if (this.checkMove(this.x, this.y, this.moves[i])) {
          possibleMoves.push(this.moves[i]);
        }
      } else {
        if (this.checkFlank(this.x, this.y, this.moves[i])) {
          possibleMoves.push(this.moves[i]);
        }
      }
    }

    // possibleMoves.push(this.checkSideTakes());

    return possibleMoves;
  }
}

class Knight extends Piece {
  constructor(x, y, team) {
    super(x, y, team);
    this.moves = [
      [ 1,  2], [-1,  2], 
      [-2,  1], [-2, -1], 
      [-1, -2], [ 1, -2], 
      [ 2, -1], [ 2,  1]
    ];
    this.name = 'knight';
  }
}

class Bishop extends FreePiece {
  constructor(x, y, team) {
    super(x, y, team);
    this.moves = [
      [1, 1], [-1, 1], [-1, -1], [1, -1]
    ];
    this.name = 'bishop';
  }
}

class Rook extends FreePiece {
  constructor(x, y, team) {
    super(x, y, team);
    this.moves = [
      [0, 1], [-1, 0], [0, -1], [1, 0]
    ];
    this.name = 'rook';
  }
}

class King extends Piece {
  // check for check obvy
  constructor(x, y, team) {
    super(x, y, team);
    this.moves = [
      [ 0,  1], [ 0, -1],
      [ 1,  0], [-1,  0],
      [ 1,  1], [ 1, -1],
      [-1,  1], [-1, -1]
    ];
    this.name = 'king';
  }
}

class Queen extends FreePiece {
  constructor(x, y, team) {
    super(x, y, team);
    this.moves = [
      [ 0,  1], [-1,  0], [ 0, -1], [ 1,  0],
      [ 1,  1], [-1,  1], [ 1, -1], [-1, -1]
    ];
    this.name = 'queen';
  }
}