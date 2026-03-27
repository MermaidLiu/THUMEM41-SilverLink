/** 使用传入的 THREE 命名空间（H5 官方包或小程序 createScopedThreejs）拼装简易 3D 人形，供点击射线检测 */

export type BodyMesh = { mesh: any; bodyPart: string };

export function buildBodyAvatar(THREE: any, scene: any): BodyMesh[] {
  const out: BodyMesh[] = [];
  const baseColor = 0xc4b5fd;
  const mat = new THREE.MeshPhongMaterial({ color: baseColor, shininess: 28 });

  function add(
    bodyPart: string,
    geom: any,
    pos: [number, number, number],
    scale: [number, number, number] = [1, 1, 1]
  ) {
    const mesh = new THREE.Mesh(geom, mat.clone());
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.userData.bodyPart = bodyPart;
    scene.add(mesh);
    out.push({ mesh, bodyPart });
  }

  add("head", new THREE.SphereGeometry(0.2, 20, 16), [0, 1.42, 0]);
  add("chest", new THREE.BoxGeometry(0.42, 0.32, 0.22), [0, 1.08, 0.02]);
  add("abdomen", new THREE.BoxGeometry(0.38, 0.28, 0.2), [0, 0.78, 0.02]);
  add("lower_back", new THREE.BoxGeometry(0.36, 0.3, 0.12), [0, 1.02, -0.14]);
  add("left_shoulder", new THREE.SphereGeometry(0.12, 14, 12), [-0.32, 1.14, 0.02]);
  add("right_shoulder", new THREE.SphereGeometry(0.12, 14, 12), [0.32, 1.14, 0.02]);
  add("left_knee", new THREE.SphereGeometry(0.11, 14, 12), [-0.14, 0.48, 0.04]);
  add("right_knee", new THREE.SphereGeometry(0.11, 14, 12), [0.14, 0.48, 0.04]);
  add("left_ankle", new THREE.SphereGeometry(0.09, 12, 10), [-0.12, 0.12, 0.04]);
  add("right_ankle", new THREE.SphereGeometry(0.09, 12, 10), [0.12, 0.12, 0.04]);

  const amb = new THREE.AmbientLight(0xffffff, 0.72);
  const dir = new THREE.DirectionalLight(0xffffff, 0.55);
  dir.position.set(2, 3, 4);
  scene.add(amb);
  scene.add(dir);

  return out;
}

export function applyMarkerColors(
  THREE: any,
  entries: BodyMesh[],
  markers: { part: string; color: string }[]
) {
  const base = new THREE.Color(0xc4b5fd);
  const map = new Map<string, string>();
  markers.forEach((m) => map.set(m.part, m.color));
  entries.forEach(({ mesh, bodyPart }) => {
    const hex = map.get(bodyPart);
    const mat = mesh.material;
    mat.color = hex ? new THREE.Color(hex) : base.clone();
    mat.needsUpdate = true;
  });
}
