<p align="center">

<img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-gradient-named.png" width="150">

</p>

<span align="center">

# Homebridge Navien Smart

</span>

[🇺🇸 English](README.md) | **[🇰🇷 한국어](README-ko.md)**

## 둘러보기

![demo](https://raw.githubusercontent.com/kyle-seongwoo-jun/homebridge-navien-smart/latest/docs/demo.jpg)

나비엔 스마트를 통해 나비엔 기기를 제어하는 플러그인.

"나비엔 스마트" 시스템과 상호 작용하는 플러그인으로, 나비엔 기기를 제어할 수 있습니다. 이 플러그인에서 사용된 API는 공식적이지 않으며, "나비엔 스마트" 모바일 앱에서 리버싱을 통해 얻었습니다.

### ⚠️ 경고

이 플러그인은 `EME520`와 `EMW720` 모델에서만 테스트되었습니다. 다른 모델에서는 작동하지 않을 수 있습니다. 다른 모델을 사용하는 경우 [관련 이슈](https://github.com/kyle-seongwoo-jun/homebridge-navien-smart/issues/24)에 코멘트를 남겨주세요.

자세한 정보는 [모델별 구현 상태](https://github.com/kyle-seongwoo-jun/homebridge-navien-smart/issues/24)를 참조하세요.

## 설치

```shell
npm i -g homebridge-navien-smart
```

# 설정

```json
{
    "authMode": "account",
    "username": "<navien-smart-username>",
    "password": "<navien-smart-password>",
    "accessoryType": "HeaterCooler",
    "soundEnabled": false,
    "separateControl": true,
    "displayName": [
        {
            "device": "온수매트",
            "mainSwitch": "온수매트 전원",
            "left": "온수매트 왼쪽",
            "right": "온수매트 오른쪽"
        }
    ],
    "platform": "NavienSmart"
}
```

```json
{
    "authMode": "token",
    "username": "<navien-smart-username>",
    "refreshToken": "<navien-api-refresh-token>",
    "accountSeq": 12345678,
    "accessoryType": "HeaterCooler",
    "soundEnabled": true,
    "separateControl": false,
    "platform": "NavienSmart"
}
```

| *키* | *설명* |
| --- | --- |
| `authMode` | 필수. `token`과 `account` 중 하나를 선택할 수 있습니다. |
| `username` | 필수. 나비엔 스마트 계정 |
| `password` | `authMode`가 `account`인 경우 필수. 나비엔 스마트 비밀번호 |
| `refreshToken` | `authMode`가 `token`인 경우 필수. `navien` CLI로 얻을 수 있습니다. |
| `accountSeq` | `authMode`가 `token`인 경우 필수. `navien` CLI로 얻을 수 있습니다. |
| `accessoryType` | 필수. `HeaterCooler`와 `Thermostat` 중 하나를 선택할 수 있습니다. |
| `soundEnabled` | 선택한 경우, 조작 시 알림 소리를 활성화합니다. (지원하는 기기에 한함) |
| `separateControl` | 선택한 경우, 좌우 분리난방을 지원합니다. (지원하는 기기에 한함) |
| `displayName` | 애플 홈에서 표시되는 이름을 설정합니다. `device` 필드는 Navien Smart 앱에서 등록된 기기 이름과 동일한 값으로 설정해야 합니다. |
| `deviceOverrides` | 선택. 기기별로 좌우 구분(`auto` / `single` / `double`)과 온도 범위(`heatMin`, `heatMax`, `heatStep`)를 덮어씁니다. `EQM582` 같은 미검증 모델에 유용합니다. |
| `platform` | 항상 `NavienSmart` |

비밀번호를 설정 파일에 넣고 싶지 않은 경우 `authMode`를 `token`으로 설정하고 대신 `refreshToken`과 `accountSeq`를 사용할 수 있습니다.

`refreshToken`과 `accountSeq`는 `navien` CLI를 통해 얻을 수 있습니다. 자세한 내용은 [CLI 사용방법](#cli-사용방법)을 참조하세요.

## CLI 사용방법

```shell
$ navien
Usage: navien <username> <password>
```

```shell
$ npm install -g homebridge-navien-smart
$ navien <your-username> <your-password>
Logging in with username: <your-username>, password: <your-password>
refreshToken: XXXXXXXXXXX.XXXXXXXXX.XXXXXXXXX
accountSeq: 12345678
```

`refreshToken`과 `accountSeq`를 복사하여 설정 파일에 붙여넣으면 됩니다.

### EQM582 (나비엔 메이트 온수매트)

`EQM582`는 서비스가 종료된 "나비엔 메이트" 앱 대신 "나비엔 스마트" 앱에 등록해서 사용합니다. 먼저 나비엔 스마트 앱에 매트를 등록하면 다른 모델과 동일하게 플러그인에서 인식됩니다.

- 기기가 온도 범위를 제공하지 않으면 28–45°C, 0.5°C 단위를 기본값으로 사용합니다.
- 처음 상태를 받으면 매트가 보고한 원본 상태를 로그에 한 번 출력합니다. 동작에 문제가 있으면 해당 로그를 [이 이슈](https://github.com/kyle-seongwoo-jun/homebridge-navien-smart/issues/24)에 공유해주세요.
- `navien inspect <username> <password>` 명령으로 기기 정보와 상태를 직접 확인할 수도 있습니다. (계정으로 로그인하므로 이후 홈브리지가 다시 로그인해야 할 수 있습니다.)

```json
"deviceOverrides": [
    {
        "device": "온수매트",
        "zones": "auto",
        "heatMin": 28,
        "heatMax": 45,
        "heatStep": 0.5
    }
]
```

## 데모 영상

### 시리 (음성 제어)

[![siri demo](https://img.youtube.com/vi/FpLxOSHVeKw/0.jpg)](https://youtu.be/FpLxOSHVeKw)

### 위젯 (홈 앱 / 컨트롤 센터)

[![widget demo](https://img.youtube.com/vi/lCtJF57DZQk/0.jpg)](https://youtu.be/lCtJF57DZQk)
