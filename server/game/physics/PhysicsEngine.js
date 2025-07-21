import { Vec2, World, Box, Circle, Edge, Polygon } from 'planck';
import { QuadTree } from '../utils/QuadTree.js';
import { SpatialHash } from '../utils/SpatialHash.js';

export class PhysicsEngine {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.world = null;
    this.gravity = new Vec2(0, -9.81);
    this.timeStep = 1/60;
    this.velocityIterations = 8;
    this.positionIterations = 3;
    
    // Spatial partitioning for optimization
    this.quadTree = new QuadTree(0, 0, 10000, 10000, 10);
    this.spatialHash = new SpatialHash(100); // 100x100 grid cells
    
    // Physics bodies registry
    this.bodies = new Map();
    this.staticBodies = new Map();
    this.dynamicBodies = new Map();
    this.kinematicBodies = new Map();
    
    // Collision handling
    this.collisionCallbacks = new Map();
    this.contactListeners = [];
    
    // Physics materials
    this.materials = new Map();
    this.initializeMaterials();
    
    // Ray casting
    this.raycastResults = [];
    
    // Forces and impulses
    this.forceRegistry = new Map();
    this.impulseRegistry = new Map();
    
    // Constraints and joints
    this.joints = new Map();
    this.constraints = new Map();
    
    // Performance metrics
    this.metrics = {
      bodyCount: 0,
      collisionPairs: 0,
      raycastCount: 0,
      updateTime: 0
    };
  }

  initialize() {
    console.log('🔧 Initializing Physics Engine...');
    
    // Create physics world
    this.world = new World(this.gravity);
    
    // Set up collision callbacks
    this.world.on('begin-contact', (contact) => {
      this.handleBeginContact(contact);
    });
    
    this.world.on('end-contact', (contact) => {
      this.handleEndContact(contact);
    });
    
    this.world.on('pre-solve', (contact, oldManifold) => {
      this.handlePreSolve(contact, oldManifold);
    });
    
    this.world.on('post-solve', (contact, impulse) => {
      this.handlePostSolve(contact, impulse);
    });
    
    // Create world boundaries
    this.createWorldBoundaries();
    
    // Initialize spatial partitioning
    this.quadTree.clear();
    this.spatialHash.clear();
    
    console.log('✅ Physics Engine initialized');
  }

  initializeMaterials() {
    // Define physics materials with different properties
    this.materials.set('default', {
      friction: 0.3,
      restitution: 0.1,
      density: 1.0
    });
    
    this.materials.set('player', {
      friction: 0.8,
      restitution: 0.0,
      density: 1.2
    });
    
    this.materials.set('ground', {
      friction: 0.9,
      restitution: 0.0,
      density: 0.0
    });
    
    this.materials.set('ice', {
      friction: 0.1,
      restitution: 0.3,
      density: 0.9
    });
    
    this.materials.set('rubber', {
      friction: 0.7,
      restitution: 0.9,
      density: 0.8
    });
    
    this.materials.set('metal', {
      friction: 0.2,
      restitution: 0.6,
      density: 2.0
    });
    
    this.materials.set('water', {
      friction: 0.0,
      restitution: 0.0,
      density: 1.0,
      isFluid: true
    });
  }

  createWorldBoundaries() {
    const worldSize = 10000;
    
    // Bottom boundary
    const bottomBody = this.world.createBody();
    bottomBody.createFixture(Edge(Vec2(-worldSize, 0), Vec2(worldSize, 0)));
    bottomBody.setUserData({ type: 'boundary', side: 'bottom' });
    
    // Top boundary
    const topBody = this.world.createBody();
    topBody.createFixture(Edge(Vec2(-worldSize, worldSize), Vec2(worldSize, worldSize)));
    topBody.setUserData({ type: 'boundary', side: 'top' });
    
    // Left boundary
    const leftBody = this.world.createBody();
    leftBody.createFixture(Edge(Vec2(0, 0), Vec2(0, worldSize)));
    leftBody.setUserData({ type: 'boundary', side: 'left' });
    
    // Right boundary
    const rightBody = this.world.createBody();
    rightBody.createFixture(Edge(Vec2(worldSize, 0), Vec2(worldSize, worldSize)));
    rightBody.setUserData({ type: 'boundary', side: 'right' });
    
    this.staticBodies.set('boundaries', {
      bottom: bottomBody,
      top: topBody,
      left: leftBody,
      right: rightBody
    });
  }

  update(deltaTime) {
    const startTime = performance.now();
    
    // Apply forces and impulses
    this.applyForces();
    this.applyImpulses();
    
    // Step the physics simulation
    this.world.step(this.timeStep, this.velocityIterations, this.positionIterations);
    
    // Update spatial partitioning
    this.updateSpatialPartitioning();
    
    // Update body positions in game engine
    this.updateGameEntities();
    
    // Handle fluid dynamics
    this.updateFluidDynamics(deltaTime);
    
    // Update constraints
    this.updateConstraints(deltaTime);
    
    // Clear force and impulse registries
    this.forceRegistry.clear();
    this.impulseRegistry.clear();
    
    // Update metrics
    this.metrics.updateTime = performance.now() - startTime;
    this.metrics.bodyCount = this.bodies.size;
    this.updateMetrics();
  }

  createPlayerBody(player) {
    const material = this.materials.get('player');
    
    const bodyDef = {
      type: 'dynamic',
      position: Vec2(player.position.x, player.position.y),
      fixedRotation: true,
      linearDamping: 5.0,
      userData: {
        type: 'player',
        id: player.id,
        gameObject: player
      }
    };
    
    const body = this.world.createBody(bodyDef);
    
    // Create player fixture (capsule shape)
    const radius = player.radius || 16;
    const height = player.height || 32;
    
    // Main body circle
    const mainFixture = body.createFixture({
      shape: Circle(Vec2(0, radius), radius),
      density: material.density,
      friction: material.friction,
      restitution: material.restitution,
      filterCategoryBits: 0x0001,
      filterMaskBits: 0xFFFF,
      userData: { type: 'player-body' }
    });
    
    // Foot sensor for ground detection
    const footSensor = body.createFixture({
      shape: Circle(Vec2(0, -radius - 2), radius * 0.8),
      isSensor: true,
      userData: { type: 'foot-sensor' }
    });
    
    this.bodies.set(player.id, body);
    this.dynamicBodies.set(player.id, body);
    
    // Initialize player physics properties
    player.physicsBody = body;
    player.isGrounded = false;
    player.canJump = true;
    
    return body;
  }

  createNPCBody(npc) {
    const material = this.materials.get('default');
    
    const bodyDef = {
      type: 'kinematic',
      position: Vec2(npc.position.x, npc.position.y),
      userData: {
        type: 'npc',
        id: npc.id,
        gameObject: npc
      }
    };
    
    const body = this.world.createBody(bodyDef);
    
    const fixture = body.createFixture({
      shape: Circle(npc.radius || 16),
      density: material.density,
      friction: material.friction,
      restitution: material.restitution,
      filterCategoryBits: 0x0002,
      filterMaskBits: 0xFFFD,
      userData: { type: 'npc-body' }
    });
    
    this.bodies.set(npc.id, body);
    this.kinematicBodies.set(npc.id, body);
    
    npc.physicsBody = body;
    
    return body;
  }

  createStaticBody(staticObject) {
    const material = this.materials.get(staticObject.material || 'default');
    
    const bodyDef = {
      type: 'static',
      position: Vec2(staticObject.position.x, staticObject.position.y),
      angle: staticObject.rotation || 0,
      userData: {
        type: 'static',
        id: staticObject.id,
        gameObject: staticObject
      }
    };
    
    const body = this.world.createBody(bodyDef);
    
    let shape;
    switch (staticObject.shape) {
      case 'box':
        shape = Box(staticObject.width / 2, staticObject.height / 2);
        break;
      case 'circle':
        shape = Circle(staticObject.radius);
        break;
      case 'polygon':
        shape = Polygon(staticObject.vertices.map(v => Vec2(v.x, v.y)));
        break;
      default:
        shape = Box(16, 16);
    }
    
    const fixture = body.createFixture({
      shape: shape,
      density: material.density,
      friction: material.friction,
      restitution: material.restitution,
      filterCategoryBits: 0x0004,
      filterMaskBits: 0xFFFF,
      userData: { type: 'static-body' }
    });
    
    this.bodies.set(staticObject.id, body);
    this.staticBodies.set(staticObject.id, body);
    
    staticObject.physicsBody = body;
    
    return body;
  }

  createTriggerZone(triggerZone) {
    const bodyDef = {
      type: 'static',
      position: Vec2(triggerZone.position.x, triggerZone.position.y),
      userData: {
        type: 'trigger',
        id: triggerZone.id,
        gameObject: triggerZone
      }
    };
    
    const body = this.world.createBody(bodyDef);
    
    let shape;
    switch (triggerZone.shape) {
      case 'box':
        shape = Box(triggerZone.width / 2, triggerZone.height / 2);
        break;
      case 'circle':
        shape = Circle(triggerZone.radius);
        break;
      default:
        shape = Box(32, 32);
    }
    
    const fixture = body.createFixture({
      shape: shape,
      isSensor: true,
      userData: { 
        type: 'trigger-zone',
        action: triggerZone.action,
        data: triggerZone.data
      }
    });
    
    this.bodies.set(triggerZone.id, body);
    this.staticBodies.set(triggerZone.id, body);
    
    return body;
  }

  createProjectile(projectile) {
    const material = this.materials.get('default');
    
    const bodyDef = {
      type: 'dynamic',
      position: Vec2(projectile.position.x, projectile.position.y),
      bullet: true, // For fast-moving objects
      userData: {
        type: 'projectile',
        id: projectile.id,
        gameObject: projectile
      }
    };
    
    const body = this.world.createBody(bodyDef);
    
    const fixture = body.createFixture({
      shape: Circle(projectile.radius || 4),
      density: 0.1,
      friction: 0.0,
      restitution: 0.3,
      filterCategoryBits: 0x0008,
      filterMaskBits: 0xFFF7,
      userData: { type: 'projectile-body' }
    });
    
    // Set initial velocity
    body.setLinearVelocity(Vec2(projectile.velocity.x, projectile.velocity.y));
    
    this.bodies.set(projectile.id, body);
    this.dynamicBodies.set(projectile.id, body);
    
    projectile.physicsBody = body;
    
    // Auto-destroy after timeout
    setTimeout(() => {
      this.destroyBody(projectile.id);
    }, projectile.lifetime || 5000);
    
    return body;
  }

  destroyBody(bodyId) {
    const body = this.bodies.get(bodyId);
    if (body) {
      this.world.destroyBody(body);
      this.bodies.delete(bodyId);
      this.dynamicBodies.delete(bodyId);
      this.kinematicBodies.delete(bodyId);
      this.staticBodies.delete(bodyId);
    }
  }

  applyForce(bodyId, force, point) {
    const body = this.bodies.get(bodyId);
    if (body) {
      if (point) {
        body.applyForce(Vec2(force.x, force.y), Vec2(point.x, point.y));
      } else {
        body.applyForceToCenter(Vec2(force.x, force.y));
      }
    }
  }

  applyImpulse(bodyId, impulse, point) {
    const body = this.bodies.get(bodyId);
    if (body) {
      if (point) {
        body.applyLinearImpulse(Vec2(impulse.x, impulse.y), Vec2(point.x, point.y));
      } else {
        body.applyLinearImpulse(Vec2(impulse.x, impulse.y), body.getWorldCenter());
      }
    }
  }

  setVelocity(bodyId, velocity) {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.setLinearVelocity(Vec2(velocity.x, velocity.y));
    }
  }

  getVelocity(bodyId) {
    const body = this.bodies.get(bodyId);
    if (body) {
      const vel = body.getLinearVelocity();
      return { x: vel.x, y: vel.y };
    }
    return { x: 0, y: 0 };
  }

  raycast(start, end, callback) {
    this.metrics.raycastCount++;
    
    const result = {
      hit: false,
      point: null,
      normal: null,
      body: null,
      fixture: null,
      fraction: 1.0
    };
    
    this.world.rayCast(Vec2(start.x, start.y), Vec2(end.x, end.y), (fixture, point, normal, fraction) => {
      result.hit = true;
      result.point = { x: point.x, y: point.y };
      result.normal = { x: normal.x, y: normal.y };
      result.body = fixture.getBody();
      result.fixture = fixture;
      result.fraction = fraction;
      
      if (callback) {
        return callback(result);
      }
      
      return fraction; // Continue raycasting
    });
    
    return result;
  }

  queryAABB(lowerBound, upperBound, callback) {
    const aabb = {
      lowerBound: Vec2(lowerBound.x, lowerBound.y),
      upperBound: Vec2(upperBound.x, upperBound.y)
    };
    
    const results = [];
    
    this.world.queryAABB(aabb, (fixture) => {
      const body = fixture.getBody();
      const userData = body.getUserData();
      
      results.push({
        body: body,
        fixture: fixture,
        userData: userData
      });
      
      if (callback) {
        return callback(fixture);
      }
      
      return true; // Continue querying
    });
    
    return results;
  }

  createJoint(type, bodyA, bodyB, options = {}) {
    let joint;
    
    switch (type) {
      case 'distance':
        joint = this.world.createJoint(DistanceJoint({
          bodyA: bodyA,
          bodyB: bodyB,
          localAnchorA: Vec2(options.anchorA?.x || 0, options.anchorA?.y || 0),
          localAnchorB: Vec2(options.anchorB?.x || 0, options.anchorB?.y || 0),
          length: options.length || 1.0,
          frequencyHz: options.frequency || 0.0,
          dampingRatio: options.damping || 0.0
        }));
        break;
      
      case 'revolute':
        joint = this.world.createJoint(RevoluteJoint({
          bodyA: bodyA,
          bodyB: bodyB,
          localAnchorA: Vec2(options.anchorA?.x || 0, options.anchorA?.y || 0),
          localAnchorB: Vec2(options.anchorB?.x || 0, options.anchorB?.y || 0),
          enableLimit: options.enableLimit || false,
          lowerAngle: options.lowerAngle || 0,
          upperAngle: options.upperAngle || 0,
          enableMotor: options.enableMotor || false,
          motorSpeed: options.motorSpeed || 0,
          maxMotorTorque: options.maxTorque || 0
        }));
        break;
      
      case 'prismatic':
        joint = this.world.createJoint(PrismaticJoint({
          bodyA: bodyA,
          bodyB: bodyB,
          localAnchorA: Vec2(options.anchorA?.x || 0, options.anchorA?.y || 0),
          localAnchorB: Vec2(options.anchorB?.x || 0, options.anchorB?.y || 0),
          localAxisA: Vec2(options.axis?.x || 1, options.axis?.y || 0),
          enableLimit: options.enableLimit || false,
          lowerTranslation: options.lowerLimit || 0,
          upperTranslation: options.upperLimit || 0,
          enableMotor: options.enableMotor || false,
          motorSpeed: options.motorSpeed || 0,
          maxMotorForce: options.maxForce || 0
        }));
        break;
    }
    
    if (joint) {
      const jointId = `${bodyA.getUserData().id}_${bodyB.getUserData().id}_${type}`;
      this.joints.set(jointId, joint);
      return joint;
    }
    
    return null;
  }

  applyForces() {
    for (const [bodyId, forces] of this.forceRegistry) {
      const body = this.bodies.get(bodyId);
      if (body) {
        forces.forEach(({ force, point }) => {
          if (point) {
            body.applyForce(Vec2(force.x, force.y), Vec2(point.x, point.y));
          } else {
            body.applyForceToCenter(Vec2(force.x, force.y));
          }
        });
      }
    }
  }

  applyImpulses() {
    for (const [bodyId, impulses] of this.impulseRegistry) {
      const body = this.bodies.get(bodyId);
      if (body) {
        impulses.forEach(({ impulse, point }) => {
          if (point) {
            body.applyLinearImpulse(Vec2(impulse.x, impulse.y), Vec2(point.x, point.y));
          } else {
            body.applyLinearImpulse(Vec2(impulse.x, impulse.y), body.getWorldCenter());
          }
        });
      }
    }
  }

  updateSpatialPartitioning() {
    this.quadTree.clear();
    this.spatialHash.clear();
    
    for (const [bodyId, body] of this.bodies) {
      const position = body.getPosition();
      const aabb = body.getFixtureList().getAABB(0);
      
      const bounds = {
        x: aabb.lowerBound.x,
        y: aabb.lowerBound.y,
        width: aabb.upperBound.x - aabb.lowerBound.x,
        height: aabb.upperBound.y - aabb.lowerBound.y,
        id: bodyId,
        body: body
      };
      
      this.quadTree.insert(bounds);
      this.spatialHash.insert(bodyId, position.x, position.y, body);
    }
  }

  updateGameEntities() {
    for (const [bodyId, body] of this.bodies) {
      const userData = body.getUserData();
      if (userData && userData.gameObject) {
        const position = body.getPosition();
        const velocity = body.getLinearVelocity();
        
        userData.gameObject.position.x = position.x;
        userData.gameObject.position.y = position.y;
        userData.gameObject.velocity = { x: velocity.x, y: velocity.y };
        userData.gameObject.isDirty = true;
      }
    }
  }

  updateFluidDynamics(deltaTime) {
    // Simple fluid simulation for water areas
    for (const [bodyId, body] of this.dynamicBodies) {
      const userData = body.getUserData();
      if (userData && userData.gameObject) {
        // Check if body is in water
        const position = body.getPosition();
        const waterZones = this.queryAABB(
          { x: position.x - 1, y: position.y - 1 },
          { x: position.x + 1, y: position.y + 1 },
          (fixture) => {
            const material = fixture.getUserData()?.material;
            return material === 'water';
          }
        );
        
        if (waterZones.length > 0) {
          // Apply buoyancy and drag
          const velocity = body.getLinearVelocity();
          const dragForce = Vec2(
            -velocity.x * 0.5,
            -velocity.y * 0.5
          );
          const buoyancyForce = Vec2(0, 2.0); // Upward force
          
          body.applyForceToCenter(dragForce);
          body.applyForceToCenter(buoyancyForce);
        }
      }
    }
  }

  updateConstraints(deltaTime) {
    // Update custom constraints
    for (const [constraintId, constraint] of this.constraints) {
      if (constraint.update) {
        constraint.update(deltaTime);
      }
    }
  }

  handleBeginContact(contact) {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();
    const bodyA = fixtureA.getBody();
    const bodyB = fixtureB.getBody();
    
    const userDataA = bodyA.getUserData();
    const userDataB = bodyB.getUserData();
    const fixtureDataA = fixtureA.getUserData();
    const fixtureDataB = fixtureB.getUserData();
    
    // Handle player ground detection
    if (fixtureDataA?.type === 'foot-sensor' && userDataB?.type === 'static') {
      const player = userDataA.gameObject;
      player.isGrounded = true;
      player.canJump = true;
    }
    
    if (fixtureDataB?.type === 'foot-sensor' && userDataA?.type === 'static') {
      const player = userDataB.gameObject;
      player.isGrounded = true;
      player.canJump = true;
    }
    
    // Handle trigger zones
    if (fixtureDataA?.type === 'trigger-zone' || fixtureDataB?.type === 'trigger-zone') {
      const trigger = fixtureDataA?.type === 'trigger-zone' ? fixtureDataA : fixtureDataB;
      const other = fixtureDataA?.type === 'trigger-zone' ? userDataB : userDataA;
      
      if (other?.type === 'player') {
        this.gameEngine.emit('trigger-enter', {
          player: other.gameObject,
          trigger: trigger,
          action: trigger.action,
          data: trigger.data
        });
      }
    }
    
    // Handle projectile collisions
    if (userDataA?.type === 'projectile' || userDataB?.type === 'projectile') {
      const projectile = userDataA?.type === 'projectile' ? userDataA : userDataB;
      const target = userDataA?.type === 'projectile' ? userDataB : userDataA;
      
      this.gameEngine.emit('projectile-hit', {
        projectile: projectile.gameObject,
        target: target?.gameObject,
        contact: contact
      });
      
      // Schedule projectile destruction
      setTimeout(() => {
        this.destroyBody(projectile.id);
      }, 50);
    }
    
    this.metrics.collisionPairs++;
  }

  handleEndContact(contact) {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();
    const bodyA = fixtureA.getBody();
    const bodyB = fixtureB.getBody();
    
    const userDataA = bodyA.getUserData();
    const userDataB = bodyB.getUserData();
    const fixtureDataA = fixtureA.getUserData();
    const fixtureDataB = fixtureB.getUserData();
    
    // Handle player ground detection
    if (fixtureDataA?.type === 'foot-sensor' && userDataB?.type === 'static') {
      const player = userDataA.gameObject;
      // Check if player still has other ground contacts
      setTimeout(() => {
        let stillGrounded = false;
        for (let edge = bodyA.getContactList(); edge; edge = edge.next) {
          const contact = edge.contact;
          if (contact.isTouching()) {
            const otherFixture = contact.getFixtureA() === fixtureA ? 
              contact.getFixtureB() : contact.getFixtureA();
            if (otherFixture.getUserData()?.type === 'foot-sensor') {
              stillGrounded = true;
              break;
            }
          }
        }
        player.isGrounded = stillGrounded;
      }, 10);
    }
    
    // Handle trigger zone exit
    if (fixtureDataA?.type === 'trigger-zone' || fixtureDataB?.type === 'trigger-zone') {
      const trigger = fixtureDataA?.type === 'trigger-zone' ? fixtureDataA : fixtureDataB;
      const other = fixtureDataA?.type === 'trigger-zone' ? userDataB : userDataA;
      
      if (other?.type === 'player') {
        this.gameEngine.emit('trigger-exit', {
          player: other.gameObject,
          trigger: trigger,
          action: trigger.action,
          data: trigger.data
        });
      }
    }
  }

  handlePreSolve(contact, oldManifold) {
    // Custom collision response handling
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();
    const userDataA = fixtureA.getBody().getUserData();
    const userDataB = fixtureB.getBody().getUserData();
    
    // Disable collision between friendly entities
    if (userDataA?.team && userDataB?.team && userDataA.team === userDataB.team) {
      contact.setEnabled(false);
    }
  }

  handlePostSolve(contact, impulse) {
    // Handle damage from impacts
    const normalImpulse = impulse.normalImpulses[0] || 0;
    
    if (normalImpulse > 10.0) { // High impact
      const fixtureA = contact.getFixtureA();
      const fixtureB = contact.getFixtureB();
      const userDataA = fixtureA.getBody().getUserData();
      const userDataB = fixtureB.getBody().getUserData();
      
      if (userDataA?.gameObject && userDataA.type === 'player') {
        const damage = Math.floor(normalImpulse / 5);
        this.gameEngine.emit('impact-damage', {
          player: userDataA.gameObject,
          damage: damage,
          impact: normalImpulse
        });
      }
      
      if (userDataB?.gameObject && userDataB.type === 'player') {
        const damage = Math.floor(normalImpulse / 5);
        this.gameEngine.emit('impact-damage', {
          player: userDataB.gameObject,
          damage: damage,
          impact: normalImpulse
        });
      }
    }
  }

  updateMetrics() {
    this.metrics.collisionPairs = 0;
    
    // Count active contacts
    for (let contact = this.world.getContactList(); contact; contact = contact.getNext()) {
      if (contact.isTouching()) {
        this.metrics.collisionPairs++;
      }
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  // Utility methods for common physics operations
  moveTowards(bodyId, targetPosition, force) {
    const body = this.bodies.get(bodyId);
    if (body) {
      const position = body.getPosition();
      const direction = Vec2(
        targetPosition.x - position.x,
        targetPosition.y - position.y
      );
      direction.normalize();
      direction.mul(force);
      
      body.applyForceToCenter(direction);
    }
  }

  setPosition(bodyId, position) {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.setPosition(Vec2(position.x, position.y));
    }
  }

  getPosition(bodyId) {
    const body = this.bodies.get(bodyId);
    if (body) {
      const pos = body.getPosition();
      return { x: pos.x, y: pos.y };
    }
    return { x: 0, y: 0 };
  }
}