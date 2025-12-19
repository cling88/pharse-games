
import Phaser from "phaser";

export default class OneTapJumpScene extends Phaser.Scene {
    player!: Phaser.GameObjects.Rectangle;
    
    velocityY = 0; 
    gravity = 1200;
    jumpPower = -500;
    groundY = 0; 
    isOnGround = true;

    // player 캐릭터 이동관련
    baseX = 100; // 기본 x 위치 
    jumpForwardOffset = 60; // 점프시 아픙로 이동 거리 
    returnSpeed = 6; // 복귀속도 (클수록 빠름)

    playerSpeed = 150;
    isGameOver = false;
    background!: Phaser.GameObjects.TileSprite; 

    obstacles: Phaser.GameObjects.Rectangle[] = [];
    spawnTimer!: Phaser.Time.TimerEvent;

    // 점수 추가 + 난이도 상승
    score = 0; 
    scoreText!: Phaser.GameObjects.Text;
    speedIncreaseInterval = 5000;  // 5초마다 속도 증가 

    constructor() {
        super("OneTapJumpScene");
    }

    create() {
        // 재시작 시 상태 초기화
        this.isGameOver = false;
        this.velocityY = 0;
        this.isOnGround = true;
        this.score = 0;
        this.playerSpeed = 150; // 초기 속도로 리셋
        this.obstacles = [];
        
        const {width, height} = this.scale;
        this.groundY = height - 80;
        this.createGradientBackground(width, height);

        this.player = this.add.rectangle(
            this.baseX,
            this.groundY,
            40,
            40, 
            0x0000ff  // 파란색 (빨간색은 장애물용으로 예약)
        );
        this.player.setDepth(10); // 플레이어를 배경보다 앞으로
        // 탭 혹은 클릭
        this.input.on("pointerdown", () => {
            if(this.isOnGround && !this.isGameOver) {
                this.velocityY = this.jumpPower;
                this.isOnGround = false;
            }
        });

        // 장애물 생성 타이머
        this.spawnTimer = this.time.addEvent({
            delay: 1500,
            loop: true,
            callback: this.spawnObstacle,
            callbackScope: this,
        })

        // 점수 표시 
        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: "24px",
            color: "#000",
            fontStyle: "bold"
        });
        this.scoreText.setDepth(20);
        
        // 난이도 상승
        this.time.addEvent({
            delay: this.speedIncreaseInterval,
            loop: true,
            callback: () => this.playerSpeed += 10
        })

        // 리사이즈 
        this.scale.on("resize", (size: Phaser.Structs.Size) => {
            this.groundY = size.height - 80;
            if(this.isOnGround) {
                this.player.y = this.groundY;
            }
            this.createGradientBackground(size.width, size.height);
        });
    }

    update(_: number, delta: number) {
        if(this.isGameOver) return;

        const dt = delta / 1000;
        
        // 중력 적용
        this.velocityY += this.gravity * dt;
        this.player.y += this.velocityY * dt;

        // 바닥충돌
        if(this.player.y >= this.groundY) {
            this.player.y = this.groundY;
            this.velocityY = 0; 
            this.isOnGround = true;
        }

        // 캐릭터 무빙
        if(!this.isOnGround) {
            // jump 시 앞으로 살짝 이동
            const targetX = this.baseX+ this.jumpForwardOffset;
            this.player.x = Phaser.Math.Linear(this.player.x, targetX, 0.15);
        } else {
            // 땅으로 내려오면 천천히 기본위치로 가기 
            this.player.x = Phaser.Math.Linear(
                this.player.x,
                this.baseX,
                this.returnSpeed * dt
            )
        }

        // 배경 좌측 이동 
        if(this.background && this.background.active) {
            this.background.tilePositionX += this.playerSpeed * dt;
        }

        // 점수 업데이트
        this.score += Math.floor(this.playerSpeed * dt / 10);
        this.scoreText.setText(`Score: ${this.score}`);

        // 장애물 이동 + 충돌 체크
        this.obstacles.forEach((obs) => {
            obs.x -= this.playerSpeed * dt;
            if(this.checkCollision(this.player, obs)) {
                this.gameOver();
            }
            if(obs.x + obs.width / 2 < 0) {
                obs.destroy();
            }
        });
        this.obstacles = this.obstacles.filter((obs) => obs.active);
    }

    private spawnObstacle() {
        const {width} = this.scale;
        const size = Phaser.Math.Between(30, 60);

        const obstacle = this.add.rectangle(
            width + size / 2,
            this.groundY,
            size,
            size,
            0xff0000
        );
        obstacle.setOrigin(0.5, 0.5); // 바닥 기준
        obstacle.setDepth(5);
        this.obstacles.push(obstacle);
    }

    private checkCollision(
        a: Phaser.GameObjects.Rectangle,
        b: Phaser.GameObjects.Rectangle
    ) {
        return(
            Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
            Math.abs(a.y - b.y) < (a.height + b.height) / 2
        )
    }

    private gameOver(){
        this.isGameOver = true;
        // 모든 장애물 제거
        this.obstacles.forEach((obs) => {
            obs.destroy();
        });
        this.obstacles = [];
        // 텍스트 표시 
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            "GAME OVER\nTap to Restart",
            {
                fontSize: "32px",
                color: "#fff",
                align: "center"
            }
        ).setOrigin(0.5); // text의 위치를 중앙정렬 (0.5 -> 50%)
        
        // 최종 점수 표시
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 + 60,
            `Final Score: ${this.score}`,
            {
                fontSize: "28px",
                color: "#000",
                align: "center"
            }
        ).setOrigin(0.5)
    
        // 입력으로 재시작
        // this.input = 이 Scene이 관리하는 입력 시스템으로 마우스, 터치, 키보드, 포인트 이벤트가 모두 여기로 들어옴.
        this.input.once("pointerdown", () => {
            this.scene.restart();
        })
    }

    private createGradientBackground(width: number, height: number) {
        if(this.background) this.background.destroy();
        
        // Canvas 2D Context를 사용하여 그라데이션 생성
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        // 하늘 느낌 그라데이션
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87ceeb'); // 상단 하늘색
        gradient.addColorStop(1, '#ffffff'); // 하단 흰색
        
        // 그라데이션으로 사각형 채우기
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 구름 그리기 (배경이 움직이는지 확인용)
        this.drawClouds(ctx, width, height);
        
        // 기존 텍스처가 있으면 제거 (재시작 시 중복 방지)
        if (this.textures.exists('gradientBg')) {
            this.textures.remove('gradientBg');
        }
        
        // Canvas를 Phaser 텍스처로 변환
        this.textures.addCanvas('gradientBg', canvas);
        
        // TileSprite로 배경 생성
        this.background = this.add.tileSprite(0, 0, width, height, 'gradientBg');
        this.background.setOrigin(0, 0);
        this.background.setDepth(0); // 배경을 가장 뒤로
    }

    private drawClouds(ctx: CanvasRenderingContext2D, width: number, height: number) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // 반투명 흰색
        
        // 랜덤하게 구름 배치 (상단 1/3 영역에)
        const cloudCount = 5;
        for (let i = 0; i < cloudCount; i++) {
            const x = Phaser.Math.Between(0, width * 2); // TileSprite가 반복되므로 2배 너비
            const y = Phaser.Math.Between(50, height / 3);
            this.drawSingleCloud(ctx, x, y);
        }
    }

    private drawSingleCloud(ctx: CanvasRenderingContext2D, x: number, y: number) {
        // 구름은 여러 개의 원을 겹쳐서 만듦
        ctx.beginPath();
        
        // 왼쪽 원
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // 중앙 원
        ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // 오른쪽 원
        ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // 아래 원들
        ctx.arc(x + 15, y + 20, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.arc(x + 35, y + 20, 25, 0, Math.PI * 2);
        ctx.fill();
    }
}