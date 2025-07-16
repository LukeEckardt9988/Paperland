// js/game.js

// =================================================================
// === 1. IMPORTS
// =================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { Enemy } from './enemy.js';
import { level1, enemyTypes } from './level-config.js';

// =================================================================
// === 2. SZENE, KAMERA, RENDERER
// =================================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.02, 1000);
camera.layers.enableAll();



// =================================================================
// === HIER DEN TASCHENLAMPEN-CODE EINFÜGEN ===
// =================================================================
const flashlight = new THREE.SpotLight(
    0xffffff, // Lichtfarbe (weiß)
    5,       // Intensität
    10,       // Maximale Leucht-Distanz
    THREE.MathUtils.degToRad(60), // Leuchtwinkel
    0.2,      // Weiche Kante des Lichtkegels
    2         // Realistische Lichtabnahme
);
flashlight.castShadow = false; // Wirft keine Schatten für beste Performance

// Die Taschenlampe wird direkt an die Kamera gehängt.
camera.add(flashlight);

// NEU: Positioniere die Lichtquelle selbst relativ zur Kamera.
// Experimentiere hier mit den Werten, besonders mit z!
flashlight.position.set(0, 0.5, 0.1);

// Ein SpotLight braucht ein "Ziel", auf das es leuchtet.
// Das Ziel bleibt relativ zur Kamera, damit das Licht immer nach vorne scheint.
const flashlightTarget = new THREE.Object3D();
camera.add(flashlightTarget);
flashlight.target = flashlightTarget;

// Das Ziel weit nach vorne setzen, damit die Lampe geradeaus leuchtet.
flashlightTarget.position.set(0, -1, -10);

// === NEU: SOUND-SYSTEM INITIALISIEREN ===
const listener = new THREE.AudioListener();
camera.add(listener);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// =================================================================
// === 3. BELEUCHTUNG
// =================================================================
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.001); // Sehr schwaches Umgebungslicht
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffee, 0.01);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
// ... (Schatten-Einstellungen bleiben gleich)
scene.add(directionalLight);

// =================================================================
// === 4. MARKIERUNGSLICHTER
// =================================================================

// --- Einstellungen für die Lichter ---
const lightColor = 0xff0000; // Rote Farbe
const lightIntensity = 10;   // Helligkeit der Lichter
const lightDistance = 25;    // Wie weit das Licht scheint
const squareSize = 15;       // Die Seitenlänge des Vierecks (20 Meter)
const lightHeight = 2.5;     // Höhe der Lichter über dem Boden

// --- Helfer-Funktion zum Erstellen der Lichter und sichtbaren Kugeln ---
function createMarker(position) {
    // Das eigentliche Licht
    const pointLight = new THREE.PointLight(lightColor, lightIntensity, lightDistance);
    pointLight.position.copy(position);
    pointLight.castShadow = false; // Wichtig für die Performance!
    scene.add(pointLight);

    // Die sichtbare rote Kugel (damit man die Lampe sieht)
    const lampGeometry = new THREE.SphereGeometry(0.2, 6, 8);
    const lampMaterial = new THREE.MeshBasicMaterial({ color: lightColor });
    const lampMesh = new THREE.Mesh(lampGeometry, lampMaterial);
    lampMesh.position.copy(position);
    scene.add(lampMesh);

    /*
    // Zum Testen der Position und Reichweite einkommentieren:
    const helper = new THREE.PointLightHelper(pointLight, 1);
    scene.add(helper);
    */
}

// --- Positionen berechnen und Lichter erstellen ---
const halfSize = squareSize / 2;

const positions = [
    new THREE.Vector3(halfSize, lightHeight, halfSize),  // vorne rechts
    new THREE.Vector3(-halfSize, lightHeight, halfSize), // vorne links
    new THREE.Vector3(halfSize, lightHeight, -halfSize), // hinten rechts
    new THREE.Vector3(-halfSize, lightHeight, -halfSize) // hinten links
];

// Erstelle für jede Position eine Lampe
positions.forEach(pos => createMarker(pos));
// =================================================================
// === 4. GLOBALE VARIABLEN & STEUERUNG
// =================================================================
// HTML Elemente
const blocker = document.getElementById('blocker'),
    instructions = document.getElementById('instructions'),
    startText = document.getElementById('start-text'),
    progressBarContainer = document.getElementById('progress-bar-container'),
    progressBar = document.getElementById('progress-bar'),
    crosshair = document.getElementById('crosshair-container'),
    currentAmmoElement = document.getElementById('current-ammo'),
    magazineCountElement = document.getElementById('magazine-count'),
    timerElement = document.getElementById('timer'),
    healthDisplay = document.getElementById('health-display'),
    deathScreen = document.getElementById('death-screen');

// Spiel-Zustände
let isWorldReady = false;
let timerStarted = false;
let isPlayerDead = false;

// Spieler-Steuerung und Physik
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());
let playerHealth = 100;
const playerSpeed = 5.0, playerHeight = 0.9, gravity = 20.0, jumpStrength = 8.0, gameDuration = 5 * 60;
const playerVelocity = new THREE.Vector3();
const groundRaycaster = new THREE.Raycaster();
const wallRaycaster = new THREE.Raycaster();
const keys = {};

// Waffen-Zustände und Animation
let weapon, muzzleFlash, muzzleFlashSprite;
let isAiming = false, isShooting = false, isReloading = false;
let currentAmmo = 30, magazines = 6, maxAmmo = 30;
let lastShotTime = 0, muzzleFlashEndTime = 0;
const fireRate = 8;
const hipFirePosition = new THREE.Vector3(0.1, -0.1, -0.2), adsPosition = new THREE.Vector3(0.0008, -0.062, -0.06);
const normalFov = 75, adsFov = 30;

// Animation-System
let playerAnimationMixer;
let weaponActions = {};
let currentWeaponAction = null;

// === NEU: SOUND VARIABLEN ===
const audioLoader = new THREE.AudioLoader();
let backgroundMusic, shootSound, reloadSound;


// Gameplay
const enemies = [];
const hitscanRaycaster = new THREE.Raycaster();
let worldObjects = [];

// --- NEU: VARIABLEN FÜR BEWEGLICHE OBJEKTE ---
let pushableObjects = []; // <-- NEUE ZEILE
let pushableDoor = null;    // Hier speichern wir das Tür-Objekt
const pushSpeed = 1.0;      // Geschwindigkeit, mit der die Tür geschoben wird


// =================================================================
// === 5. LADE-MANAGER & MODELLE
// =================================================================
const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    progressBar.style.width = (itemsLoaded / itemsTotal) * 100 + '%';
};
loadingManager.onLoad = () => {
    renderer.compile(scene, camera);
    progressBarContainer.style.display = 'none';
    if (startText) startText.style.display = 'inline';
    isWorldReady = true;
};

const loader = new GLTFLoader(loadingManager);
if (instructions) instructions.querySelector('p').textContent = '';

// === NEU: HINTERGRUNDMUSIK LADEN ===
backgroundMusic = new THREE.Audio(listener);
audioLoader.load('sounds/Background.mp3', function (buffer) {
    backgroundMusic.setBuffer(buffer);
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(0.3);
});

// Welt laden
// =================================================================
// === KORRIGIERTER LADE-BLOCK FÜR WELT & GEGNER ===
// =================================================================

// Globale Variable für den Boden, damit alle Lade-Funktionen darauf zugreifen können
let spawnFloor = null;

// ERSETZE den kompletten Welt-Lade-Block damit

loader.load('assets/NeueWelt.glb', (gltf) => {
    scene.add(gltf.scene);

    // --- KORREKTE KOLLISIONSOBJEKTE SAMMELN UND SORTIEREN ---
    worldObjects = []; // Liste leeren für neue Welt
    pushableObjects = []; // Liste leeren für neue Welt

    const collisionBounds = gltf.scene.getObjectByName('CollisionBounds');
    if (collisionBounds) {
        collisionBounds.traverse((child) => {
            if (child.isMesh) {
                // Sortiere Objekte basierend auf ihrem Namen
                if (child.name.startsWith('door')) {
                    pushableObjects.push(child);
                } else {
                    worldObjects.push(child);
                }
            }
        });
        console.log("Unbewegliche Wände geladen:", worldObjects.map(o => o.name));
        console.log("Bewegliche Objekte geladen:", pushableObjects.map(o => o.name));
    } else {
        console.error("FEHLER: 'CollisionBounds' wurde nicht gefunden!");
    }

    // --- KORREKTER SPIELER-SPAWN ---
    // Wir finden den Boden und nutzen die Koordinaten aus der level-config.js
    const spawnFloor = worldObjects.find(obj => obj.name.includes('SpawnFloor'));
    if (spawnFloor && level1.playerSpawn) {
        const spawnPos = level1.playerSpawn;
        const spawnRaycaster = new THREE.Raycaster(new THREE.Vector3(spawnPos.x, 100, spawnPos.z), new THREE.Vector3(0, -1, 0));
        const spawnIntersects = spawnRaycaster.intersectObject(spawnFloor);
        if (spawnIntersects.length > 0) {
            controls.getObject().position.copy(spawnIntersects[0].point).y += playerHeight;
        } else {
            // Notfall-Spawn, falls unter der Koordinate kein Boden ist
            controls.getObject().position.set(spawnPos.x, playerHeight, spawnPos.z);
        }
    } else {
        console.error("FEHLER: Der Boden 'SpawnFloor' oder 'playerSpawn' in der Config konnte nicht gefunden werden!");
        controls.getObject().position.set(0, playerHeight, 0); // Notfall-Spawn am Welt-Nullpunkt
    }

}, undefined, (error) => console.error("Fehler beim Laden der Welt:", error));


// Waffe laden
loader.load('assets/Mac10.glb', (gltf) => {
    // 3D-Modell der Waffe initialisieren
    weapon = gltf.scene;
    weapon.traverse((child) => {
        child.layers.set(1); // Auf eine separate Layer legen, um es von der Welt zu trennen
    });
    weapon.position.copy(hipFirePosition);
    weapon.scale.set(0.4, 0.4, 0.4);
    camera.add(weapon);

    // Mündungsfeuer (Licht-Effekt)
    muzzleFlash = new THREE.PointLight(0xfff5a1, 10, 0.5, 1.5);
    muzzleFlash.position.set(0.05, -0.1, -1.5);
    muzzleFlash.visible = false;
    weapon.add(muzzleFlash);

    // Mündungsfeuer (sichtbares Bild/Sprite)
    const muzzleFlashTexture = new THREE.TextureLoader().load('assets/muzzleflash.png');
    const muzzleFlashMaterial = new THREE.MeshBasicMaterial({
        map: muzzleFlashTexture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    });
    const muzzleFlashGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    muzzleFlashSprite = new THREE.Mesh(muzzleFlashGeometry, muzzleFlashMaterial);
    muzzleFlashSprite.position.copy(muzzleFlash.position); // Position vom Licht übernehmen
    muzzleFlashSprite.layers.set(1);
    muzzleFlashSprite.visible = false;
    weapon.add(muzzleFlashSprite);

    // WAFFEN-SOUNDS LADEN
    shootSound = new THREE.Audio(listener);
    audioLoader.load('sounds/AK47Shot.mp3', function (buffer) {
        shootSound.setBuffer(buffer);
        shootSound.setVolume(0.5);
    });
    weapon.add(shootSound);

    reloadSound = new THREE.Audio(listener);
    audioLoader.load('sounds/AK47Load.mp3', function (buffer) {
        reloadSound.setBuffer(buffer);
        reloadSound.setVolume(0.8);
    });
    weapon.add(reloadSound);

    // ANIMATIONEN VORBEREITEN
    playerAnimationMixer = new THREE.AnimationMixer(weapon);
    const animNames = ['Stehen', 'Laufen', 'Schiessen', 'Nachladen'];
    animNames.forEach(name => {
        const clip = THREE.AnimationClip.findByName(gltf.animations, name);
        if (clip) {
            const action = playerAnimationMixer.clipAction(clip);
            if (name === 'Schiessen' || name === 'Nachladen') {
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished = true;
            }
            weaponActions[name] = action;
        } else {
            console.warn(`Waffen-Animation "${name}" nicht gefunden!`);
        }
    });

    // Standard-Animation beim Start festlegen
    if (weaponActions.Stehen) {
        currentWeaponAction = weaponActions.Stehen;
        currentWeaponAction.play();
    }
}, undefined, (error) => console.error("Fehler beim Laden der Waffe:", error));

// Gegner laden
// in game.js

// Gegner laden
loader.load('assets/PaperZombie.glb', (gltf) => {
    // === DEBUG ===
    console.log("Rückruffunktion für Zombie-Modell wird ausgeführt.");

    const spawnRaycaster = new THREE.Raycaster();
    level1.enemySpawns.forEach((spawnInfo, index) => {
        // === DEBUG ===
        console.log(`Verarbeite Gegner ${index + 1} aus level-config...`);

        const modelClone = SkeletonUtils.clone(gltf.scene);
        const behavior = enemyTypes[spawnInfo.type];
        if (behavior) {

            const enemy = new Enemy(modelClone, gltf.animations, scene, worldObjects, behavior, gravity, listener);
            const spawnX = spawnInfo.position.x;
            const spawnZ = spawnInfo.position.z;

            const spawnFloor = worldObjects.find(obj => obj.name === 'SpawnFloor');
            if (spawnFloor) {
                spawnRaycaster.set(new THREE.Vector3(spawnX, 100, spawnZ), new THREE.Vector3(0, -1, 0));
                const intersects = spawnRaycaster.intersectObjects([spawnFloor], true);
                let spawnY = enemy.height;
                if (intersects.length > 0) {
                    spawnY = intersects[0].point.y + enemy.height;
                }
                enemy.mesh.position.set(spawnX, spawnY, spawnZ);
            } else {
                enemy.mesh.position.set(spawnX, enemy.height, spawnZ);
            }

            enemy.mesh.scale.set(0.5, 0.5, 0.5);
            enemies.push(enemy);
        }
    });
}, undefined, (error) => console.error("Fehler beim Laden der Gegner:", error));

// =================================================================
// === 6. HELFER-FUNKTIONEN
// =================================================================
function updateHud() {
    currentAmmoElement.textContent = String(currentAmmo).padStart(2, '0');
    magazineCountElement.textContent = magazines;
    if (healthDisplay) healthDisplay.textContent = playerHealth > 0 ? Math.round(playerHealth) : 0;
}
updateHud();

function updateTimer(elapsedTime) {
    if (isPlayerDead) return;
    const remainingTime = gameDuration - elapsedTime;
    if (remainingTime <= 0) { timerElement.textContent = "00:00"; return; }
    const minutes = String(Math.floor(remainingTime / 60)).padStart(2, '0');
    const seconds = String(Math.floor(remainingTime % 60)).padStart(2, '0');
    timerElement.textContent = `${minutes}:${seconds}`;
}

function switchWeaponAction(newActionName) {
    const newAction = weaponActions[newActionName];
    if (newAction && newAction !== currentWeaponAction) {
        if (currentWeaponAction) {
            currentWeaponAction.fadeOut(0.2);
        }
        newAction.reset().fadeIn(0.2).play();
        currentWeaponAction = newAction;
    }
}

// =================================================================
// === 7. EVENT LISTENERS
// =================================================================
if (instructions) {
    instructions.addEventListener('click', () => {
        if (isWorldReady) {
            controls.lock();
            // === NEU: MUSIK BEIM ERSTEN KLICK STARTEN ===
            if (backgroundMusic && !backgroundMusic.isPlaying) {
                backgroundMusic.play();
            }
        }
    });
}
controls.addEventListener('lock', () => { if (blocker) blocker.style.display = 'none'; if (crosshair) crosshair.style.display = 'block'; });
controls.addEventListener('unlock', () => { if (blocker) blocker.style.display = 'block'; if (crosshair) crosshair.style.display = 'none'; });
document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
    console.log(`Taste gedrückt: ${event.code}`); // Debug

    if (event.code === 'KeyP') {
        const pos = controls.getObject().position;
        console.log(`{ type: 'runner', position: { x: ${pos.x.toFixed(2)}, y: 0, z: ${pos.z.toFixed(2)} } },`);
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
    console.log(`Taste losgelassen: ${event.code}`); // Debug
});
document.addEventListener('keyup', (event) => { keys[event.code] = false; });
document.addEventListener('mousedown', (event) => {
    if (event.button === 0) isShooting = true;
    if (event.button === 2) isAiming = true;
});
document.addEventListener('mouseup', (event) => {
    if (event.button === 0) isShooting = false;
    if (event.button === 2) isAiming = false;
});
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// =================================================================
// === 8. DER GAME-LOOP
// =================================================================
const clock = new THREE.Clock();
let onGround = false;

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    if (playerAnimationMixer) playerAnimationMixer.update(delta);

    if (isPlayerDead) {
        renderer.render(scene, camera);
        return;
    }

    if (muzzleFlash && time > muzzleFlashEndTime) {
        muzzleFlash.visible = false;
        if (muzzleFlashSprite) muzzleFlashSprite.visible = false;
    }

    if (isWorldReady && controls.isLocked) {
        if (!timerStarted) { clock.start(); timerStarted = true; }
        updateTimer(time);

        const playerPosition = controls.getObject().position;
        enemies.forEach(enemy => enemy.update(delta, playerPosition, enemies));

        enemies.forEach(enemy => {
            if (!enemy.isDead && enemy.currentState === 'attack' && enemy.actions['attack']?.isRunning()) {
                if (enemy.mesh.position.distanceTo(playerPosition) < enemy.behavior.attackDistance + 0.5) {
                    if (!enemy.damageCooldown) {
                        playerHealth -= enemy.behavior.damage;
                        updateHud();
                        if (playerHealth <= 0) {
                            isPlayerDead = true;
                            controls.unlock();
                            if (deathScreen) deathScreen.classList.add('visible');
                        }
                        enemy.damageCooldown = true;
                        setTimeout(() => { enemy.damageCooldown = false; }, 1000);
                    }
                }
            }
        });
        // =================================================================
        // === FINALER PHYSIK- UND INTERAKTIONS-BLOCK START ===
        // =================================================================

        // 1. Definiere alle Objekte, mit denen der Spieler kollidieren kann
        const allColliders = worldObjects.concat(pushableObjects);

        // 2. Bodenerkennung
        groundRaycaster.set(playerPosition, new THREE.Vector3(0, -1, 0));
        const groundIntersects = groundRaycaster.intersectObjects(allColliders, true);
        onGround = groundIntersects.length > 0 && groundIntersects[0].distance <= playerHeight + 0.1;

        if (onGround) {
            playerVelocity.y = 0;
            if (keys['Space']) {
                playerVelocity.y = jumpStrength;
            }
        } else {
            playerVelocity.y -= gravity * delta;
        }

        // 3. Horizontale Bewegung & Interaktion
        const forwardInput = (Number(keys['KeyW'] || 0) - Number(keys['KeyS'] || 0));
        const sidewaysInput = (Number(keys['KeyD'] || 0) - Number(keys['KeyA'] || 0));
        const moveSpeed = isAiming ? playerSpeed / 2 : playerSpeed;
        const collisionMargin = 0.7;

        let playerDirection = new THREE.Vector3();
        controls.getObject().getWorldDirection(playerDirection);
        playerDirection.y = 0;
        playerDirection.normalize();

        const rightDir = new THREE.Vector3().copy(playerDirection).cross(camera.up);
        const intendedForwardMove = playerDirection.clone().multiplyScalar(forwardInput * moveSpeed * delta);
        const intendedSidewaysMove = rightDir.clone().multiplyScalar(sidewaysInput * moveSpeed * delta);

        // Kollisionsprüfung für Vorwärts/Rückwärts
        if (forwardInput !== 0) {
            const forwardRayDir = playerDirection.clone().multiplyScalar(Math.sign(forwardInput));
            wallRaycaster.set(playerPosition, forwardRayDir);
            const forwardIntersect = wallRaycaster.intersectObjects(allColliders, true)[0];

            if (forwardIntersect && forwardIntersect.distance < collisionMargin) {
                const hitObject = forwardIntersect.object;
                // Prüfe, ob das getroffene Objekt in unserer Liste der beweglichen Objekte ist
                if (pushableObjects.includes(hitObject) && keys['KeyB']) {
                    // Es ist eine Tür und B wird gedrückt -> bewege die TÜR und den SPIELER
                    hitObject.position.add(intendedForwardMove);
                    controls.getObject().position.add(intendedForwardMove);
                }
                // Ansonsten: Blockiere die Bewegung des Spielers (indem wir sie nicht anwenden).
            } else {
                // Kein Hindernis -> bewege Spieler normal
                controls.getObject().position.add(intendedForwardMove);
            }
        }

        // Kollisionsprüfung für Seitwärts (einfachere "Stopp"-Logik ohne Schieben)
        if (sidewaysInput !== 0) {
            const sidewaysRayDir = rightDir.clone().multiplyScalar(Math.sign(sidewaysInput));
            wallRaycaster.set(playerPosition, sidewaysRayDir);
            if (wallRaycaster.intersectObjects(allColliders, true).length === 0 || wallRaycaster.intersectObjects(allColliders, true)[0].distance > collisionMargin) {
                controls.getObject().position.add(intendedSidewaysMove);
            }
        }

        // 4. Wende die vertikale Bewegung (Schwerkraft/Sprung) an
        controls.getObject().position.y += playerVelocity.y * delta;

        // =================================================================
        // === FINALER PHYSIK- UND INTERAKTIONS-BLOCK ENDE ===
        // =================================================================

        // --- ANIMATIONS- UND WAFFENLOGIK ---
        const isMoving = forwardInput !== 0 || sidewaysInput !== 0;
        const wantsToReload = keys['KeyR'] && magazines > 0 && currentAmmo < maxAmmo;

        // NACHLADE-PROZESS STARTEN
        if (wantsToReload && !isReloading) {
            isReloading = true;
            if (reloadSound) reloadSound.play();
            const reloadDuration = weaponActions.Nachladen.getClip().duration;
            setTimeout(() => {
                magazines--;
                currentAmmo = maxAmmo;
                updateHud();
                isReloading = false;
            }, reloadDuration * 1000);
        }

        // ANIMATIONS-ZUSTANDS-MASCHINE
        const shootAction = weaponActions.Schiessen;
        if (isReloading) {
            switchWeaponAction('Nachladen');
        } else if (shootAction?.isRunning()) {
            // TU NICHTS
        } else if (isMoving) {
            switchWeaponAction('Laufen');
        } else {
            switchWeaponAction('Stehen');
        }

        // SCHIESS-AKTION
        if (isShooting && !isReloading && currentAmmo > 0 && time > lastShotTime + 1 / fireRate) {
            lastShotTime = time;
            currentAmmo--;
            updateHud();

            if (shootSound) {
                if (shootSound.isPlaying) shootSound.stop();
                shootSound.play();
            }

            if (shootAction) {
                shootAction.reset().play();
            }

            hitscanRaycaster.setFromCamera({ x: 0, y: 0 }, camera);
            const intersects = hitscanRaycaster.intersectObjects(enemies.filter(e => !e.isDead).map(e => e.mesh), true);
            if (intersects.length > 0) {
                let hitEnemy = enemies.find(e => e.mesh.getObjectById(intersects[0].object.id));
                if (hitEnemy) hitEnemy.takeDamage(55, enemies);
            }
            muzzleFlash.visible = true;
            if (muzzleFlashSprite) muzzleFlashSprite.visible = true;
            muzzleFlashEndTime = time + 0.05;
        }

        // ZIELEN
        const aimSpeed = delta * 10;
        let targetWeaponPosition = isAiming ? adsPosition.clone() : hipFirePosition.clone();
        weapon.position.lerp(targetWeaponPosition, aimSpeed);
        camera.fov = THREE.MathUtils.lerp(camera.fov, isAiming ? adsFov : normalFov, aimSpeed);
        camera.updateProjectionMatrix();
        if (crosshair) crosshair.style.display = isAiming ? 'none' : 'block';
    }

    renderer.render(scene, camera);
}

// =================================================================
// === 9. SPIEL STARTEN
// =================================================================
animate();