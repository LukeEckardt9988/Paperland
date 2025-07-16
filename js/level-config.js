

// js/level-config.js

export const enemyTypes = {
    //Humpler mit Doppelschlag über den Kopf
    doublefist: {
        health: 100, // Hat 100 Lebenspunkte
        speed: 0.25,
        attackDistance: 1, // Greift ab 1.5m an
        sightDistance: 50,
        damage: 5,
        animations: {
            idle: 'Idle',
            move: 'WalkSlowly', 
            attack: 'Attack',
            scream: 'Scream',
            death: 'Die2'
        }
    },
    // Der Runner: Schnell, aber zerbrechlich.
    runner: {
        health: 200, 
        speed: 1.6,
        attackDistance: 1.5,
        sightDistance: 60,
        damage: 5,
        animations: {
            idle: 'Idle',
            move: 'Run',
            attack: 'Bite',
            scream: 'Scream',
            death: 'Die'
        }
    },
    // Der Biter: Langsamer, aber zäher und beißt härter zu.
    biter: {
        health: 350, 
        speed: 0.25,
        attackDistance: 1,
        sightDistance: 35,
        damage: 10,
        animations: {
            idle: 'Idle',
            move: 'WalkSlowly',
            attack: 'Bite',
            scream: 'Scream',
            death: 'Die2'
        }
    },
    // =================================================================
    // === NEUER GEGNER: BoxEnemy ===
    // =================================================================
    BoxEnemy: {
        health: 150,      // Mittlere Lebenspunkte
        speed: 2.0,       // Mittlere Geschwindigkeit
        attackDistance: 1.2,  // Greift aus kurzer Distanz an
        sightDistance: 40,    // Mittlere Sichtweite
        damage: 8,        // Standard-Schaden
        animations: {
            idle: 'Idle',   // Nutzt die von dir genannten Animationsnamen
            move: 'Run',
            attack: 'Schlag',
            scream: 'Scream',
            death: 'Die'      // Wir nehmen eine Standard-Sterbeanimation an
        }
    }
};

// Hier legen wir fest, wo welche Gegner im Level platziert werden.
export const level1 = {
    enemySpawns: [
        // Gruppe 1: Erste Welle, direkt vor dem Spieler
        { type: 'runner', position: { x: 0, y: 0, z: -8 } },
        { type: 'runner', position: { x: -3, y: 0, z: -7 } },
        { type: 'runner', position: { x: 3, y: 0, z: -7 } },
        { type: 'doublefist', position: { x: 5, y: 0, z: -10 } },
        { type: 'doublefist', position: { x: -5, y: 0, z: -10 } },
 
        // === NEU: BoxEnemy zum Testen platziert ===
        { type: 'BoxEnemy', position: { x: 8, y: 0, z: -12 } },
        { type: 'BoxEnemy', position: { x: -8, y: 0, z: -12 } },

        // Gruppe 2: Linker Bereich des Lagerhauses
        { type: 'biter', position: { x: -10, y: 0, z: -12 } },
        { type: 'biter', position: { x: -12, y: 0, z: -15 } },
        { type: 'runner', position: { x: -9, y: 0, z: -18 } },
        
        // Gruppe 3: Rechter Bereich des Lagerhauses
        { type: 'biter', position: { x: 10, y: 0, z: -12 } },
        { type: 'biter', position: { x: 12, y: 0, z: -15 } },
        { type: 'runner', position: { x: 9, y: 0, z: -18 } },

        // Gruppe 4: Mittleres Feld, zwischen den Gängen
        { type: 'doublefist', position: { x: 0, y: 0, z: -15 } },
        { type: 'doublefist', position: { x: 2, y: 0, z: -16 } },
    ]
};

// js/level-config.js
/*
export const enemyTypes = {
    //Humpler mit Doppelschlag über den Kopf
    doublefist: {
        health: 100, // Hat 100 Lebenspunkte
        speed: 0.25,
        attackDistance: 1, // Greift ab 1.5m an
        sightDistance: 50,
        damage: 5,
        animations: {
            idle: 'Idle',
            move: 'WalkBad', // Benutzt NUR Run
            attack: 'Attack2',
            scream: 'Scream',
            death: 'Die' // Seine Sterbe-Animation
        }
    },
    // Der Runner: Schnell, aber zerbrechlich.
    runner: {
        health: 200, // Hat 100 Lebenspunkte
        speed: 1.6,
        attackDistance: 1.5, // Greift ab 1.5m an
        sightDistance: 60,
        damage: 5,
        animations: {
            idle: 'Idle',
            move: 'Run', // Benutzt NUR Run
            attack: 'Attack',
            scream: 'Scream',
            death: 'Die' // Seine Sterbe-Animation
        }
    },
    // Der Biter: Langsamer, aber zäher und beißt härter zu.
    biter: {
        health: 350, // Hat mehr Lebenspunkte
        speed: 0.25,
        attackDistance: 1,
        sightDistance: 35,
        damage: 10, // Macht mehr Schaden
        animations: {
            idle: 'Idle',
            move: 'WalkSlowly',
            attack: 'Bite',
            scream: 'Scream', // <-- HIER

            death: 'Die2' // Seine andere Sterbe-Animation
        }
    }
};
// Hier legen wir fest, wo welche Gegner im Level platziert werden.
export const level1 = {
    enemySpawns: [
        // Gruppe 1: Erste Welle, direkt vor dem Spieler
        { type: 'runner', position: { x: 0, y: 0, z: -8 } },
         { type: 'runner', position: { x: -3, y: 0, z: -7 } },
          { type: 'runner', position: { x: 3, y: 0, z: -7 } },
          { type: 'doublefist', position: { x: 5, y: 0, z: -10 } },
          { type: 'doublefist', position: { x: -5, y: 0, z: -10 } },
  
          // Gruppe 2: Linker Bereich des Lagerhauses
          { type: 'biter', position: { x: -10, y: 0, z: -12 } },
          { type: 'biter', position: { x: -12, y: 0, z: -15 } },
          { type: 'runner', position: { x: -9, y: 0, z: -18 } },
          { type: 'runner', position: { x: -15, y: 0, z: -20 } },
          { type: 'doublefist', position: { x: -11, y: 0, z: -22 } },
  
          // Gruppe 3: Rechter Bereich des Lagerhauses
          { type: 'biter', position: { x: 10, y: 0, z: -12 } },
          { type: 'biter', position: { x: 12, y: 0, z: -15 } },
          { type: 'runner', position: { x: 9, y: 0, z: -18 } },
          { type: 'runner', position: { x: 15, y: 0, z: -20 } },
          { type: 'doublefist', position: { x: 11, y: 0, z: -22 } },
          
          // Gruppe 4: Mittleres Feld, zwischen den Gängen
          { type: 'doublefist', position: { x: 0, y: 0, z: -15 } },
          { type: 'doublefist', position: { x: 2, y: 0, z: -16 } },
          { type: 'doublefist', position: { x: -2, y: 0, z: -16 } },
          { type: 'runner', position: { x: 0, y: 0, z: -20 } },
          { type: 'runner', position: { x: 4, y: 0, z: -21 } },
          { type: 'runner', position: { x: -4, y: 0, z: -21 } },
  
          // Gruppe 5: Hintere Sektion, eine dichte Horde
          { type: 'biter', position: { x: 0, y: 0, z: -25 } },
          { type: 'biter', position: { x: 3, y: 0, z: -26 } },
          { type: 'biter', position: { x: -3, y: 0, z: -26 } },
          { type: 'biter', position: { x: 6, y: 0, z: -27 } },
          { type: 'biter', position: { x: -6, y: 0, z: -27 } },
          { type: 'runner', position: { x: 1, y: 0, z: -28 } },
          { type: 'runner', position: { x: -1, y: 0, z: -28 } },
          { type: 'runner', position: { x: 4, y: 0, z: -29 } },
          { type: 'runner', position: { x: -4, y: 0, z: -29 } },
  /*
          // --- Zusätzliche Gegner für die dreifache Menge ---
         // Füllen die Lücken und erhöhen die Dichte
  
          // Weitere Nahbereichs-Gegner
          { type: 'runner', position: { x: 6, y: 0, z: -5 } },
          { type: 'runner', position: { x: -6, y: 0, z: -5 } },
          { type: 'doublefist', position: { x: 8, y: 0, z: -8 } },
          { type: 'doublefist', position: { x: -8, y: 0, z: -8 } },
          
          // Füllung linker Bereich
          { type: 'biter', position: { x: -14, y: 0, z: -10 } },
          { type: 'runner', position: { x: -16, y: 0, z: -14 } },
          { type: 'doublefist', position: { x: -18, y: 0, z: -18 } },
          { type: 'biter', position: { x: -10, y: 0, z: -25 } },
          { type: 'runner', position: { x: -13, y: 0, z: -24 } },
          
          // Füllung rechter Bereich
          { type: 'biter', position: { x: 14, y: 0, z: -10 } },
          { type: 'runner', position: { x: 16, y: 0, z: -14 } },
          { type: 'doublefist', position: { x: 18, y: 0, z: -18 } },
          { type: 'biter', position: { x: 10, y: 0, z: -25 } },
          { type: 'runner', position: { x: 13, y: 0, z: -24 } },
          
          // Füllung mittleres Feld
          { type: 'runner', position: { x: 5, y: 0, z: -18 } },
          { type: 'runner', position: { x: -5, y: 0, z: -18 } },
          { type: 'doublefist', position: { x: 0, y: 0, z: -22 } },
          { type: 'biter', position: { x: 2, y: 0, z: -24 } },
          { type: 'biter', position: { x: -2, y: 0, z: -24 } },
          
          // Weitere Streuner
          { type: 'runner', position: { x: 19, y: 0, z: -5 } },
          { type: 'runner', position: { x: -19, y: 0, z: -5 } },
          { type: 'doublefist', position: { x: 17, y: 0, z: -25 } },
          { type: 'doublefist', position: { x: -17, y: 0, z: -25 } },
          { type: 'biter', position: { x: 0, y: 0, z: -30 } }, */
          
          // Noch mehr, um auf die ~80 zu kommen
      /*    { type: 'runner', position: { x: 2, y: 0, z: -5 } },
          { type: 'runner', position: { x: -2, y: 0, z: -5 } },
          { type: 'doublefist', position: { x: 4, y: 0, z: -12 } },
          { type: 'doublefist', position: { x: -4, y: 0, z: -12 } },
          { type: 'biter', position: { x: 7, y: 0, z: -14 } },
          { type: 'biter', position: { x: -7, y: 0, z: -14 } },
          { type: 'runner', position: { x: 9, y: 0, z: -20 } },
          { type: 'runner', position: { x: -9, y: 0, z: -20 } },
          { type: 'doublefist', position: { x: 12, y: 0, z: -23 } },
          { type: 'doublefist', position: { x: -12, y: 0, z: -23 } },
          { type: 'biter', position: { x: 15, y: 0, z: -26 } },
          { type: 'biter', position: { x: -15, y: 0, z: -26 } },
          { type: 'runner', position: { x: 18, y: 0, z: -28 } },
          { type: 'runner', position: { x: -18, y: 0, z: -28 } },
          { type: 'doublefist', position: { x: 20, y: 0, z: -30 } },
          { type: 'doublefist', position: { x: -20, y: 0, z: -30 } },
          { type: 'biter', position: { x: 1, y: 0, z: -14 } },
          { type: 'biter', position: { x: -1, y: 0, z: -14 } },
          { type: 'runner', position: { x: 3, y: 0, z: -19 } },
          { type: 'runner', position: { x: -3, y: 0, z: -19 } },
          { type: 'doublefist', position: { x: 6, y: 0, z: -24 } },
          { type: 'doublefist', position: { x: -6, y: 0, z: -24 } },
          { type: 'biter', position: { x: 9, y: 0, z: -27 } },
          { type: 'biter', position: { x: -9, y: 0, z: -27 } },
          { type: 'runner', position: { x: 11, y: 0, z: -29 } },
          { type: 'runner', position: { x: -11, y: 0, z: -29 } },
          { type: 'doublefist', position: { x: 14, y: 0, z: -1 } },
          { type: 'doublefist', position: { x: -14, y: 0, z: -1 } }*/
    
