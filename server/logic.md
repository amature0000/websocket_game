- 카드 시스템 구상

1. n명의 플레이어로 구성됨
    - 각 플레이어는 입장할 때 자신의 닉네임을 설정해서 입장함

2. 각 플레이어는 개인 카드 풀이 존재하며, 자신의 턴 시작 시 카드를 '발견' 하여 카드 풀에 추가함
    - 각 플레이어는 자신의 턴 시작 시 카드를 n장 뽑으며, 턴 종료 시 손의 모든 카드를 버림
    - 사용한 카드는 카드 풀로 돌아가지 않으며 턴 종료 시 초기화됨

3. 플레이어 스탯은 사거리, 체력, 방어도가 존재함
    - 사거리: 대상에게 카드 사용 시 거리에 따른 명중률 보정 : 1 - ((거리 - 사거리) / 거리)
    - 체력: 0이 되면 사망하며, 최대 체력이 존재하고 특정 기술로 회복 가능
    - 방어도: 체력보다 먼저 감소하는 추가 체력

4. 통신 로직 서버 -> 플레이어
    - system_message: 메세지 전달
    - game_started: 게임 시작 메세지, 시작 플레이어 아이디 전달
    - turn_changed: 턴 변경 메세지, 대상 플레이어 아이디 전달
    - action_result: 플레이어 액션에 따른 게임 정보 전달, 현재 게임 상태와 이벤트 내용

5. 통신 로직 플레이어 -> 서버
    - join_room: 방 참가
    - start_game: 게임 시작
    - disconnect: 연결 종료
    - action: 액션(카드 플레이, 카드 선택, 턴 종료 등등)

6. 게임 진행도
    1. 플레이어 입장, 0번 플레이어가 게임 시작
    2. 0번 플레이어부터 돌아가며 행동을 취하고, 턴 종료로 다음 플레이어 턴 진행
    3. 플레이어가 action으로 행동을 취하면, 서버는 해당 행동에 대한 결과로 다음 두 가지 값을 전달함
        - broadcast: 행동에 따른 플레이어 상태 변화를 전달하기 위해 room info를 브로드캐스트
        - private: 행동한 플레이어에게만 제공되는 정보(손패, 선택한 카드 등)

7. 플레이어 턴
    1. 턴이 시작되고 카드 5장을 드로우함(서버로부터 전달받음)
    2. 자신의 덱에 추가할 카드 3장이 제시되고(서버로부터 전달받음), 그 중 하나를 선택해 서버로 전달함
    3. 자신의 턴에 플레이어는 드로우한 카드를 사용 가능함. 사용한 카드는 버려지며, 이번 턴에 드로우되지 않음.
    4. 사용할 카드를 다 사용한 후, 턴 종료를 통해 다음 플레이어에게 턴을 넘김

8. 게임 종료
    1. turnOrder에 한 명만 남은 경우 게임 종료
    2. 게임 종료 메세지를 보내고 기존 필드 초기화; 방 상태를 대기방으로 변경해야 함

- 활성 플레이어 디컨 시나리오
1. 게임 진행 중이던 플레이어가 게임 종료
2. server.js에서 roomManager / deckManager의 removePlayer 호출
3. roomManager.js에서 해당하는 globalUser, room 데이터를 삭제 -> 만약 turnOrder가 비었다면 room도 삭제
4. 마지막 활성 플레이어였다면, 이후 roomManager.getRoom에서 null값을 반환받고 방에 접속중인 모든 플레이어 강제 디컨
5. 만약 자신의 턴에 종료했다면, roomManager.removePlayer의 반환값으로 전달받은 다음 플레이어에게 setTurn 호출

- 관전 플레이어 디컨 시나리오
1. 관전 중이던 플레이어가 위의 로직에 의해 강제 디컨 -> roomManager.room은 null이지만, globalUsers 데이터는 살아있음
2. server.js에서 roomManager의 removePlayer 호출
3. roomManager.js에서 room이 null이므로 globalUsers를 삭제하고 리턴
4. server.js에서 deckManager의 removePlayer 호출
5. 이후 roomNager.getRoom에서 null값을 반환받고 함수 종료

- flowchart
```
    server.action --> actionHandler.resolveAction --> actionHandler.playCardEffect
    server.selectCard --> actionHandler.resolveAction --> actionHandler.handleSelectCard

```