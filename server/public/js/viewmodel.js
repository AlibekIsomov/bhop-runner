'use strict';
// ============================================================
// WebGL viewmodel: CS:GO karambit fade + sport gloves (FBX)
// Rendered on a transparent canvas above the 2D game.
//
// TUNING SYSTEM (simplified):
//   POS     — screen position [right, up, into-screen]
//   ORIENT  — model rotation as Euler YXZ [pitch, yaw, roll] in radians
//   SCALE   — size multiplier (on top of forearm normalization)
//
// Override at runtime: window.VM_TUNE = { POS:[...], ORIENT:[...], ... }
// ============================================================
function initViewmodel(canvas) {
  // --- renderer & scene ---
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, 1, 0.01, 20);

  // --- lighting (map's magenta-purple haze) ---
  scene.add(new THREE.HemisphereLight(0xd9c4f0, 0x2a1636, 1.15));
  const key = new THREE.DirectionalLight(0xfff0dd, 1.25);
  key.position.set(-1.5, 2, 1.2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff82f5, 1.0);
  rim.position.set(0.6, 0.4, -2);
  scene.add(rim);

  // --- rig hierarchy ---
  // rig  (moves with sway/bob/drop — screen-space)
  //  └ holder  (base orientation + scale — static pose of the model)
  //     └ root (FBX scene graph, centered on right hand)
  const rig = new THREE.Group();
  scene.add(rig);

  const diag = { bones: [], meshes: [] };
  let ready = false;

  // ============================================================
  // TUNING CONSTANTS — the ONLY place you need to touch
  // ============================================================
  const T = Object.assign({
    // Screen position of the rig:
    //   [0] X : positive → right       (try 0.10 – 0.20)
    //   [1] Y : positive → up          (try -0.30 – -0.50)
    //   [2] Z : negative → into screen (try -0.55 – -0.80)
    POS: [0.12, -0.30, -0.60],

    // Model orientation — Euler angles (radians), applied in YXZ order.
    // This is the SINGLE rotation that controls how the hands face.
    //   [0] pitch (X) : positive → tilt fingers downward
    //   [1] yaw   (Y) : positive → turn model leftward
    //   [2] roll  (Z) : positive → counter-clockwise tilt
    ORIENT: [0.00, Math.PI, 0.00],

    // Scale multiplier (normalized by forearm bone length)
    SCALE: 2.5,

    // Which duplicate knife mesh to show (0 or 1)
    KNIFE: 1,
  }, window.VM_TUNE || {});

  // --- textures ---
  function b64Tex(b64) {
    const t = new THREE.TextureLoader().load('data:image/png;base64,' + b64);
    t.encoding = THREE.sRGBEncoding;
    t.flipY = true;
    return t;
  }
  const texGloveL = b64Tex(MODELS.gloveLeftPNG);
  const texGloveR = b64Tex(MODELS.gloveRightPNG);

  function fadeTex() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const lg = g.createLinearGradient(0, 256, 256, 0);
    lg.addColorStop(0, '#2a1746');
    lg.addColorStop(0.35, '#7b2d8b');
    lg.addColorStop(0.6, '#e0417e');
    lg.addColorStop(0.8, '#ff9a3d');
    lg.addColorStop(1, '#ffd34d');
    g.fillStyle = lg;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  // --- materials ---
  const matKnife = new THREE.MeshStandardMaterial({ map: fadeTex(), metalness: 0.75, roughness: 0.25 });
  const matGloveL = new THREE.MeshStandardMaterial({ map: texGloveL, metalness: 0.05, roughness: 0.85 });
  const matGloveR = new THREE.MeshStandardMaterial({ map: texGloveR, metalness: 0.05, roughness: 0.85 });
  const matSkin = new THREE.MeshStandardMaterial({ color: 0x9a6f52, metalness: 0, roughness: 0.9 });

  function remap(m) {
    const n = (m && m.name) || '';
    if (n.indexOf('knife_karam') >= 0) return matKnife;
    if (n === 'Material.005') return matGloveL;
    if (n === 'Material.006') return matGloveR;
    if (n.indexOf('bare_arm') >= 0) return matSkin;
    return matSkin;
  }

  // --- load FBX (URL modifier prevents external texture fetches) ---
  const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const mgr = new THREE.LoadingManager();
  mgr.setURLModifier(() => PIXEL);

  try {
    const root = new THREE.FBXLoader(mgr).parse(b64ToBuf(MODELS.handsFBX), '');
    const meshes = [];

    root.traverse(o => {
      if (o.isBone) diag.bones.push(o.name);
      if (o.isMesh) {
        meshes.push(o);
        o.frustumCulled = false;
        diag.meshes.push(o.name);
        if (Array.isArray(o.material)) o.material = o.material.map(remap);
        else o.material = remap(o.material);
      }
    });

    // hide duplicate knife meshes
    const knives = meshes.filter(m => /knife/i.test(m.name))
      .sort((a, b) => a.name.length - b.name.length);
    knives.forEach((k, i) => { k.visible = i === (T.KNIFE !== undefined ? T.KNIFE : 1); });

    // find skeleton bones for centering + scale normalization
    const glove = meshes.find(m => /glove/i.test(m.name));
    if (!glove || !glove.skeleton) throw new Error('glove mesh/skeleton not found');
    const findBone = n => glove.skeleton.bones.find(b => b.name === 'v_weaponBip01_' + n);
    const handBone = findBone('R_Hand');
    const elbowBone = findBone('R_Forearm');
    if (!handBone || !elbowBone) throw new Error('R_Hand/R_Forearm bone not found');

    root.updateMatrixWorld(true);
    const handPos = new THREE.Vector3();
    const elbowPos = new THREE.Vector3();
    handBone.getWorldPosition(handPos);
    elbowBone.getWorldPosition(elbowPos);
    const forearmLen = handPos.distanceTo(elbowPos);
    diag.hand = handPos.toArray().map(v => +v.toFixed(3));
    diag.forearm = +forearmLen.toFixed(4);

    // center model on right hand bone
    root.position.copy(handPos).negate();

    // build holder: scale + orient
    const scale = T.SCALE * 0.12 / forearmLen;
    const holder = new THREE.Group();
    holder.scale.setScalar(scale);
    holder.rotation.order = 'YXZ';
    holder.rotation.set(T.ORIENT[0], T.ORIENT[1], T.ORIENT[2]);
    holder.add(root);
    rig.add(holder);

    ready = true;
  } catch (e) {
    diag.error = String(e && e.message || e);
  }

  rig.position.set(...T.POS);

  function resize(w, h) {
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }

  // state: { t, swayX, swayY, bob, drop }
  function update(st) {
    // position: base + subtle sway/bob/drop
    rig.position.set(
      T.POS[0] + st.swayX * 0.0010,
      T.POS[1] - st.swayY * 0.0008 - st.bob * 0.003 - st.drop * 0.002,
      T.POS[2]
    );
    // rotation: only dynamic sway (base orientation is on the holder)
    rig.rotation.set(
      st.swayY * 0.0010 + st.drop * 0.003,
      0,
      -st.swayX * 0.0014
    );
    renderer.render(scene, cam);
  }

  return { update, resize, diag, isReady: () => ready };
}
