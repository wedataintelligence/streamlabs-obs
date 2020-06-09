import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Source } from 'services/sources/source';
import { IJoinMeManagerSettings } from 'services/sources/properties-managers/join-me-manager';
import electron from 'electron';
import { Inject } from 'services';
import { UserService } from 'services/user';
import Video, { connect } from 'twilio-video';

@Component({})
export default class JoinMeProperties extends Vue {
  @Prop() source: Source;

  @Inject() userService: UserService;

  managerSettings: IJoinMeManagerSettings = null;

  participantReady = false;

  copied = false;

  created() {
    this.refreshSettings();

    fetch('https://8f503f72fcbe.ngrok.io/token?identity=slobsmonitor').then(resp => {
      resp.text().then(token => {
        console.log('Got Token', token);

        connect(token, { name: this.managerSettings.uuid, audio: false, video: false }).then(
          room => {
            console.log(`Successfully joined a Room: ${room}`);
            console.log(room.participants);
            room.participants.forEach(part => {
              if (part.identity !== 'slobshost') {
                this.participantReady = true;

                this.mountVideoTrack(part);
              }

              console.log(part);
            });

            room.on('participantConnected', part => {
              if (part.identity !== 'slobshost') {
                this.participantReady = true;

                this.mountVideoTrack(part);
              }
            });
          },
        );
      });
    });
  }

  mountVideoTrack(part: Video.RemoteParticipant) {
    part.on('trackSubscribed', track => {
      console.log(track);

      if (track.kind === 'video') {
        const trackElm = track.attach();

        trackElm.style.position = 'absolute';
        trackElm.style.top = 0;
        trackElm.style.left = 0;
        trackElm.style.width = '100%';
        trackElm.style.height = '100%';

        document.getElementById('remote-media-div').appendChild(trackElm);
      }
    });
  }

  refreshSettings() {
    this.managerSettings = this.source.getPropertiesManagerSettings() as any;
  }

  get participantUrl() {
    return `https://8f503f72fcbe.ngrok.io/?room=${this.managerSettings.uuid}&channel=${this.userService.platform.username}`;
  }

  copyParticipantLink() {
    electron.remote.clipboard.writeText(this.participantUrl);
    this.copied = true;

    setTimeout(() => (this.copied = false), 3 * 1000);
  }

  addToStream() {
    this.source.setPropertiesManagerSettings({ mode: 'live' });
    this.refreshSettings();
  }

  removeFromStream() {
    this.source.setPropertiesManagerSettings({ mode: 'waiting' });
    this.refreshSettings();
  }

  render() {
    return (
      <div>
        {!this.participantReady && this.managerSettings.mode === 'waiting' ? (
          <div>
            <div>Send this link to someone to invite them to your stream!</div>
            <button
              onClick={() => this.copyParticipantLink()}
              class="button button--default"
              style={{ marginTop: '8px', width: '160px' }}
            >
              {this.copied ? 'Copied!' : 'Copy Participant Link'}
            </button>
          </div>
        ) : (
          <div>
            <div>
              {this.managerSettings.mode === 'live'
                ? 'Your participant is live! Click below to remove them from your stream.'
                : 'Your participant is ready. To add them to your stream, click below.'}
            </div>
            <div style={{ marginTop: '16px' }}>
              {this.managerSettings.mode === 'waiting' ? (
                <button onClick={() => this.addToStream()} class="button button--action">
                  Add To Stream
                </button>
              ) : (
                <button onClick={() => this.removeFromStream()} class="button button--warn">
                  Remove From Stream
                </button>
              )}
            </div>
            <div
              id="remote-media-div"
              style={{ position: 'relative', height: '318px', marginTop: '16px' }}
            ></div>
          </div>
        )}
      </div>
    );
  }
}
