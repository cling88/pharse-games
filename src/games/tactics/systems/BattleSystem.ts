import type { Player } from "../entities/Player";

export class BattleSystem {
    // 버프를 고려한 데미지 계산
    calculateDamageWithBuff(player: Player, baseDamage: number): number {
        let damage = baseDamage;
        if(player.buff && player.buff.damageBonus > 0) {
            const bonus = Math.floor(damage * player.buff.damageBonus);
            damage += bonus;
            if(player.buff.criticalChange && Math.random() < player.buff.criticalChange) {
                damage = Math.floor(damage * 1.5);
            }
        }
        return damage;
    }
}
