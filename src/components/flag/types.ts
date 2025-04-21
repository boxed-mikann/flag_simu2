//import * as THREE from 'three';

export interface FlagSimulationProps {
  image: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  windForce: number;
  poleRotation: number;
}

export interface Constraint {
  p1: number;
  p2: number;
  distance: number;
}

export interface SimulationConfig {
  width: number;
  height: number;
  segments: {
    x: number;
    y: number;
  };
  mass?: number;
  damping?: number;
  gravity?: number;
  poleRadius?: number;
}