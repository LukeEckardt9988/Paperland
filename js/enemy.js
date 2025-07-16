// js/enemy.js
import * as THREE from 'three';

export class Enemy {
    constructor(mesh, allAnimations, scene, worldObjects, behavior, gravity, listener) {
        this.mesh = mesh;
        this.animations = allAnimations;
        this.scene = scene;
        this.worldObjects = worldObjects;
        this.behavior = behavior;
        this.mesh.userData.isEnemy = true;
        this.mesh.uuid = THREE.MathUtils.generateUUID();

        this.gravity = gravity;
        this.height = 0.2;
        this.velocity = new THREE.Vector3();
        this.groundRaycaster = new THREE.Raycaster();

        this.mixer = new THREE.AnimationMixer(this.mesh);
        this.actions = {};

        // Sound-System für den Gegner einrichten
        this.sounds = {};
        const audioLoader = new THREE.AudioLoader();

        // Sound für den Angriff
        if (listener) {
            this.sounds.attack = new THREE.Audio(listener);
            audioLoader.load('sounds/Zombieattack.mp3', (buffer) => {
                this.sounds.attack.setBuffer(buffer);
                this.sounds.attack.setVolume(0.7);
            });
            this.mesh.add(this.sounds.attack);
        }

        // Ambient-Sound (Murmeln/Stöhnen)
        /*  if (listener) {
              this.sounds.ambient = new THREE.Audio(listener);
              audioLoader.load('sounds/Zombiesound.mp3', (buffer) => {
                  this.sounds.ambient.setBuffer(buffer);
                  this.sounds.ambient.setLoop(true);
                  this.sounds.ambient.setVolume(0.4);
              });
              this.mesh.add(this.sounds.ambient);
          }*/

        // Todes-Sound
        if (listener) {
            this.sounds.death = new THREE.Audio(listener);
            audioLoader.load('sounds/Zombiedie.mp3', (buffer) => {
                this.sounds.death.setBuffer(buffer);
                this.sounds.death.setVolume(1);
            });
            this.mesh.add(this.sounds.death);
        }

        this.setupAnimations();

        this.wallRaycaster = new THREE.Raycaster();
        this.currentState = null;
        this.health = this.behavior.health;
        this.isDead = false;
        this.damageCooldown = false;

        // Gegner-Schatten aktivieren
        this.mesh.traverse(child => {
            if (child.isMesh) child.castShadow = true;
        });

        this.scene.add(this.mesh);
        this.switchState('idle');
    }

    setupAnimations() {
        for (const key in this.behavior.animations) {
            const animName = this.behavior.animations[key];
            const clip = THREE.AnimationClip.findByName(this.animations, animName);
            if (clip) {
                const action = this.mixer.clipAction(clip);
                if (['attack', 'scream', 'death'].includes(key)) {
                    action.setLoop(THREE.LoopOnce);
                    action.clampWhenFinished = true;
                }
                this.actions[key.toLowerCase()] = action;
            }
        }
    }

    update(delta, playerPosition, allEnemies) {
        if (this.isDead) {
            this.mixer.update(delta);
            return;
        }

        this.mixer.update(delta);

        const attackAction = this.actions['attack'];
        if (attackAction && attackAction.isRunning()) {
            return;
        }

        this.mesh.lookAt(playerPosition.x, this.mesh.position.y, playerPosition.z);

        const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
        let nextState = 'idle';
        if (distanceToPlayer < this.behavior.attackDistance) {
            nextState = 'attack';
        } else if (distanceToPlayer < this.behavior.sightDistance) {
            nextState = 'move';
        }
        this.switchState(nextState);

        // Logik für das Umgebungsgeräusch (Murmeln/Stöhnen)
        if (this.sounds.ambient) {
            if (distanceToPlayer < this.behavior.sightDistance && !this.sounds.ambient.isPlaying) {
                this.sounds.ambient.play();
            } else if (distanceToPlayer >= this.behavior.sightDistance && this.sounds.ambient.isPlaying) {
                this.sounds.ambient.stop();
            }
        }

        // Neuer, korrigierter Code mit "Wall Sliding"
        // ERSETZE DEN KOMPLETTEN if-BLOCK FÜR 'move' IN enemy.js HIERMIT:

        if (this.currentState === 'move') {
            const moveSpeed = this.behavior.speed;

            // --- NEUE, VEREINFACHTE "STOPP"-LOGIK ---

            // 1. Richtung berechnen (bleibt gleich)
            const desiredMove = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
            const separationForce = new THREE.Vector3();
            allEnemies.forEach(otherEnemy => {
                if (otherEnemy === this || otherEnemy.isDead) return;
                const dist = this.mesh.position.distanceTo(otherEnemy.mesh.position);
                if (dist < 1.5) {
                    const awayVector = new THREE.Vector3().subVectors(this.mesh.position, otherEnemy.mesh.position);
                    separationForce.add(awayVector.normalize());
                }
            });
            const finalDirection = desiredMove.add(separationForce.multiplyScalar(0.5)).normalize();

            // 2. Kollision prüfen (wie beim Spieler)
            const collisionMargin = 1; // Ein fester, sicherer Abstand
            const rayOrigin = this.mesh.position.clone().add(new THREE.Vector3(0, this.height / 1.5, 0));
            this.wallRaycaster.set(rayOrigin, finalDirection);
            const wallIntersects = this.wallRaycaster.intersectObjects(this.worldObjects);

            // 3. Bewegung anwenden, ABER NUR, wenn kein Hindernis im Weg ist
            if (wallIntersects.length === 0 || wallIntersects[0].distance > collisionMargin) {
                const moveVector = finalDirection.multiplyScalar(delta * moveSpeed);
                this.mesh.position.add(moveVector);
            }
            // Die komplexe "Sliding"-Logik wurde komplett entfernt.
        }

        // Boden- und Schwerkraft-Logik
        this.groundRaycaster.set(this.mesh.position, new THREE.Vector3(0, -1, 0));
        const groundIntersects = this.groundRaycaster.intersectObjects(this.worldObjects, true);

        if (groundIntersects.length > 0) {
            const distanceToGround = groundIntersects[0].distance;
            const targetY = groundIntersects[0].point.y + this.height;

            if (distanceToGround < this.height + 0.3) {
                this.velocity.y = 0;
                this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, targetY, 0.2);
            } else {
                this.velocity.y -= this.gravity * delta;
                this.mesh.position.y += this.velocity.y * delta;
            }
        } else {
            this.velocity.y -= this.gravity * delta;
            this.mesh.position.y += this.velocity.y * delta;
        }
    }

    switchState(newStateKey) {
        if (this.currentState === newStateKey) return;

        // Logik für den Angriffs-Sound
        if (newStateKey === 'attack') {
            if (this.sounds.attack && !this.sounds.attack.isPlaying) {
                this.sounds.attack.play();
            }
        }

        const oldAction = this.actions[this.currentState];
        const newAction = this.actions[newStateKey];

        if (!newAction) return;

        if (oldAction) oldAction.fadeOut(0.3);
        newAction.reset().fadeIn(0.3).play();
        this.currentState = newStateKey;
    }

    takeDamage(amount) {
        if (this.isDead) return;
        this.health -= amount;

        const currentAction = this.actions[this.currentState];
        if (currentAction && currentAction.isRunning()) {
            currentAction.stop();
            currentAction.reset();
            currentAction.play();
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;

        // Spielt den Todes-Sound ab
        if (this.sounds.death && !this.sounds.death.isPlaying) {
            this.sounds.death.play();
        }

        this.switchState('death');

        // Stoppt alle anderen laufenden Geräusche
        if (this.sounds.ambient && this.sounds.ambient.isPlaying) this.sounds.ambient.stop();
        if (this.sounds.attack && this.sounds.attack.isPlaying) this.sounds.attack.stop();

        setTimeout(() => {
            if (this.mesh) {
                this.scene.remove(this.mesh);
            }
            const index = enemies.findIndex(e => e.mesh.uuid === this.mesh.uuid);
            if (index > -1) {
                enemies.splice(index, 1);
            }
        }, 5000);
    }
}