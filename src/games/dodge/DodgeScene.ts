import Phaser from 'phaser';

export default class DodgeScene extends Phaser.Scene {
    player!: Phaser.GameObjects.Rectangle; // 플레이어 오브젝트
    obstacles!: Phaser.GameObjects.Rectangle[]; // 장애물 오브젝트
    isGameOver!: boolean;

    constructor() {
        super('DodgeScene');
    }
    
    create() {
        this.isGameOver = false;
        this.obstacles = [];

        // 플레이어 생성
        this.player = this.add.rectangle(0, 0, 50, 50, 0xffffff);
        
        // 초기 위치 세팅
        this.updatePlayerPosition(
            this.scale.width,
            this.scale.height
        );
        
        // 마우스, 터치 이동
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if(!this.isGameOver) {
                // pointer.x는 화면 좌표, worldX는 월드 좌표
                // FIT 모드에서는 x를 사용하는 것이 더 안정적
                const x = pointer.x;
                this.player.x = Phaser.Math.Clamp(
                    x,
                    25, // player rectangle width (50)/ 2
                    this.scale.width - 25
                );
            }
        });

        // 리사이즈 대응
        this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
            this.updatePlayerPosition(gameSize.width, gameSize.height);
        });

        // 장애물 생성 타이머
        this.time.addEvent({
            delay: 800,
            loop: true,
            callback: this.spawnObstacle,
            callbackScope: this,
        })        
    }

    update(){
        if(this.isGameOver) return;
        this.obstacles.forEach((obs) => {
            obs.y += 3;
            if(this.checkCollision(this.player, obs)) {
                this.gameOver();
            }
            if(obs.y > this.scale.height + 50) {
                obs.destroy();
            }
        });
        // 제거된 장애물 배열 정리
        this.obstacles = this.obstacles.filter((obs) => obs.active);
    }
    
    private updatePlayerPosition(width: number, height: number) {
        if (!this.player) return;
        this.player.x = width / 2;
        this.player.y = height - 80;
    }

    private spawnObstacle() {
        const x = Phaser.Math.Between(20, this.scale.width - 20);
        const obstacle = this.add.rectangle(
            x, // x축
            -20, // y축
            30, // 너비
            30, // 높이
            0xff5555 // 색상
        )
        this.obstacles.push(obstacle);
    }

    // 장애물 충돌 체크 
    private checkCollision(
        a: Phaser.GameObjects.Rectangle,
        b: Phaser.GameObjects.Rectangle
    ):boolean {
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
        // 입력으로 재시작
        // this.input = 이 Scene이 관리하는 입력 시스템으로 마우스, 터치, 키보드, 포인트 이벤트가 모두 여기로 들어옴.
        this.input.once("pointerdown", () => {
            this.scene.restart();
        })
    }
}
