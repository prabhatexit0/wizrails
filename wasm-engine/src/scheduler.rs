use wasm_bindgen::prelude::*;

/// Calculate ETA in minutes given current position, speed, and target km
#[wasm_bindgen]
pub fn calculate_eta(position_km: f64, speed_kmh: f64, target_km: f64) -> f64 {
    if speed_kmh <= 0.0 {
        return f64::INFINITY;
    }
    let distance = target_km - position_km;
    if distance <= 0.0 {
        return 0.0;
    }
    (distance / speed_kmh) * 60.0 // minutes
}

/// Calculate punctuality score (0-5) based on scheduled vs actual arrival
/// Scheduled and actual are in minutes since midnight
#[wasm_bindgen]
pub fn punctuality_score(scheduled_minutes: f64, actual_minutes: f64) -> f64 {
    let delay = (actual_minutes - scheduled_minutes).abs();
    if delay <= 1.0 {
        5.0
    } else if delay <= 3.0 {
        4.0
    } else if delay <= 5.0 {
        3.0
    } else if delay <= 10.0 {
        2.0
    } else {
        1.0
    }
}

/// Calculate overall journey score
#[wasm_bindgen]
pub fn journey_score(
    punctuality_avg: f64,
    safety_violations: u32,
    overspeed_count: u32,
    hard_brake_count: u32,
) -> f64 {
    let mut score = punctuality_avg;
    score -= safety_violations as f64 * 1.5;
    score -= overspeed_count as f64 * 0.3;
    score -= hard_brake_count as f64 * 0.2;
    score.max(0.0).min(5.0)
}
