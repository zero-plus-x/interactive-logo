0+x interactive logo.
---

The Mesh model was generated in blender from original svg logo by Dmytro Kovkun. Change it to get different logos.

![screen shot](https://raw.githubusercontent.com/yuri-karadzhov/interactive-logo/master/screen_shot.png)

## Install

```sh
npm install -S @zero-plus-x/logo
```

## Usage

```js
import { Logo, Controls } from '@zero-plus-x/logo';

// render logo to a given DOM-element
const logoContainer = document.getElementById('logo-container');
const options = {}; // see `options` section below
const logo = new Logo(logoContainer, options);

// (optional) render controls to tweak how logo should look
const controlsContainer = document.getElementById('controls-container');
const controls = new Controls(controlsContainer, logo);

// destroy logo if it's not needed anymore
logo.destroy();
```

## Logo options

### options.vertexShader

- _default:_

  ```c
  attribute float a_Size;
  attribute float a_Alpha;
  varying float v_Alpha;
  void main() {
    v_Alpha = a_Alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = a_Size;
    gl_Position = projectionMatrix * mvPosition;
  }
  ```

### options.fragmentShader

- _default:_

  ```c
  uniform sampler2D u_Texture;
  varying float v_Alpha;
  void main() {
    vec4 color = vec4(1.0, 1.0, 1.0, v_Alpha) * texture2D(u_Texture, vec2(1.0, 1.0) - gl_PointCoord);
    gl_FragColor = color;
  }
  ```

### options.cameraHeight

- _default:_ 50

### options.radius

- _default:_ 10

### options.minParticleSize

- _default:_ 1

### options.maxParticleSize

- _default:_ 6

### options.minParticleAlpha

- _default:_ 0.2

### options.maxParticleAlpha

- _default:_ 1

### options.minFrame

- _default:_ 10

### options.maxFrame

- _default:_ 30

### options.minBrownSpeed

- _default:_ 0.03

### options.maxBrownSpeed

- _default:_ 0.08

### options.minBrownRadius

- _default:_ 0

### options.maxBrownRadius

- _default:_ 1

### options.initRadius

- _default:_ 1000

### options.freeAmount

- _default:_ 50

### options.minFreeSize

- _default:_ 1

### options.maxFreeSize

- _default:_ 8

### options.minFreeAlpha

- _default:_ 0.1

### options.maxFreeAlpha

- _default:_ 0.9

### options.minFreeSpeed

- _default:_ 0.001

### options.maxFreeSpeed

- _default:_ 0.005

### options.minFreeFrame

- _default:_ 180

### options.maxFreeFrame

- _default:_ 300


## Development

Install dependencies:
```sh
npm install
```

Start dev-server (at http://localhost:3333):
```sh
npm start
```

Production build:
```sh
npm run build
```

Build a standalone page with this module:
```sh
npm run buildGlobal
```

Run linters (ESLint + Stylelint):
```sh
npm test
```
