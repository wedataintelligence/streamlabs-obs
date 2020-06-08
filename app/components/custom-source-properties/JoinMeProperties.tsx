import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Source } from 'services/sources/source';
import { IJoinMeManagerSettings } from 'services/sources/properties-managers/join-me-manager';
import electron from 'electron';

@Component({})
export default class JoinMeProperties extends Vue {
  @Prop() source: Source;

  get managerSettings() {
    return this.source.getPropertiesManagerSettings() as IJoinMeManagerSettings;
  }

  get participantUrl() {
    return `http://localhost:3005/quickstart?roomName=${this.managerSettings.uuid}`;
  }

  copyParticipantLink() {
    electron.remote.clipboard.writeText(this.participantUrl);
  }

  render() {
    return (
      <div>
        <button onClick={() => this.copyParticipantLink()} class="button button--default">
          Copy Join Link
        </button>
        <input type="text" value={this.participantUrl} />
      </div>
    );
  }
}
