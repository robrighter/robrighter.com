document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('solarSystemCanvas');
    const ctx = canvas.getContext('2d');

    const sun = {
        radius: 30,
        color: 'yellow',
        orbitRadius: 0,
        speed: 0,
        angle: 0
    };

    const planets = [
        { name: 'Earth', radius: 10, color: 'blue', orbitRadius: 150, speed: 0.01, angle: 0 },
        { name: 'Mars', radius: 7, color: 'red', orbitRadius: 220, speed: 0.007, angle: 0 },
        { name: 'Jupiter', radius: 20, color: 'orange', orbitRadius: 300, speed: 0.005, angle: 0 }
    ];

    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Center coordinates
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Draw Sun
        ctx.beginPath();
        ctx.arc(centerX, centerY, sun.radius, 0, Math.PI * 2);
        ctx.fillStyle = sun.color;
        ctx.fill();
        ctx.closePath();

        // Draw planets
        planets.forEach(planet => {
            const x = centerX + planet.orbitRadius * Math.cos(planet.angle);
            const y = centerY + planet.orbitRadius * Math.sin(planet.angle);

            ctx.beginPath();
            ctx.arc(x, y, planet.radius, 0, Math.PI * 2);
            ctx.fillStyle = planet.color;
            ctx.fill();
            ctx.closePath();

            // Update angle for next frame
            planet.angle += planet.speed;
        });

        // Request next frame
        requestAnimationFrame(draw);
    }

    // Start animation
    draw();
});
