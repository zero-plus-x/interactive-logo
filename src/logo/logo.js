import logo from '../models/logo-flat.json';
import particle from '../textures/particle.png';

import * as THREE from 'three';
import {randomRange} from './utils';

class Logo {
  constructor(element, {
    vertexShader = `
      attribute float a_Size;
      attribute float a_Alpha;
      varying float v_Alpha;
      void main() {
        v_Alpha = a_Alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = a_Size;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader = `
      uniform sampler2D u_Texture;
      varying float v_Alpha;
      void main() {
        vec4 color = vec4(1.0, 1.0, 1.0, v_Alpha) * texture2D(u_Texture, vec2(1.0, 1.0) - gl_PointCoord);
        gl_FragColor = color;
      }
    `,
    cameraHeight = 50,
    radius = 10,
    minParticleSize = 1,
    maxParticleSize = 6,
    minParticleAlpha = 0.2,
    maxParticleAlpha = 1,
    minFrame = 10,
    maxFrame = 30,
    minBrownSpeed = 0.03,
    maxBrownSpeed = 0.08,
    minBrownRadius = 0,
    maxBrownRadius = 1,
    initRadius = 1000,
    freeAmount = 50,
    minFreeSize = 1,
    maxFreeSize = 8,
    minFreeAlpha = 0.1,
    maxFreeAlpha = 0.9,
    minFreeSpeed = 0.001,
    maxFreeSpeed = 0.005,
    minFreeFrame = 180,
    maxFreeFrame = 300
  }) {
    if (!vertexShader || !fragmentShader) {
      throw new Error('Please, provide both vertexShader and fragmentShader to Logo.');
    }

    this.element = element;
    this.cfg = {
      cameraHeight,
      radius,
      minParticleSize,
      maxParticleSize,
      minParticleAlpha,
      maxParticleAlpha,
      minFrame,
      maxFrame,
      minBrownSpeed,
      maxBrownSpeed,
      minBrownRadius,
      maxBrownRadius,
      initRadius,
      freeAmount,
      minFreeSize,
      maxFreeSize,
      minFreeAlpha,
      maxFreeAlpha,
      minFreeSpeed,
      maxFreeSpeed,
      minFreeFrame,
      maxFreeFrame
    };

    this.height = 0;
    this.width = 0;
    this.aspect = 0;
    this.vHeight = 0;
    this.vWidth = 0;

    this.frameCounter = 0;
    this.maxFrames = [];
    this.freeMaxFrames = [];
    this.brownVectors = [];
    this.freeBrownVectors = [];
    this.textGeometry = null;
    this.bufferedGeometry = null;

    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        'u_Texture': {
          type: 't',
          value: new THREE.TextureLoader().load(particle)
        }
      },
      vertexShader,
      fragmentShader,
      transparent: true
    });

    this.mouse = new THREE.Vector3(-1000, -1000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.aspect, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({alpha: true});

    this.onResize();
    this.appendToDom();
    this.addFreeParticles();
    this.load();
    this.subscribeEvents();
  }

  appendToDom() {
    this.element.appendChild(this.renderer.domElement);
  }

  load() {
    const jsonLoader = new THREE.JSONLoader();
    jsonLoader.load(logo, this.onResoucesLoad.bind(this));
  }

  addFreeParticles() {
    this._initMaxFrames(this.freeMaxFrames, this.cfg.freeAmount);
    this.freeGeometry = new THREE.BufferGeometry();
    this._setupBufferedGeometry(this.freeGeometry, this.cfg.freeAmount, {
      minSize: this.cfg.minFreeSize,
      maxSize: this.cfg.maxFreeSize,
      minAlpha: this.cfg.minFreeAlpha,
      maxAlpha: this.cfg.maxFreeAlpha,
      width: this.vWidth / 2,
      height: this.vHeight / 2
    });
    const freePoints = new THREE.Points(this.freeGeometry, this.particleMaterial);
    freePoints.name = 'free.particles';
    this.scene.add(freePoints);
  }

  _initMaxFrames(frames, length) {
    for (let i = 0; i < length; i++) {
      frames[i] = 1;
    }
  }

  _setupBufferedGeometry(bufferedGeometry, amount, cfg) {
    const positions = new THREE.BufferAttribute(new Float32Array(amount * 3), 3, 1).setDynamic(true);
    const alphas = new THREE.BufferAttribute(new Float32Array(amount), 1, 1);
    const sizes = new THREE.BufferAttribute(new Float32Array(amount), 1, 1);
    for (let i = 0; i < amount; i++) {
      // const point = this.textGeometry.vertices[i];
      // positions.setXYZ(i, point.x, point.y, point.z);
      positions.setXYZ(i, randomRange(-cfg.width, cfg.width), randomRange(-cfg.height, cfg.height), 0);
      sizes.setX(i, randomRange(cfg.minSize, cfg.maxSize));
      alphas.setX(i, randomRange(cfg.minAlpha, cfg.maxAlpha));
    }

    bufferedGeometry.addAttribute('position', positions);
    bufferedGeometry.addAttribute('a_Size', sizes);
    bufferedGeometry.addAttribute('a_Alpha', alphas);
  }

  render() {
    this._moveLogo();
    this._moveFree();
    this.frameCounter = (this.frameCounter + 1) % 10000;
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    this.render();
    window.requestAnimationFrame(this.animate.bind(this));
  }

  _moveLogo() {
    const length = this.textGeometry.vertices.length;
    const vertices = this.bufferedGeometry.attributes.position.array;

    for (let i = 0; i < length; i++) {
      const point = new THREE.Vector3().fromArray(vertices, 3 * i);
      let dir = new THREE.Vector3().copy(this.mouse).sub(point);
      let dist = dir.length();
      let origPoint = this.textGeometry.vertices[i];
      if (dist < this.cfg.radius) {
        point.sub(dir.divideScalar(dist * dist));
      }

      this._brownianMove(i, point, origPoint);
      point.toArray(vertices, 3 * i);
    }
    this.bufferedGeometry.attributes.position.needsUpdate = true;
  }

  _moveFree() {
    const length = this.cfg.freeAmount;
    const vertices = this.freeGeometry.attributes.position.array;

    for (let i = 0; i < length; i++) {
      const point = new THREE.Vector3().fromArray(vertices, 3 * i);
      this._freeBrownianMove(i, point);
      point.toArray(vertices, 3 * i);
    }
    this.freeGeometry.attributes.position.needsUpdate = true;
  }

  _getBrownVetor(index, point, origPoint) {
    const brownRadius = randomRange(this.cfg.minBrownRadius, this.cfg.maxBrownRadius);
    const brownQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * Math.random());
    const brownDir = new THREE.Vector3(brownRadius, 0, 0).applyQuaternion(brownQuat);
    return new THREE.Vector3().copy(origPoint)
      .sub(point)
      .add(brownDir)
      .multiplyScalar(randomRange(this.cfg.minBrownSpeed, this.cfg.maxBrownSpeed));
  }

  _brownianMove(index, point, origPoint) {
    if (this.frameCounter % this.maxFrames[index] === 0) {
      this.brownVectors[index] = this._getBrownVetor(index, point, origPoint);
      this.maxFrames[index] = Math.floor(randomRange(this.cfg.minFrame, this.cfg.maxFrame));
    }
    point.add(this.brownVectors[index]);
  }

  _freeBrownianMove(index, point) {
    if (this.frameCounter % this.freeMaxFrames[index] === 0) {
      const width = this.vWidth / 2;
      const height = this.vHeight / 2;
      this.freeBrownVectors[index] = new THREE.Vector3(randomRange(-width, width), randomRange(-height, height), 0)
        .sub(point)
        .multiplyScalar(randomRange(this.cfg.minFreeSpeed, this.cfg.maxFreeSpeed));
      this.freeMaxFrames[index] = Math.floor(randomRange(this.cfg.minFreeFrame, this.cfg.maxFreeFrame));
    }
    point.add(this.freeBrownVectors[index]);
  }

  subscribeEvents() {
    window.addEventListener('resize', this.onResize.bind(this));

    window.addEventListener('mousemove', (event) => {
      const clientX = event.clientX;
      const clientY = event.clientY;
      this.mouse.x = ((clientX / this.width) * 2 - 1) * this.vWidth / 2;
      this.mouse.y = (-(clientY / this.height) * 2 + 1) * this.vHeight / 2;
    });
  }

  onReset() {
    const positions = this.bufferedGeometry.attributes.position;
    const amount = positions.array.length;
    const radius = this.cfg.initRadius;
    for (let i = 0; i < amount; i++) {
      positions.setXYZ(i, randomRange(-radius, radius), randomRange(-radius, radius), 0);
    }
    positions.needsUpdate = true;
  }

  onResoucesLoad(geometry) {
    this.textGeometry = geometry;
    const length = this.textGeometry.vertices.length;

    this._initMaxFrames(this.maxFrames, length);

    this.bufferedGeometry = new THREE.BufferGeometry();
    this._setupBufferedGeometry(this.bufferedGeometry, length, {
      minSize: this.cfg.minParticleSize,
      maxSize: this.cfg.maxParticleSize,
      minAlpha: this.cfg.minParticleAlpha,
      maxAlpha: this.cfg.maxParticleAlpha,
      width: this.cfg.initRadius,
      height: this.cfg.initRadius
    });

    const textPoints = new THREE.Points(this.bufferedGeometry, this.particleMaterial);
    this.scene.add(textPoints);

    this.animate();
  }

  onResize() {
    this.height = this.element.parentNode.clientHeight;
    this.width = this.element.parentNode.clientWidth;
    this.aspect = this.width / this.height;
    const camera = this.camera;
    camera.position.z = this.cfg.cameraHeight;
    camera.aspect = this.aspect;
    camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    const vFOV = camera.fov * Math.PI / 180;
    this.vHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
    this.vWidth = this.vHeight * this.aspect;
  }
}

export default Logo;
