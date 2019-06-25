import { Inject, StatefulService } from '../core';
import { EReplayBufferState, EStreamingState, StreamingService } from '../streaming';
import { SettingsService } from '../settings';
import fs from 'fs';
import path from 'path';
import { UserService } from '../user';

export class NotifyService extends StatefulService<{}> {
  @Inject() streamingService: StreamingService;
  @Inject() settingsService: SettingsService;
  @Inject() userService: UserService;

  init() {
    this.streamingService.streamingStatusChange.subscribe(state => {
      if (state === EStreamingState.Starting || state === EStreamingState.Live) {
        this.enableReplayBuffer();
      }
    });
  }

  get replayBufferEnabled() {
    if (this.streamingService.state.replayBufferStatus === EReplayBufferState.Offline) {
      return this.settingsService.state.Output.RecRB;
    }
  }

  enableReplayBuffer() {
    this.streamingService.startReplayBuffer();
  }

  capture(notificationMessage: string) {
    return new Promise(resolve => {
      setTimeout(async () => {
        this.streamingService.saveReplay();

        await this.uploadLastReplay(notificationMessage);
        resolve();
      }, 20 * 1000);
    });
  }

  get recordingPath() {
    return (this.settingsService.state.Output as any).FilePath;
  }

  get replayBufferPrefix() {
    return (this.settingsService.state.Advanced as any).RecRBPrefix;
  }

  getLastReplay() {
    const dir = this.recordingPath;
    const files = fs
      .readdirSync(dir)
      .filter(file => file.startsWith(this.replayBufferPrefix))
      .map(v => ({
        name: v,
        time: fs.statSync(path.join(dir, v)).mtime.getTime(),
      }))
      .sort((a, b) => a.time - b.time)
      .map(v => v.name);

    return path.join(dir, files[files.length - 1]);
  }

  uploadLastReplay(notificationMessage: string) {
    const NOTIFY_URL = 'http://localhost:8080';

    return new Promise(resolve => {
      setTimeout(() => {
        const replay = this.getLastReplay();
        const fileName = path.basename(replay);
        const formData = new FormData();
        const fileContents = fs.readFileSync(replay);
        const file = new File([fileContents], fileName);
        formData.append('file', file);
        formData.append('userId', this.userService.state.auth.platform.id);
        formData.append('username', this.userService.state.auth.platform.username);
        formData.append('account_type', this.userService.state.auth.platform.type);
        formData.append('message', notificationMessage);
        const request = new Request(`${NOTIFY_URL}/api/notify`, { body: formData, method: 'POST' });
        fetch(request).then(resolve);
        return;
      }, 5 * 1000);
    });
  }
}
