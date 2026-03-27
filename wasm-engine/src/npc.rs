use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

/// NPC preference weights
#[derive(Serialize, Deserialize)]
pub struct Preferences {
    pub punctuality: f64,
    pub safety: f64,
    pub comfort: f64,
    pub food: f64,
}

/// Journey statistics for rating calculation
#[derive(Serialize, Deserialize)]
pub struct JourneyStats {
    pub punctuality_score: f64,
    pub safety_score: f64,
    pub comfort_score: f64,
    pub food_score: f64,
}

/// Calculate an NPC's rating (1-5) based on their preferences and journey stats
#[wasm_bindgen]
pub fn calculate_rating(preferences_json: &str, stats_json: &str) -> f64 {
    let prefs: Preferences = match serde_json::from_str(preferences_json) {
        Ok(p) => p,
        Err(_) => return 3.0,
    };
    let stats: JourneyStats = match serde_json::from_str(stats_json) {
        Ok(s) => s,
        Err(_) => return 3.0,
    };

    let raw = prefs.punctuality * stats.punctuality_score
        + prefs.safety * stats.safety_score
        + prefs.comfort * stats.comfort_score
        + prefs.food * stats.food_score;

    raw.max(1.0).min(5.0)
}
