import log from '../../../core/src/common/log';
import {VIDEO_WIDTH, VIDEO_HEIGHT} from '../../../core/src/video/constants';
import {createPalette} from '../../../core/src/video/palettes';
import Options from '../data/Options';
import {createRenderer} from './renderers';

const fullscreenStyle = {
  position: 'fixed',
  top: '0',
  right: '0',
  bottom: '0',
  left: '0',
  margin: 'auto',
  width: 'auto',
  height: 'auto',
};

export default class Video {

  constructor(nes, {screenfull}) {
    log.info('Initializing video');
    this.nes = nes;
    this.screenfull = screenfull;
    this.initListeners();
    this.initOptions();
  }

  initListeners() {
    if (this.screenfull) {
      document.addEventListener(this.screenfull.raw.fullscreenchange, () => this.onFullscreenChange());
    }
    window.addEventListener('deviceorientation', () => this.onResolutionChange());
    window.addEventListener('resize', () => this.onResolutionChange());
  }

  initOptions() {
    this.options = new Options(this);
    this.options.add('videoRenderer', this.setRenderer, this.getRenderer, 'webgl');
    this.options.add('videoPalette', this.setPalette, this.getPalette, 'fceux');
    this.options.add('videoScale', this.setScale, this.getScale, 1);
    this.options.add('videoSmoothing', this.setSmoothing, this.isSmoothing, false);
    this.options.add('videoDebugging', this.setDebugging, this.isDebugging, false);
    this.options.add('fullscreenType', this.setFullscreenType, this.getFullscreenType, 'maximized');
    this.options.reset();
  }

  //=========================================================
  // Canvas
  //=========================================================

  setCanvas(canvas) {
    log.info(`Setting video output to ${canvas}`);
    this.canvas = canvas;
    if (this.canvas) {
      this.createRenderer();
      this.updateRenderer();
      this.updateCanvasSize();
      this.updateCanvasStyle();
      this.drawFrame();
    }
  }

  getCanvas() {
    return this.canvas;
  }

  updateCanvasSize() {
    this.canvas.width = this.getTargetScale() * VIDEO_WIDTH * this.getWidthMultiplier();
    this.canvas.height = this.getTargetScale() * VIDEO_HEIGHT;
  }

  updateCanvasStyle() {
    const style = this.canvas.style;
    if (this.isFullscreen()) {
      Object.assign(style, fullscreenStyle);
      if (this.fullscreenType !== 'normalized') {
        style.width = '100%';
        style.height = '100%';
        if (this.fullscreenType !== 'stretched') {
          const ratio = this.canvas.width / this.canvas.height;
          if (screen.height * ratio > screen.width) {
            style.height = 'auto';
          } else {
            style.width = 'auto';
          }
        }
      }
    } else {
      for (const property of Object.keys(fullscreenStyle)) {
        style.removeProperty(property);
      }
    }
  }

  getOutputRect() {
    if (this.canvas) {
      const rect = this.getCanvasRect();
      if (this.debugging) {
        rect.right -= (rect.right - rect.left) / 2; // Without debugging output
      }
      return rect;
    }
    return this.getEmptyRect();
  }

  mouseToOutputCoordinates(cursorX, cursorY) {
    const rect = this.getOutputRect();
    const horizontalScale = (rect.right - rect.left) / VIDEO_WIDTH;
    const verticalScale = (rect.bottom - rect.top) / VIDEO_HEIGHT;
    const screenX = ~~((cursorX - rect.left) / horizontalScale);
    const screenY = ~~((cursorY - rect.top) / verticalScale);
    return [screenX, screenY];
  }

  getCanvasRect() {
    const rect = this.canvas.getBoundingClientRect(); // Read-only, we need a writable copy
    return {top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left};
  }

  getEmptyRect() {
    return {top: -1, right: -1, bottom: -1, left: -1};
  }

  onResolutionChange() {
    if (this.canvas) {
      this.updateRenderer();
      this.updateCanvasSize();
      this.updateCanvasStyle();
      this.drawFrame();
    }
  }

  //=========================================================
  // Renderer
  //=========================================================

  setRenderer(id) {
    if (this.rendererId !== id) {
      log.info(`Using "${id}" video renderer`);
      this.rendererId = id;
      if (this.canvas) {
        this.createRenderer();
        this.updateRenderer();
      }
    }
  }

  getRenderer() {
    return this.rendererId;
  }

  createRenderer() {
    this.renderer = createRenderer(this.rendererId, this.canvas);
    this.frame = this.renderer.createFrame(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    this.debugFrame = this.renderer.createFrame(VIDEO_WIDTH, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  }

  updateRenderer() {
    this.renderer.setSmoothing(this.smoothing);
    this.renderer.setScale(this.getTargetScale());
  }

  renderFrame() {
    this.nes.renderFrame(this.frame.data);
    if (this.debugging) {
      this.nes.renderDebugFrame(this.debugFrame.data);
    }
  }

  drawFrame() {
    this.renderer.begin();
    this.renderer.drawFrame(this.frame);
    if (this.debugging) {
      this.renderer.drawFrame(this.debugFrame);
    }
    this.renderer.end();
  }

  //=========================================================
  // Palette
  //=========================================================

  setPalette(id) {
    if (this.paletteId !== id) {
      log.info(`Setting video palette to "${id}"`);
      this.paletteId = id;
      this.nes.setPalette(createPalette(id));
      if (this.canvas) {
        this.renderFrame();
        this.drawFrame();
      }
    }
  }

  getPalette() {
    return this.paletteId;
  }

  //=========================================================
  // Scale
  //=========================================================

  setScale(scale) {
    if (this.scale !== scale) {
      log.info(`Setting video scale to ${scale}`);
      this.scale = scale;
      if (this.canvas) {
        this.updateRenderer();
        this.updateCanvasSize();
        this.updateCanvasStyle();
        this.drawFrame();
      }
    }
  }

  getScale() {
    return this.scale;
  }

  getTargetScale() {
    if (this.isFullscreen()) {
      const maxScale = this.getMaxScale();
      return maxScale > 1 ? ~~maxScale : maxScale;
    }
    return this.scale;
  }

  getMaxScale() {
    const maxHorizontalScale = screen.width / (VIDEO_WIDTH * this.getWidthMultiplier());
    const maxVerticalScale = screen.height / VIDEO_HEIGHT;
    return Math.min(maxHorizontalScale, maxVerticalScale);
  }

  //=========================================================
  // Smoothing
  //=========================================================

  setSmoothing(enabled) {
    if (this.smoothing !== enabled) {
      log.info(`Setting video smoothing to ${enabled ? 'on' : 'off'}`);
      this.smoothing = enabled;
      if (this.canvas) {
        this.updateRenderer();
        this.drawFrame();
      }
    }
  }

  isSmoothing() {
    return this.smoothing;
  }

  //=========================================================
  // Debugging
  //=========================================================

  setDebugging(enabled) {
    if (this.debugging !== enabled) {
      log.info(`Setting video debugging to ${enabled ? 'on' : 'off'}`);
      this.debugging = enabled;
      if (this.canvas) {
        this.updateRenderer();
        this.updateCanvasSize();
        this.updateCanvasStyle();
        this.renderFrame();
        this.drawFrame();
      }
    }
  }

  isDebugging() {
    return this.debugging;
  }

  getWidthMultiplier() {
    return this.debugging ? 2 : 1;
  }

  //=========================================================
  // Full screen
  //=========================================================

  enterFullscreen() {
    this.checkScreenfullAvailable();
    if (this.screenfull.enabled && !this.isFullscreen()) {
      log.info('Entering fullscreen');
      this.screenfull.request(this.canvas.parentElement);
    }
  }

  leaveFullscreen() {
    this.checkScreenfullAvailable();
    if (this.screenfull.enabled && this.isFullscreen()) {
      log.info('Leaving fullscreen');
      this.screenfull.exit();
    }
  }

  onFullscreenChange() {
    log.info(`Fullscreen ${this.isFullscreen() ? 'enabled' : 'disabled'}`);
    this.updateRenderer();
    this.updateCanvasSize();
    this.updateCanvasStyle();
    this.drawFrame();
  }

  isFullscreen() {
    return this.screenfull && this.screenfull.isFullscreen;
  }

  setFullscreenType(type) {
    if (this.fullscreenType !== type) {
      log.info(`Setting fullsreen type to "${type}"`);
      this.fullscreenType = type;
      if (this.canvas) {
        this.updateCanvasStyle();
      }
    }
  }

  getFullscreenType() {
    return this.fullscreenType;
  }

  checkScreenfullAvailable() {
    if (this.screenfull == null) {
      throw new Error('Unable to switch to full screen: screenfull library is not available');
    }
  }

}