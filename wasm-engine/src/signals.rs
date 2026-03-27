use wasm_bindgen::prelude::*;

/// Signal state: 0 = green, 1 = yellow, 2 = red
#[wasm_bindgen]
pub fn check_signal(position_km: f64, speed_kmh: f64, block_occupied: bool) -> u8 {
    if block_occupied {
        // Block ahead is occupied
        if position_km % 7.0 < 1.0 {
            return 2; // red — stop
        }
        return 1; // yellow — caution
    }

    // Speed-based caution near stations
    let station_kms = [0.0, 90.0, 157.0, 199.0, 266.0];
    for &skm in &station_kms {
        let dist = (position_km - skm).abs();
        if dist < 3.0 && speed_kmh > 60.0 {
            return 1; // yellow near stations if fast
        }
    }

    0 // green
}

/// Check if passing a red signal constitutes a violation
#[wasm_bindgen]
pub fn is_signal_violation(signal_state: u8, speed_kmh: f64) -> bool {
    signal_state == 2 && speed_kmh > 5.0
}
