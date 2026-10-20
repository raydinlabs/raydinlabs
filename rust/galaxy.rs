//! Deterministic spiral-galaxy point cloud. Each record is seven little-endian f32s:
//! x, y, z, red, green, blue, point size. Artistic illustration, not astronomical data.
use std::{env, fs::File, io::{BufWriter, Write}};
fn random(seed: &mut u32) -> f32 { *seed = seed.wrapping_mul(1664525).wrapping_add(1013904223); (*seed >> 8) as f32 / 16777216.0 }
fn stars(count: usize) -> Vec<f32> {
    let mut seed = 42042u32;
    let mut out = Vec::with_capacity(count * 7);
    for i in 0..count {
        let r = random(&mut seed).powf(0.72) * 5.0;
        let arm = (i % 4) as f32 * std::f32::consts::FRAC_PI_2;
        let angle = arm + r * 1.15 + (random(&mut seed) - 0.5) * (0.65 + r * 0.10);
        let spread = (random(&mut seed) - 0.5) * 0.5;
        let y = (random(&mut seed) - 0.5) * (0.12 + 0.25 * (-r).exp());
        let warmth = (-r * 0.65).exp();
        let tint = random(&mut seed);
        out.extend_from_slice(&[(r + spread) * angle.cos(), y, (r + spread) * angle.sin(),
            0.30 + warmth * 0.70 + tint * 0.10, 0.50 + warmth * 0.33, 0.90 - warmth * 0.36,
            0.7 + random(&mut seed).powf(4.0) * 3.2]);
    }
    out
}
fn main() -> std::io::Result<()> {
    let path = env::args().nth(1).expect("output path required");
    let mut file = BufWriter::new(File::create(path)?);
    for value in stars(18000) { file.write_all(&value.to_le_bytes())?; }
    file.flush()
}
#[cfg(test)] mod tests {
    use super::*;
    #[test] fn bounded_finite_and_repeatable() {
        let a = stars(18000); assert_eq!(a, stars(18000)); assert_eq!(a.len(), 126000);
        for star in a.chunks_exact(7) { assert!(star.iter().all(|v| v.is_finite())); assert!(star[0].abs() <= 5.3); assert!(star[2].abs() <= 5.3); assert!(star[6] > 0.0); }
    }
}
