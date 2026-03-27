use std::collections::HashSet;
use serde::Serialize;
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
struct ValidationResult {
    valid: bool,
    invalid_cells: Vec<u32>,
}

/// Returns the 4-connected neighbours of a cell index in a grid.
fn neighbors(cell: u32, width: u32, total: u32) -> Vec<u32> {
    let height = total / width;
    let row = cell / width;
    let col = cell % width;
    let mut result = Vec::with_capacity(4);
    if row > 0 {
        result.push((row - 1) * width + col);
    }
    if row + 1 < height {
        result.push((row + 1) * width + col);
    }
    if col > 0 {
        result.push(row * width + col - 1);
    }
    if col + 1 < width {
        result.push(row * width + col + 1);
    }
    result
}

/// Validate track placement against maximum gradient.
///
/// For every track cell, check whether the elevation difference to any
/// neighbouring track cell exceeds `max_gradient`. Returns a JSON string:
/// `{ "valid": bool, "invalid_cells": [cell_index, ...] }`
#[wasm_bindgen]
pub fn validate_track(
    tracks: &[u32],
    heightmap: &[f32],
    width: u32,
    max_gradient: f32,
) -> String {
    let track_set: HashSet<u32> = tracks.iter().copied().collect();
    let total = heightmap.len() as u32;
    let mut invalid_cells: Vec<u32> = Vec::new();

    for &cell in tracks {
        if cell as usize >= heightmap.len() {
            continue;
        }
        let elev = heightmap[cell as usize];
        let mut cell_invalid = false;

        for nb in neighbors(cell, width, total) {
            if track_set.contains(&nb) {
                let nb_elev = heightmap[nb as usize];
                if (elev - nb_elev).abs() > max_gradient {
                    cell_invalid = true;
                    break;
                }
            }
        }

        if cell_invalid {
            invalid_cells.push(cell);
        }
    }

    let result = ValidationResult {
        valid: invalid_cells.is_empty(),
        invalid_cells,
    };

    serde_json::to_string(&result).unwrap_or_else(|_| {
        r#"{"valid":false,"invalid_cells":[]}"#.to_string()
    })
}
