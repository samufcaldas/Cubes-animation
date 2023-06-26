import * as CANNON from "https://cdn.skypack.dev/cannon-es";

import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

const canvasEl = document.querySelector("#canvas");
const rollBtn = document.querySelector("#roll-btn");
const cubeRocket = document.querySelector("#cube-rocket");

let renderer, scene, camera, diceMesh, physicsWorld;

const params = {
  numberOfDice: 5, //aqui seta o número de dados
  segments: 40,
};

const diceArray = [];

// Função para deixar o icone aleatorio na tela
document.addEventListener("DOMContentLoaded", () => {
  // Position rollBtn on random position on screen

  cubeRocket.style.top = `${Math.random() * 100}%`;

  cubeRocket.style.left = `${Math.random() * 100}%`;

  cubeRocket.style.display = "block";
});

rollBtn.addEventListener("click", () => {
  initPhysics();
  initScene();
  throwDice();

  rollBtn.style.display = "none";

  setTimeout(() => {
    const fadeEffect = setInterval(function () {
      if (!canvasEl.style.opacity) {
        canvasEl.style.opacity = 1;
      }
      if (canvasEl.style.opacity > 0) {
        canvasEl.style.opacity -= 0.1;
      } else {
        clearInterval(fadeEffect);
        canvasEl.style.display = "none";
      }
    }, 80);
  }, 8000);
});

function initScene() {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvasEl,
  });

  //renderer.shadowMap.enabled = true //inicializa o shadow dos cubos
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );
  camera.position.set(0, 0.5, 4).multiplyScalar(7);

  updateSceneSize();

  createFloor();

  diceMesh = createDiceMesh();

  for (let i = 0; i < params.numberOfDice; i++) {
    diceArray.push(createDice());
  }

  throwDice(); //funcao para lancar os dados

  render();
}

function initPhysics() {
  console.log("initPhysics");
  physicsWorld = new CANNON.World({
    allowSleep: true,
    gravity: new CANNON.Vec3(0, -20, 0), //configura a gravidade
  });
  physicsWorld.defaultContactMaterial.restitution = 0.1; //defina quanto vai pular com o contato
}

function createFloor() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.ShadowMaterial({
      opacity: 0.1,
    })
  );
  floor.receiveShadow = true;
  floor.position.y = -5; //aqui configura onde cai o dado
  floor.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI * 0.5);
  scene.add(floor);

  const floorBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  });
  floorBody.position.copy(floor.position);
  floorBody.quaternion.copy(floor.quaternion);
  physicsWorld.addBody(floorBody);
}

function createDiceMesh() {
  const loader = new THREE.TextureLoader();

  const boxMaterialOuter = [
    new THREE.MeshBasicMaterial({
      map: loader.load("/img/dado-1.png"),
    }),
    new THREE.MeshBasicMaterial({
      map: loader.load("/img/dado-2.png"),
    }),
    new THREE.MeshBasicMaterial({
      map: loader.load("/img/dado-3.png"),
    }),
    new THREE.MeshBasicMaterial({
      map: loader.load("/img/dado-4.png"),
    }),
    new THREE.MeshBasicMaterial({
      map: loader.load("/img/dado-5.png"),
    }),
    new THREE.MeshBasicMaterial({
      map: loader.load("/img/dado-6.png"),
    }),
  ];

  const diceMesh = new THREE.Group();
  const outerMesh = new THREE.Mesh(createBoxGeometry(), boxMaterialOuter);
  outerMesh.castShadow = true;
  diceMesh.add(outerMesh);

  return diceMesh;
}

function createDice() {
  const mesh = diceMesh.clone();
  scene.add(mesh);

  const body = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Box(new CANNON.Vec3(0.6, 0.6, 0.6)),
    sleepTimeLimit: 0.1,
  });
  physicsWorld.addBody(body);

  return { mesh, body };
}

function createBoxGeometry() {
  return new THREE.BoxGeometry(
    2,
    2,
    2,
    params.segments,
    params.segments,
    params.segments
  ); //tamanho dos cubos
}

function render() {
  physicsWorld.fixedStep();

  for (const dice of diceArray) {
    dice.mesh.position.copy(dice.body.position);
    dice.mesh.quaternion.copy(dice.body.quaternion);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function updateSceneSize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function throwDice() {
  diceArray.forEach((d, dIdx) => {
    d.body.velocity.setZero();
    d.body.angularVelocity.setZero();

    d.body.position = new CANNON.Vec3(10, dIdx * 20, 0);
    d.mesh.position.copy(d.body.position);

    d.mesh.rotation.set(
      2 * Math.PI * Math.random(),
      0,
      2 * Math.PI * Math.random()
    );
    d.body.quaternion.copy(d.mesh.quaternion);

    const force = 3 + 5 * Math.random(); //velocidade e forca de lancamento do dado
    d.body.applyImpulse(
      new CANNON.Vec3(-force, force, 0),
      new CANNON.Vec3(0, 0, 0.2)
    );

    d.body.allowSleep = true;
  });
}
