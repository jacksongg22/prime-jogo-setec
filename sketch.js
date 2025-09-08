// Variáveis do jogo
let estadoJogo = "menu";
let dificuldade = 1; // 1: Fácil, 2: Médio, 3: Difícil
let score = 0;
let nave;
let tiros = [];
let inimigos = [];
let inimigoChefe;
let tirosInimigo = [];
let inimigosDerrotados = 0;
let telaPiscando = false;
let tempoPisca = 0;
let bossApareceu = false;

// Configurações de velocidade base
let velocidadeTiroInimigo;
let velocidadeInimigo;
let vidaChefe;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  textSize(20);
  fill(255);
  iniciarMenu();
}

function draw() {
  background(0);

  if (estadoJogo === "menu") {
    desenharMenu();
  } else if (estadoJogo === "jogando") {
    atualizarJogo();
    desenharJogo();
  } else if (estadoJogo === "gameOver") {
    desenharGameOver();
  } else if (estadoJogo === "vitoria") {
    desenharVitoria();
  }
}

// --- CLASSES ---

class Nave {
  constructor() {
    this.x = width / 2;
    this.y = height - 50;
    this.tamanho = 20;
    this.velocidade = 5;
    this.tirosAtraso = 10;
    this.tirosContador = 0;
  }

  desenhar() {
    fill(0, 255, 0);
    noStroke();
    triangle(
      this.x,
      this.y - this.tamanho,
      this.x - this.tamanho,
      this.y + this.tamanho,
      this.x + this.tamanho,
      this.y + this.tamanho
    );
  }

  mover() {
    if (keyIsDown(LEFT_ARROW)) {
      this.x -= this.velocidade;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.x += this.velocidade;
    }
    this.x = constrain(this.x, this.tamanho, width - this.tamanho);
  }

  atirar() {
    if (this.tirosContador <= 0) {
      tiros.push(new Tiro(this.x, this.y - this.tamanho));
      this.tirosContador = this.tirosAtraso;
    }
  }
}

class Tiro {
  constructor(x, y, cor = "blue") {
    this.x = x;
    this.y = y;
    this.tamanho = 5;
    this.velocidade = 7;
    this.cor = cor;
  }

  desenhar() {
    fill(this.cor);
    noStroke();
    rect(this.x, this.y, this.tamanho, this.tamanho * 2);
  }

  mover() {
    if (this.cor === "blue") {
      this.y -= this.velocidade; // Tiros do jogador sobem
    } else {
      this.y += this.velocidade; // Tiros do chefe descem
    }
  }
}

class Inimigo {
  constructor() {
    this.x = random(width);
    this.y = -10;
    this.raio = 15;
    this.velocidade = velocidadeInimigo;
  }

  desenhar() {
    fill(255, 0, 0);
    noStroke();
    ellipse(this.x, this.y, this.raio * 2);
  }

  mover() {
    this.y += this.velocidade;
  }
}

class Chefe {
  constructor() {
    this.x = width / 2;
    this.y = -100;
    this.tamanho = 80;
    this.velocidade = 3;
    this.direcao = 1;
    this.vidaTotal = vidaChefe;
    this.vidaAtual = this.vidaTotal;
    this.tirosAtraso = 60 / dificuldade;
    this.tirosContador = 0;
  }

  desenhar() {
    fill(255, 140, 0);
    noStroke();
    rectMode(CENTER);
    rect(this.x, this.y, this.tamanho, this.tamanho);
    rectMode(CORNER);
    this.desenharBarraVida();
  }

  desenharBarraVida() {
    let barraLargura = 100;
    let barraAltura = 10;
    let barraVidaAtual = map(
      this.vidaAtual,
      0,
      this.vidaTotal,
      0,
      barraLargura
    );
    fill(255);
    rect(
      this.x - barraLargura / 2,
      this.y + this.tamanho / 2 + 10,
      barraLargura,
      barraAltura
    );
    fill(255, 0, 0);
    rect(
      this.x - barraLargura / 2,
      this.y + this.tamanho / 2 + 10,
      barraVidaAtual,
      barraAltura
    );
  }

  mover() {
    // Desce até y = 100
    if (this.y < 100) {
      this.y += this.velocidade;
    } else {
      // Andar na horizontal entre as bordas, respeitando o tamanho
      this.x += this.velocidade * this.direcao;

      if (this.x > width - this.tamanho / 2) {
        this.x = width - this.tamanho / 2;
        this.direcao = -1;
      } else if (this.x < this.tamanho / 2) {
        this.x = this.tamanho / 2;
        this.direcao = 1;
      }
    }
  }

  atirar() {
    if (this.tirosContador <= 0) {
      tirosInimigo.push(new Tiro(this.x, this.y + this.tamanho / 2, "red"));
      this.tirosContador = this.tirosAtraso;
    }
  }
}

// --- FUNÇÕES DE JOGO ---

function atualizarJogo() {
  nave.mover();
  if (keyIsDown(32)) {
    // Espaço para atirar
    nave.atirar();
  }
  if (nave.tirosContador > 0) nave.tirosContador--;

  // Tiros do jogador
  for (let i = tiros.length - 1; i >= 0; i--) {
    tiros[i].mover();
    if (tiros[i].y < 0) {
      tiros.splice(i, 1);
    }
  }

  // Inimigos normais
  if (!bossApareceu) {
    for (let i = inimigos.length - 1; i >= 0; i--) {
      inimigos[i].mover();
      if (inimigos[i].y > height) {
        inimigos.splice(i, 1);
        spawnInimigo();
      }
    }
  }

  // Colisão tiros-inimigos normais
  for (let i = tiros.length - 1; i >= 0; i--) {
    for (let j = inimigos.length - 1; j >= 0; j--) {
      let d = dist(tiros[i].x, tiros[i].y, inimigos[j].x, inimigos[j].y);
      if (d < tiros[i].tamanho + inimigos[j].raio) {
        tiros.splice(i, 1);
        inimigos.splice(j, 1);
        inimigosDerrotados++;
        score += 10;
        spawnInimigo();
        break;
      }
    }
  }

  // Chefe aparece após 14 inimigos derrotados
  if (!bossApareceu && inimigosDerrotados >= 14) {
    bossApareceu = true;
    telaPiscando = true;
    tempoPisca = millis();
    inimigos = [];
    inimigoChefe = new Chefe();
  }

  // Tela piscando quando o chefe aparece
  if (telaPiscando) {
    let tempoDecorrido = millis() - tempoPisca;
    if (tempoDecorrido > 2000) {
      telaPiscando = false;
    } else {
      if (floor(tempoDecorrido / 200) % 2 === 0) {
        background(255, 0, 0);
      } else {
        background(255);
      }
    }
  }

  // Movimento e ataque do chefe
  if (bossApareceu) {
    inimigoChefe.mover();
    inimigoChefe.atirar();
    if (inimigoChefe.tirosContador > 0) inimigoChefe.tirosContador--;

    // Tiros do chefe
    for (let i = tirosInimigo.length - 1; i >= 0; i--) {
      tirosInimigo[i].mover();
      if (tirosInimigo[i].y > height) {
        tirosInimigo.splice(i, 1);
      }
    }

    // Colisão tiros-jogador contra chefe
    for (let i = tiros.length - 1; i >= 0; i--) {
      let d = dist(tiros[i].x, tiros[i].y, inimigoChefe.x, inimigoChefe.y);
      if (d < tiros[i].tamanho + inimigoChefe.tamanho / 2) {
        tiros.splice(i, 1);
        inimigoChefe.vidaAtual -= 1;
        score += 5;
      }
    }

    // Chefe morto
    if (inimigoChefe.vidaAtual <= 0) {
      estadoJogo = "vitoria";
    }

    // Colisão nave-chefe
    let d = dist(nave.x, nave.y, inimigoChefe.x, inimigoChefe.y);
    if (d < nave.tamanho + inimigoChefe.tamanho / 2) {
      estadoJogo = "gameOver";
    }

    // Colisão tiros chefe-nave
    for (let i = tirosInimigo.length - 1; i >= 0; i--) {
      let dTiroNave = dist(
        tirosInimigo[i].x,
        tirosInimigo[i].y,
        nave.x,
        nave.y
      );
      if (dTiroNave < tirosInimigo[i].tamanho + nave.tamanho) {
        estadoJogo = "gameOver";
      }
    }
  }
}

function desenharJogo() {
  // Fundo estilo estrelas
  for (let i = 0; i < 50; i++) {
    fill(255, 255, 255, random(50, 200));
    ellipse(random(width), random(height), 2, 2);
  }

  nave.desenhar();
  tiros.forEach((t) => t.desenhar());
  inimigos.forEach((i) => i.desenhar());

  if (bossApareceu) {
    inimigoChefe.desenhar();
    tirosInimigo.forEach((t) => t.desenhar());
  }

  fill(255);
  textSize(20);
  text(`Pontuação: ${score}`, 70, 30);
}

function spawnInimigo() {
  inimigos.push(new Inimigo());
}

// --- Telas ---

function desenharMenu() {
  background(0);
  fill(255);
  textSize(50);
  text("Jogo da Nave", width / 2, height / 2 - 100);
  textSize(30);
  text("Escolha a Dificuldade", width / 2, height / 2 - 40);

  textSize(25);
  text("1 - Fácil", width / 2, height / 2 + 10);
  text("2 - Médio", width / 2, height / 2 + 50);
  text("3 - Difícil", width / 2, height / 2 + 90);

  textSize(18);
  text("Pressione 1, 2 ou 3 para iniciar", width / 2, height / 2 + 150);
}

function desenharGameOver() {
  background(0);
  fill(255, 0, 0);
  textSize(50);
  text("GAME OVER", width / 2, height / 2 - 20);
  fill(255);
  textSize(25);
  text(`Sua pontuação: ${score}`, width / 2, height / 2 + 30);
  text("Pressione R para reiniciar", width / 2, height / 2 + 80);
}

function desenharVitoria() {
  background(0, 150, 0);
  fill(255);
  textSize(50);
  text("VOCÊ VENCEU!", width / 2, height / 2 - 20);
  textSize(25);
  text(`Sua pontuação: ${score}`, width / 2, height / 2 + 30);
  text("Pressione R para jogar novamente", width / 2, height / 2 + 80);
}

// --- Controles ---

function keyPressed() {
  if (estadoJogo === "menu") {
    if (key === "1") {
      dificuldade = 1;
      balancearDificuldade();
      iniciarJogo();
    } else if (key === "2") {
      dificuldade = 2;
      balancearDificuldade();
      iniciarJogo();
    } else if (key === "3") {
      dificuldade = 3;
      balancearDificuldade();
      iniciarJogo();
    }
  }

  if (
    (estadoJogo === "gameOver" || estadoJogo === "vitoria") &&
    (key === "r" || key === "R")
  ) {
    iniciarMenu();
  }
}

function iniciarMenu() {
  estadoJogo = "menu";
  score = 0;
  inimigosDerrotados = 0;
  bossApareceu = false;
  tiros = [];
  tirosInimigo = [];
  inimigos = [];
  nave = new Nave();
  velocidadeInimigo = 1.5;
  velocidadeTiroInimigo = 2;
  vidaChefe = 10;
}

function iniciarJogo() {
  estadoJogo = "jogando";
  tiros = [];
  tirosInimigo = [];
  inimigos = [];
  inimigosDerrotados = 0;
  bossApareceu = false;
  spawnInimigo();
  nave = new Nave();
}

function balancearDificuldade() {
  // Velocidade dos inimigos normais aumenta com dificuldade
  velocidadeInimigo = 1.5 + dificuldade * 1.5; // Fácil=3, Médio=4.5, Difícil=6

  // Velocidade dos tiros do chefe
  velocidadeTiroInimigo = 2 + dificuldade; // Fácil=3, Médio=4, Difícil=5

  // Vida do chefe diminui com dificuldade para ficar mais balanceado
  // Exemplo: Fácil=15, Médio=12, Difícil=8
  vidaChefe = 15 - (dificuldade - 1) * 3.5;
}
