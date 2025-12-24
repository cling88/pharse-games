import type {Status} from '../types';

export interface EnemyData {
    name: string;
    stats: Status;
    traits?: string[]; // 예: ['회피', '방어력']
}

export const ENEMIES: Record<string, EnemyData> = {
    shadow: {
        name: '숲의 그림자',
        stats: {
            hp: 20,
            maxHp: 20,
            atk: 5,
            move: 3
        }
    },
    hunter: {
        name: '숲의 사냥꾼',
        stats: {
            hp: 18,
            maxHp: 18,
            atk: 7,
            move: 4
        },
        traits: ['회피']
    },
    guardian: {
        name: '숲의 파수꾼',
        stats: {
            hp: 30,
            maxHp: 30,
            atk: 9,
            move: 2
        },
        traits: ['방어력']
    },
    boss: {
        name: '숲의 수호자',
        stats: {
            hp: 120,
            maxHp: 120,
            atk: 12,
            move: 3
        },
        traits: ['2턴마다 강공격']
    }
}