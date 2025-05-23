export class Tournament {
    constructor(type, buyIn, maxPlayers) {
        this.type = type; // 'local', 'online', 'major'
        this.buyIn = buyIn;
        this.maxPlayers = maxPlayers;
        this.currentPlayers = maxPlayers; // 시작부터 가득 차있도록 설정
        this.status = "open"; // 'open', 'in_progress', 'completed'
        this.players = [];
        this.results = [];

        // 상금 계산 (바이인의 90%가 상금풀로)
        this.prizePool = Math.floor(this.buyIn * this.maxPlayers * 0.9);

        // NPC 결과 미리 생성
    }

    // 토너먼트 참가 가능 여부 확인
    canEnter(character) {
        const energyRequired = this.type === "online" ? 0 : 20;
        return (
            this.status === "open" &&
            character.resources.bankroll >= this.buyIn &&
            character.resources.energy >= energyRequired
        );
    }

    // 토너먼트 참가
    enter(character) {
        if (!this.canEnter(character)) {
            return {
                success: false,
                message: "토너먼트 참가가 불가능합니다.",
            };
        }

        // 참가비 지불
        character.modifyResource("bankroll", -this.buyIn);

        // 오프라인 토너먼트만 에너지 소모
        if (this.type !== "online") {
            character.modifyResource("energy", -20);
        }

        // NPC로 나머지 자리 채우기
        this.currentPlayers = this.maxPlayers;
        this.generateNPCResults();

        // 플레이어 결과 계산
        const result = this.calculateResult(character);
        this.results.push(result);

        return {
            success: true,
            result,
        };
    }

    // 결과 계산
    calculateResult(character) {
        const score = this.calculateScore(character);
        const totalPlayers = this.maxPlayers;
        const rank = this.calculateRank(score);
        const prize = this.calculatePrize(rank);
        const percentile = (rank / totalPlayers) * 100;

        // 상금 지급
        if (prize > 0) {
            character.modifyResource("bankroll", prize);
            // ITM 달성 시 추가 명성 부여
            const reputationGain =
                Math.floor(prize / 100) +
                this.calculateITMBonus(rank, totalPlayers);
            character.modifyResource("reputation", reputationGain);
        }

        return {
            character,
            score,
            rank,
            prize,
            percentile,
            totalPlayers,
        };
    }

    // 점수 계산
    calculateScore(character) {
        const stats = character.getStats();

        // 스킬 점수 계산 (0-1 사이 값)
        const skillBonus =
            (stats.pokerIQ * 0.3 +
                stats.insight * 0.25 +
                stats.gtoMastery * 0.2 +
                stats.focus * 0.15 +
                stats.stamina * 0.05 +
                stats.luck * 0.05) /
            100;

        // Box-Muller 변환을 사용한 정규분포 생성 (평균 50, 표준편차 15)
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        const baseScore = 50 + z * 15;

        // 스킬 보너스 (최대 25점)
        const skillScore = skillBonus * 25;

        // 운 요소 (-10 ~ +10)
        const luckFactor = Math.random() * 20 - 10;

        // 최종 점수 = 기본 점수 + 스킬 보너스 + 운 요소
        let finalScore = baseScore + skillScore + luckFactor;

        // 점수 범위 제한 (0-100)
        finalScore = Math.max(0, Math.min(100, finalScore));

        return finalScore;
    }

    // NPC 점수 생성
    generateNPCScore() {
        // Box-Muller 변환을 사용한 정규분포 생성
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        const baseScore = 50 + z * 15;

        // NPC 스킬 레벨 - 정규분포 사용 (평균 0.5, 표준편차 0.15)
        const u3 = Math.random();
        const u4 = Math.random();
        const z2 =
            Math.sqrt(-2.0 * Math.log(u3)) * Math.cos(2.0 * Math.PI * u4);
        const npcSkillLevel = Math.max(0, Math.min(1, 0.5 + z2 * 0.15));

        // 스킬 보너스 (최대 25점)
        const skillScore = npcSkillLevel * 25;

        // 운 요소 (-10 ~ +10)
        const luckFactor = Math.random() * 20 - 10;

        // 최종 점수 계산
        let finalScore = baseScore + skillScore + luckFactor;
        finalScore = Math.max(0, Math.min(100, finalScore));

        return finalScore;
    }

    generateNPCResults() {
        // 기존 결과 초기화
        this.results = [];

        // NPC 수에 따른 스킬 레벨 조정을 위한 변수
        const eliteNPCCount = Math.floor(this.maxPlayers * 0.01); // 상위 1%는 엘리트 NPC
        const strongNPCCount = Math.floor(this.maxPlayers * 0.05); // 상위 5%는 강한 NPC

        // maxPlayers - 1 만큼의 NPC 생성 (플레이어 한 자리 제외)
        for (let i = 0; i < this.maxPlayers - 1; i++) {
            let npcScore;
            if (i < eliteNPCCount) {
                // 엘리트 NPC (상위 1%) - 추가 스킬 보너스
                npcScore = this.generateNPCScore() + 10;
            } else if (i < strongNPCCount) {
                // 강한 NPC (상위 5%) - 약간의 추가 보너스
                npcScore = this.generateNPCScore() + 5;
            } else {
                // 일반 NPC
                npcScore = this.generateNPCScore();
            }

            // 점수 범위 제한
            npcScore = Math.max(0, Math.min(100, npcScore));

            this.results.push({
                character: { name: `NPC ${i + 1}` },
                score: npcScore,
                rank: 0,
                prize: 0,
            });
        }
    }

    // 토너먼트 정보 반환
    getInfo() {
        return {
            name: this.type,
            buyIn: this.buyIn,
            prizePool: this.prizePool,
            maxPlayers: this.maxPlayers,
            currentPlayers: this.currentPlayers,
            type: this.type,
            status: this.status,
            itmCount: Math.floor(this.maxPlayers * 0.15), // ITM 비율을 15%로 수정
        };
    }

    // 결과 정보 반환
    getResults() {
        return [...this.results].sort((a, b) => a.rank - b.rank);
    }

    // 순위별 상금 계산
    calculatePrize(rank) {
        if (this.maxPlayers !== 1000) {
            // 1000명이 아닌 토너먼트는 기본 상금 구조 사용
            const prizeStructure = [0.25, 0.15, 0.1, 0.08, 0.06];
            if (rank <= prizeStructure.length) {
                return Math.floor(this.prizePool * prizeStructure[rank - 1]);
            }
            return 0;
        }

        // 1000명 토너먼트 상금 구조
        const prizeStructure = {
            1: 0.23,
            2: 0.135,
            3: 0.085,
            4: 0.065,
            5: 0.055,
            6: 0.039,
            7: 0.029,
            8: 0.019,
            9: 0.013,
            10: 0.01,
            "11-15": 0.01,
            "16-20": 0.007,
            "21-25": 0.006,
            "26-30": 0.005,
            "31-35": 0.0045,
            "36-40": 0.004,
            "41-50": 0.0028,
            "51-60": 0.0024,
            "61-75": 0.0022,
            "76-100": 0.0021,
        };

        // 순위에 따른 상금 계산
        if (rank <= 10) {
            return Math.floor(this.prizePool * prizeStructure[rank]);
        } else if (rank <= 15) {
            return Math.floor(this.prizePool * prizeStructure["11-15"]);
        } else if (rank <= 20) {
            return Math.floor(this.prizePool * prizeStructure["16-20"]);
        } else if (rank <= 25) {
            return Math.floor(this.prizePool * prizeStructure["21-25"]);
        } else if (rank <= 30) {
            return Math.floor(this.prizePool * prizeStructure["26-30"]);
        } else if (rank <= 35) {
            return Math.floor(this.prizePool * prizeStructure["31-35"]);
        } else if (rank <= 40) {
            return Math.floor(this.prizePool * prizeStructure["36-40"]);
        } else if (rank <= 50) {
            return Math.floor(this.prizePool * prizeStructure["41-50"]);
        } else if (rank <= 60) {
            return Math.floor(this.prizePool * prizeStructure["51-60"]);
        } else if (rank <= 75) {
            return Math.floor(this.prizePool * prizeStructure["61-75"]);
        } else if (rank <= 100) {
            return Math.floor(this.prizePool * prizeStructure["76-100"]);
        }
        return 0;
    }

    // 순위 계산
    calculateRank(playerScore) {
        // 모든 결과의 점수를 배열로 만들고 플레이어 점수 추가
        const scores = [...this.results.map((r) => r.score), playerScore];

        // 점수 내림차순 정렬
        scores.sort((a, b) => b - a);

        // 플레이어 점수의 순위 찾기 (1-based index)
        return scores.indexOf(playerScore) + 1;
    }

    // ITM 보너스 계산
    calculateITMBonus(rank, totalPlayers) {
        const itmCount = Math.floor(totalPlayers * 0.15); // ITM 비율을 15%로 증가
        if (rank > itmCount) return 0;

        // 순위에 따른 보너스 계산
        const baseBonus = 100;
        const rankMultiplier = (itmCount - rank + 1) / itmCount;
        return Math.floor(baseBonus * rankMultiplier);
    }
}
