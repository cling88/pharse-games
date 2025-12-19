import Phaser from "phaser";

interface StageConfig {
    id: number;
    enemyTotal: number;
    initialSpawn: number;
    maxSpawn: number;
    backgroundColor: number;
    itemCount?: number; // 아이템 개수 (선택적, 기본값 0)
}

const ItemType = {
    speedUp: 1,
    TripleShot: 2,
    FreezeEnemy: 3
} as const;

type ItemType = typeof ItemType[keyof typeof ItemType];

interface Item {
    sprite: Phaser.GameObjects.Rectangle,
    type: ItemType,
    expireTimer?: Phaser.Time.TimerEvent
}

type EnemyType = "normal" | "shooter" | "tank";
interface EnemyData {
    sprite: Phaser.GameObjects.Rectangle;
    type: EnemyType;
    hp: number;
    shootTimer?: Phaser.Time.TimerEvent;
}

export default class ShooterScene extends Phaser.Scene {
    // stage
    stages: StageConfig[] = [
        {id: 1, enemyTotal: 10, backgroundColor: 0xfff3b0, initialSpawn: 3, maxSpawn: 5, itemCount: 1},
        {id: 2, enemyTotal: 20, backgroundColor: 0xe6d3b1, initialSpawn: 4, maxSpawn: 8, itemCount: 2},
        {id: 3, enemyTotal: 40, backgroundColor: 0xe3d7f5, initialSpawn: 6, maxSpawn: 12, itemCount: 3}
    ]   
    currentStageIndex = 0; 
    // player
    player!: Phaser.GameObjects.Rectangle;
    playerSpeed = 300; 
    playerPadding = 20;

    // Bullets
    bullets!: Phaser.GameObjects.Rectangle[];
    bulletSpeed = 500; 
    fireInterval = 250; 

    // Enemies
    enemies!: EnemyData[];
    enemySpeed = 80;
    spawnedEnemyCount = 0; 
    currentSpawnCount = 0; 

    // stage
    isStageClearing = false;
    isGameClear = false; 
    isGameOver = false;

    // item
    items: Item[] = [];
    activeItemTimers: Phaser.Time.TimerEvent[] = [];

    // item - effect
    isEnemyFrozen = false;
    tripleShotEnabled = false;
    originalPlayerSpeed = 300;

    // enemy
    enemyBullets: Phaser.GameObjects.Rectangle[] = [];
    enemyBulletSpeed = 250;

    score = 0; 
    scoreText!: Phaser.GameObjects.Text;

    constructor() {
        super("ShooterScene");
    }

    create() {
        // 재시작 시 상태 초기화
        this.isGameOver = false;
        this.isGameClear = false;
        this.isStageClearing = false;
        this.currentStageIndex = 0;
        this.spawnedEnemyCount = 0;
        this.score = 0;
        
        // 기존 게임 오브젝트 정리
        if(this.player && this.player.active) {
            this.player.destroy();
        }
        if(this.scoreText && this.scoreText.active) {
            this.scoreText.destroy();
        }
        if(this.bullets) {
            this.bullets.forEach(b => {
                if(b && b.active) b.destroy();
            });
        }
        if(this.enemies) {
            this.enemies.forEach(e => {
                if(e && e.sprite.active) {
                    e.sprite.destroy();
                    e.shootTimer?.remove();
                }
            });
        }
        
        const {width, height} = this.scale; 
        // 초기 스테이지 세팅
        const stage = this.stages[this.currentStageIndex];
        this.applyStage(stage);

        // 플레이어 생성
        this.player = this.add.rectangle(
            width / 2,
            height - 60,
            40,
            40,
            0x000000
        );

        this.bullets = [];
        this.enemies = [];

        // 상하좌우이동 (마우스 터치)
        this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if(this.isGameOver) return;
            this.player.x = Phaser.Math.Clamp(pointer.x, this.playerPadding, width - this.playerPadding);
            this.player.y = Phaser.Math.Clamp(pointer.y, this.playerPadding, height - this.playerPadding);
        })

        // 자동연사
        this.time.addEvent({
            delay: this.fireInterval,
            loop: true,
            callback: () => this.fireBullet()
        });

        // 적 스폰 설정
        this.currentSpawnCount = stage.initialSpawn;
        this.time.addEvent({
            delay: 2000,
            loop: true,
            callback: () => {
                if(this.isGameOver || this.isGameClear) return; // 게임 오버/클리어 시 중단
                const currentStage = this.stages[this.currentStageIndex];
                if(currentStage && this.currentSpawnCount < currentStage.maxSpawn) {
                    this.currentSpawnCount++;
                }
            }
        });
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if(this.isGameOver || this.isGameClear) return; // 게임 오버/클리어 시 중단
                const currentStage = this.stages[this.currentStageIndex];
                if(!currentStage) return; // 스테이지가 없으면 중단
                while(
                    this.enemies.length < this.currentSpawnCount &&
                    this.spawnedEnemyCount < currentStage.enemyTotal
                ) {
                    this.spawnEnemy();
                }
            }
        });

        // 점수 표시
        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: "24px",
            color: "#000",
            fontStyle: "bold"
        });
        this.scoreText.setDepth(100);

        // 아이템 생성 스케쥴링
        this.scheduleItemsForStage(stage.id);
    }

    update(_: number, delta: number) {
        if(this.isGameOver || this.isGameClear) return;
        const dt = delta / 1000;
        // 총알 이동
        this.bullets.forEach((bullet) => {
            // bullet.y -= this.bulletSpeed * dt;
            // if(bullet.y < -20) {
            //     bullet.destroy();
            // }
            // 각도 적용 
            const vx = bullet.getData("vx") ?? 0;
            const vy = bullet.getData("vy") ?? this.bulletSpeed;
            bullet.x += vx * dt;
            bullet.y += vy * dt;
            if(bullet.y < -20 || bullet.x < -10 || bullet.x > this.scale.width + 20) {
                bullet.destroy();
            }
        });

        // 적 이동
        this.enemies.forEach((enemy) => {
            if(!this.isEnemyFrozen) {
                enemy.sprite.y += this.enemySpeed * dt;
            }
            if(enemy.sprite.y > this.scale.height + 40) {
                // enemy.destroy(); 
                this.triggerGameOver();
            }
        });

        // 총알이 적을 맞췄을떄 체크  
        this.bullets.forEach((bullet) => {
            this.enemies.forEach((enemy) => {
                if(!bullet.active || !enemy.sprite.active) return; 

                if(this.isColliding(bullet, enemy.sprite)) {
                    bullet.destroy();
                    enemy.hp--;
                    if(enemy.hp <= 0) {
                        enemy.sprite.destroy();
                        enemy.shootTimer?.remove();
                        this.score += 100;
                        this.scoreText.setText(`Score: ${this.score}`);
                    }
                }
            })
        });
        

        // 제거된 총알&적 정리
        this.bullets = this.bullets.filter((b) => b.active);
        this.enemies = this.enemies.filter((e) => e.sprite.active);

        // 플레이어와 적 충돌
        this.enemies.forEach((enemy) => {
            if(enemy.sprite.active && this.isColliding(enemy.sprite, this.player)) {
                this.triggerGameOver();
            }
        });

        // 아이템 충돌 체크 
        this.items.forEach((item) => {
            if(item.sprite.active && this.isColliding(item.sprite, this.player)) {
                this.applyItemEffect(item.type);
                this.removeItem(item);
            }
        })

        // 적 총알 이동 추가 
        this.enemyBullets.forEach((bullet) => {
            bullet.y += bullet.getData("vy") * dt;
            if(bullet.y > this.scale.height + 20) {
                bullet.destroy();
            }
            if(bullet.active && this.isColliding(bullet, this.player)) {
                this.triggerGameOver();
            }
        });
        this.enemyBullets = this.enemyBullets.filter(b => b.active);

        // 다음 스테이지
        this.checkStageClear();
    }

    // 총알 발사
    private fireBullet() {
        if(this.isGameOver || this.isGameClear || !this.player.active) return;
        const angles = this.tripleShotEnabled 
            ? [0, Phaser.Math.DegToRad(-15), Phaser.Math.DegToRad(15)] 
            : [0];
        
        angles.forEach((angle) => {
            const bullet = this.add.rectangle(
                this.player.x,
                this.player.y - 30,
                6, 
                16,
                0xfacc15
            );
            // 각 총알에 방향 벡터 저장
            bullet.setData("vx", Math.sin(angle) * this.bulletSpeed);
            bullet.setData("vy", -Math.cos(angle) * this.bulletSpeed);
            this.bullets.push(bullet);
        });

        
    }

    private spawnEnemy() {
        const {width} = this.scale;
        const stageId = this.stages[this.currentStageIndex].id;

        // 기존 코드 -> 적이 한가지 타입만 있음음
        // const enemy = this.add.rectangle(
        //     Phaser.Math.Between(20, width - 20),
        //     -20,
        //     36,
        //     36,
        //     0xef4444
        // );
        // this.enemies.push(enemy);
        // this.spawnedEnemyCount++;

        let type: EnemyType = "normal";
        let hp = 1;
        let color = 0xef4444;
        let size = 36; 

        // 슈팅 타입
        if(stageId >= 2 && Phaser.Math.Between(0, 100) < 15) {
            type = "shooter";
        }
        // 탱크 타입
        if(stageId === 3 && Phaser.Math.Between(0, 100) < 15) {
            type = "tank";
            hp=5;
            color=0xec4899;
            size=48;
        }
        const enemyRect = this.add.rectangle(
            Phaser.Math.Between(20, width - 20),
            -30,
            size,
            size,
            color
        );
        const enemy:EnemyData = {
            sprite: enemyRect,
            type,
            hp
        }
        //  슈터 총알 발사
        if(type === "shooter") {
            enemy.shootTimer = this.time.addEvent({
                delay: Phaser.Math.Between(1200, 2000),
                loop: true,
                callback: () => this.fireEnemyBullet(enemy)
            })
        }
        this.enemies.push(enemy);
        this.spawnedEnemyCount++;
    }

    private isColliding(
        a: Phaser.GameObjects.Rectangle,
        b: Phaser.GameObjects.Rectangle
    ) {
        return(
            Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
            Math.abs(a.y - b.y) < (a.height + b.height) / 2
        )
    }

    // 아이템 처리 
    private getItemCountForStage(stageId: number): number {
        const stage = this.stages.find(s => s.id === stageId);
        return stage?.itemCount ?? 0;
    }

    private scheduleItemsForStage(stageId: number) {
        const itemCount = this.getItemCountForStage(stageId);
        for(let i=0; i < itemCount; i++) {
            this.time.addEvent({
                delay: Phaser.Math.Between(2000, 6000) * (i + 1),
                callback: () => this.spawnItem()
            })
        }
    }

    private spawnItem() {
        const {width, height} = this.scale;
        const type = Phaser.Math.Between(1, 3) as ItemType;
        const itemRect = this.add.rectangle(
            Phaser.Math.Between(40, width - 40),
            Phaser.Math.Between(40, height - 200),
            36,
            36,
            0xd8b4fe
        );
        const label = this.add.text(
            itemRect.x,
            itemRect.y,
            String(type),
            {fontSize: "20px", color: "#fff", fontStyle: "bold"}
        ).setOrigin(0.5);
        itemRect.setData("label", label);
        const item: Item = {sprite: itemRect, type};
        this.items.push(item);
        // 3초 후 사라짐
        this.time.addEvent({
            delay: 3000,
            callback: () => this.removeItem(item)
        })
    }

    private removeItem(item: Item) {
        if(!item.sprite.active) return;
        const label = item.sprite.getData("label") as Phaser.GameObjects.Text;
        label?.destroy();
        item.sprite.destroy();
        this.items = this.items.filter(i => i !== item);
    }

    private applyItemEffect (type: ItemType) {
        switch(type) {
            case ItemType.speedUp:
                this.playerSpeed *= 1.5;
                break;
            case ItemType.TripleShot:
                this.tripleShotEnabled = true; 
                break;
            case ItemType.FreezeEnemy:
                this.isEnemyFrozen = true;
                break;
        }
        // 최대 지속시간 5초 
        const timer = this.time.addEvent({
            delay: 5000,
            callback: () => this.clearItemEffect(type)
        });
        this.activeItemTimers.push(timer);
    }

    private clearItemEffect(type: ItemType) {
        switch(type) {
            case ItemType.speedUp:
                this.playerSpeed = this.originalPlayerSpeed;
                break;
            case ItemType.TripleShot:
                this.tripleShotEnabled = false; 
                break;
            case ItemType.FreezeEnemy:
                this.isEnemyFrozen = false;
                break;
        }
    }

    // 적관련 
    private fireEnemyBullet (enemy: EnemyData) {
        if(!enemy.sprite.active || this.isGameOver) return;
        const bullet = this.add.rectangle(
            enemy.sprite.x,
            enemy.sprite.y + 20,
            6,
            14,
            0x22c55e
        );
        bullet.setData("vy", this.enemyBulletSpeed);
        this.enemyBullets.push(bullet);
    }

    // 게임 종료, 리셋 관련 처리 
    private checkStageClear() {
        const stage = this.stages[this.currentStageIndex];
        if(
            !this.isStageClearing && // 아직 스테이지 clear 아니고 
            this.spawnedEnemyCount >= stage.enemyTotal && // 모든 적들이 출몰했고
            this.enemies.length === 0 // 모든 적들이 소멸했으면
        ) {
            this.isStageClearing = true;
            this.time.delayedCall(1500, () =>{
                this.goToNextStage();
            })
        }
    }

    private goToNextStage () {
        this.currentStageIndex ++;
        if(this.currentStageIndex >= this.stages.length) {
            this.gameClear();
            return;
        }
        this.resetStage();
    }

    private resetStage() {
        const stage = this.stages[this.currentStageIndex];
        // 기존 적 제거
        this.enemies.forEach(e => {
            e.sprite.destroy();
            e.shootTimer?.remove();
        });
        this.enemies = [];

        // 스테이지 변수 초기화
        this.spawnedEnemyCount = 0; 
        this.currentSpawnCount = stage.initialSpawn;
        this.isStageClearing = false;

        // 배경 변경
        this.applyStage(stage);

        // 플레이어 위치 리셋
        const {width, height} = this.scale;
        this.player.setPosition(width/2, height - 60);

        // 아이템 생성 스케쥴링
        this.scheduleItemsForStage(stage.id);
    }

    private gameClear() {
        this.isGameClear = true;
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            "Game Clear!🥰",
            {
                fontSize: "48px",
                color: "#000",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);
    }

    private triggerGameOver() {
        if(this.isGameOver) return;
        this.isGameOver = true;
        // 모든적 & 총알 정지
        this.bullets.forEach(b => b.destroy());
        this.enemies.forEach(e => {
            e.sprite.destroy();
            e.shootTimer?.remove();
        });
        this.bullets = [];
        this.enemies = [];
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            "GAME OVER😢\nTap to Restart",
            {
                fontSize: "48px",
                color: "#000",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        this.enemyBullets.forEach(b => b.destroy());
        this.enemyBullets = [];

        this.input.once("pointerdown", () => {
            this.scene.restart();
        })
    }

    // stage 적용
    private applyStage(stage: StageConfig){
        this.cameras.main.setBackgroundColor(stage.backgroundColor);
    }
    
}