const inter = `"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
const cormorant = `"Cormorant Garamond", Georgia, "Times New Roman", serif`;

export function buildTypography(mode = "light") {
  return {
    fontFamily: inter,
    h1: { fontFamily: cormorant, fontWeight: 700, lineHeight: 1.15, fontSize: "clamp(2.2rem,4vw,3rem)" },
    h2: { fontFamily: cormorant, fontWeight: 600, lineHeight: 1.2,  fontSize: "clamp(1.8rem,3vw,2.4rem)" },
    h3: { fontWeight: 700, lineHeight: 1.25, fontSize: "clamp(1.4rem,2.5vw,1.8rem)" },
    h4: { fontWeight: 600, lineHeight: 1.3,  fontSize: "1.4rem" },
    h5: { fontWeight: 600, lineHeight: 1.35, fontSize: "1.2rem" },
    h6: { fontWeight: 600, lineHeight: 1.4,  fontSize: "1.1rem" },
    body1: { fontWeight: 400, lineHeight: 1.8, fontSize: "1rem" },
    body2: { fontWeight: 400, lineHeight: 1.7, fontSize: "1rem" },
    button: { fontWeight: 600, textTransform: "none", fontSize: "1rem", letterSpacing: 0.2 },
    // opcional: variant “display” solemne
    display: { fontFamily: cormorant, fontWeight: 600, lineHeight: 1.15, fontSize: "clamp(1.9rem,3.2vw,2.6rem)" },
  };
}