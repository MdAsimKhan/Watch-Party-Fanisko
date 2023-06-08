// Type definitions for mind-ar
// declare module 'mind-ar/dist/mindar-image-three.prod.js';
declare module 'mind-ar/dist/mindar-image-three.prod.js' {
  export interface Anchor {
    group: Group;
    landmarkIndex: number;
    css: boolean;
  }

  export class MindARThree {
    constructor(options: {
      container: HTMLElement;
      uiLoading?: string;
      uiScanning?: string;
      uiError?: string;
      filterMinCF?: number | null;
      filterBeta?: number | null;
    });

    scene: Scene;
    cssScene: Scene;
    renderer: WebGLRenderer;
    cssRenderer: CSS3DRenderer;
    camera: PerspectiveCamera;
    anchors: Anchor[];
    faceMeshes: Mesh[];

    start(): Promise<void>;
    stop(): void;
    switchCamera(): void;
    addFaceMesh(): Mesh;
    addAnchor(landmarkIndex: number): Anchor;
    addCSSAnchor(landmarkIndex: number): Anchor;
  }
}
