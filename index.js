// ----------------- Planetes orbitant -----------------
// Aquí creo els planetes que giren per la pantalla. Primer agafo el contenidor:
const planetsContainer = document.getElementById("planets");

// Imatges que faig servir per als planetes
const planetImgs = [
  "https://upload.wikimedia.org/wikipedia/commons/c/c2/Jupiter_by_Cassini-Huygens.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/0/02/Mars_mosaic.jpg"
];

let planets = [];

// Genero 5 planetes amb mides, velocitats i posicions aleatòries:
for (let i = 0; i < 5; i++) {
    const p = document.createElement("div");
    p.classList.add("planet");

    let size = 80 + Math.random() * 100;
    p.style.width = p.style.height = size + "px";

    p.centerX = Math.random() * window.innerWidth;
    p.centerY = Math.random() * window.innerHeight;
    p.radius = 50 + Math.random() * 100;
    p.angle = Math.random() * Math.PI * 2;
    p.speed = 0.01 + Math.random() * 0.02;

    p.style.backgroundImage = `url(${planetImgs[i % planetImgs.length]})`;
    p.style.backgroundSize = "cover";
    p.style.borderRadius = "50%";
    p.style.position = "absolute";

    planetsContainer.appendChild(p);
    planets.push(p);
}

// Funció que fa que els planetes orbitin
function animatePlanets() {
    planets.forEach(p => {
        p.angle += p.speed;
        p.style.left = p.centerX + Math.cos(p.angle) * p.radius - parseFloat(p.style.width) / 2 + "px";
        p.style.top = p.centerY + Math.sin(p.angle) * p.radius - parseFloat(p.style.height) / 2 + "px";
    });
    requestAnimationFrame(animatePlanets);
}
animatePlanets();


// ----------------- Scroll, topBtn i barra -----------------
// Aquí actualitzo la barra de progrés del scroll i el botó de pujar amunt:
window.addEventListener("scroll", () => {
  const h = document.documentElement;
  const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;

  document.getElementById("scrollBar").style.width = scrolled + "%";
  document.getElementById("topBtn").style.display = window.scrollY > 400 ? "block" : "none";
});

// Botó per tornar amunt amb scroll suau
document.getElementById("topBtn").onclick = () =>
  window.scrollTo({ top: 0, behavior: "smooth" });


// ----------------- Flip-card sounds -----------------
// Aquí afegeixo els sons de passar el ratolí per sobre i clicar:
document.querySelectorAll(".flip-card").forEach(card => {
  card.addEventListener("mouseenter", () =>
    document.getElementById("hoverSound")?.play()
  );
  card.addEventListener("click", () =>
    document.getElementById("clickSound")?.play()
  );
});


// --- CLASSIFICADOR ASTRONÒMIC MILLORAT ---
// Aquesta part és on jo faig l'anàlisi automàtica de la imatge:
document.getElementById("inputImg").addEventListener("change", async function () {
    const file = this.files[0];
    const preview = document.getElementById("preview");
    const result = document.getElementById("resultText");
    const barGraph = document.getElementById("barGraph");

    if (!file) return;

    preview.src = URL.createObjectURL(file);

    result.innerHTML = `<span style="opacity:0.7">Analitzant imatge...</span>`;
    barGraph.innerHTML = "";

    await new Promise(r => setTimeout(r, 700)); // retard estètic

    const img = new Image();
    img.src = preview.src;

    img.onload = () => {
        // Passo la imatge per un canvas per poder llegir els píxels
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        c.width = 200;
        c.height = 200;

        ctx.drawImage(img, 0, 0, 200, 200);
        const data = ctx.getImageData(0, 0, 200, 200).data;

        // Variables per detectar propietats de la imatge
        let brightness = 0;
        let red = 0, green = 0, blue = 0;
        let saturation = 0;
        let gradientStrength = 0;

        // Recorro tots els píxels
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            brightness += (r + g + b) / 3;
            red += r;
            green += g;
            blue += b;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            saturation += (max - min);

            gradientStrength += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
        }

        const pixelCount = data.length / 4;

        brightness /= pixelCount;
        red /= pixelCount;
        green /= pixelCount;
        blue /= pixelCount;
        saturation /= pixelCount;
        gradientStrength /= pixelCount;

        // Sistema de puntuació per classificar imatges
        const scores = {
            "Estrella": brightness * 1.4,
            "Galàxia": blue * 1.2 + brightness * 0.6 - gradientStrength * 0.3,
            "Nebulosa": (blue + red * 0.5) * 0.8 + gradientStrength * 1.3 + saturation * 0.9,
            "Planeta": (red * 1.1 + green * 0.8) - gradientStrength * 0.4
        };

        const total = Object.values(scores).reduce((a, b) => a + b, 0);

        const probs = Object.fromEntries(
            Object.entries(scores).map(([k, v]) => [k, Math.max(v / total, 0)])
        );

        const best = Object.entries(probs).sort((a, b) => b[1] - a[1])[0];

        result.innerHTML =
          `Classificació estimada: <b>${best[0]}</b> (${Math.round(best[1] * 100)}%)`;

        // Generació de les barres animades
        barGraph.innerHTML = "";
        Object.entries(probs).forEach(([cat, prob], i) => {
            const bar = document.createElement("div");
            bar.style.width = "45px";
            bar.style.height = "0px";
            bar.style.transition = "0.9s ease";
            bar.style.background = `hsl(${i * 90}, 80%, 60%)`;
            bar.style.borderRadius = "10px";

            const container = document.createElement("div");
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.alignItems = "center";
            container.style.gap = "6px";

            const label = document.createElement("span");
            label.style.fontSize = "14px";
            label.style.opacity = "0.8";
            label.innerText = cat;

            container.appendChild(bar);
            container.appendChild(label);
            barGraph.appendChild(container);
                
            setTimeout(() => {
                bar.style.height = (prob * 130 + 10) + "px";
            }, 100);
        });
    };
});
