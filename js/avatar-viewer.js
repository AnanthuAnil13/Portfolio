import * as THREE from "./vendor/three/three.module.js";
import { GLTFLoader } from "./vendor/three/loaders/GLTFLoader.js";

(function () {
  window.__avatarViewerStarted = true;

  const AVATAR_MODEL_URL = "assets/avatar/avatar-hero.v1.glb";
  const container = document.getElementById("avatar-scene");
  if (!container) return;

  const boot = (window.__portfolioBoot = window.__portfolioBoot || {
    avatar: {
      state: "idle",
      progress: null,
    },
  });
  const loadingEl = document.getElementById("avatar-loading");

  function setStatus(message) {
    if (!loadingEl) return;
    loadingEl.textContent = message;
    loadingEl.classList.toggle("is-hidden", message.length === 0);
  }

  function updateBootAvatar(state, detail) {
    boot.avatar = {
      ...(boot.avatar || {}),
      ...detail,
      state,
    };
  }

  function emitAvatarEvent(type, detail) {
    const state =
      type === "portfolio:avatar-ready"
        ? "ready"
        : type === "portfolio:avatar-error"
          ? "error"
          : "loading";

    updateBootAvatar(state, detail);
    window.dispatchEvent(new CustomEvent(type, { detail }));
  }

  function emitAvatarProgress(detail) {
    const progress =
      detail.total && detail.total > 0
        ? Math.round((detail.loaded / detail.total) * 100)
        : detail.progress ?? null;

    emitAvatarEvent("portfolio:avatar-progress", {
      ...detail,
      progress,
      modelUrl: AVATAR_MODEL_URL,
    });
  }

  function emitAvatarError(message, detail = {}) {
    emitAvatarEvent("portfolio:avatar-error", {
      ...detail,
      message,
      modelUrl: AVATAR_MODEL_URL,
    });
  }

  if (window.location.protocol === "file:") {
    const message = "Run this site through a local server to enable the live avatar.";
    setStatus(message);
    emitAvatarError(message, { code: "file-protocol" });
    return;
  }

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    console.error("Failed to initialize WebGL renderer", error);
    setStatus("WebGL is unavailable.");
    emitAvatarError("WebGL is unavailable.", {
      code: "webgl-unavailable",
    });
    return;
  }

  renderer.domElement.className = "cin-avatar-canvas";
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    30,
    container.clientWidth / container.clientHeight,
    0.01,
    100
  );
  camera.position.set(0, 1.42, 5.2);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a1646, 0.9));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(2.8, 3.6, 3.4);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x9b8bff, 0.72);
  rimLight.position.set(-3.2, 2.2, -2.8);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x6849ff, 18, 18, 2);
  fillLight.position.set(0, 2.1, 1.6);
  scene.add(fillLight);

  const avatarRig = new THREE.Group();
  scene.add(avatarRig);

  const lookState = {
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0,
  };

  const HEAD_YAW_LIMIT = THREE.MathUtils.degToRad(24);
  const HEAD_PITCH_LIMIT = THREE.MathUtils.degToRad(14);
  const EYE_YAW_SCALE = 0.45;
  const EYE_PITCH_SCALE = 0.45;

  let mixer = null;
  let loadedAvatar = null;
  let headBone = null;
  const eyeBones = [];
  const headBaseQuaternion = new THREE.Quaternion();
  const eyeBaseQuaternions = new Map();
  const headOffsetQuaternion = new THREE.Quaternion();
  const eyeOffsetQuaternion = new THREE.Quaternion();
  const fallbackQuaternion = new THREE.Quaternion();
  const tmpBox = new THREE.Box3();
  const tmpSize = new THREE.Vector3();
  const tmpCenter = new THREE.Vector3();

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updatePointer(clientX, clientY) {
    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = (clientY / window.innerHeight) * 2 - 1;

    lookState.targetYaw = clamp(x * HEAD_YAW_LIMIT, -HEAD_YAW_LIMIT, HEAD_YAW_LIMIT);
    lookState.targetPitch = clamp(y * HEAD_PITCH_LIMIT, -HEAD_PITCH_LIMIT, HEAD_PITCH_LIMIT);
  }

  window.addEventListener("pointermove", function (event) {
    updatePointer(event.clientX, event.clientY);
  });

  window.addEventListener(
    "touchmove",
    function (event) {
      const touch = event.touches[0];
      if (touch) updatePointer(touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  function recenterLook() {
    lookState.targetYaw = 0;
    lookState.targetPitch = 0;
  }

  window.addEventListener("pointerleave", recenterLook);
  window.addEventListener("blur", recenterLook);

  function fitAvatar(modelRoot) {
    const initialBox = new THREE.Box3().setFromObject(modelRoot);
    const initialSize = initialBox.getSize(new THREE.Vector3());
    const initialCenter = initialBox.getCenter(new THREE.Vector3());

    if (initialSize.y === 0) return;

    const targetHeight = 2;
    const scale = targetHeight / initialSize.y;

    modelRoot.position.sub(initialCenter);
    modelRoot.scale.setScalar(scale);

    const fittedBox = new THREE.Box3().setFromObject(modelRoot);
    const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
    modelRoot.position.sub(fittedCenter);
  }

  function frameAvatar(modelRoot) {
    tmpBox.setFromObject(modelRoot);
    tmpBox.getSize(tmpSize);
    tmpBox.getCenter(tmpCenter);

    const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
    const distanceForHeight = (tmpSize.y * 0.5) / Math.tan(halfFovY);
    const halfFovX = Math.atan(Math.tan(halfFovY) * camera.aspect);
    const distanceForWidth = (tmpSize.x * 0.5) / Math.tan(halfFovX);
    const distance = Math.max(distanceForHeight, distanceForWidth) * 1.18;

    camera.position.set(
      tmpCenter.x,
      tmpCenter.y + tmpSize.y * 0.04,
      tmpCenter.z + distance
    );
    camera.near = Math.max(0.01, distance / 100);
    camera.far = distance + Math.max(tmpSize.x, tmpSize.y, tmpSize.z) * 10;
    camera.updateProjectionMatrix();
    camera.lookAt(tmpCenter);
  }

  const loader = new GLTFLoader();
  emitAvatarProgress({ phase: "boot", progress: 0, loaded: 0, total: 0 });

  loader.load(
    AVATAR_MODEL_URL,
    function (gltf) {
      const avatar = gltf.scene;
      loadedAvatar = avatar;
      avatarRig.add(avatar);
      fitAvatar(avatar);
      frameAvatar(avatar);

      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(avatar);
        for (const clip of gltf.animations) {
          mixer.clipAction(clip).play();
        }
      }

      avatar.traverse(function (node) {
        if (!node.isBone) return;
        const lowerName = node.name.toLowerCase();

        if (!headBone && lowerName.includes("head") && !lowerName.includes("end")) {
          headBone = node;
        }

        if (lowerName.includes("eye") && !lowerName.includes("target")) {
          eyeBones.push(node);
        }
      });

      if (headBone) {
        headBaseQuaternion.copy(headBone.quaternion);
      }

      for (const eyeBone of eyeBones.slice(0, 2)) {
        eyeBaseQuaternions.set(eyeBone, eyeBone.quaternion.clone());
      }

      container.classList.add("is-live");
      setStatus("");
      renderer.render(scene, camera);

      const readyDetail = {
        phase: "ready",
        progress: 100,
        modelUrl: AVATAR_MODEL_URL,
      };

      updateBootAvatar("ready", readyDetail);

      window.requestAnimationFrame(function () {
        window.dispatchEvent(new CustomEvent("portfolio:avatar-ready", { detail: readyDetail }));
      });
    },
    function (event) {
      if (!event.total) {
        emitAvatarProgress({
          phase: "download",
          loaded: event.loaded || 0,
          total: 0,
        });
        return;
      }

      emitAvatarProgress({
        phase: "download",
        loaded: event.loaded,
        total: event.total,
      });
    },
    function (error) {
      console.error("Failed to load avatar model", error);
      setStatus("Live avatar failed to load.");
      emitAvatarError("Live avatar failed to load.", {
        code: "load-failed",
      });
    }
  );

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (mixer) mixer.update(delta);

    lookState.yaw = THREE.MathUtils.damp(lookState.yaw, lookState.targetYaw, 9, delta);
    lookState.pitch = THREE.MathUtils.damp(lookState.pitch, lookState.targetPitch, 9, delta);

    if (headBone) {
      headOffsetQuaternion.setFromEuler(
        new THREE.Euler(lookState.pitch, lookState.yaw, 0, "YXZ")
      );
      headBone.quaternion.copy(headBaseQuaternion).multiply(headOffsetQuaternion);

      eyeOffsetQuaternion.setFromEuler(
        new THREE.Euler(
          lookState.pitch * EYE_PITCH_SCALE,
          lookState.yaw * EYE_YAW_SCALE,
          0,
          "YXZ"
        )
      );

      for (const eyeBone of eyeBones.slice(0, 2)) {
        const base = eyeBaseQuaternions.get(eyeBone);
        if (!base) continue;
        eyeBone.quaternion.copy(base).multiply(eyeOffsetQuaternion);
      }
    } else {
      fallbackQuaternion.setFromEuler(
        new THREE.Euler(lookState.pitch * 0.45, lookState.yaw * 0.62, 0, "YXZ")
      );
      avatarRig.quaternion.slerp(fallbackQuaternion, 0.14);
    }

    renderer.render(scene, camera);
  }

  animate();

  function handleResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    if (loadedAvatar) frameAvatar(loadedAvatar);
  }

  window.addEventListener("resize", handleResize);
})();
