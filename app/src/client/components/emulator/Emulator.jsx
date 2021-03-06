import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {ActionState} from '../../enums';
import {Main} from '../common';
import EmulatorControls, {controlsPropType} from './EmulatorControls';
import EmulatorError from './EmulatorError';
import EmulatorOutput from './EmulatorOutput';
import connect from './connect';
import './Emulator.css';

class Emulator extends PureComponent {

  static propTypes = {
    romId: PropTypes.string,
    routeRomId: PropTypes.string,
    loadState: PropTypes.oneOf(ActionState.values).isRequired,
    controls: controlsPropType.isRequired,
    controlsVisible: PropTypes.bool.isRequired,
    crosshairVisible: PropTypes.bool.isRequired,
    error: PropTypes.string.isRequired,
    onConnect: PropTypes.func.isRequired,
    onDisconnect: PropTypes.func.isRequired,
    onLoad: PropTypes.func.isRequired,
    onFetchAndLoad: PropTypes.func.isRequired,
    onRouteRedirect: PropTypes.func.isRequired,
    onControlsClose: PropTypes.func.isRequired,
    onErrorClose: PropTypes.func.isRequired,
  };

  static defaultProps = {
    romId: null,
    routeRomId: null,
  };

  state = {
    dragOver: false,
  };

  componentDidMount() {
    const {romId, routeRomId, onConnect, onFetchAndLoad, onRouteRedirect} = this.props;
    onConnect(this.canvas);

    if (romId !== routeRomId) {
      if (routeRomId) {
        onFetchAndLoad(routeRomId);
      } else {
        onRouteRedirect(romId);
      }
    }

    const {element} = this;
    element.addEventListener('dragover', this.handleDragEnter);
    element.addEventListener('dragleave', this.handleDragLeave);
    element.addEventListener('dragover', this.handleDragOver);
    element.addEventListener('drop', this.handleDrop);
  }

  componentWillReceiveProps(props) {
    const {romId, routeRomId, onRouteRedirect} = props;
    if (romId !== routeRomId) {
      onRouteRedirect(romId);
    }
  }

  componentWillUnmount() {
    this.props.onDisconnect();

    const {element} = this;
    element.removeEventListener('dragover', this.handleDragEnter);
    element.removeEventListener('dragleave', this.handleDragLeave);
    element.removeEventListener('dragover', this.handleDragOver);
    element.removeEventListener('drop', this.handleDrop);
  }

  setElement = element => {
    this.element = element;
  }

  setCanvas = canvas => {
    this.canvas = canvas;
  }

  handleDragEnter = () => {
    this.setState({dragOver: true});
  };

  handleDragLeave = () => {
    this.setState({dragOver: false});
  };

  handleDragOver = event => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  };

  handleDrop = event => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file) {
      this.props.onLoad(file);
    }
    this.setState({dragOver: false});
  };

  render() {
    const {dragOver} = this.state;
    const {loadState, controls, controlsVisible, onControlsClose, crosshairVisible, error, onErrorClose} = this.props;
    const loading = loadState === ActionState.STARTED;
    const fullClassName = classNames('emulator', {'drag-over': dragOver});

    return (
      <Main className={fullClassName} refMain={this.setElement}>
        {controlsVisible && (
          <EmulatorControls controls={controls} onClose={onControlsClose}/>
        )}
        {error && (
          <EmulatorError message={error} onClose={onErrorClose}/>
        )}
        <EmulatorOutput loading={loading} crosshair={crosshairVisible} refCanvas={this.setCanvas}/>
      </Main>
    );
  }

}

export default connect(Emulator);
