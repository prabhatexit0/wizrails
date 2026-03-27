use wasm_bindgen::prelude::*;

pub mod signals;
pub mod scheduler;
pub mod npc;

/// Optional init function called when the WASM module is instantiated.
#[wasm_bindgen(start)]
pub fn init() {
    // Could initialize logging / panic hooks here in the future.
}
