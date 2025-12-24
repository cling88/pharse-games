
// 좌표 
export interface GridPosition {
    x: number; 
    y: number;
}

// 스텟
export interface Status {
    hp: number;
    maxHp: number;
    atk: number;
    move: number;
}

export type EntityType = 'player' | 'enemy' | 'boss';
export type SkillTyp = 'melee' | 'ranged' | 'buffer';
export type StageId = 'stage1' | 'stage2' | 'stage3' | 'boss';
export type EndingType = 'happy' | 'neutral' | 'bad';
export type ItemType = 'potion' | 'skill_reset';

export interface Item {
    id: string;
    type: ItemType;
    name: string;
    position: GridPosition;
}