import {
  createElement as $,
  PropTypes,
} from 'react';

import onlyUpdateForPropTypes from 'recompose/onlyUpdateForPropTypes';
import setPropTypes from 'recompose/setPropTypes';
import compose from 'recompose/compose';
import withState from 'recompose/withState';
import withHandlers from 'recompose/withHandlers';
import pure from 'recompose/pure';
import lifecycle from 'recompose/lifecycle';

import React3 from 'react-three-renderer';
import * as THREE from 'three';

import Cloth from './models/cloth';

const GRAVITY = 981 * 1.4;
const gravity = new THREE.Vector3(0, -GRAVITY, 0).multiplyScalar(Cloth.MASS);
const TIMESTEP = 18 / 1000;
const TIMESTEP_SQ = TIMESTEP * TIMESTEP;
const diff = new THREE.Vector3();
const tmpForce = new THREE.Vector3();

function satisfyConstrains(p1, p2, distance) {
  diff.subVectors(p2.position, p1.position);
  const currentDist = diff.length();
  if (currentDist === 0) return; // prevents division by 0
  const correction = diff.multiplyScalar(1 - (distance / currentDist));
  const correctionHalf = correction.multiplyScalar(0.5);
  p1.position.add(correctionHalf);
  p2.position.sub(correctionHalf);
}

const fragmentShaderDepth =
  ' uniform sampler2D texture;' +
  ' varying vec2 vUV;' +
  ' void main() {' +
    ' vec4 pixel = texture2D( texture, vUV );' +
    ' if ( pixel.a < 0.5 ) discard;' +
    ' gl_FragData[ 0 ] = packDepthToRGBA( gl_FragCoord.z );' +
  ' }';

const vertexShaderDepth =
  ' varying vec2 vUV;' +
  ' void main() {' +
    ' vUV = 0.75 * uv;' +
    ' vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );' +
    ' gl_Position = projectionMatrix * mvPosition;' +
  ' }';


export const ClothComponent = pure(compose(
  onlyUpdateForPropTypes,
  setPropTypes({
    cloth: PropTypes.instanceOf(Cloth).isRequired,
  }),
  lifecycle({
    componentDidMount() {
      this.refs.geometry.computeFaceNormals();
    },
  }),
)((props) => {
  const {
    cloth,
  } = props;
  return $('parametricGeometry', {
    ref: 'geometry',
    parametricFunction: Cloth.clothFunction,
    slices: cloth.w,
    stacks: cloth.h,
    dynamic: true,
  });
}));


export default pure(compose(
  withState('ambientLightColor', 'setAmbientLightColor', 0x666666),
  withState('cameraPosition', 'setCameraPosition', new THREE.Vector3(0, 50, 1500)),
  withState('cloth', 'setCloth', new Cloth(10, 10)),
  withState('clothPosition', 'setClothPosition', new THREE.Vector3(0, 0, 0)),
  withState('directionalLightPosition', 'setDirectionalLightPosition', new THREE.Vector3(50, 200, 100).multiplyScalar(1.3)),
  withState('fog', 'setFog', new THREE.Fog(0xcce0ff, 500, 10000)),
  withState('refCloth', 'setRefCloth', null),
  withState('scenePosition', 'setScenePosition', new THREE.Vector3(0, 0, 0)),
  withState('time', 'setTime', null),
  withState('windForce', 'setWindForce', new THREE.Vector3(0, 0, 0)),
  withHandlers({
    simulate: props => () => {
      const {
        cloth,
        refCloth,
        windForce,
      } = props;
      const clothGeometry = React3.findTHREEObject(refCloth);

      // Contraintes aerodynamiques
      let face;
      const faces = clothGeometry.faces;
      let normal;

      const { particles } = cloth;

      for (let i = faces.length - 1; i >= 0; i -= 1) {
        face = faces[i];
        normal = face.normal;

        tmpForce.copy(normal).normalize().multiplyScalar(normal.dot(windForce));
        particles[face.a].addForce(tmpForce);
        particles[face.b].addForce(tmpForce);
        particles[face.c].addForce(tmpForce);
      }

      let particle;
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        particle = particles[i];
        particle.addForce(gravity);

        particle.integrate(TIMESTEP_SQ);
      }

      // Start constrains
      const constrains = cloth.constrains;
      let constrain;
      for (let i = constrains.length - 1; i >= 0; i -= 1) {
        constrain = constrains[i];
        satisfyConstrains(constrain[0], constrain[1], constrain[2]);
      }

      // Pin constrains
      const pins = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      for (let i = pins.length - 1; i >= 0; i -= 1) {
        const xy = pins[i];
        const p = particles[xy];
        p.position.copy(p.original);
        p.previous.copy(p.original);
      }
    },
  }),
  withHandlers({
    onAnimate: props => () => {
      const {
        refCloth,
        cloth,
        time,
        setTime,
        cameraPosition,
        setCameraPosition,
        setWindForce,
        simulate,
      } = props;
      const newTime = Date.now();
      if (newTime === time) {
        return;
      }

      // Force du vent
      const windStrength = (Math.cos(time / 7000) * 20) + 40;
      setWindForce(new THREE.Vector3(
        Math.sin(time / 2000),
        Math.cos(time / 3000),
        Math.sin(time / 1000)).normalize().multiplyScalar(windStrength));

      // Simulation des contraintes
      simulate();

      // Camera position
      setCameraPosition(new THREE.Vector3(
      Math.cos(newTime * 0.0005) * 1500,
      cameraPosition.y,
      Math.sin(newTime * 0.0005) * 1500));

      const clothGeometry = React3.findTHREEObject(refCloth);
      const p = cloth.particles;
      for (let i = p.length - 1; i >= 0; i -= 1) {
        clothGeometry.vertices[i].copy(p[i].position);
      }

      clothGeometry.computeFaceNormals();
      clothGeometry.computeVertexNormals();

      clothGeometry.normalsNeedUpdate = true;
      clothGeometry.verticesNeedUpdate = true;

      setTime(newTime);
    },
  }),
)((props) => {
  const {
    ambientLightColor,
    cameraPosition,
    cloth,
    clothPosition,
    directionalLightPosition,
    fog,
    onAnimate,
    refCloth,
    scenePosition,
    setRefCloth,
  } = props;
  const width = window.innerWidth;
  const height = window.innerHeight;
  return $(React3,
    {
      width,
      height,
      mainCamera: 'mainCamera',
      clearColor: 0xcce0ff,
      onAnimate,
      pixelRatio: window.devicePixelRatio,
    },
      $('scene', { fog },
        $('resources', undefined,
          $('texture', {
            url: 'https://thumbs.dreamstime.com/z/circuit-board-vector-computer-seamless-pattern-29487352.jpg',
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.RepeatWrapping,
            anisotropy: 16,
            resourceId: 'clothTexture',
          }),
        ),
        $('perspectiveCamera', {
          name: 'mainCamera',
          fov: 30,
          aspect: width / height,
          near: 1,
          far: 10000,
          lookAt: scenePosition,
          position: cameraPosition,
        }),
        $('ambientLight', { color: ambientLightColor }),
        $('directionalLight', {
          castShadow: true,
          color: 0xdfebff,
          intensity: 1.75,
          position: directionalLightPosition,
          lookAt: scenePosition,
        }),
        $('mesh',
          {
            position: clothPosition,
            castShadow: true,
            receiveShadow: true,
          },
            $(ClothComponent, {
              ref: ref => (refCloth !== ref && ref !== null ? setRefCloth(ref) : ref),
              cloth,
            }),
            $('meshPhongMaterial',
              {
                alphaTest: 0.5,
                color: 0xffffff,
                specular: 0x030303,
                emissive: 0x111111,
                shininess: 10,
                side: THREE.DoubleSide,
              },
                $('textureResource', { resourceId: 'clothTexture' }),
            ),
            $('shaderMaterial',
              {
                slot: 'customDepthMaterial',
                fragmentShader: fragmentShaderDepth,
                vertexShader: vertexShaderDepth,
              },
                $('uniforms', undefined,
                  $('uniform',
                    {
                      name: 'texture',
                      type: 't',
                    },
                      $('textureResource', { resourceId: 'clothTexture' }),
                  ),
                ),
            ),
        ),
      ),
  );
}));
