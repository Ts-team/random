import { createElement as $ } from 'react';

import compose from 'recompose/compose';
import withState from 'recompose/withState';
import withHandlers from 'recompose/withHandlers';

import React3 from 'react-three-renderer';
import * as THREE from 'three';

export default compose(
  withState('cameraPosition', 'setCameraPosition', new THREE.Vector3(0, 0, 5)),
  withState('cubeRotation', 'setCubeRotation', new THREE.Euler()),
  withState('directionalLightPosition', 'setDirectionalLightPosition', new THREE.Vector3(0, 4, 0)),
  withState('scenePosition', 'setScenePosition', new THREE.Vector3(0, 0, 0)),
  withHandlers({
    onAnimate: ({ cubeRotation, setCubeRotation }) => () =>
      setCubeRotation(new THREE.Euler(
        cubeRotation.x + 0.1,
        cubeRotation.y + 0.1,
        0,
      )),
  }),
)((props) => {
  const {
    cameraPosition,
    cubeRotation,
    directionalLightPosition,
    onAnimate,
    scenePosition,
  } = props;
  const width = window.innerWidth;
  const height = window.innerHeight;
  return $(React3,
    {
      mainCamera: 'mainCamera',
      width,
      height,
      onAnimate,
      clearColor: 0x404040,
    },
      $('scene', undefined,
        $('perspectiveCamera', {
          name: 'mainCamera',
          fov: 75,
          aspect: width / height,
          near: 0.1,
          far: 1000,
          position: cameraPosition,
          lookAt: scenePosition,
        }),
        $('pointLight', {
          color: 0xffffff,
          intensity: 0.8,
        }),
        $('ambientLight', { color: 0x404040 }),
        $('directionalLight', {
          color: 0xffffff,
          position: directionalLightPosition,
          lookAt: scenePosition,
        }),
        $('mesh', { rotation: cubeRotation },
          $('boxGeometry', {
            width: 1,
            height: 1,
            depth: 1,
          }),
          $('meshPhongMaterial', {
            color: 0x8080f0,
          }),
        ),
      ),
  );
});
