import Phaser from "phaser";
import type {StageId, GridPosition, EndingType, Item, ItemType} from "../types";
import { STAGES } from "../data/stage";
import { ENEMIES } from "../data/enemies";
import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import { Skill } from "../entities/Skill";
import { ITEMS } from "../data/item";
import { GridSystem } from "../systems/GridSystem";
import { SkillSystem } from "../systems/SkillSystem";
import { BattleSystem } from "../systems/BattleSystem";

export default class BattleScene extends Phaser.Scene {
    private stageId!: StageId;
    private player!: Player;
    private enemies: Enemy[] = [];
    private gridSize = 60;
    private mapSize = {width: 6, height: 6}
    private playerSprite!: Phaser.GameObjects.Arc;
    private enemySprites: Phaser.GameObjects.Arc[] = [];
    private enemyTexts: Phaser.GameObjects.Text[] = []; // 적 HP 텍스트
    // 턴제 시스템 
    private moveableCells: Phaser.GameObjects.Rectangle[] = [];
    private actionText!: Phaser.GameObjects.Text; 
    // 스킬 
    private skillButtons: Phaser.GameObjects.Rectangle[] = [];
    private selectedSkill: Skill | null = null;
    private isSelectingSkill = false;
    private endTurnButton: Phaser.GameObjects.Rectangle | null = null; // 턴 종료 버튼
    // 아이템
    private items:Item[] = [];
    private itemSprites: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[] = [];
    private itemModal: Phaser.GameObjects.Container | null = null; // 아이템 획득 팝업 
    // 시스템
    private gridSystem!: GridSystem;
    private skillSystem!: SkillSystem;
    private battleSystem!: BattleSystem;

    constructor() {
        super("BattleScene");
    }

    init(data: {stageId: StageId, player?: Player}) {
        this.stageId = data.stageId || 'stage1';
        // 이전 스테이지의 플레이어 데이터 전달받기 (있는 경우)
        if (data.player) {
            this.player = data.player;
            // 스테이지 클리어 시 각 스킬 사용 횟수 +1
            this.player.skills.forEach(skill => {
                skill.useCount += 1;
            });
        }
    }

    create() {
        const stageConfig = STAGES[this.stageId];
        this.mapSize = stageConfig.mapSize;
        this.cameras.main.setBackgroundColor(stageConfig.bgColor);
        
        // 시스템 초기화
        this.gridSystem = new GridSystem(this, this.gridSize, this.mapSize);
        this.skillSystem = new SkillSystem();
        this.battleSystem = new BattleSystem();
        
        // 맵 크기 변경 시 GridSystem 업데이트
        this.gridSystem.updateMapSize(this.mapSize);
        
        // 플레이어 생성 (이미 전달받은 경우 제외)
        if (!this.player) {
        const playerStartPos: GridPosition = {x: 1, y: this.mapSize.height - 2};
        this.player = new Player(playerStartPos);
        } else {
            // 플레이어 위치 재설정
            const playerStartPos: GridPosition = {x: 1, y: this.mapSize.height - 2};
            this.player.moveTo(playerStartPos);
        }
        // 적 생성
        this.createEnemies(stageConfig.enemyCount);
        // 아이템 생성
        this.createItems();

        this.drawGrid();
        this.drawEntities();
        this.updateUI();

        this.startPlayerTurn();

    }

    createEnemies(count: number) {
        // 보스전
        if(this.stageId === "boss") {
            const x = Math.floor(this.mapSize.width / 2);
            const y = Math.floor(this.mapSize.height / 2);
            const position: GridPosition = {x, y};
            const enemyData = ENEMIES['boss'];
            const boss = new Enemy(enemyData, position);
            this.enemies.push(boss);

            // 일반 적 3명 생성
            const enemyTypes = ['shadow', 'hunter', 'guardian'];
            for(let i = 0; i < 3; i++) {
                const x = Phaser.Math.Between(this.mapSize.width - 3, this.mapSize.width - 1);
                const y = Phaser.Math.Between(0, 2);
                const position: GridPosition = {x, y};
                const enemyType = enemyTypes[Phaser.Math.Between(0, enemyTypes.length - 1)];
                const enemyData = ENEMIES[enemyType];
                const enemy = new Enemy(enemyData, position);
                this.enemies.push(enemy);
            }
            return;
        }
        // 일반스테이지 
        const enemyTypes = ['shadow', 'hunter', 'guardian'];
        for(let i = 0; i< count; i++) {
            const x = Phaser.Math.Between(this.mapSize.width - 3, this.mapSize.width - 1);
            const y = Phaser.Math.Between(0, 2);
            const position: GridPosition = {x, y};
            const enemyType = enemyTypes[Phaser.Math.Between(0, enemyTypes.length - 1)];
            const enemyData = ENEMIES[enemyType];
            const enemy = new Enemy(enemyData, position);
            this.enemies.push(enemy);
        }
    }
    // 아이템 생성
    createItems() {
        this.items = [];
        if(this.stageId === "stage2") {
            // 회복아이템 1개
            this.spawnItem('potion', 1);
        } else if(this.stageId === "stage3"){
            this.spawnItem('potion', 1);
            this.spawnItem('skill_reset', 1);
        } else  if(this.stageId === "boss") {
            this.spawnItem('potion', 2);
            this.spawnItem('skill_reset', 2);
        }
    }

    spawnItem(itemType:ItemType, count: number) {
        for(let i=0; i<count; i++) {
            let position: GridPosition;
            let attempts = 0;
            // 빈 위치 찾기 
            do {
                position = {
                    x: Phaser.Math.Between(1, this.mapSize.width - 2),
                    y: Phaser.Math.Between(1, this.mapSize.height - 2)
                };
                attempts++;
            } while (
                attempts < 50 && (
                    // 플레이어와 위치 겹치는지 확인
                    (position.x === this.player.position.x && position.y === this.player.position.y) ||
                    // 적과 위치 겹치는지 확인
                    this.enemies.some(e => e.position.x === position.x && e.position.y === position.y) ||
                    // 다른 아이템과 겹치는지 확인
                    this.items.some(item => item.position.x === position.x && item.position.y === position.y)
                )
            );
            const itemData = ITEMS[itemType];
            const item:Item = {
                id: `${itemType}_${i}_${Date.now()}`,
                type: itemType,
                name: itemData.name,
                position: position
            }
            this.items.push(item);
        }
    }

    drawGrid() {
        this.gridSystem.drawGrid();
    }
    drawEntities(){
        const {startX, startY} = this.gridSystem.getGridStartPosition();

        // 플레이어 그리기
        const playerX = startX + this.player.position.x * this.gridSize + this.gridSize / 2;
        const playerY = startY + this.player.position.y * this.gridSize + this.gridSize / 2;
        this.playerSprite = this.add.circle(playerX, playerY, this.gridSize / 3, 0x3498db);

        // 적 그리기 및 HP 표시
        this.enemySprites = [];
        this.enemyTexts = [];
        
        this.enemies.forEach(enemy => {
            const enemyX = startX + enemy.position.x * this.gridSize + this.gridSize / 2;
            const enemyY = startY + enemy.position.y * this.gridSize + this.gridSize / 2;
            
            // 적 원형 스프라이트
            const enemySprite = this.add.circle(enemyX, enemyY, this.gridSize / 3, 0xe74c3c);
            this.enemySprites.push(enemySprite);
            
            // 적 HP 텍스트 (적 위에 표시)
            const hpText = this.add.text(
                enemyX,
                enemyY - this.gridSize / 2 - 15,
                `${enemy.name}\nHP: ${enemy.stats.hp}/${enemy.stats.maxHp}`,
                {
                    fontSize: "12px",
                    color: "#fff",
                    backgroundColor: "#000",
                    padding: { x: 5, y: 3 },
                    align: "center"
                }
            ).setOrigin(0.5);
            this.enemyTexts.push(hpText);
        });

        // 아이템 그리기 
        this.itemSprites.forEach(sprite => sprite.destroy());
        this.itemSprites = [];
        this.items.forEach(item => {
            const itemX = startX + item.position.x * this.gridSize + this.gridSize / 2;
            const itemY = startY + item.position.y * this.gridSize + this.gridSize / 2;
            // 아이템 색상 (회복 물약: 파란색, 스킬 초기화: 노란색)
            const itemColor = item.type === "potion" ? 0x3498db : 0xf1c40f;
            const itemSprite = this.add.rectangle(
                itemX,
                itemY,
                this.gridSize / 2,
                this.gridSize / 2,
                itemColor,
                0.8
            );
            // 아이템 이름 텍스트
            const itemText = this.add.text(
                itemX,
                itemY,
                item.type === 'potion' ? '💊' : '🔄',
                {
                    fontSize: "20px",
                    color: "#fff"
                }
            ).setOrigin(0.5);
            this.itemSprites.push(itemSprite);
            this.itemSprites.push(itemText);
        })
    }
    updateUI() {
        const {width} = this.scale;
        // 기존 ui 제거
        const existingUI = this.children.list.filter((child: any) => child.isUI);
        existingUI.forEach((ui: any) => ui.destroy());
        
        // 플레이어 HP 표시 (최대값 보장)
        const playerHp = Math.min(this.player.stats.hp, this.player.stats.maxHp);
        this.add.text(
            width / 2,
            30,
            `HP: ${playerHp} / ${this.player.stats.maxHp}`,
            {
                fontSize: "24px",
                color: "#fff",
                backgroundColor: "#000",
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5).setData("isUI", true);
        
        // 버프 상태 표시 (버프가 있을 때만)
        if(this.player.buff && this.player.buff.turnsRemaining > 0) {
            const bonusPercent = Math.floor(this.player.buff.damageBonus * 100);
            const reductionPercent = Math.floor(this.player.buff.damageReduction * 100);
            const critText = this.player.buff.criticalChange ? `크리 ${Math.floor(this.player.buff.criticalChange * 100)}%` : "";
            const buffText = `✨ 집중 (공격 +${bonusPercent}%, 받는 데미지 ${reductionPercent}% 감소${critText}, ${this.player.buff.turnsRemaining}턴)`;
            this.add.text(
                width / 2,
                60,
                buffText,
                {
                    fontSize: "14px",
                    color: "#00ffff",
                    backgroundColor: "#000",
                    padding: { x: 8, y: 4 } 
                }
            ).setOrigin(0.5).setData("isUI", true);
        }
    }

    // 플레이어 턴 시작
    startPlayerTurn() {
        this.selectedSkill = null;
        this.isSelectingSkill = false;
        // 기존 턴 종료 버튼 제거
        if(this.endTurnButton) {
            this.endTurnButton.destroy();
            this.endTurnButton = null;
        }
        this.updateActionText("스킬을 선택하거나 이동하세요");
        this.showSkillButtons();
        this.showMoveableCells();
        // 턴 종료 버튼 항상 표시
        this.showEndTurnButton();
    }
    // 이동 가능한 셀 표시 
    showMoveableCells() {
        // 기존 이동 가능 셀 제거 
        this.moveableCells.forEach(cell => cell.destroy());
        this.moveableCells = [];
        
        // 플레이어 이동 범위 내의 셀 표시 
        for(let y = 0; y < this.mapSize.height; y++) {
            for(let x = 0; x < this.mapSize.width; x++) {
                const distance = Phaser.Math.Distance.Between(
                    this.player.position.x, this.player.position.y,
                    x, y
                );
                if(distance <= this.player.stats.move && distance > 0) {
                    // 다른 유닛이 있는지 확인
                    const hasEnemy = this.enemies.some(e => e.position.x === x && e.position.y === y);
                    const targetPos: GridPosition = {x, y};
                    
                    if(hasEnemy && distance <= 1) {
                        // 적이 있는 셀 + 기본 공격 사정거리 1 이내 - 공격 가능 표시 (빨간색)
                        const cell = this.gridSystem.createCell(targetPos, 0xff0000, 0.3, () => {
                            const targetEnemy = this.enemies.find(e => e.position.x === x && e.position.y === y);
                            if (targetEnemy) {
                                if (this.isSelectingSkill && this.selectedSkill) {
                                    this.useSkill(this.selectedSkill, targetEnemy);
                                } else {
                                    this.playerAttack(targetEnemy);
                                }
                            }
                        });
                        this.moveableCells.push(cell);
                    } else if(!hasEnemy) {
                        // 빈 셀 - 이동 가능 표시 (초록색)
                        const cell = this.gridSystem.createCell(targetPos, 0x00ff00, 0.3, () => {
                            if (!this.isSelectingSkill) {
                                this.movePlayer(targetPos);
                            }
                        });
                        this.moveableCells.push(cell);
                    }
                }
            }
        }
    }

    // 스킬 버튼 표시 
    showSkillButtons () {
        this.skillButtons.forEach(btn => btn.destroy());
        this.skillButtons = [];
        const {width, height} = this.scale;
        const buttonY = height - 100; 
        const buttonWidth = 120;
        const buttonHeight = 40;
        const spacing = 10; 
        const startX = width / 2 - (this.player.skills.length * (buttonWidth + spacing)) / 2;

        this.player.skills.forEach((skill, index) => {
            const buttonX = startX + index * (buttonWidth + spacing);
            // 스킬 사용 가능 여부 확인 (각 스킬별 사용 횟수)
            const canUse = skill.useCount > 0;
            // 버튼 배경 (사용 불가능하면 회색)
            const buttonColor = canUse ? 0x3498db : 0x7f8c8d;
            const button = this.add.rectangle(
                buttonX + buttonWidth / 2,
                buttonY,
                buttonWidth,
                buttonHeight,
                buttonColor,
                0.8
            ).setInteractive({useHandCursor: canUse});
            this.add.text(
                buttonX + buttonWidth / 2,
                buttonY,
                `${skill.name}\nLv.${skill.level} (${skill.useCount})`,
                {
                    fontSize: "14px",
                    color: "#fff",
                    align: "center"
                }
            ).setOrigin(0.5);

            button.on("pointerdown", () => {
                if (canUse) {
                    // 이미 선택된 스킬을 다시 클릭하면 취소
                    if(this.isSelectingSkill && this.selectedSkill && this.selectedSkill.id === skill.id) {
                        this.cancelSkillSelection();
                    } else {
                        this.selectSkill(skill);
                    }
                } else {
                    this.updateActionText(`${skill.name} 사용 횟수가 부족합니다!`);
                }
            });

            button.on('pointerover', () => {
                button.setFillStyle(0x2980b9, 0.9);
            })
            button.on('pointerout', () => {
                button.setFillStyle(0x3498db, 0.9);
            });
            this.skillButtons.push(button);
        })
    }

    // 스킬 선택
    selectSkill(skill: Skill) {
        this.selectedSkill = skill;
        this.isSelectingSkill = true;
        this.updateActionText(`${skill.name} 선택됨. 대상을 선택하세요. (다시 클릭하면 취소)`);
        // 버튼 강조
        this.skillButtons.forEach((btn, index) => {
            if(this.player.skills[index].id === skill.id) {
                btn.setFillStyle(0x2ecc71, 1);
            } else {
                btn.setFillStyle(0x3498db, 0.8);
            }
        });
        // 공격 가능한 범위 다시 표시 (스킬 사거리 고려)
        this.showAttackableCells(skill);
    }
    
    // 스킬 선택 취소
    cancelSkillSelection() {
        this.selectedSkill = null;
        this.isSelectingSkill = false;
        this.updateActionText("스킬 선택 취소됨. 스킬을 선택하거나 이동하세요.");
        // 버튼 색상 원래대로
        this.skillButtons.forEach((btn, index) => {
            const skill = this.player.skills[index];
            const canUse = skill.useCount > 0;
            btn.setFillStyle(canUse ? 0x3498db : 0x7f8c8d, 0.8);
        });
        // 이동 가능한 셀 다시 표시
        this.showMoveableCells();
    }
    
    // 공격 가능한 셀 표시 (스킬 선택 시)
    showAttackableCells(skill: Skill) {
        // 기존 이동 가능 셀 제거 
        this.moveableCells.forEach(cell => cell.destroy());
        this.moveableCells = [];

        // 버프스킬은 자기 자신에게 사용
        if(skill.type === "buffer") {
            const cell = this.gridSystem.createCell(this.player.position, 0x00ffff, 0.5, () => {
                this.useSkill(skill, null);
            });
            this.moveableCells.push(cell);
            return;
        }

        const skillRange = this.skillSystem.getSkillRange(skill);
        // 색상 결정 (근접: 빨강, 원거리: 주황)
        const cellColor = skill.type === "ranged" ? 0xff6600 : 0xff0000;
        
        // 플레이어 위치 기준으로 공격 가능한 셀 찾기 
        for (let x = 0; x < this.mapSize.width; x++) {
            for(let y = 0; y < this.mapSize.height; y++) {
                const distance = Phaser.Math.Distance.Between(
                    this.player.position.x, this.player.position.y,
                    x, y
                );
                // 사거리 내에 있는 셀만 표시 
                if(distance <= skillRange && distance > 0) {
                    const hasEnemy = this.enemies.some(e => e.position.x === x && e.position.y === y);
                    // 적이 있는 셀만 공격 가능 표시 
                    if(hasEnemy) {
                        const targetPos: GridPosition = {x, y};
                        const cell = this.gridSystem.createCell(targetPos, cellColor, 0.4, () => {
                            const targetEnemy = this.enemies.find(e => e.position.x === x && e.position.y === y);
                            if(targetEnemy) {
                                this.useSkill(skill, targetEnemy);
                            }
                        });
                        this.moveableCells.push(cell);
                    }
                }
            }
        }
    }

    handleSkillTarget(pointer: Phaser.Input.Pointer, skill: Skill) {
        if(!skill) return;
        const targetPos = this.gridSystem.pointerToGridPosition(pointer);
        if(!targetPos) {
            this.startPlayerTurn();
            return;
        }
        
        const distance = Phaser.Math.Distance.Between(
            this.player.position.x, this.player.position.y,
            targetPos.x, targetPos.y
        );
        const skillRange = this.skillSystem.getSkillRange(skill);
        
        // 근접 스킬인 경우 거리 1이내만 가능 
        if(skill.type === "melee" && distance > 1) {
            this.updateActionText("적이 너무 멀리 있습니다. 다시 선택하세요.");
            return;
        } else if(skill.type === "ranged" && (distance > skillRange || distance === 0)) {
            this.updateActionText(`사거리 밖입니다! (사거리: ${skillRange}) 다시 선택하세요.`);
            return;
        }

        // 적 찾기 
        const targetEnemy = this.enemies.find(e => 
            e.position.x === targetPos.x && e.position.y === targetPos.y
        );
        if(targetEnemy) {
            this.useSkill(skill, targetEnemy);
        } else {
            this.updateActionText("대상이 없습니다. 다시 선택하세요.");
        }
    }

    // 스킬 사용
    useSkill(skill:Skill, target: Enemy | null) {
        if(skill.id === 'quick_strike') {
            this.useQuickStrike(skill, target!);
        } else if(skill.id === "throwing_dagger") {
            this.useThrowingDagger(skill, target!);
        } else if(skill.id === "focus") {
            this.useFocus(skill);
        }
    }
    // 빠른 일격 스킬
    useQuickStrike(skill:Skill, target: Enemy ){
        // 스킬 사용 횟수 확인
        if (skill.useCount <= 0) {
            this.updateActionText("스킬 사용 횟수가 부족합니다!");
            this.startPlayerTurn();
            return;
        }
        
        // 스킬 사용 횟수 감소
        skill.useCount--;
        
        // 빠른 일격 스킬 데미지 계산
        let damage = this.player.stats.atk;
        let hitCount = 1; 
        
        // 스킬 기본 보너스 (레벨 1부터 적용)
        if(skill.id === 'quick_strike') {
            // Lv1: 기본 공격보다 +30% (10 → 13)
            // Lv2: 기본 공격보다 +50% (10 → 15)
            // Lv3: 기본 공격보다 +50% + 추가 타격
            const bonusMultiplier = skill.level >= 2 ? 1.5 : 1.3;
            damage = Math.floor(damage * bonusMultiplier);
            
            if(skill.level >= 3) {
                hitCount = 2; // 추가 1회 타격
            }
        }

        // 버프: 공격 데미지 증가 적용 (스킬 데미지에 추가)
        damage = this.battleSystem.calculateDamageWithBuff(this.player, damage);

        // 공격 실행
        let totalDamage = 0; 
        for(let i = 0; i < hitCount; i++) {
            target.modifyHp(-damage);
            totalDamage += damage;
        }
        
        // 스킬 메시지 (기본 공격과 구분)
        const damageText = hitCount > 1 ? `${damage} x ${hitCount}` : `${totalDamage}`;
        this.updateActionText(
            `⚔️ ${skill.name} (Lv.${skill.level})! ${damageText} 데미지!`
        );
        // 적 사망 체크 
        if(!target.isAlive()) {
            this.enemies = this.enemies.filter(e => e !== target);
            this.updateActionText(`${target.name} 처치!`);
        }
        this.endTurnAfterAction();
    }

    useThrowingDagger(skill: Skill, target: Enemy) {
        if(skill.useCount <= 0) {
            this.updateActionText("스킬 사용 횟수가 부족합니다!");
            this.startPlayerTurn();
            return;
        }
        // 거리체크
        const distance = Phaser.Math.Distance.Between(
            this.player.position.x, this.player.position.y,
            target.position.x, target.position.y
        );
        const skillRange = this.skillSystem.getSkillRange(skill);
        
        if (distance > skillRange) {
            this.updateActionText("사거리 밖입니다!");
            this.startPlayerTurn();
            return;
        }
        
        // 스킬 사용 횟수 감소
        skill.useCount--;
        // 투척 단검 데미지 계산 (기본 공격과 동일)
        let damage = this.battleSystem.calculateDamageWithBuff(this.player, this.player.stats.atk);

        // 레벨 3 이상이면 방어 무시 (추후 방어력 시스템 구현 시 적용)
        target.modifyHp(-damage);
        this.updateActionText(
            `🗡️ ${skill.name} (Lv.${skill.level})! ${damage} 데미지!`
        )
        // 적 사망 체크
        if(!target.isAlive()) {
            this.enemies = this.enemies.filter(e => e !== target);
            this.updateActionText(`${target.name} 처치!`);
        }
        this.endTurnAfterAction();
    }

    //집중 스킬 버프 - 공격 데미지 증가, 받는 데미지 감소
    useFocus (skill: Skill) {
        if(skill.useCount <= 0) {
            this.updateActionText("스킬 사용 횟수가 부족합니다");
            this.startPlayerTurn();
            return;
        }

        skill.useCount--;
        // 버프 적용 (레벨별 효과)
        let damageBonus = 0.3;
        let damageReduction = 0.3;
        let criticalChance = 0;
        // 버프 지속 턴 수 
        let turns = 3;
        if(skill.level >= 2) {
            damageBonus = 0.4;
            damageReduction = 0.4;
        }
        if(skill.level >= 3) {
            damageBonus = 0.5;
            damageReduction = 0.5;
            criticalChance = 0.2;
        }

        this.player.applyBuff(damageBonus, damageReduction, turns, criticalChance);
        this.updateActionText(
            `✨ ${skill.name} (Lv.${skill.level})! ${turns}턴 동안 공격력 +${Math.floor(damageBonus * 100)}%, 받는 데미지 ${Math.floor(damageReduction * 100)}% 감소!`
        );
        this.updateUI();
        //
        this.skillButtons.forEach(btn => btn.destroy());
        this.skillButtons = [];
        this.isSelectingSkill = false;
        this.selectedSkill = null;

        this.endPlayerTurn();
    }
    
    updateActionText(text: string){
        const {width} = this.scale;
        if(this.actionText) {
            this.actionText.destroy();
        }
        this.actionText = this.add.text(
            width / 2,
            70,
            text,
            {
                fontSize: "20px",
                color: "#fff",
                backgroundColor: "#000",
                padding: {x: 10, y: 5}
            }
        ).setOrigin(0.5).setData("isUI", true);
    }

    handleGridClick(pointer: Phaser.Input.Pointer) {
        if(this.isSelectingSkill && this.selectedSkill) {
            // 스킬 선택 중일 때 그리드 밖 클릭하면 스킬 선택 취소
            const targetPos = this.gridSystem.pointerToGridPosition(pointer);
            if(!targetPos) {
                this.cancelSkillSelection();
                return;
            }
            this.handleSkillTarget(pointer, this.selectedSkill);
            return;
        }
        
        const clickedPos = this.gridSystem.pointerToGridPosition(pointer);
        if(!clickedPos) {
            // 그리드 밖 클릭 시 아무것도 하지 않음 (턴 유지)
            return;
        }
        const distance = Phaser.Math.Distance.Between(
            this.player.position.x, this.player.position.y,
            clickedPos.x, clickedPos.y 
        )

        // 적이 있는지 확인
        const targetEnemy = this.enemies.find(e => e.position.x === clickedPos.x && e.position.y === clickedPos.y);
        
        if(targetEnemy) {
            // 적이 있는 경우: 기본 공격 사정거리 체크 (거리 1 이내만 가능)
            if(distance <= 1) {
                this.playerAttack(targetEnemy);
            } else {
                // 공격 사정거리 밖
                this.updateActionText("기본 공격은 거리 1 이내만 가능합니다.");
            }
        } else {
            // 빈 셀: 이동 가능한 거리인지 체크
            if(distance <= this.player.stats.move) {
                // 이동
                this.movePlayer(clickedPos);
            } else {
                // 이동 범위 밖
                this.updateActionText("이동 범위를 벗어났습니다.");
            }
        }
    }
    movePlayer(targetPos: GridPosition) {
        this.player.moveTo(targetPos);
        this.updateEntitiesVisual();
        this.checkItemCollection();
        
        // 이동 후 공격 가능한 적이 있는지 확인 (근접 공격)
        const attackableEnemy = this.findAttackableEnemy();
        
        if(attackableEnemy) {
            // 공격 가능한 적이 있으면 공격 가능한 셀 표시
            this.showAttackableCellsAfterMove();
        } else {
            // 근접 공격 불가능, 모든 스킬로도 공격 가능한지 확인
            const canAttackWithAnySkill = this.canAttackWithAnySkill();
            
            if(canAttackWithAnySkill) {
                // 스킬로 공격 가능하면 스킬 사용 가능
                this.updateActionText("이동 완료. 스킬을 사용하거나 턴을 종료하세요.");
            } else {
                // 공격할 대상이 없으면 턴 종료 버튼 표시
                this.updateActionText("이동 완료. 공격할 대상이 없습니다.");
                this.showEndTurnButton();
            }
        }
    }

    // 아이템 획득 체크
    checkItemCollection() {
        const collectedItem = this.items.find(item => 
            item.position.x === this.player.position.x &&
            item.position.y === this.player.position.y
        );
        if(collectedItem) {
            this.collectItem(collectedItem);
        }
    }
    collectItem(item:Item) {
        this.items = this.items.filter(i => i !== item);
        this.updateEntitiesVisual();
        // 아이템 효과 적용
        if(item.type === 'potion') {
            this.player.stats.hp = this.player.stats.maxHp;
            this.updateUI();
            this.showItemModal(`${item.name}을(를) 먹었습니다.\nHP가 100% 회복되었습니다.`);
        } else if(item.type === "skill_reset") {
            const initialUseCount = 3 + (this.stageId === 'stage2' ? 1 : this.stageId === 'stage3' ? 2 : this.stageId === 'boss' ? 3 : 0);
            this.player.skills.forEach(skill => {
                skill.useCount = initialUseCount;
            });
            this.updateUI();
            this.showItemModal(`${item.name}을(를) 먹었습니다.\n모든 스킬 사용 횟수가 초기화되었습니다.`);
        }
    }

    showItemModal(message:string) {
        if(this.itemModal) {
            this.itemModal.destroy();
        }
        const {width, height} = this.scale;
         // 배경 (반투명 검은색)
         const bg = this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.7
        ).setInteractive();
        const modalBox = this.add.rectangle(
            width / 2,
            height / 2,
            400,
            200,
            0x2c3e50,
            0.95
        ).setStrokeStyle(2, 0xecf0f1);
        const messageText = this.add.text(
            width / 2,
            height / 2 - 30,
            message,
            {
                fontSize: "20px",
                color: "#fff",
                align: "center",
                wordWrap: { width: 350 }
            }
        ).setOrigin(0.5);
        // 닫기 버튼
        const closeButton = this.add.rectangle(
            width / 2,
            height / 2 + 50,
            120,
            40,
            0x3498db,
            0.9
        ).setInteractive({useHandCursor: true});
        const closeText = this.add.text(
            width / 2,
            height / 2 + 50,
            "닫기",
            {
                fontSize: "18px",
                color: "#fff"
            }
        ).setOrigin(0.5);

        closeButton.on('pointerdown', () => {
            if(this.itemModal) {
                this.itemModal.destroy();
                this.itemModal = null;
            }
        });
        closeButton.on('pointerover', () => {
            closeButton.setFillStyle(0x2980b9, 0.9);
        });
        
        closeButton.on('pointerout', () => {
            closeButton.setFillStyle(0x3498db, 0.9);
        });

        this.itemModal =  this.add.container(0, 0, [bg, modalBox, messageText, closeButton, closeText]);

    }
    
    // 모든 스킬로 공격 가능한 적이 있는지 확인
    canAttackWithAnySkill(): boolean {
        for(const skill of this.player.skills) {
            if(skill.useCount <= 0) continue; // 사용 횟수 없으면 스킵
            
            if(skill.type === "buffer") {
                // 버프 스킬은 항상 사용 가능
                return true;
            }
            
            // 근접/원거리 스킬인 경우 사거리 내 적이 있는지 확인
            const skillRange = this.skillSystem.getSkillRange(skill);
            
            for(const enemy of this.enemies) {
                const distance = Phaser.Math.Distance.Between(
                    this.player.position.x, this.player.position.y,
                    enemy.position.x, enemy.position.y
                );
                if(distance <= skillRange && distance > 0) {
                    return true; // 공격 가능한 적이 있음
                }
            }
        }
        return false; // 공격할 대상이 없음
    }
    
    // 턴 종료 버튼 표시
    showEndTurnButton() {
        // 기존 버튼 제거
        if(this.endTurnButton) {
            this.endTurnButton.destroy();
        }
        
        const {width, height} = this.scale;
        const buttonX = width - 100;
        const buttonY = height - 50;
        const buttonWidth = 150;
        const buttonHeight = 40;
        
        this.endTurnButton = this.add.rectangle(
            buttonX,
            buttonY,
            buttonWidth,
            buttonHeight,
            0xe74c3c, // 빨간색
            0.8
        ).setInteractive({useHandCursor: true});
        
        this.add.text(
            buttonX,
            buttonY,
            "턴 종료",
            {
                fontSize: "18px",
                color: "#fff",
                align: "center"
            }
        ).setOrigin(0.5);
        
        this.endTurnButton.on("pointerdown", () => {
            this.endPlayerTurn();
        });
        
        this.endTurnButton.on('pointerover', () => {
            this.endTurnButton!.setFillStyle(0xc0392b, 0.9);
        });
        
        this.endTurnButton.on('pointerout', () => {
            this.endTurnButton!.setFillStyle(0xe74c3c, 0.8);
        });
    }
    
    // 이동 후 공격 가능한 적 찾기 (거리 1 이내)
    findAttackableEnemy(): Enemy | null {
        for(const enemy of this.enemies) {
            const distance = Phaser.Math.Distance.Between(
                this.player.position.x, this.player.position.y,
                enemy.position.x, enemy.position.y
            );
            if(distance <= 1) {
                return enemy;
            }
        }
        return null;
    }
    
    // 이동 후 공격 가능한 셀 표시
    showAttackableCellsAfterMove() {
        // 기존 이동 가능 셀 제거
        this.moveableCells.forEach(cell => cell.destroy());
        this.moveableCells = [];
        
        // 플레이어 위치 기준 거리 1 이내의 적 찾기
        for(const enemy of this.enemies) {
            const distance = Phaser.Math.Distance.Between(
                this.player.position.x, this.player.position.y,
                enemy.position.x, enemy.position.y
            );
            
            if(distance <= 1) {
                // 공격 가능한 적 셀 표시 (빨간색)
                const cell = this.gridSystem.createCell(enemy.position, 0xff0000, 0.4, () => {
                    this.playerAttack(enemy);
                });
                this.moveableCells.push(cell);
            }
        }
        
        this.updateActionText("이동 완료. 공격할 대상을 선택하세요.");
    }

    playerAttack(enemy: Enemy) {
        const damage = this.battleSystem.calculateDamageWithBuff(this.player, this.player.stats.atk);

        enemy.modifyHp(-damage);
        this.updateActionText(`💢 기본 공격! ${enemy.name}에게 ${damage} 데미지!`);
        // 적이 죽었는지 확인
        if(!enemy.isAlive()) {
            this.enemies = this.enemies.filter(e => e !== enemy);
            this.updateActionText(`${enemy.name} 처치!`);
        }
        this.endTurnAfterAction();
    }
    // 플레이어 턴 종료 
    endPlayerTurn() {
        this.player.decreaseBuffTurn();
        this.moveableCells.forEach(cell => cell.destroy());
        this.moveableCells = [];
        // 스킬버튼 제거
        this.skillButtons.forEach(btn => btn.destroy());
        this.skillButtons = [];
        // 턴 종료 버튼 제거
        if(this.endTurnButton) {
            this.endTurnButton.destroy();
            this.endTurnButton = null;
        }
        this.isSelectingSkill = false;
        this.selectedSkill = null;
        // 적 턴 시작
        this.time.delayedCall(250, () => {
            this.startEnemyTurn();
        })
    }
    // 적 턴 시작
    startEnemyTurn() {
        // 적이 모두 죽었는지 먼저 확인
        if(this.enemies.length === 0) {
            this.checkVictory();
            return;
        }
        
        this.updateActionText("적의 턴입니다");
        let enemyIndex = 0; 
        const processEnemy = () => {
            // 적이 모두 죽었는지 확인 (중간에 플레이어가 적을 죽인 경우 대비)
            if(this.enemies.length === 0) {
                this.checkVictory();
                return;
            }
            
            if(enemyIndex >= this.enemies.length) {
                // 모든 적 턴 종료
                this.startPlayerTurn();
                return;
            }
            const enemy = this.enemies[enemyIndex];
            this.processEnemyAction(enemy);
            enemyIndex++;
            this.time.delayedCall(400, processEnemy);
        }
        processEnemy();
    }

    // 적 행동 처리
    processEnemyAction(enemy: Enemy) {
        const distance = Phaser.Math.Distance.Between(
            enemy.position.x, enemy.position.y,
            this.player.position.x, this.player.position.y
        );
        
        if(distance <= 1) {
            // 공격 범위 내에 있으면 공격 
            let damage = enemy.stats.atk;

            // 버프: 받는 데미지 감소 적용
            if(this.player.buff && this.player.buff.damageReduction > 0) {
                const reduceDamage = Math.floor(damage * (1 - this.player.buff.damageReduction));
                damage = reduceDamage;
            }

            this.player.modifyHp(-damage);
            this.updateActionText(`${enemy.name}이 공격! ${damage} 데미지!`);
            this.updateUI();
            if(!this.player.isAlive()) {
                this.checkDefeat();
            }
        } else {
            // 플레이어에게 접근
            const dx = this.player.position.x - enemy.position.x;
            const dy = this.player.position.y - enemy.position.y; 
            let moveX = enemy.position.x;
            let moveY = enemy.position.y;
            if(Math.abs(dx) > 0 && enemy.stats.move > 0) {
                moveX += dx > 0 ? 1 : -1;
            }
            if(Math.abs(dy) > 0 && enemy.stats.move > 0) {
                moveY += dy > 0 ? 1: -1;
            }
            // 이동 가능한지 확인
            const newPos: GridPosition = {x: moveX, y: moveY};
            const canMove = moveX >= 0 && moveX < this.mapSize.width &&
                            moveY >= 0 && moveY < this.mapSize.height &&
                            !this.enemies.some(e => e !== enemy && e.position.x === moveX && e.position.y === moveY) &&
                            !(moveX === this.player.position.x && moveY === this.player.position.y);
            if(canMove) {
                enemy.moveTo(newPos);
            }
        }
        this.updateEntitiesVisual();
    }

    // 엔티티 시각화 업데이트
    updateEntitiesVisual(){
        // 기존 스프라이트 제거 
        if (this.playerSprite) {
            this.playerSprite.destroy();
        }
        this.enemySprites.forEach(sprite => sprite.destroy());
        this.enemyTexts.forEach(text => text.destroy());
        this.enemySprites = [];
        this.enemyTexts = [];
        // 다시 그리기
        this.drawEntities();
    }

    checkVictory() {
        // 스테이지 클리어 시 체력 증가 (최대 체력의 30% 회복, 최대치 초과 불가)
        const healAmount = Math.floor(this.player.stats.maxHp * 0.3);
        const newHp = Math.min(this.player.stats.maxHp, this.player.stats.hp + healAmount);
        this.player.stats.hp = newHp;

        const expGain: Record<StageId, number> = {
            stage1: 50,
            stage2: 75,
            stage3: 100,
            boss: 150
        }
        const gainedExp = expGain[this.stageId] || 50;
        const leveledUp = this.player.addExp(gainedExp);

        // 스테이지 클리어 시 모든 스킬 레벨업 (+1)
        this.player.skills.forEach(skill => {
            skill.levelUp();
        });

        this.updateActionText(
            `승리! 체력 +${healAmount} / 경험치 +${gainedExp}${leveledUp ? ' (레벨업!)' : ''} / 모든 스킬 레벨업!`
        );
        const nextStage: StageId = 
            this.stageId === "stage1" ? "stage2":
            this.stageId === "stage2" ? "stage3":
            this.stageId === "stage3" ? "boss": "boss";
        if(this.stageId === "boss") {
            // 보스 클리어 엔딩으로 
            this.time.delayedCall(1000, () => {
                const endingType: EndingType = this.player.stats.hp >= 30 ? "happy": "neutral";
                this.scene.start('EndingScene', {endingType});
            })
        } else {
            this.time.delayedCall(1000, () => {
                // LevelUpScene 없이 바로 다음 스테이지로
                this.scene.start('StoryScene', {
                    stageId: nextStage,
                    player: this.player
                });
            })
        }
    }
    checkDefeat() {
        this.updateActionText("패배");
        this.time.delayedCall(1000, () => {
            this.scene.start("EndingScene", {endingType: 'bad'})
        })
    }



    gridToPixel(gridPos: GridPosition):{x: number, y:number} {
        return this.gridSystem.gridToPixel(gridPos);
    }

    // 헬퍼 메서드: 스킬/공격 후 턴 종료 처리
    private endTurnAfterAction() {
        this.updateEntitiesVisual();
        this.updateUI();
        // 스킬 버튼 제거
        this.skillButtons.forEach(btn => btn.destroy());
        this.skillButtons = [];
        this.isSelectingSkill = false;
        this.selectedSkill = null;
        
        // 잠시 대기 후 적 턴 시작
        this.time.delayedCall(500, () => {
            if(this.enemies.length === 0) {
                this.checkVictory();
            } else {
                this.endPlayerTurn();
            }
        });
    }
}