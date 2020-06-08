import { PropertiesManager } from './properties-manager';
import uuid from 'uuid/v4';

export interface IJoinMeManagerSettings {
  uuid: string;
}

export class JoinMeManager extends PropertiesManager {
  customUIComponent = 'JoinMeProperties';

  settings: IJoinMeManagerSettings;

  init() {
    console.log('join me init');

    this.settings.uuid = uuid();
    console.log('Room name', this.settings.uuid);

    this.obsSource.update({
      url: `http://localhost:3000?channel=${this.settings.uuid}`,
      width: 1280,
      height: 720,
    });
  }
}
