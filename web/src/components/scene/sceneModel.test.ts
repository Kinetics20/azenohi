import { describe, expect, it, vi } from 'vitest';
import { BoxGeometry, Mesh, MeshBasicMaterial, Texture } from 'three';
import { animateScene, buildScene, disposeScene } from './sceneModel';
describe('Orbital scene', () => {
  it('builds independent geometry, advances the Earth and station, and disposes GPU resources', () => {
    const model = buildScene({ day: new Texture(), night: new Texture(), clouds: new Texture() });
    expect(model.earth.geometry.type).toBe('SphereGeometry');
    expect(model.station.children.length).toBeGreaterThan(30);
    const tilt = model.station.parent!.rotation.toArray();
    animateScene(model, 10);
    expect(model.earth.rotation.y).toBeGreaterThan(0.9);
    expect(model.station.rotation.y).toBeLessThan(0);
    expect(model.station.parent!.rotation.toArray()).toEqual(tilt);
    const light = model.red.emissiveIntensity;
    animateScene(model, 12);
    expect(model.red.emissiveIntensity).not.toEqual(light);
    const disposeGeometry = vi.spyOn(model.earth.geometry, 'dispose');
    const disposeMaterial = vi.spyOn(model.red, 'dispose');
    const materials = [new MeshBasicMaterial(), new MeshBasicMaterial()];
    const extra = new Mesh(new BoxGeometry(), materials);
    model.root.add(extra);
    const extraDispose = vi.spyOn(materials[0]!, 'dispose');
    disposeScene(model);
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(disposeMaterial).toHaveBeenCalledOnce();
    expect(extraDispose).toHaveBeenCalledOnce();
  });
});
