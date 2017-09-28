import {
  createElement as $,
  PropTypes,
} from 'react';
import compose from 'recompose/compose';
import withState from 'recompose/withState';
import withHandlers from 'recompose/withHandlers';
import onlyUpdateForPropTypes from 'recompose/onlyUpdateForPropTypes';
import setPropTypes from 'recompose/setPropTypes';

import React3 from 'react-three-renderer';
import * as THREE from 'three';

import frag from '../tools/shaders/cloth/fragment';
import vert from '../tools/shaders/cloth/vertex';


export const Part = compose(
  onlyUpdateForPropTypes,
  setPropTypes({
    geometry: PropTypes.string.isRequired,
    height: PropTypes.number.isRequired,
    isTextured: PropTypes.bool,
    position: PropTypes.object.isRequired,
    radiusBottom: PropTypes.number,
    radiusTop: PropTypes.number,
    rotation: PropTypes.object.isRequired,
    thetaLength: PropTypes.number,
    thetaStart: PropTypes.number,
  }),
)((props) => {
  const {
    geometry,
    height,
    isTextured = false,
    position,
    radiusBottom,
    radiusTop,
    rotation,
    thetaLength,
    thetaStart,
  } = props;
  return $('mesh',
    {
      castShadow: true,
      position: new THREE.Vector3(position.x, position.y, position.z),
      receiveShadow: true,
      rotation: new THREE.Euler(rotation.x, rotation.y, rotation.z),
    },
      geometry !== 'boxGeometry' ? null : $(geometry, {
        depth: 0.6,
        height,
        width: 0.02,
      }),
      geometry !== 'cylinderGeometry' ? null : $(geometry, {
        radiusBottom,
        radiusTop,
        thetaLength,
        thetaStart,
        height,
      }),
      $('meshLambertMaterial',
        {
          color: 0xffffff,
          side: THREE.DoubleSide,
        },
          !isTextured ? null : $('textureResource', { resourceId: 'blackDots' }),
      ),
      $('shaderMaterial',
        {
          slot: 'customDepthMaterial',
          fragmentShader: frag,
          vertexShader: vert,
        },
          $('uniforms', undefined,
            $('uniform',
              {
                name: 'texture',
                type: 't',
              },
                !isTextured ? null : $('textureResource', { resourceId: 'blackDots' }),
            ),
          ),
      ),
  );
});


export default compose(
  withState('directionalLightPosition', 'setDirectionalLightPosition', new THREE.Vector3(5, 10, 7).multiplyScalar(1.3)),
  withState('cameraPosition', 'setCameraPosition', new THREE.Vector3(-3, 2, 6)),
  withState('fog', 'setFog', new THREE.Fog(0xcce0ff, 200, 200)),
  withState('scenePosition', 'setScenePosition', new THREE.Vector3(0, 2, 0)),
  withHandlers({
    onAnimate: ({ cameraPosition, setCameraPosition, directionalLightPosition, setDirectionalLightPosition }) => () => {
      const time = Date.now();
      setCameraPosition(new THREE.Vector3(
        Math.cos(time * 0.001) * 10,
        cameraPosition.y,
        Math.sin(time * 0.001) * 10,
      ));
      setDirectionalLightPosition(new THREE.Vector3(
        Math.cos(time * 0.001) * 10,
        directionalLightPosition.y,
        Math.sin(time * 0.001) * 10,
      ));
    },
  }),
)((props) => {
  const {
    cameraPosition,
    directionalLightPosition,
    fog,
    onAnimate,
    scenePosition,
  } = props;
  const width = window.innerWidth;
  const height = window.innerHeight;

  return $(React3,
    {
      clearColor: 0xcce0ff,
      height,
      mainCamera: 'mainCamera',
      onAnimate,
      pixelRatio: window.devicePixelRatio,
      shadowMapEnabled: true,
      shadowMapType: THREE.PCFSoftShadowMap,
      width,
    },
      $('scene',
        {
          fog,
          castShadow: true,
          receiveShadow: true,
        },
          $('resources', undefined,
            $('texture', {
              url: 'black-dots.jpg',
              wrapS: THREE.RepeatWrapping,
              wrapT: THREE.RepeatWrapping,
              anisotropy: 16,
              resourceId: 'blackDots',
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
          $('ambientLight', { color: 0xFCE4EC }),
          $('directionalLight', {
            castShadow: true,
            color: 0xffffff,
            position: directionalLightPosition,
            lookAt: scenePosition,
            shadowCameraRight: 5,
            shadowCameraLeft: -5,
            shadowCameraTop: 5,
            shadowCameraBottom: -5,
          }),
          $(Part, {
            geometry: 'boxGeometry',
            height: 4,
            isTextured: true,
            position: { x: 0, y: 2, z: 0 },
            rotation: { x: 0, y: 0, z: -0.26 },
          }),
          $(Part, {
            geometry: 'boxGeometry',
            height: 2.7,
            isTextured: true,
            position: { x: 1, y: 1.4, z: 0 },
            rotation: { x: 0, y: 0, z: 0.13 },
          }),
          $(Part, {
            geometry: 'boxGeometry',
            height: 1.2,
            position: { x: 0.65, y: 3.14, z: 0.15 },
            rotation: { x: 0, y: 0, z: 1.22 },
          }),
          $(Part, {
            geometry: 'cylinderGeometry',
            height: 0.02,
            isTextured: true,
            position: { x: 0.06, y: 3.76, z: 0 },
            radiusBottom: 0.7,
            radiusTop: 0.7,
            rotation: { x: 1.57, y: 1.27, z: 0 },
            thetaLength: 1.57,
            thetaStart: 0,
          }),
          $(Part, {
            geometry: 'cylinderGeometry',
            height: 0.02,
            position: { x: -0.53, y: 0.83, z: -0.16 },
            radiusBottom: 0.7,
            radiusTop: 0.7,
            rotation: { x: 0, y: 3.14, z: 0.2 },
            thetaLength: 3.14,
            thetaStart: 1.57,
          }),
          $(Part, {
            geometry: 'boxGeometry',
            height: 2,
            position: { x: 0.26, y: 2, z: 0.17 },
            rotation: { x: 0, y: 0, z: -1.38 },
          }),
          $(Part, {
            geometry: 'cylinderGeometry',
            height: 0.02,
            position: { x: 1, y: 2.5, z: 0 },
            radiusBottom: 0.7,
            radiusTop: 0.7,
            rotation: { x: 1.57, y: 0, z: 0 },
            thetaLength: 1.57,
            thetaStart: 0.15,
          }),
          $(Part, {
            geometry: 'boxGeometry',
            height: 2.4,
            position: { x: -0.6, y: 2.6, z: 0 },
            rotation: { x: 0, y: 0, z: 0.16 },
          }),
          $(Part, {
            geometry: 'boxGeometry',
            height: 0.7,
            isTextured: true,
            position: { x: -0.7, y: 3.3, z: 0.2 },
            rotation: { x: 0, y: 0, z: -1.27 },
          }),
      ),
  );
});
