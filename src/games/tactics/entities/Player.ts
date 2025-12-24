import type { GridPosition, Status } from "../types";
import { Skill } from "./Skill";
import { SKILLS } from "../data/skill";

export class Player {
    name = '철수';
    position: GridPosition;
    stats: Status;
    level = 1;
    exp=0; 
    expToNextLevel = 100;
    skills: Skill[] = [];
    buff: {
        damageBonus: number; // 데미지 증가율 (0.3 = 30%)
        damageReduction: number; // 받는 데미지 감소율 (0.3 = 30% 감소)
        criticalChange?: number; // 크리티컬 확률 (Lv.3)
        turnsRemaining: number; // 남은 턴 수
    } | null = null; 

    constructor(startPosition: GridPosition) {
        this.position = startPosition;
        this.stats = {
            hp: 60,
            maxHp: 60,
            atk: 10,
            move: 3
        }

        // 시작 시 3개 스킬 모두 보유
        const quickStrikeData = SKILLS.find(s => s.id === 'quick_strike');
        if(quickStrikeData) {
            this.skills.push(new Skill(quickStrikeData));
        }

        const throwingDaggerData = SKILLS.find(s => s.id === 'throwing_dagger');
        if(throwingDaggerData) {
            this.skills.push(new Skill(throwingDaggerData));
        }

        const focusData = SKILLS.find(s => s.id === 'focus');
        if(focusData) {
            this.skills.push(new Skill(focusData));
        }
    }

    
    
    modifyHp(amount:number) {
        this.stats.hp = Math.max(0, Math.min(this.stats.maxHp, this.stats.hp + amount))
    }

    moveTo(position: GridPosition) {
        this.position = position;
    }

    isAlive(): boolean {
        return this.stats.hp > 0;
    }

    getSkill(skillId: string): Skill | undefined {
        return this.skills.find(s => s.id === skillId);
    }

    // 버프 적용
    applyBuff(damageBonus: number, damageReduction: number, turns: number, criticalChange?: number) {
        this.buff = {
            damageBonus,
            damageReduction,
            criticalChange: criticalChange || 0,
            turnsRemaining: turns
        }
    }
    // 버프 제거
    removeBuff() {
        this.buff = null;
    }
    // 버프 턴 감소 (턴 종료 시 호출)
    decreaseBuffTurn() {
        if(this.buff) {
            this.buff.turnsRemaining--;
            if(this.buff.turnsRemaining <= 0) {
                this.removeBuff();
            }
        }
    }

    // 경험치 추가 및 레벨업 체크 
    addExp(amount: number): boolean {
        this.exp += amount;
        if(this.exp >= this.expToNextLevel) {
            this.levelUp();
            return true;
        }
        return false;
    }

    levelUp() {
        this.level++;
        this.exp -= this.expToNextLevel;
        this.expToNextLevel = 100 + (this.level - 1) * 50;
        // 스탯 자동 증가
        this.stats.maxHp += 5; 
        this.stats.hp = this.stats.maxHp; // 레벨업 시 풀체력 회복
        this.stats.atk += 1;
        // 이동력은 레벨 3에서만 증가
        if(this.level === 3) {
            this.stats.move = Math.min(4, this.stats.move + 1);
        }
    }
}