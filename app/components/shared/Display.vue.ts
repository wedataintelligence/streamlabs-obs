import TsxComponent from 'components/tsx-component';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { VideoService, Display as OBSDisplay } from 'services/video';
import { WindowsService } from 'services/windows';
import { CustomizationService } from 'services/customization';
import electron from 'electron';
import * as obs from '../../../obs-api';

const { remote } = electron;

interface DisplayProps {
  sourceId: string;
  paddingSize?: number;
  drawUI?: false;
  onOutputResize: (region: IRectangle) => void;
}

@Component({})
export default class Display extends TsxComponent<DisplayProps> {
  @Inject() videoService: VideoService;
  @Inject() windowsService: WindowsService;
  @Inject() customizationService: CustomizationService;

  @Prop() sourceId: string;
  @Prop({ default: 0 }) paddingSize: number;
  @Prop({ default: false }) drawUI: boolean;
  @Prop() renderingMode: number;

  $refs: {
    display: HTMLElement;
  };

  display: OBSDisplay;

  mounted() {
    this.createDisplay();
  }

  onClickHandler(event: MouseEvent) {
    this.$emit('click', event);
  }

  get paddingColor() {
    return this.customizationService.displayBackground;
  }

  createDisplay() {
    const displayId = this.videoService.getRandomDisplayId();
    this.display = new OBSDisplay(displayId, {
      sourceId: this.sourceId,
      paddingSize: this.paddingSize,
      paddingColor: this.paddingColor,
      renderingMode: this.renderingMode,
    });

    if (!this.sourceId)
      this.windowsService.mainWindowId = displayId;
    else
      this.windowsService.childWIndowId = displayId;
    
    this.display.setShoulddrawUI(this.drawUI);

    this.display.onOutputResize(region => {
      this.$emit('outputResize', region);
    });

    this.display.trackElement(this.$refs.display);

    const electronWindow = remote.BrowserWindow.fromId(remote.getCurrentWindow().id);

    electronWindow.on( "move", (event: any) => {
      const bounds = event.sender.getBounds();

      if (this.$refs.display) {
        const rect = this.$refs.display.getBoundingClientRect();
        const x = rect.left;
        const y = rect.top;

        const moveX = bounds.x + x;
        const moveY = bounds.y - y - 21;
        
        this.videoService.moveOBSDisplay(displayId, moveX, moveY);
      }
    });
    // obs.NodeObs.OBS_content_setFocused(displayId, true);
  }

  destroyDisplay() {
    this.display.destroy();
  }

  @Watch('sourceId')
  changeSource() {
    this.updateDisplay();
  }

  @Watch('paddingColor')
  updateDisplay() {
    this.destroyDisplay();
    this.createDisplay();
  }

  beforeDestroy() {
    this.destroyDisplay();
  }
}
