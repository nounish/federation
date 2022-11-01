import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Vector2, Color } from "three";
import styles from "./shader.module.scss";

const Gradient = () => {
  const mesh = useRef();

  const uniforms = useMemo(
    () => ({
      u_time: {
        value: 0.0,
      },
      u_mouse: { value: new Vector2(0, 0) },
      u_bg: {
        value: new Color("#FFF"),
      },
      u_colorA: { value: new Color("#D6ABF6") },
      u_colorB: { value: new Color("#6358ee") },
    }),
    []
  );

  useFrame((state) => {
    const { clock } = state;
    mesh.current.material.uniforms.u_time.value = clock.getElapsedTime();
  });

  return (
    <mesh ref={mesh} position={[0, 0, 1]} scale={1}>
      <planeGeometry args={[1, 1, 42, 32]} />
      <shaderMaterial fragmentShader={fragmentShader} vertexShader={vertexShader} uniforms={uniforms} />
    </mesh>
  );
};

const Scene = () => {
  return (
    <Canvas
      camera={{ position: [0.0, 0.0, 1.5] }}
      className={styles.c}
      style={{ position: "absolute", left: 0, right: 0 }}
    >
      <Gradient />
    </Canvas>
  );
};

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
  }
`;

// https://github.com/ashima/webgl-noise/blob/master/src/noise2D.glsl
const fragmentShader = `
  uniform float u_time;
  uniform vec3 u_bg;
  uniform vec3 u_colorA;
  uniform vec3 u_colorB;
  uniform vec2 u_mouse;

  varying vec2 vUv;

  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec3 permute(vec3 x) {
    return mod289(((x*34.0)+1.0)*x);
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                      -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0

    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);

    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289(i); // Avoid truncation effects in permutation
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));

    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }


  void main() {
    vec3 color = u_bg;

    float noise1 = snoise(vUv + u_time * (sin(u_mouse.x * 0.001) + 0.2));
    float noise2 = snoise(vUv + u_time * (sin(u_mouse.y * 0.001) + 0.2));

    color = mix(color, u_colorA, noise1);
    color = mix(color, u_colorB, noise2);
    
    gl_FragColor = vec4(color ,1.0);
  }
`;

export default Scene;
