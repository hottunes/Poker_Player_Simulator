export class Character {
    constructor(name, style) {
        this.name = name;
        this.style = style;

        // Initialize base stats
        this.stats = {
            pokerIQ: 50, // 확률 계산과 전략 이해
            insight: 50, // 블러프, 블러프 캐치, 히어로 폴드 능력
            gtoMastery: 50, // 이론적 최적 전략
            focus: 50, // 긴 토너먼트 지속성
            stamina: 50, // 연속 게임 피로 관리
            luck: 50, // 랜덤 요소
        };

        // Initialize resources
        this.resources = {
            bankroll: 1000, // 초기 자금
            reputation: 0, // 명성
            energy: 100, // 에너지
        };

        // Load stats from URL parameters if available
        this.loadFromURL();
    }

    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        // Load stats from URL
        Object.keys(this.stats).forEach((stat) => {
            const value = urlParams.get(stat);
            if (value) {
                this.stats[stat] = Math.min(100, Math.max(0, parseInt(value)));
            }
        });

        // Load resources from URL
        Object.keys(this.resources).forEach((resource) => {
            const value = urlParams.get(resource);
            if (value) {
                this.resources[resource] = parseInt(value);
            }
        });
    }

    // 스탯 수정 메서드
    modifyStat(stat, amount) {
        if (this.stats[stat] !== undefined) {
            this.stats[stat] = Math.min(
                100,
                Math.max(0, this.stats[stat] + amount)
            );
            return true;
        }
        return false;
    }

    // 자원 수정 메서드
    modifyResource(resource, amount) {
        if (this.resources[resource] !== undefined) {
            this.resources[resource] += amount;
            return true;
        }
        return false;
    }

    // 스탯 정보 반환
    getStats() {
        return { ...this.stats };
    }

    // 자원 정보 반환
    getResources() {
        return { ...this.resources };
    }

    // 전체 캐릭터 정보 반환
    getCharacterInfo() {
        return {
            name: this.name,
            style: this.style,
            stats: this.getStats(),
            resources: this.getResources(),
        };
    }
}
