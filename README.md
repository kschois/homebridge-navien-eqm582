[![npm-version](https://badgen.net/npm/v/homebridge-navien-smart)](https://www.npmjs.com/package/homebridge-navien-smart)
[![npm-total-downloads](https://badgen.net/npm/dt/homebridge-navien-smart)](https://www.npmjs.com/package/homebridge-navien-smart)
[![ci-status](https://github.com/kyle-seongwoo-jun/homebridge-navien-smart/actions/workflows/build.yml/badge.svg)](https://github.com/kyle-seongwoo-jun/homebridge-navien-smart/actions/workflows/build.yml)

<p align="center">

<img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-gradient-named.png" width="150">

</p>

<span align="center">

# Homebridge Navien Smart

</span>

**[🇺🇸 English](README.md)** | [🇰🇷 한국어](README-ko.md)

## Overview

![demo](https://raw.githubusercontent.com/kyle-seongwoo-jun/homebridge-navien-smart/latest/docs/demo.jpg)

Homebridge plugin to control Navien devices via Navien Smart.

A plugin for interacting with the "Navien Smart" system, which can control Navien devices. API used in this plugin is not official, I reversed from their "Navien Smart" mobile app.

### ⚠️ Warning

This plugin is only tested with `EME520` and `EMW720` models. It may not work with other models. If you have a different model, please comment on [this issue](https://github.com/kyle-seongwoo-jun/homebridge-navien-smart/issues/24) to support your model.

See [Implementation Status](https://github.com/kyle-seongwoo-jun/homebridge-navien-smart/issues/24) for more information.

## Installation

```shell
npm i -g homebridge-navien-smart
```

# Configuration

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
            "device": "My Heating Mat",
            "mainSwitch": "Mat Power",
            "left": "Mat Left",
            "right": "Mat Right"
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

| *Key* | *Description* |
| --- | --- |
| `authMode` | Required. You can choose between `token` and `account` |
| `username` | Required. Navien Smart account |
| `password` | Required if `authMode` = `account`. Navien Smart password |
| `refreshToken` | Required if `authMode` = `token`. You can get it with `navien` cli. |
| `accountSeq` | Required if `authMode` = `token`. You can get it with `navien` cli. |
| `accessoryType` | Required. You can choose between `HeaterCooler` and `Thermostat` |
| `soundEnabled` | If selected, enable the notification sound on operation. (only for supported devices) |
| `separateControl` | If selected, support left and right separated heating. (only for supported devices) |
| `displayName` | Set name appears in Apple Home. `device` field must be set to the same as the device name in Navien Smart app. |
| `deviceOverrides` | Optional. Override zones (`auto` / `single` / `double`) and temperature range (`heatMin`, `heatMax`, `heatStep`) per device. Useful for unverified models such as `EQM582`. |
| `platform` | value always `NavienSmart` |

If you don't want to put your password in the config, you can use `authMode` = `token` and use `refreshToken` and `accountSeq` instead.

You can get `refreshToken` and `accountSeq` with `navien` cli. See [CLI Usage](#cli-usage).

## CLI Usage

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

You can copy and paste `refreshToken` and `accountSeq` to your config.

### EQM582 (Navien Mate water mat)

`EQM582` was controlled by the discontinued "Navien Mate" app, and is now registered in the "Navien Smart" app. Register the mat in Navien Smart first, then the plugin will pick it up like other models.

- If the device does not provide its temperature range, the plugin falls back to 28–45°C in 0.5°C steps.
- On first status update, the plugin logs the raw reported state of the mat. If something does not work, please share that log line in [this issue](https://github.com/kyle-seongwoo-jun/homebridge-navien-smart/issues/24).
- You can also print device info and status with `navien inspect <username> <password>`. (This logs in with your account, so Homebridge may need to log in again afterwards.)

```json
"deviceOverrides": [
    {
        "device": "My Water Mat",
        "zones": "auto",
        "heatMin": 28,
        "heatMax": 45,
        "heatStep": 0.5
    }
]
```

## Demo

### Siri (Voice Control)

[![siri demo](https://img.youtube.com/vi/FpLxOSHVeKw/0.jpg)](https://youtu.be/FpLxOSHVeKw)

### Widget (Home app / Control Center)

[![widget demo](https://img.youtube.com/vi/lCtJF57DZQk/0.jpg)](https://youtu.be/lCtJF57DZQk)
