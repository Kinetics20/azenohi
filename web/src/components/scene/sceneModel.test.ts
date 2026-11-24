import { describe, expect, it, vi } from 'vitest';
import { BoxGeometry, InstancedMesh, Mesh, MeshBasicMaterial, Sprite, Texture } from 'three';
import { animateScene, buildScene, disposeScene } from './sceneModel';
describe('Orbital scene', () => {
  it('builds independent geometry, advances the Earth and station, and disposes GPU resources', () => {
    const day = new Texture();
    const model = buildScene({
      day,
      night: new Texture(),
      clouds: new Texture(),
      normal: new Texture(),
    });
    expect(model.earth.geometry.type).toBe('SphereGeometry');
    expect(model.station.getObjectByName('Habitat pressure hull')).toBeInstanceOf(Mesh);
    expect(model.station.getObjectByName('Docking deck')).toBeInstanceOf(Mesh);
    expect(model.station.parent!.rotation.x).toBeLessThan(0);
    const plating = model.station.getObjectByName('Hull plating');
    const trusses = model.station.getObjectByName('Trusses and ribs');
    if (!(plating instanceof InstancedMesh) || !(trusses instanceof InstancedMesh))
      throw new Error('Hull details must use instanced geometry');
    expect(plating.count).toBeGreaterThan(1000);
    expect(Number.isFinite(plating.boundingSphere!.radius)).toBe(true);
    expect(trusses.geometry).toBe(plating.geometry);
    const tilt = model.station.parent!.rotation.toArray();
    animateScene(model, 10);
    expect(model.earth.rotation.y).toBeGreaterThan(0.9);
    expect(model.clouds.rotation.y).toBeGreaterThan(model.earth.rotation.y);
    expect(model.earth.material.uniforms['cloudDrift']!.value).toBeGreaterThan(0);
    expect(model.station.rotation.y).toBeLessThan(0);
    expect(model.station.parent!.rotation.toArray()).toEqual(tilt);
    const light = model.red.emissiveIntensity;
    animateScene(model, 12);
    expect(model.red.emissiveIntensity).not.toEqual(light);
    const disposeGeometry = vi.spyOn(model.earth.geometry, 'dispose');
    const disposeClouds = vi.spyOn(model.clouds.geometry, 'dispose');
    const disposeMaterial = vi.spyOn(model.red, 'dispose');
    const disposeInstances = vi.spyOn(plating, 'dispose');
    const disposeSharedBox = vi.spyOn(plating.geometry, 'dispose');
    const disposeTextures = model.ownedTextures.map((texture) => vi.spyOn(texture, 'dispose'));
    const disposeBorrowedTexture = vi.spyOn(day, 'dispose');
    const glint = model.root.getObjectByName('Warm rim reflection');
    if (!(glint instanceof Sprite)) throw new Error('Missing rim reflection');
    const disposeGlint = vi.spyOn(glint.material, 'dispose');
    const materials = [new MeshBasicMaterial(), new MeshBasicMaterial()];
    const extra = new Mesh(new BoxGeometry(), materials);
    model.root.add(extra);
    const extraDispose = vi.spyOn(materials[0]!, 'dispose');
    disposeScene(model);
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(disposeClouds).toHaveBeenCalledOnce();
    expect(disposeMaterial).toHaveBeenCalledOnce();
    expect(extraDispose).toHaveBeenCalledOnce();
    expect(disposeInstances).toHaveBeenCalledOnce();
    expect(disposeSharedBox).toHaveBeenCalledOnce();
    expect(disposeGlint).toHaveBeenCalledOnce();
    disposeTextures.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce());
    expect(disposeBorrowedTexture).not.toHaveBeenCalled();
  });
});
