use noise::{NoiseFn, Simplex};
use wasm_bindgen::prelude::*;

/// Returns a base elevation for a given row (0 = top/Shimla, 39 = bottom/Delhi).
fn base_elevation(row: u32) -> f32 {
    if row >= 30 {
        // Delhi: flat plains
        0.0
    } else if row >= 16 {
        // Punjab/Haryana: gentle rolling 0-2
        let t = (30 - row) as f32 / 14.0;
        t * 2.0
    } else if row >= 8 {
        // Chandigarh/Kalka foothills: 2-5
        let t = (16 - row) as f32 / 8.0;
        2.0 + t * 3.0
    } else {
        // Shimla mountains: 5-12
        let t = (8 - row) as f32 / 8.0;
        5.0 + t * 7.0
    }
}

/// Generate a heightmap for a width x height grid.
/// The heightmap is returned as a flat Vec<f32> in row-major order (index = row * width + col).
#[wasm_bindgen]
pub fn generate_terrain(width: u32, height: u32, seed: u32) -> Vec<f32> {
    let simplex = Simplex::new(seed);
    let mut heightmap = Vec::with_capacity((width * height) as usize);

    for row in 0..height {
        let base = base_elevation(row);
        for col in 0..width {
            // Layer simplex noise at two frequencies
            let nx = col as f64 / width as f64;
            let ny = row as f64 / height as f64;

            let n1 = simplex.get([nx * 4.0, ny * 4.0]) as f32; // broad features
            let n2 = simplex.get([nx * 8.0 + 100.0, ny * 8.0 + 100.0]) as f32; // detail

            // Scale noise amplitude by the zone – mountains get more variation
            let amplitude = if row < 8 {
                2.0
            } else if row < 16 {
                1.0
            } else if row < 30 {
                0.5
            } else {
                0.15
            };

            let elevation = (base + (n1 * 0.7 + n2 * 0.3) * amplitude).max(0.0);
            heightmap.push(elevation);
        }
    }

    heightmap
}
