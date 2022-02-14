const pi = 3.14159265358979323846;
let score = {
    strikes: 0,
    balls: 0,
    outs: 0,
    hits: 0
}
let midiSelectSlider;
let canPitch, canSwing;
let ball = {
    startX: 250, // 球開始座標
    startY: 50,
    angle: 0, // ball angle
    spinVel: 0.01, // ball spin velocity
    velX: 0, // ball velocity
    velY: 0,
    x: 250, // ball position
    y: 50,
    size: 50, // ball size
    speed: 0.05, // ball speed
    desiredX: 250, // ball desired position
    desiredXVel: 0,
    desiredY: 50,
    status: "ready",
    strike: false,
    hit: false,
    randomX: 0
};
let bat = {
    startAngle: pi * 1.5,
    endAngle: pi * -0.5,
    desiredAngle: pi * 1.5,
    angle: pi * 1.5,
    vel: 0,
    speed: 0.3,
    status: "ready",
    swung: false // 揮棒記錄
};
let pitchInput = {
    c: false,
    e: false,
    g: false,
    cTime: 0,
    eTime: 0,
    gTime: 0,
    cVel: 0,
    eVel: 0,
    gVel: 0
};
let pitcherDir = "C";
let umpireReady = true;
let messageOn = false;
let messageType = "";


function preload() {
    // images
    ballImg = loadImage('assets/ball.png');
    batImg = loadImage('assets/bat.png');
    plateImg = loadImage('assets/plate.png');

    // SFX
    soundFormats('mp3');
    swishSFX = loadSound('assets/swish');
    swingSFX = loadSound('assets/swing');
    hitSFX = loadSound('assets/hit');
    catchSFX = loadSound('assets/catch');
    ballFourSFX = loadSound('assets/ballfour');
    fairBallSFX = loadSound('assets/fairball');
    outSFX = loadSound('assets/out');
    gameOverSFX = loadSound('assets/gameover');
 

}

function setup() {
    let canvas = createCanvas(500, 800);
    getAudioContext().suspend();

    canvas.parent('sketch-holder');
    colorMode(HSB, 100)
    frameRate(120);
    textAlign(CENTER, CENTER);
    // Init MIDI
    WebMidi.enable(function (err) { //check if WebMidi.js is enabled
        if (err) {
            console.log("WebMidi could not be enabled.", err);
        } else {
            console.log("WebMidi enabled!");
        }

        //name our visible MIDI input and output ports
        console.log("---");
        console.log("Inputs Ports: ");
        for (i = 0; i < WebMidi.inputs.length; i++) {
            console.log(i + ": " + WebMidi.inputs[i].name);
        }

        console.log("---");
        console.log("Output Ports: ");
        for (i = 0; i < WebMidi.outputs.length; i++) {
            console.log(i + ": " + WebMidi.outputs[i].name);
        }
        midiSelectSlider = select("#slider");
        midiSelectSlider.attribute("max", WebMidi.inputs.length - 1);
        midiSelectSlider.changed(inputChanged);
        midiIn = WebMidi.inputs[midiSelectSlider.value()]
        inputChanged();
    });
    resetGame();
}

function draw() { // 主 Loop
    background(66, 20, 20);
    drawField();
    drawScore();
    updateBat();
    drawBat();
    calculatePitch();
    udpateBall()
    drawBall();
    checkHit();
    umpire();
    drawMessage();

    // bat.angle -= 0.05;
}

function checkHit() { // 檢查有沒有打到球
    textAlign(CENTER, CENTER)
    //let debugText = floor(mouseX) + "," + floor(mouseY);
    fill(255);
    stroke(255);
    //text(debugText, mouseX, mouseY - 10);
    let dist = 25;
    let len = 125;
    let ang = bat.angle - (pi * 0.25);
    let lineX1 = dist * cos(ang - 0.1) + 170;
    let lineX2 = (dist + len) * cos(ang - 0.1) + 170;
    let lineY1 = dist * sin(ang - 0.1) + 600;
    let lineY2 = (dist + len) * sin(ang - 0.1) + 600;
    let lineX3 = dist * cos(ang + 0.1) + 170;
    let lineX4 = (dist + len) * cos(ang + 0.1) + 170;
    let lineY3 = dist * sin(ang + 0.1) + 600;
    let lineY4 = (dist + len) * sin(ang + 0.1) + 600;
    //line(lineX1, lineY1, lineX2, lineY2);  // bat visualizer
    // line(lineX3, lineY3, lineX4, lineY4);
    //let bottomText = "ball: " + ball.x + ", " + ball.y;
    //text(bottomText, 250, 750);
    // 用兩條線代表球棒（避免穿牆），檢查跟球是否重疊

    if (lineCircle(lineX1, lineY1, lineX2, lineY2, ball.x, ball.y, ball.size / 2) || lineCircle(lineX3, lineY3, lineX4, lineY4, ball.x, ball.y, ball.size / 2)) {
        if (bat.angle < pi && bat.status == "swinging" && !ball.hit) {
            fill(100, 70, 100);
            ellipse(ball.x, ball.y, ball.size);
            // console.log("hit" + ball.x + ", " + ball.y + " " + bat.angle);
            ball.hit = true;
            
            hitSFX.play();
            flyBall(ang, bat.vel, ball.x, ball.y, ball.speed); // ball is hit!
            console.log(ang, bat.vel, ball.x, ball.y, ball.speed);
        }
    } else {

    }




}

function umpire() { // 判斷好球壞球
    //stroke(255);
    //line(200, 600, 300, 600);  // plate visualizer
    //line(200, 660, 300, 660);
    if (lineCircle(200, 600, 300, 600, ball.x, ball.y, ball.size / 2) || lineCircle(200, 660, 300, 660, ball.x, ball.y, ball.size / 2)) {
        console.log("strike zone passed.");
        ball.strike = true;

    } else {

    }
}

function drawScore() {
    textFont('Verdana');
    textSize(80);
    fill(66, 20, 80, 20);
    noStroke();
    textAlign(RIGHT, TOP);
    textStyle(BOLD);
    // text(score.outs, 480, 20);
    text(score.hits, 130, 600);

    let scoreText = "STRIKE " + "⚾️".repeat(score.strikes) + "\nBALLS " + "⚾️".repeat(score.balls) + "\nOUTS " + "⚾️".repeat(score.outs);
    textSize(18);
    fill(66, 10, 80);
    textAlign(LEFT, CENTER);
    textStyle(BOLD);
    text(scoreText, 300, 720);


}

function drawMessage() {
    if (messageOn) {
        let type = messageType;
        let bigText, smallText = "";
        if (type == "hit") {
            bigText = "HIT!"
            smallText = ""
        }
        if (type == "foul") {
            bigText = "FOUL"
            smallText = ""
        }
        if (type == "strike") {
            bigText = "STRIKE"
            smallText = ""
        }
        if (type == "strikeOut") {
            bigText = "STRIKE OUT!"
            smallText = ""
        }
        if (type == "ball") {
            bigText = "BALL"
            smallText = ""
        }
        if (type == "ballFour") {
            bigText = "BALL FOUR!"
            smallText = ""
        }
        if (score.outs == 3) {
            bigText = "GAME OVER"
            smallText = "Hits: " + score.hits;
            
        }
        textSize(32);
        textAlign(CENTER, CENTER);
        text(bigText, 250, 350);
        textStyle(NORMAL);
        textSize(24);
        text(smallText, 250, 400);
    }
}

function resetGame() {
    bat.swung = false; // 揮棒記錄
    messageOn = false; // 訊息關閉
    returnBat();
    returnBall();
    if (score.outs == 3) {
        resetScore();
    }
}

function pitcherPos(dir) { // 移動投手位置
    if (ball.status == "ready") {
        if (dir == "L") {
            ball.desiredX -= 4;
            ball.desiredX = constrain(ball.desiredX, 150, 350);
        }
        if (dir == "R") {
            ball.desiredX += 4;
            ball.desiredX = constrain(ball.desiredX, 150, 350);
        }
    }
}

function udpateBall() { // 球的移動邏輯
    // change pitcher position
    pitcherPos(pitcherDir);
    // move ball to desired x, y
    ball.desiredX += constrain(ball.desiredXVel, -500, 1000);
    if (frameCount % 4) {
        ball.desiredX += random(-ball.randomX, ball.randomX);
    }
    ball.velX = (ball.desiredX - ball.x) * ball.speed;
    ball.velY = (ball.desiredY - ball.y) * ball.speed;
    if (abs(ball.desiredX - ball.x) < 1) {
        ball.x = ball.desiredX;
    }
    if (abs(ball.desiredY - ball.y) < 1) {
        ball.y = ball.desiredY;
    }
    if (ball.y > 900 && ball.status == "pitching") { // 球被捕手接到了
        ball.status = "catched";
        catchSFX.play();
        ball.desiredXVel = 0;
        if (ball.strike || bat.swung) {
            score.strikes++;
            messageOn = true;
            messageType = "strike";
            console.log("strikes: " + score.strikes);
            if (score.strikes == 3) { // strike out
                messageOn = true;
                messageType = "strikeOut";
                outSFX.play();
                score.outs++;
                if (score.outs == 3) {
                    gameOverSFX.play();
                }
                score.strikes = 0;
                score.balls = 0;
            }
            ball.strike = false;
        } else {
            score.balls++;
            messageOn = true;
            messageType = "ball";
            console.log("balls: " + score.balls);
            if (score.balls == 4) { // ball four
                messageOn = true;
                messageType = "ballFour";
                ballFourSFX.play();
                score.hits++;
                score.balls = 0;
                score.strikes = 0;
            }
        }
    }
    ball.x += ball.velX;
    ball.y += ball.velY;
    ball.angle += ball.spinVel;
}

function ballDrop() { // 判斷球落點！
    if (ball.status == "flying") {
        ball.desiredXVel = 0;
        let ballDrop = calAngle(250, 700, ball.x, ball.y);
        if (ballDrop < -0.78 && ballDrop > -2.36) {
            messageOn = true;
            messageType = "hit";
            console.log("Fair Ball: " + ballDrop);
            fairBallSFX.play();
            score.hits++;
            score.balls = 0;
            score.strikes = 0;
        } else {
            messageOn = true;
            messageType = "foul";
            console.log("Foul Ball: " + ballDrop);
            if (score.strikes < 2) {
                score.strikes++;
            }
        }
    }
}


function calculatePitch() { // 計算球路
    if (ball.status == "ready" && pitchInput.c == true && pitchInput.e == true && pitchInput.g == true) { // Check C, E, G all pressed
        // calculate spin
        let spin = pitchInput.gVel - pitchInput.cVel // C & G control spin
        spin = map(spin, -0.5, 0.5, -1, 1, true);
        ball.desiredXVel = spin * -120;
        ball.spinVel = spin;
        // calculate speed
        let speed = (pitchInput.cVel + pitchInput.eVel * 2 + pitchInput.gVel) / 4;
        speed = map(speed, 0.2, 0.8, 0.01, 0.06, true);
        ball.speed = speed;
        ball.randomX = map(abs(spin), 0, 0.5, 220, 0, true) * map(speed, 0.01, 0.03, 1, 0, true) // the less spin & the less speed, the more random X movement
        console.log(abs(spin), speed);
        ball.desiredX += spin * map(speed, 0.01, 0.07, 800, -50, true);
        
        // if input too slow
        let duration = max([pitchInput.cTime, pitchInput.eTime, pitchInput.gTime]) - min([pitchInput.cTime, pitchInput.eTime, pitchInput.gTime]);
        console.log(duration);
        if (duration > 100) {
            ball.speed = 0.007; // 輸入期間超過 100ms 的話，球變超慢
            ball.desiredXVel = ball.desiredXVel * 0.05; // 球變不曲
            ball.spinVel = ball.spinVel * 0.2 // 球變不曲
            ball.randomX = 0;
        }

        // pitch!
        ball.status = "pitching";
        console.log("pitch!")
        pitchBall();

    }
}

function flyBall(batAng, batVel, ballX, ballY, ballSpeed) { // 球被打到了，計算飛行方向
    ball.status = "flying";
    ball.randomX = 0;
    let flyDist = 1000; // fly distance
    ball.desiredX = flyDist * cos(batAng - 1.4) + ballX;
    ball.desiredXVel = 10 * cos(batAng - 1);
    ball.desiredY = flyDist * sin(batAng - 1.4) + ballY;
    ball.spinVel += cos(batAng - 1);
    ball.speed = 0.03; //
    setTimeout(ballDrop, 600); // 0.6 秒後判斷球落點
}

function pitchBall() {
    ball.desiredY = 1300; // 投球就是將球想要去的 y 座標設到 1300
    swishSFX.play();
}

function returnBall() { // return the ball to original position
    pitchInput.c = false;
    pitchInput.e = false;
    pitchInput.g = false;
    ball.speed = 0.2;
    ball.spinVel = random(-0.02, 0.02);
    ball.desiredX = ball.startX;
    ball.desiredXVel = 0;
    ball.desiredY = ball.startY;
    pitcherDir = "C";
    ball.hit = false;
    ball.status = "ready";
    ball.strike = false;
    ball.randomX = 0;
}

function drawBall() {
    push();
    translate(ball.x, ball.y);
    rotate(ball.angle);
    imageMode(CENTER);
    image(ballImg, 0, 0, ball.size, ball.size);
    pop();
}

function updateBat() {
    bat.vel = (bat.desiredAngle - bat.angle) * bat.speed;
    bat.angle = bat.angle + bat.vel;
    if (abs(bat.angle - bat.desiredAngle) < 0.01) {
        bat.angle = bat.desiredAngle;
    }
}

function drawBat() {
    push();
    translate(170, 600);
    rotate(bat.angle);
    image(batImg, 40, -40, 105, 105);
    pop();
}

function swingBat(vel) {
    if (bat.status == "ready") {
        bat.speed = map(vel, 0.2, 0.8, 0.1, 0.4, true);
        console.log(bat.speed);
        bat.desiredAngle = bat.endAngle;
        bat.status = "swinging";
        swingSFX.play();
        bat.swung = true;
        setTimeout(returnBat, 1000);
    }
}

function returnBat() {
    bat.desiredAngle = bat.startAngle;
    bat.speed = 0.1;
    bat.status = "ready";
}

function drawField() {
    stroke(30);
    line(250, 700, 0, 450);
    line(250, 700, 500, 450);
    imageMode(CENTER);
    image(plateImg, 250, 650, 110, 110);

}

function resetScore() {
    score.strikes = 0;
    score.balls = 0;
    score.outs = 0;
    score.hits = 0;
}

function noteOn(note, vel, ms) {
    if (note == 36) { // C3
        resetScore();
        resetGame();
    }
    if (note == 48) { // C3
        swingBat(vel);
    }
    if (note == 60) {
        resetGame();
    }
    if (note == 72) {
        pitchInput.c = true;
        pitchInput.cVel = vel;
        pitchInput.cTime = ms;
    }
    if (note == 76) {
        pitchInput.e = true;
        pitchInput.eVel = vel;
        pitchInput.eTime = ms;
    }
    if (note == 79) {
        pitchInput.g = true;
        pitchInput.gVel = vel;
        pitchInput.gTime = ms;
    }
    if (note == 73) {
        pitcherDir = "L";
    }
    if (note == 75) {
        pitcherDir = "R";
    }
}

function noteOff(note, vel, ms) {
    if (note == 73) {
        pitcherDir = "C";
    }
    if (note == 75) {
        pitcherDir = "C";
    }
}

function inputChanged() {
    midiIn.removeListener();
    midiIn = WebMidi.inputs[midiSelectSlider.value()];
    midiIn.addListener('noteon', "all", function (e) {
        console.log(e.note.number, e.velocity, e.timestamp);
        noteOn(e.note.number, e.velocity, e.timestamp); // number: 
    });
    midiIn.addListener('noteoff', "all", function (e) {
        noteOff(e.note.number, e.velocity, e.timestamp);
    })
    console.log(midiIn.name);
    select("#device").html(midiIn.name);
};

function mouseClicked() {
    resetGame();
    userStartAudio();
}


// line-circle collision

function lineCircle(x1, y1, x2, y2, cx, cy, r) {

    // is either end INSIDE the circle?
    // if so, return true immediately
    let inside1 = pointCircle(x1, y1, cx, cy, r);
    let inside2 = pointCircle(x2, y2, cx, cy, r);
    if (inside1 || inside2) return true;

    // get length of the line
    let distX = x1 - x2;
    let distY = y1 - y2;
    let len = sqrt((distX * distX) + (distY * distY));

    // get dot product of the line and circle
    let dot = (((cx - x1) * (x2 - x1)) + ((cy - y1) * (y2 - y1))) / pow(len, 2);

    // find the closest point on the line
    let closestX = x1 + (dot * (x2 - x1));
    let closestY = y1 + (dot * (y2 - y1));

    // is this point actually on the line segment?
    // if so keep going, but if not, return false
    let onSegment = linePoint(x1, y1, x2, y2, closestX, closestY);
    if (!onSegment) return false;

    // optionally, draw a circle at the closest
    // point on the line


    // get distance to closest point
    distX = closestX - cx;
    distY = closestY - cy;
    let distance = sqrt((distX * distX) + (distY * distY));

    if (distance <= r) {
        return true;
    }
    return false;
}

// POINT/CIRCLE
function pointCircle(px, py, cx, cy, r) {

    // get distance between the point and circle's center
    // using the Pythagorean Theorem
    let distX = px - cx;
    let distY = py - cy;
    let distance = sqrt((distX * distX) + (distY * distY));

    // if the distance is less than the circle's
    // radius the point is inside!
    if (distance <= r) {
        return true;
    }
    return false;
}


// LINE/POINT
function linePoint(x1, y1, x2, y2, px, py) {

    // get distance from the point to the two ends of the line
    let d1 = dist(px, py, x1, y1);
    let d2 = dist(px, py, x2, y2);

    // get the length of the line
    let lineLen = dist(x1, y1, x2, y2);

    // since floats are so minutely accurate, add
    // a little buffer zone that will give collision
    let buffer = 0.1; // higher # = less accurate

    // if the two distances are equal to the line's
    // length, the point is on the line!
    // note we use the buffer here to give a range,
    // rather than one #
    if (d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer) {
        return true;
    }
    return false;
}

function calAngle(cx, cy, ex, ey) {
    var dy = ey - cy;
    var dx = ex - cx;
    var theta = Math.atan2(dy, dx); // range (-PI, PI]
    return theta;
}