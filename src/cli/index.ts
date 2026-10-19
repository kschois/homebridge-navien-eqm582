/* eslint-disable no-console */

import assert from 'assert';
import { Logging } from 'homebridge';

import { AwsSession } from '../aws/aws.session.js';
import { AwsPubSub } from '../aws/pubsub.js';
import { NavienException } from '../navien/exceptions/index.js';
import { NavienApi } from '../navien/navien.api.js';
import { NavienAuth } from '../navien/navien.auth.js';
import { NavienDevice } from '../navien/navien.device.js';
import { NavienSession } from '../navien/navien.session.js';
import { NavienSessionManager } from '../navien/navien.session-manager.js';
import { NavienUser } from '../navien/navien.user.js';
import { PLUGIN_VERSION } from '../version.js';

const INSPECT_DURATION = 15 * 1000; // milliseconds

console.log(`Navien CLI: ${PLUGIN_VERSION}`);

// do not print debug logs (it may contain password)
const log = { ...console, debug: () => { } } as unknown as Logging;

const args = process.argv.slice(2);
const isInspect = args[0] === 'inspect';
const [username, password] = isInspect ? args.slice(1) : args;

if (!username || !password) {
  console.error('Usage: navien <username> <password>');
  console.error('       navien inspect <username> <password>  # print device info and status for unsupported models');
  process.exit(1);
}

async function login() {
  const auth = new NavienAuth(log);

  const response = await auth.login(username, password);
  console.log('refreshToken:', response.refreshToken);
  console.log('accountSeq:', response.userSeq);
}

async function inspect() {
  const auth = new NavienAuth(log);

  // login
  const response = await auth.login(username, password);
  const { data } = await auth.tokenLogin(response.accessToken, response.loginId, response.userSeq);
  assert(data && data.home.length > 0, 'No home in token-login response.');

  const { userInfo, home, authInfo } = data;
  const user = new NavienUser(response.loginId, response.userSeq, userInfo.userSeq, home[0].homeSeq);
  const session = NavienSession.fromResponse(response);
  const sessionManager = {
    session,
    user,
    refreshSession: async () => session,
  } as unknown as NavienSessionManager;
  const api = new NavienApi(log, sessionManager, false);

  // print devices
  const devices = (await api.getDevices()).map((json) => new NavienDevice(json));
  console.log(`\nFound ${devices.length} device(s).`);
  for (const device of devices) {
    const { heatRange } = device.functions;
    console.log(JSON.stringify({
      name: device.name,
      model: device.model,
      modelName: device.modelName,
      modelCode: device.modelCode,
      serviceCode: device.serviceCode,
      connected: device.connected,
      isDouble: device.isDouble,
      nickName: device.Properties?.nickName,
      functions: device.Properties?.registry?.attributes?.functions,
      mcu: device.Properties?.registry?.attributes?.mcu?.matType,
      heatRange,
    }, null, 2));
  }

  // print reported status
  const pubsub = new AwsPubSub(userInfo.userSeq, user.homeSeq, AwsSession.fromResponse(authInfo));
  for (const device of devices) {
    pubsub.deviceStatusChanges(device.id).subscribe((event) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { info, ...reported } = event.payload.state.reported!;
      console.log(`\n[${device.name}] reported state:`, JSON.stringify(reported, null, 2));
    });
  }

  // wait for connection, then request status
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(`\nRequesting status... (waiting ${INSPECT_DURATION / 1000} seconds)`);
  await Promise.all(devices.map((device) => api.initializeDevice(device)));
  await new Promise((resolve) => setTimeout(resolve, INSPECT_DURATION));
}

(isInspect ? inspect() : login())
  .catch((error) => {
    if (error instanceof NavienException) {
      console.error(error.toString());
      return;
    }
    console.error('Unknown error occurred. Please report this to the developer:', error);
  })
  .finally(() => process.exit(0));
