# 눈짓으로 먼저 묻는 책상 로봇

**NotiFYI 연구 방향 v2 · 반응 조건부 개입 (probe-contingent intervention)**

작성 2026-11-10 · 실험 전 문서(데이터 없음) · 캡스톤 포스터를 출발점으로 삼고, 이전 제안 P1–P4를 대체합니다.

> **이 문서의 표기.** [확립] 선행연구로 확인된 결과 · [가설] 우리가 제안하고 아직 검증하지 않은 것 · [구현] 지금 이 사이트와 디지털 트윈에 들어 있는 것 · [예정] 아직 하지 않은 일.
> 문헌은 2026-11-10에 서지와 초록 수준으로 확인했습니다. 제출 전에 원문을 읽고 다시 확인해야 합니다.

## 0. 결론 먼저

1. 포스터의 질문("언제, 어떻게 개입할 것인가")은 그대로 둡니다. 바꾸는 것은 답의 구조입니다. 포스터의 답은 "맥락을 인식해서 시점을 예측한다"였고, 여기서는 "**예측이 애매하면 로봇이 먼저 작게 묻는다**"입니다.
2. 로봇은 자세가 무너진 것을 보고도 바로 신호하지 않습니다. 1초가 안 되는 작은 고개 돌림(눈짓)을 먼저 보냅니다. 사용자가 쳐다보면 자세 신호로 이어가고, 반응이 없으면 눈에 보이게 물러났다가 나중에 다시 묻습니다.
3. 검증할 주장은 하나입니다. **눈짓에 대한 반응은 "지금 개입해도 되는가"에 대해 키보드나 시선 같은 수동 관찰만으로는 알 수 없는 정보를 더 주고, 그 반응을 따르는 로봇은 같은 교정 효과를 더 적은 작업 방해로 얻는다.** [가설]
4. 이 주장이 틀렸다고 판정할 기준을 미리 정했습니다(6.2). 눈짓 응답이 신호의 효과를 가르지 못하거나, 눈짓 자체가 신호만큼 방해가 되면 이 방향은 접습니다.
5. 최소 실험은 24명, 1인당 결정 시점 약 40회입니다. 결정 시점마다 눈짓 유무와 자세 신호 유무를 무작위로 정하는 2 × 2 미세 무작위 설계이고, 이 한 번의 데이터로 다섯 가지 개입 정책을 사후에 비교합니다. [예정]
6. 컨텍스추얼 밴딧, VLM, 생성형 모션에는 각각 "무엇이 얼마나 좋아지면 쓴다"는 기준을 붙였습니다(7절). 기준을 못 넘으면 쓰지 않습니다.
7. 지금 구현된 것은 디지털 트윈 위의 맥락별 동작 8개와 시연 도구입니다. 실물 로봇 구동, 시선 감지, 참가자 실험은 아직 없습니다.

## 1. 출발점: 캡스톤 포스터

<!--FIG:poster-->

### 1.1 그대로 가져가는 것

- **문제 인식.** "자세가 무너지는 이유는 바른 자세를 몰라서가 아니라, 집중하는 동안 자세를 의식하기 어렵기 때문이다." 그리고 "방해하지 않는 것과 알아차리게 하는 것은 서로 다른 문제다." 이 두 문장이 연구의 축입니다.
- **파이프라인.** 사용자 관찰 → 맥락 인식 → 개입 시점 판단 → 모션 피드백 → 사용자 반응 반영. 마지막 칸인 "사용자 반응 반영"을 이번 방향의 중심으로 끌어올립니다.
- **초기 결과의 해석.** 외형 차이는 첫인상(책상에 어울림, p = .016)에서만 유의했고, 체험 후의 알아차림 · 자세 반응 · 작업 방해에서는 유의하지 않았습니다(p ≈ .17, .53, .45). 참가자 의견은 주로 시점과 방식을 지적했습니다.

### 1.2 연구실 리뷰에서 나올 지적

1. **초기 결과는 동기이지 증거가 아닙니다.** 15명의 자기보고이고 시점을 조작하지 않았습니다. "언제가 중요하다"는 참가자 의견에서 나온 방향이지 측정된 효과가 아닙니다.
2. **III의 표는 제품 비교입니다.** 몸짓으로 자세를 알리는 물체와 로봇은 이미 연구돼 있습니다: 오래 앉으면 구부정해지는 조형물 Breakaway(2005), 자세를 따라 굽는 꽃 아바타(2015), 구부정한 자세를 흉내 내는 로봇 SitBot(2025)과 Tuotle(2026). 자세 알림 방식별 작업 방해도 이미 비교된 적이 있습니다(Haller 외, 2011). 표의 "작업 방해 검증 ✓"는 우리의 계획이지 결과가 아닙니다.
3. **접근 방법 네 줄은 도구 목록입니다.** 멀티모달 센싱, 컨텍스추얼 밴딧, 생성형 모션, VLM 라벨링이 각각 무엇을 얼마나 낫게 하는지, 그것을 무엇으로 잴지가 없습니다.
4. **가장 약한 고리에 전체가 걸려 있습니다.** 웹캠 하나와 Raspberry Pi 3B+로 작업 맥락과 집중 상태를 얼마나 맞힐 수 있는지가 불확실합니다. 시점 판단이 이 추정에 의존하면, 추정이 틀릴 때마다 사용자가 비용을 냅니다.

그래서 문제 정의는 유지하고, 답을 "더 잘 예측한다"에서 "**예측이 애매할 때는 싸게 물어본다**"로 옮깁니다.

## 2. 선행연구 검토: 무엇이 풀렸고 무엇이 남았나

<!--FIG:matrix-->

### 2.1 중단 가능성과 수용성

**이미 풀린 것** [확립]

- 작업의 경계(breakpoint)에서 알리면 방해가 줄어듭니다(Iqbal & Bailey, 2008). 최근의 IDE 현장 연구에서도 같은 모양입니다. 작업 흐름의 경계에서 준 제안은 52 %가 받아들여졌고, 작업 도중의 제안은 62 %가 기각됐습니다(Kuo 외, 2026).
- 센서로 중단 가능성을 사람의 판단에 가깝게 예측할 수 있습니다(Fogarty 외, 2005). 컴퓨터 사용 기록으로 켜지는 책상 표시등은 449명 현장 연구에서 동료의 방해를 46 % 줄였습니다(Züger 외, 2017).
- 시점이 맞으면 인상만이 아니라 성과가 바뀝니다. 피부 전도와 마우스 움직임으로 시점을 맞춘 도움은, 어긋나게 준 도움이나 무작위 시점의 도움보다 응답 정확도를 21 % 높였습니다(Liu 외, 2026).
- 끼어들기 방식 네 가지(즉시, 협상, 중재, 예약)를 비교한 고전 연구가 있고, 사용자가 받을 때를 고르는 방식이 '협상'입니다(McFarlane, 2002).

**실제 한계**

- 구조가 한 방향입니다. 시스템은 관찰하고 예측한 뒤 막거나 내보냅니다. 예측이 틀리면 비용은 사용자가 냅니다.
- 예측 모델은 개인별 데이터가 쌓여야 맞고, 키보드 기록이나 생리 센서에 기댑니다. 우리 로봇에는 피부 전도 센서가 없습니다.
- 협상 방식은 "지금 받을래요?"라는 알림 자체가 하나의 방해입니다.

**우리에게 남는 질문.** 협상을 화면의 대화상자가 아니라 주변 시야의 작은 몸짓으로 하면, 협상의 비용을 거의 0으로 만들 수 있는가?

### 2.2 로봇의 개입 시점

**이미 풀린 것** [확립]

- 중단 가능성을 분류해서 끼어드는 로봇은 더 사려 깊다고 평가받고 로봇 자신의 과제 수행도 나아졌습니다. 사람의 작업 성과는 끼어듦이 있어도 유지됐습니다(Banerjee 외, 2018).
- 정보를 얻으려고 끼어드는 로봇은 유의하게 덜 도움이 된다고 평가됩니다(Mannem 외, 2023). 사무 작업 중 끼어드는 시점은 알림과 로봇에 대한 인상을 바꿉니다(Ganal 외, 2025).
- 인지 부하가 낮을 때는 말로 거는 선제 행동이 선호됐고, 높을 때는 비언어 신호만 쓰는 선제 행동이 가장 좋은 경험을 줬습니다(Carsenti 외, 2026; 87명, 참가자 간 설계).
- 영상 연구에서 과반은 사람이 먼저 거는 상호작용을 선호했습니다(Viswanath & Buschmeier, 2026; 239명). 맥락을 보고 선택적으로 개입하는 전략과 계속 관여를 시도하는 전략의 비교(Hriscu 외, 2026; 32명), 사람들이 로봇의 끼어들기에 무엇을 기대하는지에 대한 조사(Leusmann 외, 2026)도 나왔습니다.
- 속도, 시선, 고개, 회전, 거리 같은 최소한의 비언어 단서만으로 사람들은 로봇의 끼어들기가 얼마나 급한지 읽습니다(Saulnier 외, 2011).

**가장 가까운 선행연구 두 편**

- Das 외(2015)는 사람의 시각 주의 수준을 추정해 주의를 끌기에 알맞은 때를 정하고, 상대의 관심을 감지한 뒤 눈맞춤을 만드는 로봇을 만들었습니다. 평가는 "받아들일 만하게 주의를 끌었는가"의 설문과 눈맞춤 성공률입니다.
- Chiang 외(2014)는 사용자의 주의 반응을 보고 끼어들기 전략을 강화학습으로 개인화했습니다. 워크숍 논문이고, 작업 비용과 행동 결과는 재지 않았습니다.

**실제 한계**

- 결과 변수가 대부분 인상 평가입니다. 실제 행동 변화와 작업 비용을 한 실험에서 사건 단위로 함께 잰 연구가 드뭅니다.
- 조건이 블록이나 참가자 단위로 고정됩니다. 같은 순간에 "했을 때"와 "안 했을 때"의 차이, 즉 그 순간의 인과 효과를 알 수 없습니다.
- 사용자의 반응을 본 두 연구는 "주의를 끄는 데 성공했는가"가 목표였습니다. 그 반응이 **이후 개입의 효과와 비용을 얼마나 예측하는지**는 재지 않았습니다.

### 2.3 자세 피드백 로봇과 물체

**이미 풀린 것** [확립]

- 의자 센서 기반 자세 알림에서 물리적 피드백은 화면 알림이나 진동보다 작업 흐름을 덜 방해한다고 평가됐습니다(Haller 외, 2011).
- 지각 문턱 아래 속도로 움직이는 모니터는 4시간 작업에서 빠른 자세 교정을 늘리고 불균형 자세 시간을 줄였습니다(Shin 외, 2019; 12명).
- 구부정한 자세를 흉내 내는 로봇은 교정과 자각을 높이는 경향을 보였고, 기준 조건보다 더 방해된다고 느껴지지 않았습니다(Wang 외, 2025; SitBot, 20명). 같은 발상의 책상 로봇 Tuotle도 예비 연구를 보고했습니다(Yuan 외, 2026).
- 책상 로봇 자체도 빠르게 늘고 있습니다. 가만히 있는 로봇, 사용자의 작업 · 휴식을 따라 하는 로봇, 반대로 움직이는 로봇은 각각 애완동물, 동료, 감독자처럼 다르게 지각됐습니다(Yoon 외, 2024; 36명). 기숙사에 3주 둔 학습 동반 로봇(O'Connell 외, 2024; 11명), 주의 집중을 돕는 책상 로봇의 참여 디자인(Xiang 외, 2026), 짧은 휴식을 유도하는 노트북 옆 로봇(Park 외, 2026)이 있습니다.

**실제 한계**

- 전부 "어떤 신호인가"의 연구입니다. 시점은 감지 즉시이거나 고정이고, 사용자의 반응에 따라 다음 행동을 바꾸지 않습니다.
- 로봇 쪽은 20명 안팎의 단일 세션이 대부분이라 익숙해진 뒤의 효과를 모릅니다. 휴식을 권하는 로봇의 현장 연구는 반응이 사람마다 갈린다고 보고합니다(Preston 외, 2023).

**결론.** 자세를 따라 하는 몸짓은 새롭지 않습니다. 우리 자세 신호는 기존 형식을 그대로 쓰고, 새로움은 시점과 조건부 구조에서 찾습니다.

### 2.4 표현적 모션

**이미 풀린 것** [확립]

- 동작 전의 예고와 결과에 대한 반응을 보여 주면 로봇이 무엇을 하려는지 더 잘 읽힙니다(Takayama 외, 2011).
- 기능만 수행하는 움직임보다 표현을 넣은 움직임이 관여와 로봇 인상을 높입니다(Hu 외, 2025). 언어 모델로 표현 동작을 만들 수 있고(Mahadevan 외, 2024; Huang 외, 2024), 맥락 설명에서 동작을 만들고 변조하는 방법도 나왔습니다(Hielscher 외, 2026).
- 사용자를 향하는 '주의'는 따뜻함과 의도성 인상을 올리고, 빠르고 큰 '각성'은 불편감을 올립니다(El-Helou & Pan, 2025).
- 자유도가 낮은 로봇의 감정 표현은 정확한 인식률이 높지 않습니다(Rogel 외, 2026; 100명).

**실제 한계**

- 평가가 "맥락에 맞아 보이는가", "이해되는가"의 평정에 머뭅니다. 그 동작이 사람의 행동과 작업 비용을 어떻게 바꾸는지는 거의 재지 않습니다.
- 생성 모델은 동작을 다양하게 만들지만, 실험에서 통제해야 하는 변수인 현저성(얼마나 눈에 띄는가)을 통제하기 어렵게 만듭니다.

**우리에게 남는 질문.** 표현을 보기 좋게 하는 데 쓰지 않고 **로봇의 결정 과정을 드러내는 수단**으로 쓰면 어떤가. 묻는 동작(주의는 높게, 각성은 낮게), 물러나는 동작(양보가 보이게), 확인하는 동작이 그것입니다.

### 2.5 사회적 수반성

**이미 풀린 것** [확립]

- 상대의 행동에 조건부로 반응하는 로봇은 사람의 행동을 바꿉니다. 수반적인 머리 동작은 기부액을 32 % 늘렸고(Wills 외, 2016), 반응적인 로봇은 접근 행동을 늘렸습니다(Birnbaum 외, 2016).
- 상대의 시선에 맞춰 단계적으로 상호작용에 들어가는 방식이 관여를 유지하는 수단으로 제안됐고(Pitsch 외, 2009), 불확실할 때 머뭇거림을 표현해 시간을 버는 방법도 있습니다(Bohus & Horvitz, 2014).
- 눈맞춤을 감지한 뒤 단계적으로 알림을 여는 주변 기기(Altosaar 외, 2006; AuraOrb)와 시선 위치에 따라 알림을 띄우는 화면 설계(Klauck 외, 2017)가 있습니다.
- 지각된 주체성을 재는 검증된 척도가 있습니다(Trafton 외, 2024).

**실제 한계**

- 수반성의 효과와 동작량의 효과를 가르는 통제, 즉 같은 동작을 다른 사람의 시점대로 재생하는 yoked 조건이 드뭅니다.
- 작업 중인 사람 옆의 로봇이라는 맥락에서 수반성의 비용 쪽은 검증되지 않았습니다. AuraOrb의 평가는 휴리스틱 평가였습니다.

### 2.6 적응 정책과 사용자 상태 추정

**이미 풀린 것** [확립]

- 모바일 건강 분야에서는 결정 시점마다 개입 여부를 무작위로 정하는 미세 무작위 시험(MRT)이 정착했고(Klasnja 외, 2015), 그 데이터를 바탕으로 한 강화학습 알고리즘이 실제 배포에 쓰입니다(Liao 외, 2020).
- 개입 효과는 시간이 지나며 줄어듭니다. HeartSteps에서 활동 제안은 초기에 30분 걸음 수를 66 % 늘렸지만 6주 평균은 14 %였습니다(Klasnja 외, 2019).
- 보상을 무엇으로 정하느냐가 학습된 정책을 바꿉니다(Trella 외, 2023). 공공장소 로봇의 말하기 정책을 12일간 톰슨 샘플링으로 최적화한 연구에서 세 가지 보상은 서로 다른 행동 분포를 만들었습니다(Song 외, 2026).
- 언어 모델은 별도 장치 없이는 탐색을 안정적으로 하지 못합니다(Krishnamurthy 외, 2024). 언어 모델이 만든 사전 지식으로 밴딧을 초기화하는 방법은 제안돼 있습니다(Alamdari 외, 2024).

**실제 한계**

- 밴딧은 개입 효과가 **관찰 가능한 맥락에 따라 달라질 때만** 배울 것이 있습니다. 주변 시야의 로봇 몸짓에 대해 그런 차이가 있는지는 아직 측정된 적이 없습니다.
- 사회적 로봇 연구에서 미세 무작위 설계를 쓴 사례를 찾지 못했습니다(arXiv 검색, HRI 2026 본 논문과 컴패니언 초록의 키워드 검색에서 0건).
- 적응적으로 모은 데이터에 일반적인 검정을 그대로 쓰면 추론이 틀어질 수 있습니다(Zhang 외, 2020). 학습을 시작하기 전에 무작위 데이터가 먼저 있어야 합니다.

## 3. 그래서 무엇이 새로울 수 있나

### 3.1 새롭다고 주장하면 안 되는 것

| 주장 | 이미 있는 근거 |
|---|---|
| 자세를 따라 하는 몸짓으로 알린다 | Breakaway(2005), 꽃 아바타(2015), SitBot(2025), Tuotle(2026) |
| 작업 경계에서 알리면 덜 방해된다 | Iqbal & Bailey(2008), Kuo 외(2026) |
| 맥락을 보고 끼어드는 로봇이 더 사려 깊어 보인다 | Banerjee 외(2018), Ganal 외(2025), Hriscu 외(2026) |
| 부하가 높을 때는 비언어 신호가 낫다 | Carsenti 외(2026) |
| 눈맞춤을 확인한 뒤 단계적으로 알린다 | AuraOrb(2006), Das 외(2015) |
| 정보 이득이 끼어드는 비용보다 클 때만 되묻는다 | Ghose 외(2026), 말로 하는 목표 확인 |
| 밴딧으로 개입 시점을 개인화한다 | HeartSteps(Liao 외, 2020) |
| 언어 모델로 표현 동작을 만든다 | GenEM(2024), EMOTION(2024), Hielscher 외(2026) |

### 3.2 방어할 수 있는 새로움 네 가지 [가설]

**N1. 반응을 센서로 쓴다.** 로봇의 저강도 몸짓에 대한 사용자의 반응이 이후 개입의 효과와 비용을 얼마나 예측하는지를, 수동 맥락 정보 위에 더해지는 정보량으로 잽니다. Das 외(2015)와 Chiang 외(2014)는 반응을 주의 끌기의 성공 여부로만 썼습니다.

**N2. 사람의 주의 필터를 분류기로 쓴다.** 지각 부하가 높으면 과제와 무관한 주변 자극은 의식에 닿지 않습니다(Lavie, 2005; Cartwright-Finch & Lavie, 2007). 갑작스러운 출현이 주의를 끄는 정도도 부하가 높으면 줄어듭니다(Cosman & Vecera, 2009). 포스터는 이 무주의 맹시를 문제로 들었습니다. 우리는 이것을 기제로 뒤집습니다. 충분히 약한 눈짓은 주의에 여유가 있을 때만 보이므로, **보였다는 사실이 여유가 있다는 증거**가 됩니다. 로봇이 사용자의 인지 부하를 추정하는 대신, 사용자의 지각 시스템이 걸러 주는 것입니다.

**N3. 보이는 양보.** 중단 가능성 시스템의 '참기'는 사용자에게 보이지 않습니다. 로봇이 "물어봤고, 바쁜 걸 알았고, 물러난다"를 몸으로 보여 주면 이후의 개입이 더 잘 받아들여지는지, 그 표현의 주의 비용은 얼마인지를 잽니다.

**N4. 사회적 로봇 연구를 위한 미세 무작위 요인 설계.** 결정 시점마다 눈짓과 신호를 독립적으로 무작위화하면, 눈짓 응답은 신호 여부가 정해지기 **전에** 측정된 변수가 됩니다. 그러면 응답에 따른 신호 효과의 차이를 인과적으로 추정할 수 있고, 무작위 확률을 알기 때문에 한 데이터에서 여러 정책의 가치를 사후에 추정할 수 있습니다.

여기서 "새롭다"는 2026-11-10의 검색(HRI 2026 초록 키워드 검색, arXiv, 웹 검색)에서 같은 조합을 찾지 못했다는 뜻입니다. 없다고 증명한 것은 아닙니다.

## 4. 세 가지 방향과 선택

<!--FIG:directions-->

**선택: A를 주제로 하고, B의 설계를 방법으로 씁니다. C는 후속 연구입니다.**

- A만 하면 좋은 아이디어의 시연에 그칩니다. B의 무작위 설계가 붙어야 인과 주장을 할 수 있습니다.
- B만 하면 모바일 건강의 방법론을 로봇에 옮긴 연구가 됩니다. 왜 로봇이어야 하는지가 약합니다. A가 그 이유를 줍니다. 화면 알림은 물어볼 수 없고, 로봇의 몸은 물어볼 수 있습니다.
- C는 2주 이상의 배치가 필요해서 로봇 한 대와 지금 일정으로는 무리입니다. 다만 A와 B의 사건 기록 형식을 C에서 그대로 쓰도록 설계합니다.

## 5. 선택한 방향: 눈짓으로 먼저 묻는다

### 5.1 결정 문제로 쓰기

Horvitz(1999)는 시스템이 사용자의 목표를 확신하지 못할 때의 선택을 세 구간으로 나눴습니다: 아무것도 하지 않는다, 물어본다, 실행한다. 우리 로봇의 세 구간은 **가만히 있는다, 눈짓으로 묻는다, 자세 신호를 준다**입니다. 차이는 '묻기'가 대화상자가 아니라 주변 시야의 작은 움직임이라는 점입니다.

사용자가 지금 수용적일 확률을 p라고 하겠습니다(수동 관찰로 얻은 추정). 세 행동의 기대 효용은 다음과 같습니다.

- **가만히:** −w
- **바로 신호:** p · U₁ + (1 − p) · U₀
- **눈짓을 보내고 응답이 있을 때만 신호:** −k + p · [a · U₁ − (1 − a) · w] + (1 − p) · [b · U₀ − (1 − b) · w]

w는 자세가 무너진 채 시간이 지나는 비용, U₁과 U₀는 수용적일 때와 아닐 때 신호의 순효용(교정 이득 − 방해 비용), k는 눈짓 자체의 비용, a는 수용적일 때 눈짓에 응답할 확률, b는 수용적이지 않은데 응답할 확률입니다.

<!--FIG:decision-->

이 모형에서 바로 나오는 것이 세 가지 있습니다.

1. **눈짓은 p가 중간일 때만 이득입니다.** 수동 관찰만으로 확실하면(통화 중, 자리 비움, 방금 문단을 끝냄) 물을 필요가 없습니다. 눈짓과 수동 예측은 경쟁하지 않고 서로를 보완합니다.
2. **실험이 재야 할 숫자는 넷입니다.** 눈짓 비용 k, 응답의 진단력 a와 b, 그리고 수용적일 때와 아닐 때 신호 순효용의 차이. 6절의 실험은 이 넷을 잽니다.
3. **기각 조건이 숫자로 나옵니다.** a와 b가 비슷하면, 즉 응답이 아무것도 가르지 못하면 눈짓이 이기는 구간이 사라집니다. k가 방해 비용의 차이에 가까워져도 사라집니다.

그림의 기본값은 설명을 위한 가정이고 측정값이 아닙니다. 되묻기를 정보 이득과 끼어드는 비용으로 정하는 접근은 협업 로봇의 목표 추론에서 이미 쓰였습니다(Ghose 외, 2026). 우리 쪽이 다른 점은 물음이 말이 아니라 몸짓이고, 묻는 대상이 목표가 아니라 "지금 괜찮은가"라는 점입니다.

### 5.2 로봇의 결정: 가만히, 묻기, 개입, 다음 행동 조정

<!--FIG:states-->

**가만히 있기.** 다음 중 하나면 관절을 움직이지 않습니다: 사람이 없다, 통화나 대화 중이다, 직전 신호 뒤의 불응기다, 자세가 무너진 지 얼마 안 됐다(스스로 고칠 시간을 준다). 가만히 있는 것은 기본값이 아니라 선택된 행동이고, 기록에도 하나의 행동으로 남깁니다. 가만히 있는 책상 로봇이 움직이는 로봇과 다르게 지각된다는 결과가 있기 때문입니다(Yoon 외, 2024).

**묻기(눈짓).** 고개를 사용자 쪽으로 14° 돌리고 1.2초 본 뒤 돌아옵니다. 사용자를 향하되 작고 느리게 만듭니다.

**물러나기.** 2.5초 안에 응답이 없으면 원래 자세보다 조금 더 돌아서 작게 숙였다가 자리를 잡습니다. 다음 물음까지의 간격을 늘립니다.

**개입(자세 신호).** 응답이 있으면 고개를 마저 돌려 시선을 받고, 사용자와 같이 구부정해졌다가 올려다본 뒤 함께 일어납니다. 신호의 형식은 선행연구의 자세 흉내 그대로입니다.

**확인.** 신호 뒤 20초 안에 자세가 고쳐지면 한 번 끄덕이고 불응기에 들어갑니다. 고쳐지지 않으면 재촉하지 않고 물러납니다.

**한 단계 올리기.** 두 번 물어 응답이 없고 무너진 자세가 오래 이어지면 한 단계만 올립니다(몸을 기울이고 고개를 한 번 젓습니다). 올리는 것은 한 번까지이고 소리는 쓰지 않습니다. 이 규칙은 결정 모형에서 나온 것이 아니라 설계 선택이며, 필요한지 자체가 시험 대상입니다.

**다음 행동 조정.** 응답이 없으면 수용성 추정이 내려가고 다음 물음까지의 간격이 두 배가 됩니다. 응답과 교정이 있으면 간격을 기본값으로 되돌립니다. 눈짓의 크기는 사람마다 "한가할 때 열 번 중 여덟 번 보이는" 수준으로 맞춥니다. [가설]

### 5.3 맥락별 동작 시연

<!--FIG:player-->

시연의 결정은 5.1의 모형에 가정한 수치를 넣어 계산한 것입니다. 학습된 정책이 아니고, 맥락은 보는 사람이 고른 값이지 로봇이 인식한 것이 아닙니다. [구현]

### 5.4 동작의 물리량

<!--FIG:salience-->

디지털 트윈은 여기서 자극 규격서 역할을 합니다. 모든 동작은 실제 관절의 소프트 한계, 속도 한계(90°/s), 충돌 검사를 통과했고, 눈짓은 자세 신호의 약 4분의 1만 움직입니다. 실험에서는 이 표의 수치를 자극 조건으로 보고합니다. 서보의 지연과 떨림은 들어 있지 않습니다. [구현]

## 6. 연구 질문, 가설, 실험

### 6.1 연구 질문

- **RQ1 (자기 선별).** 주변 시야의 약한 눈짓은 부하가 높을 때 덜 응답되는가?
- **RQ2 (진단력).** 눈짓에 대한 응답은 이후 자세 신호의 효과와 비용을 예측하는가? 수동 맥락 정보에 더해서도 그런가?
- **RQ3 (물음의 값).** 눈짓 자체의 작업 비용은 얼마인가?
- **RQ4 (정책 가치).** 응답을 따르는 정책은 즉시 신호 정책과 작업 경계 대기 정책보다 나은가?
- **RQ5 (수반성).** 로봇의 양보가 보이면 로봇을 더 사려 깊고 의도가 있는 존재로 보는가? 같은 동작을 수반성 없이 재생했을 때와 비교해서.

### 6.2 가설과 기각 조건 [가설]

| | 가설 | 이렇게 나오면 기각 |
|---|---|---|
| H1 | 눈짓 응답률은 고부하 구간이 저부하 구간보다 낮다 | 응답률 차이가 5 %p 미만이거나 방향이 반대 |
| H2 | 자세 신호의 교정 효과(신호 있음 − 없음)는 눈짓에 응답한 뒤가 응답하지 않은 뒤보다 크다 | 상호작용의 90 % 신뢰구간이 0을 포함하고 점추정이 5 %p 미만 |
| H3 | 눈짓만 있을 때의 타이핑 저하는 미리 정한 한계(0.35 SD) 안이고 자세 신호의 저하보다 작다 | 눈짓의 저하가 한계를 넘거나 자세 신호와 구별되지 않음 |
| H4 | 응답 조건부 정책의 추정 가치(교정 − λ · 방해)는 즉시 신호 정책과 경계 대기 정책보다 높다 | 미리 정한 λ 범위 전체에서 두 기준 정책 중 하나 이하 |
| H5 | 응답 조건부 로봇은 같은 동작을 수반성 없이 재생한 로봇보다 사려 깊음과 지각된 주체성 점수가 높다 (Study 2) | 차이가 없거나 반대 |

H2가 기각되면 N1과 N2가 무너지고 이 방향은 접습니다. H2는 서는데 H3이 기각되면 물음이 너무 비싼 것이므로 눈짓을 더 약하게 만들어 다시 시험합니다. H1만 기각되면 자기 선별 기제(N2)는 버리고, 응답을 자발적인 사회적 신호로만 해석합니다.

### 6.3 Study 1: 최소 실험 [예정]

<!--FIG:study-->

- **참가자.** 24명, 참가자 내 설계. 하루 4시간 이상 책상에서 컴퓨터를 쓰는 성인.
- **배치.** 로봇은 모니터 옆, 화면 중심에서 30–40° 벗어난 자리에 둡니다. 거리와 각도는 참가자마다 재서 기록합니다.
- **과제.** 부하가 다른 두 과제를 10분 단위로 교대합니다: 시간 제한이 있는 전사 타이핑(고부하), 자기 속도로 읽고 가끔 답하는 읽기(저부하). 부하 조작이 통했는지는 NASA-TLX와 수행으로 확인합니다.
- **결정 시점.** 평균 2.5분 간격(90–210초 사이에서 흔듦), 1인당 약 40회입니다. 50분 작업 구간 두 번으로 나눕니다.
- **무작위화.** 결정 시점마다 넷 중 하나를 뽑습니다: 가만히(15 %), 눈짓만(35 %), 신호만(15 %), 눈짓 뒤 신호(35 %). 눈짓 뒤 신호 조건에서는 **응답과 무관하게** 신호를 줍니다. 그래야 응답하지 않았을 때의 신호 효과도 관찰됩니다.
- **사건 단위 측정.** 눈짓 응답은 2.5초 안에 시선이나 머리가 로봇 쪽을 향했는가로 정합니다(외부 카메라 판독, 로봇 카메라의 판정은 비교용). 이득은 20초 안의 자세 교정과 이후 120초의 바른 자세 유지 시간입니다. 비용은 개시 전후 10초의 타이핑 속도 변화, 오타, 화면 밖 시선 시간입니다.
- **세션 단위 측정.** NASA-TLX, 방해감, 짜증과 반발, RoSAS(Carpinella 외, 2017), 지각된 주체성 척도. 이 설계에서는 조건이 한 세션에 섞여 있으므로 설문은 조건 비교가 아니라 기술 통계로만 씁니다.
- **분석.** 사건 단위 회귀에 참가자 군집 표준오차를 씁니다. H2는 눈짓이 있었던 두 조건 안에서 '신호 × 응답' 상호작용입니다(Boruvka 외, 2018의 인과 효과 조절 분석을 따름). H4는 알려진 무작위 확률로 역확률 가중한 정책 가치 추정입니다.
- **자세의 정답.** 실험에서는 측면 카메라와 사람의 판독으로 정답을 만듭니다. 로봇의 자체 감지는 이 정답과 비교해 따로 보고합니다.

**검정력(가정에 기반한 계획값).** 수용적일 때 응답 70 %, 아닐 때 20 %, 신호 뒤 교정 65 % 대 30 %, 저부하와 고부하에서 수용적일 확률 60 % 대 30 %를 가정한 시뮬레이션(2,000회)에서 24명 × 40회의 검정력은 H1 0.99, H2 0.86, H3 0.75입니다. 타이핑 비용의 상호작용은 0.44로 부족해서 탐색적 결과로만 둡니다. 실제 효과가 가정의 절반이면 H2의 검정력은 0.19로 떨어집니다. 그래서 6명의 예비 실험으로 효과 크기를 먼저 보고 인원을 다시 정합니다. 균등 배정에 28회였다면 H2의 검정력은 0.61이었습니다.

### 6.4 비교하는 정책

같은 데이터에서 사후에 가치를 추정합니다.

| 정책 | 규칙 | 대표하는 선행연구 |
|---|---|---|
| 항상 가만히 | 개입 없음 | 자연 교정률의 기준선 |
| 즉시 신호 | 결정 시점마다 바로 신호 | 자세 앱, SitBot 방식 |
| 경계 대기 | 타이핑이 2초 이상 멈춘 결정 시점에만 신호 | Iqbal & Bailey(2008) 계열 |
| 응답 조건부 | 눈짓 뒤 응답이 있을 때만 신호 | 제안 |
| 결합 | 경계면 바로 신호, 아니면 눈짓 | 5.1의 모형이 예측하는 최선 |

### 6.5 Study 2와 Study 3 [예정]

- **Study 2 (확증, 24–30명).** 정책을 실시간으로 돌립니다. 조건은 즉시 신호, 경계 대기, 응답 조건부, 그리고 응답 조건부 로봇의 동작을 다른 참가자의 시점 그대로 재생하는 yoked 조건입니다. 교정은 비열등, 방해는 우월을 검정하고 H5를 봅니다.
- **Study 3 (현장, 8–12명 × 2주).** 참가자 자신의 책상에 둡니다. 미세 무작위화를 계속하면서 효과가 날짜에 따라 줄어드는지 보고, 이 단계에서 처음으로 밴딧 개인화를 고정 규칙과 비교합니다.

### 6.6 타당도 위협

- **눈짓이 신호를 예고한다.** 눈짓 뒤에 신호가 자주 오면 참가자가 눈짓을 "곧 신호가 온다"로 학습합니다. 눈짓만 있는 조건(35 %)이 이 연합을 절반에 묶어 둡니다. 세션 안의 시간 추세는 따로 봅니다.
- **요구 특성.** 참가자가 자세 연구인 줄 알면 눈짓에 일부러 반응합니다. 안내는 "작업 중 로봇과 함께 있기"로 하고, 끝난 뒤 연구 목적을 알아챘는지 묻습니다.
- **응답의 판독.** 로봇을 보지 않고도 주변시로 알아챌 수 있습니다. 시선 응답 말고 타이핑 멈춤과 자세의 미세 변화도 응답 후보로 사전 등록합니다.
- **실험실과 실제 책상의 차이.** 50분 두 번은 몇 주 뒤를 말해 주지 않습니다. 습관화에 대한 주장은 Study 3 전에는 하지 않습니다.
- **로봇 한 대, 외형 하나.** 결과는 이 형태와 이 눈짓 크기에 한정됩니다.

## 7. VLM, 밴딧, 생성 모션을 쓰는 조건

| 도구 | 쓰는 곳 | 가치가 있다고 볼 기준 | 쓰지 않는 곳과 이유 |
|---|---|---|---|
| VLM | 녹화 영상의 맥락 라벨링(작업 종류, 통화, 자리 비움)을 오프라인으로 | 사람 판독자 2명과의 일치도 κ ≥ 0.7이고, 그 라벨이 값싼 특징(키 입력, 얼굴 방향)에 더해 수용성 예측 AUC를 0.03 이상 올릴 때 | 실시간 제어 루프. Pi 3B+에서 돌지 않고, 외부 서버로 보내면 지연이 2.5초 응답 창보다 길어질 수 있으며 책상 영상이 밖으로 나갑니다 |
| 컨텍스추얼 밴딧 | Study 3에서 눈짓 크기와 대기 간격의 개인화 | Study 1에서 개입 효과가 맥락에 따라 달라진다는 것이 먼저 확인되고, 기록 재생 평가에서 최선의 고정 규칙보다 교정당 방해가 10 % 이상 낮을 때 | Study 1과 2. 학습 중인 정책으로 모은 데이터는 가설 검정을 어렵게 합니다. 행동 4개, 맥락 특징 6개 이하의 작은 문제로 유지합니다 |
| 생성형 모션 | Study 3에서 신호의 변주(같은 현저성, 다른 형태)를 만들어 습관화를 늦추는지 시험 | 변주한 신호의 효과 감소 기울기가 고정 신호보다 완만할 때. 경고창 연구의 다형 경고(Anderson 외, 2015)와 같은 논리입니다 | Study 1과 2의 자극. 실험 변수인 현저성을 통제해야 하므로 손으로 정한 매개변수 동작을 씁니다. 생성한 동작도 트윈의 한계 · 충돌 검사와 물리량 표를 통과해야 씁니다 |
| 멀티모달 센싱 | 사람 있음, 얼굴이 로봇을 향함, 타이핑 활동, 자세 각도 | 각각을 사람의 판독과 비교한 정확도를 보고할 수 있을 때 | 인지 부하나 몰입의 직접 추정. 우리 센서로는 근거가 약하고, 눈짓이 그 역할을 대신할 수 있는지가 연구 질문입니다 |

## 8. 지금 구현된 것과 아닌 것

| 항목 | 상태 |
|---|---|
| 맥락별 동작 8개: 가만히, 눈짓, 눈짓 뒤 물러남, 눈짓 뒤 신호, 즉시 신호, 확인, 한 단계 올림, 한 에피소드 | [구현] 트윈에서 관절 한계, 속도, 충돌 검사 통과. 실물에서는 구동한 적 없음 |
| 동작의 물리량 표 | [구현] 트윈의 운동학으로 계산한 값. 측정값 아님 |
| 시나리오 시연과 결정 모형 계산기 | [구현] 설명용. 규칙과 수치는 가정 |
| Study 1 검정력 시뮬레이션 | [구현] 가정에 기반한 계획값 |
| 실물 로봇에서 동작 실행 | [예정] 조립 중. 서보 ID 지도를 확인한 뒤 |
| 얼굴이 로봇을 향했는지 감지 | [예정] |
| 자세 감지의 정확도 보고 | [예정] |
| 참가자 실험 | [예정] 윤리 심의 필요 여부를 확인한 뒤 |

3D 모델, 출력 도면, 조립 설명서 탭은 그대로입니다. 새 동작은 3D 탭의 프리셋 목록에 `ctx_`로 시작하는 이름으로 추가됐습니다.

## 9. 이전 제안 P1–P4의 처리

- **P1 (책상과의 어울림 × 신호의 시작 방식).** 주 연구에서 내립니다. 포스터의 초기 결과가 외형 효과를 지지하지 않았고 외형이 하나로 정해졌습니다. '천천히 시작 대 갑자기 시작' 조작은 눈짓의 현저성 조절로 흡수됩니다. 이전 초안과 설문 문항은 [보관 페이지](research_p1.html)에 남깁니다.
- **P2 (좁은 관절 범위에서의 감정 표현, 흐름 정합).** 보류합니다. 이번 방향에서 생성 모델은 7절의 기준을 넘을 때만 씁니다.
- **P3 (추종 오차의 지각 문턱).** 독립 논문에서 내리고 자극 검증 절차로 남깁니다. 실물 로봇의 눈짓이 트윈의 물리량 표와 얼마나 다른지 재서 보고합니다.
- **P4 (넛지는 닳는가).** Study 3으로 흡수합니다. 미세 무작위화라는 방법은 그대로이고, 무작위화하는 대상이 신호의 종류에서 눈짓과 신호로 바뀝니다.

## 10. 일정 제안

1. **지금부터 4주.** 실물 로봇에서 `ctx_` 동작 구동, 얼굴 방향 감지, 사건 기록기. 3–4명으로 눈짓 크기를 예비 조정합니다.
2. **5–8주.** 예비 실험 6명, 효과 크기로 인원 재계산, 사전 등록.
3. **9–14주.** Study 1.
4. **이후.** Study 2. 두 실험을 묶어 HRI 정규 논문으로 내거나, Study 1만으로 레이트브레이킹 리포트를 먼저 냅니다. 마감일은 학회 사이트에서 확인해야 합니다.

## 참고문헌

서지는 2026-11-10에 Crossref, OpenAlex, arXiv, ACM Digital Library, Springer, HRI 2026 프로시딩 목차에서 확인했습니다. †는 이번에 다시 확인하지 않은 항목입니다.

- Alamdari, P. A., Cao, Y., & Wilson, K. H. (2024). Jump starting bandits with LLM-generated prior knowledge. arXiv:2406.19317.
- Altosaar, M., Vertegaal, R., Sohn, C., & Cheng, D. (2006). AuraOrb: Social notification appliance. CHI '06 Extended Abstracts.
- Anderson, B. B., Kirwan, C. B., Jenkins, J. L., Eargle, D., Howard, S., & Vance, A. (2015). How polymorphic warnings reduce habituation in the brain. CHI '15.
- Banerjee, S., Silva, A., Feigh, K., & Chernova, S. (2018). Effects of interruptibility-aware robot behavior. arXiv:1804.06383. 관련: Banerjee, Silva, & Chernova (2018), ACM THRI.
- Birnbaum, G. E., Mizrahi, M., Hoffman, G., Reis, H. T., Finkel, E. J., & Sass, O. (2016). Machines as a source of consolation: Robot responsiveness increases human approach behavior and desire for companionship. HRI '16.
- Bohus, D., & Horvitz, E. (2014). Managing human-robot engagement with forecasts and... um... hesitations. ICMI '14.
- Boruvka, A., Almirall, D., Witkiewitz, K., & Murphy, S. A. (2018). Assessing time-varying causal effect moderation in mobile health. Journal of the American Statistical Association.
- Carpinella, C. M., Wyman, A. B., Perez, M. A., & Stroessner, S. J. (2017). The Robotic Social Attributes Scale (RoSAS). HRI '17.
- Carsenti, E., Manor, A., Sadka, O., 외 (2026). Designing a robot's proactivity: Adjusting the robot's communication modality to the participant's cognitive load. HRI '26 Companion.
- Cartwright-Finch, U., & Lavie, N. (2007). The role of perceptual load in inattentional blindness. Cognition.
- Chiang, Y.-S., Chu, T.-S., Lim, C. D., Wu, T.-Y., Tseng, S.-H., & Fu, L.-C. (2014). Personalizing robot behavior for interruption in social human-robot interaction. IEEE ARSO.
- Cosman, J. D., & Vecera, S. P. (2009). Perceptual load modulates attentional capture by abrupt onsets. Psychonomic Bulletin & Review.
- Das, D., Rashed, M. G., Kobayashi, Y., & Kuno, Y. (2015). Supporting human-robot interaction based on the level of visual focus of attention. IEEE Transactions on Human-Machine Systems.
- El-Helou, R., & Pan, M. K. X. J. (2025). The social life of industrial arms: How arousal and attention shape human-robot interaction. arXiv:2504.01260.
- Fogarty, J., Hudson, S. E., Atkeson, C. G., 외 (2005). Predicting human interruptibility with sensors. ACM TOCHI.
- Ganal, E., Steinhaeusser, S. C., Niebling, F., & Lugrin, B. (2025). Message for you: Observing the effects of a social robot's interruptions during an office task. ICSR+AI 2025.
- Ghose, D., Gitelson, O., Vázquez, M., & Scassellati, B. (2026). Open-ended goal inference through actions and language for human-robot collaboration. HRI '26.
- Haller, M., Richter, C., Brandl, P., 외 (2011). Finding the right way for interrupting people improving their sitting posture. INTERACT 2011.
- Hielscher, T., Scaparro, F., & Arras, K. O. (2026). Context-aware generation and modulation of expressive motion behavior using multimodal foundation models. HRI '26.
- Hong, J., Song, S., Cho, J., & Bianchi, A. (2015). Better posture awareness through flower-shaped ambient avatar. TEI '15.
- Horvitz, E. (1999). Principles of mixed-initiative user interfaces. CHI '99.
- Hriscu, L., Bo, V., Sanfeliu, A., & Garrell, A. (2026). When should robots intervene? Balancing engagement and intrusiveness in human-robot interaction. RO-MAN 2026. arXiv:2609.21734.
- Hu, Y., Huang, P., Sivapurapu, M., & Zhang, J. (2025). ELEGNT: Expressive and functional movement design for non-anthropomorphic robot. arXiv:2501.12493.
- Huang, P., Hu, Y., Nechyporenko, N., 외 (2024). EMOTION: Expressive motion sequence generation for humanoid robots with in-context learning. arXiv:2410.23234.
- Iqbal, S. T., & Bailey, B. P. (2008). Effects of intelligent notification management on users and their tasks. CHI '08.
- Jafarinaimi, N., Forlizzi, J., Hurst, A., & Zimmerman, J. (2005). Breakaway: An ambient display designed to change human behavior. CHI '05 Extended Abstracts.
- Klasnja, P., Hekler, E. B., Shiffman, S., 외 (2015). Microrandomized trials: An experimental design for developing just-in-time adaptive interventions. Health Psychology.
- Klasnja, P., Smith, S., Seewald, N. J., 외 (2019). Efficacy of contextually tailored suggestions for physical activity: A micro-randomized optimization trial of HeartSteps. Annals of Behavioral Medicine.
- Klauck, M., Sugano, Y., & Bulling, A. (2017). Noticeable or distractive? A design space for gaze-contingent user interface notifications. CHI '17 Extended Abstracts.
- Krishnamurthy, A., Harris, K., Foster, D. J., Zhang, C., & Slivkins, A. (2024). Can large language models explore in-context? NeurIPS 2024.
- Kuo, N., Sergeyuk, A., Chen, V., & Izadi, M. (2026). Developer interaction patterns with proactive AI: A five-day field study. IUI '26. arXiv:2601.10253.
- Lavie, N. (2005). Distracted and confused?: Selective attention under load. Trends in Cognitive Sciences.
- Leusmann, J., Windl, M., Gienger, M., Wang, C., & Mayer, S. (2026). How people envision robot interruption behaviors. RO-MAN 2026.
- Liao, P., Greenewald, K., Klasnja, P., & Murphy, S. (2020). Personalized HeartSteps: A reinforcement learning algorithm for optimizing physical activity. PACM IMWUT.
- Liu, A., Karoui, Y., Draxler, F., Kreuter, F., & Chiossi, F. (2026). Sensing what surveys miss: Understanding and personalizing proactive LLM support by user modeling. CHI '26. arXiv:2602.00880.
- Mahadevan, K., Chien, J., Brown, N., 외 (2024). Generative expressive robot behaviors using large language models. HRI '24.
- Mannem, S., Macke, W., Stone, P., & Mirsky, R. (2023). Exploring the cost of interruptions in human-robot teaming. Humanoids 2023. arXiv:2311.00785.
- McFarlane, D. C. (2002). Comparison of four primary methods for coordinating the interruption of people in human-computer interaction. Human-Computer Interaction.
- O'Connell, Banga, Ayissi, 외 (2024). Design and evaluation of a socially assistive robot schoolwork companion for college students with ADHD. HRI '24.
- Park, S., Jung, E., Lee, K., Lim, D., & Choi, K. Y. (2026). PAWSE: A laptop-peripheral robot supporting micro-breaks through fidgeting-based tangible interaction. HRI '26 Companion.
- Pitsch, K., Kuzuoka, H., Suzuki, Y., 외 (2009). "The first five seconds": Contingent stepwise entry into an interaction as a means to secure sustained engagement in HRI. RO-MAN 2009.
- Preston, Dinsdale, Shippy, & Fitter (2023). Robot-mediated nudges for workplace health: Not a one-size-fits-all modeling problem. International Journal of Social Robotics.
- Rogel, A., Yadollahi, E., & Laban, G. (2026). Emotional expression in low-degrees-of-freedom robots: Assessing perception with Reachy Mini. arXiv:2605.12786.
- Saulnier, P., Sharlin, E., & Greenberg, S. (2011). Exploring minimal nonverbal interruption in HRI. RO-MAN 2011.
- Shin, J.-G., Onchi, E., Reyes, M. J., Song, J., Lee, U., Lee, S.-H., & Saakes, D. (2019). Slow robots for unobtrusive posture correction. CHI '19.
- Song, S., Okafuji, Y., Ariu, K., & Koike, A. (2026). What you reward is what you learn: Comparing rewards for online speech policy optimization in public HRI. HRI '26.
- Takayama, L., Dooley, D., & Ju, W. (2011). Expressing thought: Improving robot readability with animation principles. HRI '11.
- Trafton, J. G., McCurry, J. M., Zish, K., & Frazier, C. R. (2024). The perception of agency. ACM THRI.
- Trella, A. L., Zhang, K. W., Nahum-Shani, I., Shetty, V., Doshi-Velez, F., & Murphy, S. A. (2023). Reward design for an online reinforcement learning algorithm supporting oral self-care. AAAI 2023.
- Viswanath, A., & Buschmeier, H. (2026). Desirability of proactive robots: A user study on spoken interaction initiation. HRI '26.
- Wang 외 (2025). SitBot: A posture-mimicking robot to reduce slouching. ICSR+AI 2025 (출판 2026).
- Wills, P., Baxter, P., Kennedy, J., Senft, E., & Belpaeme, T. (2016). Socially contingent humanoid robot head behaviour results in increased charity donations. HRI '16.
- Xiang, Y., Ping, C., Wang, M., & Fan, M. (2026). Envisioning an attention-supportive desktop robot: A participatory design study. HRI '26 Companion.
- Yoon, S., Kim, S., Park, G., & Lim, H. (2024). Evaluating how desktop companion robot behaviors influence work experience and robot perception. CHI EA '24.
- Yuan, Y., Huang, K., Li, M. D., Zhao, Y., & Zhu, B. (2026). Tuotle: A posture correction robot based on cognitive dissonance theory. HRI '26 Companion.
- Zhang, K. W., Janson, L., & Murphy, S. A. (2020). Inference for batched bandits. NeurIPS 2020. †
- Züger, M., Corley, C., Meyer, A. N., 외 (2017). Reducing interruptions at work: A large-scale field study of FlowLight. CHI '17.
