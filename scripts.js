// Year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// Soft cursor glow (desktop only)
const cursor = document.querySelector(".cursor");
let cx = window.innerWidth / 2;
let cy = window.innerHeight / 2;
let tx = cx, ty = cy;

window.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
});

function animateCursor() {
    // smooth follow
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;

    if (cursor) cursor.style.left = cx + "px";
    if (cursor) cursor.style.top = cy + "px";

    requestAnimationFrame(animateCursor);
}
animateCursor();

// Reveal on scroll
const items = document.querySelectorAll(".reveal");

const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
            io.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

items.forEach(el => io.observe(el));
