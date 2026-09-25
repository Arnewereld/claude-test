// World layout (meters). The line runs left to right: belt → forklift → truck.

export const BELT_Z = -1
export const BELT_START_X = -9.4
export const BELT_END_X = -1.0
export const BELT_TOP = 0.9
export const BELT_SPEED = 2.1
export const PAINT_X = -5.2
export const HOPPER_X = -8.8

export const BOX = { w: 0.9, h: 0.7, d: 0.9 }
export const BOX_REST_X = BELT_END_X - 0.35 // where the parcel waits at the end of the belt

export const TRUCK_X = 5.0 // rear edge of the cargo box
export const TRUCK_Z = BELT_Z
export const TRUCK_FLOOR = 1.25

// Forklift: model faces local +Z. heading = atan2(dirX, dirZ).
export const FORK_REACH = 1.6 // parcel center, measured forward from the forklift origin
export const FORK_TRAVEL = 0.15
export const FORK_BELT = BELT_TOP - 0.06
export const FORK_CARRY = BELT_TOP + 0.14
export const FORK_TRUCK = TRUCK_FLOOR + 0.1

export const PARK = { x: 1.8, z: 2.9, h: Math.PI }
export const PICK = { x: BOX_REST_X + FORK_REACH, z: BELT_Z, h: -Math.PI / 2 }
export const TURN = { x: 2.3, z: 1.3 }
export const DOCK = { x: TRUCK_X + 0.55 - FORK_REACH, z: TRUCK_Z, h: Math.PI / 2 }
export const BACKOFF = { x: 2.6, z: TRUCK_Z }
