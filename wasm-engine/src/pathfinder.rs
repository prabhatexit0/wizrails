use std::collections::{BinaryHeap, HashMap, HashSet};
use std::cmp::Ordering;
use wasm_bindgen::prelude::*;

#[derive(Copy, Clone)]
struct Node {
    cost: f32,
    cell: u32,
}

impl PartialEq for Node {
    fn eq(&self, other: &Self) -> bool {
        self.cell == other.cell
    }
}
impl Eq for Node {}

impl Ord for Node {
    fn cmp(&self, other: &Self) -> Ordering {
        // Reverse ordering for min-heap
        other.cost.partial_cmp(&self.cost).unwrap_or(Ordering::Equal)
    }
}

impl PartialOrd for Node {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

/// Returns the 4-connected neighbours of a cell index in a grid.
fn neighbors(cell: u32, width: u32, height: u32) -> Vec<u32> {
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

/// Manhattan distance heuristic scaled to grid coordinates.
fn heuristic(a: u32, b: u32, width: u32) -> f32 {
    let ar = a / width;
    let ac = a % width;
    let br = b / width;
    let bc = b % width;
    (ar as f32 - br as f32).abs() + (ac as f32 - bc as f32).abs()
}

/// A* from `start` to `goal` over the set of traversable cells.
fn astar(
    start: u32,
    goal: u32,
    traversable: &HashSet<u32>,
    width: u32,
    height: u32,
    heightmap: &[f32],
) -> Vec<u32> {
    let mut open = BinaryHeap::new();
    let mut g_score: HashMap<u32, f32> = HashMap::new();
    let mut came_from: HashMap<u32, u32> = HashMap::new();

    g_score.insert(start, 0.0);
    open.push(Node {
        cost: heuristic(start, goal, width),
        cell: start,
    });

    while let Some(current) = open.pop() {
        if current.cell == goal {
            // Reconstruct path
            let mut path = vec![goal];
            let mut c = goal;
            while let Some(&prev) = came_from.get(&c) {
                path.push(prev);
                c = prev;
            }
            path.reverse();
            return path;
        }

        let current_g = g_score.get(&current.cell).copied().unwrap_or(f32::MAX);

        for nb in neighbors(current.cell, width, height) {
            if !traversable.contains(&nb) {
                continue;
            }

            let elev_diff = (heightmap[nb as usize] - heightmap[current.cell as usize]).abs();
            let move_cost = 1.0 + elev_diff * 2.0; // elevation penalty
            let tentative_g = current_g + move_cost;

            if tentative_g < g_score.get(&nb).copied().unwrap_or(f32::MAX) {
                g_score.insert(nb, tentative_g);
                came_from.insert(nb, current.cell);
                open.push(Node {
                    cost: tentative_g + heuristic(nb, goal, width),
                    cell: nb,
                });
            }
        }
    }

    // No path found – return empty
    Vec::new()
}

/// Find optimal path from the first station through all stations in order.
///
/// * `tracks` – flat array of cell indices that have track placed on them
/// * `stations` – ordered array of station cell indices (first to last)
/// * `width`, `height` – grid dimensions
/// * `heightmap` – flat elevation array (row-major)
///
/// Returns cell indices of the complete path.
#[wasm_bindgen]
pub fn find_path(
    tracks: &[u32],
    stations: &[u32],
    width: u32,
    height: u32,
    heightmap: &[f32],
) -> Vec<u32> {
    if stations.len() < 2 {
        return stations.to_vec();
    }

    // Build traversable set: all track cells + all station cells
    let mut traversable: HashSet<u32> = tracks.iter().copied().collect();
    for &s in stations {
        traversable.insert(s);
    }

    let mut full_path: Vec<u32> = Vec::new();

    for i in 0..stations.len() - 1 {
        let segment = astar(stations[i], stations[i + 1], &traversable, width, height, heightmap);
        if segment.is_empty() {
            // If any segment fails, return what we have so far
            return full_path;
        }
        if i == 0 {
            full_path.extend_from_slice(&segment);
        } else {
            // Skip the first cell of subsequent segments (it's the shared station)
            full_path.extend_from_slice(&segment[1..]);
        }
    }

    full_path
}
