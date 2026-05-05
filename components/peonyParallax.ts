// Shared mutable state consumed by PeonyCanvas useFrame.
// Mutated outside React (scroll handlers, window mousemove) so it never
// triggers re-renders.
//
// - progress: scroll progress 0..1 from ProfileModal's right column
// - mouseX/Y: viewport-NDC mouse position (-1..1) from a window listener
//   attached at PortfolioApp level. We can't use useThree().mouse because the
//   Canvas element has pointer-events:none (so clicks pass through to grid).
export const peonyParallax = {
  progress: 0,
  mouseX:   0,
  mouseY:   0,
}
