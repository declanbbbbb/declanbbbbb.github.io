// Chess
// Declan Bainbridge
// 11/8/21

// things that aren't finished: en passant, 3 move repetition draw (kind of optional)
// TECHNICALLY if a pawn gets to the other side it can become a bishop, knight, rook, OR queen but for simplicity i made the executive decision that they all become queens

// resizeNN.js is NOT MY CODE. p5 doesn't have nearest neighbor resizing by default so pixel art gets blurry. that script just implements it.
// https://gist.github.com/GoToLoop/2e12acf577506fd53267e1d186624d7c

let startingBoard = [
  ['r','n','b','q', 0 ,'b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  [ 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 ],
  [ 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 ],
  [ 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 ],
  [ 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 ],
  ['p','p','p','p','p','p','p','p'],
  ['r','n','b','q', 0 ,'b','n','r']
];

// teams/turns: white: -1, black: 1

// the array that holds the current board
let pieces;

// scale of coordinates 
let scx;
let scy;

// for keeping a border around the pieces
let offset;

// list of the types of pieces
let types;

// list that turns a 'code' into an index
let codes;

// current turn
let turn = -1;
let selectedPiece;

let picking = true;
let done = false;

let selectedIsProper = false;

let sprites = [];
let theme = 0;
// this controls the text fading out
let themeNameAlphaBuffer = 0;

let font;
let tap;

let blackKing;
let whiteKing;

function preload() {
  tap = loadSound('./assets/move.wav');
  font = loadFont('./assets/IMFellDWPica-Regular.ttf');

  // the array of all the images
  // layout: sprites[white/black/theme names][piece][theme]
  sprites = [
    [
      [loadImage("./assets/pixel/wpawn.png")  , loadImage("./assets/retro/wpawn.png")  , loadImage("./assets/realism/wpawn.png")  ],
      [loadImage("./assets/pixel/wknight.png"), loadImage("./assets/retro/wknight.png"), loadImage("./assets/realism/wknight.png")],
      [loadImage("./assets/pixel/wbishop.png"), loadImage("./assets/retro/wbishop.png"), loadImage("./assets/realism/wbishop.png")],
      [loadImage("./assets/pixel/wrook.png")  , loadImage("./assets/retro/wrook.png")  , loadImage("./assets/realism/wrook.png")  ],
      [loadImage("./assets/pixel/wqueen.png") , loadImage("./assets/retro/wqueen.png") , loadImage("./assets/realism/wqueen.png") ],
      [loadImage("./assets/pixel/wking.png")  , loadImage("./assets/retro/wking.png")  , loadImage("./assets/realism/wking.png")  ],
    ],
    [
      [loadImage("./assets/pixel/bpawn.png")  , loadImage("./assets/retro/bpawn.png")  , loadImage("./assets/realism/bpawn.png")  ],
      [loadImage("./assets/pixel/bknight.png"), loadImage("./assets/retro/bknight.png"), loadImage("./assets/realism/bknight.png")],
      [loadImage("./assets/pixel/bbishop.png"), loadImage("./assets/retro/bbishop.png"), loadImage("./assets/realism/bbishop.png")],
      [loadImage("./assets/pixel/brook.png")  , loadImage("./assets/retro/brook.png")  , loadImage("./assets/realism/brook.png")  ],
      [loadImage("./assets/pixel/bqueen.png") , loadImage("./assets/retro/bqueen.png") , loadImage("./assets/realism/bqueen.png") ],
      [loadImage("./assets/pixel/bking.png")  , loadImage("./assets/retro/bking.png")  , loadImage("./assets/realism/bking.png")  ],
    ],
    [
      "Modern",                                "Retro",                                 "Realism"
    ]
  ];
  
}

function setup() {
  createCanvas(544, 544); // multiples of 8 and 17 (136)
  noStroke();
  textFont(font);

  types = {'p': Pawn, 'n': Knight, 'b': Bishop, 'r': Rook, 'q': Queen, 'k': King};
  codes = {'p': 0, 'n': 1, 'b': 2, 'r': 3, 'q': 4, 'k': 5};

  scx = width/8;
  scy = height/8;
  offset = width/8/17; // 15x15 with one on either side (17x17)

  initBoard();

  // this resizes the pixel art to the right size
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 6; i++) {
      for (let k = 0; k < sprites[j][i].length; k++) {
        sprites[j][i][k].resizeNN(width/8/17*15, width/8/17*15);
      }
    }
  }
}

function draw() {
  background(220);

  drawGrid();
  displayPieces();
  drawThemeName();
  
  // if someone is in checkmate, stop the game and display the winner
  if (checkForCheckMate()) {
    done = true;

    push();
    stroke(0);
    strokeWeight(8);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(120);
    if (turn === -1) {
      text("Black wins", width/2, height/2);
    } else {
      text("White wins", width/2, height/2);
    }

    pop();
  }

  // normal turn stuff
  if (!done) {
    // update the selectedpiece and make sure it is a piece and not zero
    selectedIsProper = selectedPiece !== undefined && selectedPiece.team === turn;
    
    // if in check, highlight the affected king
    drawCheck();
    
    // if you have actually selected a piece, show its moves
    if (selectedIsProper) {
      highlightMoves(selectedPiece);
    }
  }
  
}

function drawThemeName() {
  // this draws text in the bottom left whenever the theme is switched

  push();
  fill(255, themeNameAlphaBuffer);
  stroke(0, themeNameAlphaBuffer);
  strokeWeight(5);

  textSize(36);
  textAlign(LEFT, TOP);
  text(`Theme: ${sprites[2][theme]}`, 10, height-50);
  pop();

  // slowly fade out the text
  themeNameAlphaBuffer -= 2;
  themeNameAlphaBuffer = max(themeNameAlphaBuffer, 0);
}

function checkForCheckMate() {
  // if there are no legal moves that you can make, it is checkmate
  // this happens to include stalemate

  let moveFound = false;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (pieces[y][x] !== 0) {
        if (pieces[y][x].team === turn) {
          if (pieces[y][x].getAllowableMoves().length !== 0) {
            // if there is a move, it is not checkmate
            moveFound = true;
          }
        }
      }
    }
  }
  return !moveFound;
}

function drawCheck() {
  // draw a yellow rectangle highlighting the king in check

  push();
  fill(255, 255, 0, 127);
  noStroke();

  if (turn === -1) {
    if (whiteKing.isInCheck()) {
      rect(whiteKing.x * scx, whiteKing.y * scy, scx, scy);
    }
  } else {
    if (blackKing.isInCheck()) {
      rect(blackKing.x * scx, blackKing.y * scy, scx, scy);
    }
  }
  pop();
}

function initBoard() {
  // this sets up the board and all the pieces
  let curTeam = 1;
  pieces = startingBoard;

  // go through all the characters and turn them into pieces
  // curTeam is the starting team of the pieces, which switches halfway down the board
  for (let y = 0; y < 8; y++) {
    if (y === 4) {
      curTeam = -1;
    }

    for (let x = 0; x < 8; x++) {
      if (startingBoard[y][x] !== 0) {
        // i cannot believe this works
        pieces[y][x] = new types[pieces[y][x]](x, y, curTeam);
      }
    }
  }

  // setup the kings and put them into place
  blackKing = new King(4, 0, 1);
  whiteKing = new King(4, 7, -1);
  pieces[0][4] = blackKing;
  pieces[7][4] = whiteKing;

  // if on the white team, flip all the moves vertically
  for (let y = 4; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (startingBoard[y][x] !== 0) {
        for (let i = 0; i < pieces[y][x].moves.length; i++) {
          pieces[y][x].moves[i][1] *= -1;
        }
      }
    }
  }
}

function drawGrid() {
  // draws a grid of rectangles of alternating colour
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      fill((x+y+1)%2 * 255);
      rect(x * scx, y * scy, scx, scy);
    }
  }
}

function displayPieces() {
  // calls piece.display on every piece
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (pieces[y][x] !== 0) {
        pieces[y][x].display();
      }
    }
  }
}

function highlightMoves(p, moves=p.getAllowableMoves()) {
  // draws the allowable moves of a given piece (or any other set of moves passed in)
  let x = p.x;
  let y = p.y;

  push();
  fill(0, 255, 0, 127);
  rect(x*scx, y*scy, scx, scy);

  for (let move of moves) {
    // line from the current position to the new position, from the cetner of squares
    strokeWeight(10);
    stroke(255, 0, 0, 127);

    line(x*scx + scx/2, y*scy + scy/2, (x + move[0])*scx + scx/2, (y + move[1])*scy + scy/2);
    
    // add a dot at every end point of the moves for added clarity (bishops et al were hard to see)
    strokeWeight(20);
    stroke(255, 0, 0);

    point((x + move[0])*scx + scx/2, (y + move[1])*scy + scy/2);
  }
  pop();
}

function mouseClicked() {
  let mouseXIndex = floor(mouseX/scx);
  let mouseYIndex = floor(mouseY/scy);
  
  // if the mouse is on the board
  if (mouseX < width && mouseX > 0 && mouseY < height && mouseY > 0) {
    // if the selected piece is actually a piece
    if (selectedIsProper) {
      let found = false;
      let moves = selectedPiece.getAllowableMoves();
      
      // look at the mouse coordinate and see if it is a move that a piece can make
      // if it is, move there
      // otherwise, select whatever else you clicked on
      for (let move of moves) {
        if (move[0] + selectedPiece.x === mouseXIndex && move[1] + selectedPiece.y === mouseYIndex) {

          // move the piece
          selectedPiece.move(mouseXIndex, mouseYIndex);

          // if you are trying to move a king more than one square:
          if (selectedPiece.code === 'k') {
            if (abs(move[0]) > 1) {
              // if the king is castling, move the rook too
              let xIndex = max(0, min(move[0], 1)) * 7;

              pieces[selectedPiece.y][xIndex].move(selectedPiece.x - move[0]/2, selectedPiece.y);

              // turn is toggled twice since two pieces move so it needs to be toggled once more
              turn = -turn;
            }
          }

          // a move has been found
          found = true;
          break;
        }
      }
      if (!found) {
        selectedPiece = pieces[mouseYIndex][mouseXIndex];
      }
    } else {
      // if it is not a piece, try selecting a new one instead
      selectedPiece = pieces[mouseYIndex][mouseXIndex];
    }
  }
}

function mouseWheel(event) {
  // change the theme up or down according to the scroll
  theme += ceil(-event.delta/100);
  
  // loop back around
  if (theme < 0) {
    theme = sprites[0][0].length-1;
  }
  theme %= sprites[0][0].length;

  // set it to 300 so that it stays solid for a little bit before fading
  themeNameAlphaBuffer = 300;

  return false;
}