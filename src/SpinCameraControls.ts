/**
 * Copyright (c) 2025 hamamatsu-shota
 * @author hamamatsu-shota
 * @license MIT
 */

import * as THREE from 'three';

interface SpinCameraControlsEventMap {
  change: { type: 'change' };
  start: { type: 'start' };
  end: { type: 'end' };
}

/**
 * Fires when the camera has been transformed by the controls.
 *
 * @event OrbitControls#change
 * @type {Object}
 */
const changeEvent: SpinCameraControlsEventMap['change'] = { type: 'change' } as const;

/**
 * Fires when an interaction was initiated.
 *
 * @event OrbitControls#start
 * @type {Object}
 */
const startEvent: SpinCameraControlsEventMap['start'] = { type: 'start' };

/**
 * Fires when an interaction has finished.
 *
 * @event OrbitControls#end
 * @type {Object}
 */
const endEvent: SpinCameraControlsEventMap['end'] = { type: 'end' };

/** 有効なマウスアクション */
type EnabledMouseActions = THREE.MOUSE.ROTATE;
/** 有効なタッチアクション */
type EnabledTouchActions = THREE.TOUCH.ROTATE;

/**
 * 360度自転操作を行うクラス
 * @class SpinCameraControls
 * @extends THREE.Controls
 */
export class SpinCameraControls extends THREE.Controls<SpinCameraControlsEventMap> {
  /** 操作対象のカメラ */
  public camera: THREE.PerspectiveCamera;
  /** 回転感度 */
  public rotateSensitivity = 0.005;
  /** ズーム有効化 */
  public enableZoom = true;
  /** ズーム感度 */
  public zoomSensitivity = 0.01;
  /**　
   * マウスアクションのキー割り当て
   * @remark MIDDLEはズームで使用する
  */
  public mouseButtons: { LEFT?: EnabledMouseActions, RIGHT?: EnabledMouseActions } = { LEFT: THREE.MOUSE.ROTATE };
  /**　タッチアクションのキー割り当て　*/
  public touches: { ONE?: EnabledTouchActions, TWO?: EnabledTouchActions } = { ONE: THREE.TOUCH.ROTATE };

  // カメラのヨー（左右回転）
  private _yaw = 0;
  // カメラのピッチ（上下回転）
  private _pitch = 0;
  // 最小fov(zoomの最小値)
  private _minFov = 30;
  // 最大fov(zoomの最大値)
  private _maxFov = 90;
  // ドラッグ中かどうかのフラグ
  private _isDragging = false;
  // ドラッグ直前のマウス位置
  private _previousMousePosition = { x: 0, y: 0 };

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement | null = null) {
    super(camera, domElement)
    this.camera = camera;
    if (this.domElement) {
      this.connect(this.domElement)
    }
  }

  public connect(element: HTMLElement) {
    super.connect(element)
    // マウスイベント
    element.addEventListener('mousedown', this._onMouseDown);
    element.addEventListener('mousemove', this._onMouseMove);
    element.addEventListener('mouseup', this._onMouseUp);
    element.addEventListener('mouseleave', this._onMouseUp);

    // タッチイベント
    element.addEventListener('touchstart', this._onTouchStart);
    element.addEventListener('touchmove', this._onTouchMove);
    element.addEventListener('touchend', this._onTouchEnd);

    // ホイールイベント
    element.addEventListener('wheel', this._onWheel, { passive: false });

    element.style.touchAction = 'none'; // disable touch scroll
  }

  public disconnect() {
    if (!this.domElement) return;
    // マウスイベント
    this.domElement.removeEventListener('mousedown', this._onMouseDown);
    this.domElement.removeEventListener('mousemove', this._onMouseMove);
    this.domElement.removeEventListener('mouseup', this._onMouseUp);
    this.domElement.removeEventListener('mouseleave', this._onMouseUp);

    // タッチイベント
    this.domElement.removeEventListener('touchstart', this._onTouchStart);
    this.domElement.removeEventListener('touchmove', this._onTouchMove);
    this.domElement.removeEventListener('touchend', this._onTouchEnd);

    // ホイールイベント
    this.domElement.removeEventListener('wheel', this._onWheel);

    this.domElement.style.touchAction = 'auto';

    super.disconnect();
  }

  public dispose() {
    this.disconnect();
  }

  private _onWheel = (e: WheelEvent) => {
    if (!this.enableZoom) return;
    // デフォルトのホイールイベントを無効化
    e.preventDefault();
    this.camera.fov += e.deltaY * this.zoomSensitivity;
    this.camera.fov = THREE.MathUtils.clamp(this.camera.fov, this._minFov, this._maxFov);
    this.camera.updateProjectionMatrix();
  };

  private _onMouseDown = (e: MouseEvent) => {
    let mouseAction: EnabledMouseActions | undefined;
    switch (e.button) {
      case 0:
        mouseAction = this.mouseButtons.LEFT;
        break;
      case 2:
        mouseAction = this.mouseButtons.RIGHT;
        break;
    }
    if (mouseAction == undefined || mouseAction !== THREE.MOUSE.ROTATE) return;
    this._isDragging = true;
    // カメラの現在の向きから yaw / pitch を初期化
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    this._yaw = Math.atan2(direction.x, direction.z);
    this._pitch = Math.asin(direction.y);
    this._previousMousePosition = { x: e.clientX, y: e.clientY };
    this.dispatchEvent(startEvent);
  };

  private _onMouseMove = (e: MouseEvent) => {
    if (!this._isDragging) return;

    const dx = e.clientX - this._previousMousePosition.x;
    const dy = e.clientY - this._previousMousePosition.y;

    this._yaw -= dx * this.rotateSensitivity;
    this._pitch -= dy * this.rotateSensitivity;

    this._pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this._pitch));

    this._updateCameraRotation();
    this._previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  private _onMouseUp = () => {
    this._isDragging = false;
    this.dispatchEvent(endEvent);
  };

  private _onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      this._previousMousePosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
    this.dispatchEvent(startEvent);
  };

  private _onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - this._previousMousePosition.x;
      const dy = e.touches[0].clientY - this._previousMousePosition.y;

      this._yaw -= dx * this.rotateSensitivity;
      this._pitch -= dy * this.rotateSensitivity;

      this._pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this._pitch));

      this._updateCameraRotation();
      this._previousMousePosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  private _onTouchEnd = () => {
    this.dispatchEvent(endEvent);
  };

  /**　カメラの回転を更新する　*/
  private _updateCameraRotation() {
    const target = new THREE.Vector3();
    target.x = Math.cos(this._pitch) * Math.sin(this._yaw);
    target.y = Math.sin(this._pitch);
    target.z = Math.cos(this._pitch) * Math.cos(this._yaw);

    // カメラの位置を加算して、カメラの向いている座標を計算
    target.add(this.camera.position);
    this.camera.lookAt(target);
    this.dispatchEvent(changeEvent);
  }
}