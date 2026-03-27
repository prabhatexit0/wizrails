use wasm_bindgen::prelude::*;

pub mod terrain;
pub mod pathfinder;
pub mod validator;

/// Optional init function called when the WASM module is instantiated.
#[wasm_bindgen(start)]
pub fn init() {
    // Could initialize logging / panic hooks here in the future.
}
