import { PropertiesManager } from './properties-manager';
import uuid from 'uuid/v4';

export interface IJoinMeManagerSettings {
  uuid: string;
  mode: 'waiting' | 'live';
}

export class JoinMeManager extends PropertiesManager {
  customUIComponent = 'JoinMeProperties';

  settings: IJoinMeManagerSettings;

  blacklist = [
    'css',
    'fps',
    'fps_custom',
    'height',
    'reroute_audio',
    'restart_when_active',
    'shutdown',
    'url',
    'width',
    'is_local_file',
    'refreshnocache',
  ];

  init() {
    console.log('join me init');

    this.applySettings({
      uuid: uuid(),
      mode: 'waiting',
    });

    console.log(this.obsSource.settings);

    console.log('Room name', this.settings.uuid);
  }

  applySettings(settings: IJoinMeManagerSettings) {
    super.applySettings(settings);

    this.obsSource.update({
      url: `http://localhost:3000?mode=${this.settings.mode}&channel=${this.settings.uuid}`,
      width: 1280,
      height: 720,
    });
  }
}
