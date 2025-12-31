window.onload = async () => {
    const container = document.getElementById("updateContainer");
    
    container.innerHTML = '';

    try {
        const response = await fetch('updates.json');
        if (!response.ok) throw new Error('Failed to load updates');

        const data = await response.json();

        const sortedVersions = data.versions.sort((a, b) => {
            return parseFloat(b.number) - parseFloat(a.number);
        });

        sortedVersions.forEach(update => {
            const updateBox = document.createElement("div");
            updateBox.className = "update-box";

            const title = document.createElement("h3");
            title.className = "update-title";
            title.innerText = `v${update.number}`;

            const desc = document.createElement("p");
            desc.className = "update-desc";
            desc.innerText = update.description;

            updateBox.appendChild(title);
            updateBox.appendChild(desc);
            container.appendChild(updateBox);
        });

        if (sortedVersions.length === 0) {
            const emptyMsg = document.createElement("p");
            emptyMsg.className = "update-desc";
            emptyMsg.style.opacity = "0.6";
            emptyMsg.innerText = "No hoppenings yet... check back soon! 🥕";
            container.appendChild(emptyMsg);
        }

    } catch (error) {
        console.error('Error loading updates:', error);
        container.innerHTML = `<p class="update-desc" style="opacity:0.6;">Oopsie! Bunny updates are hiding... 🐇</p>`;
    }
};

const galleryGrid = document.getElementById("galleryGrid");

const occaliImages = [
    "Analysing.jpg",
    "BedPotato.jpg",
    "CouchPotato.jpg",
    "DeskPotato.jpg",
    "FastAEep.jpg",
    "GonnaGetYa.jpg",
    "Happy!.jpg",
    "Hewwo.jpg",
    "Hunting.jpg",
    "JumpScare.jpg",
    "OnTheHunt.jpg",
    "Sus.jpg",
    "Toast.jpg",
    "UpClose.jpg"
];

if (occaliImages.length > 0) {
    galleryGrid.innerHTML = '';

    const shuffled = [...occaliImages].sort(() => 0.5 - Math.random());
    const selectedImages = shuffled.slice(0, 6);

    selectedImages.forEach(filename => {
        const img = document.createElement("img");
        img.src = `Occali/${filename}`;
        img.alt = "Loading failed :(";
        img.loading = "lazy";
        galleryGrid.appendChild(img);
    });
} else {
    galleryGrid.innerHTML = '<p style="opacity: 0.6; grid-column: 1 / -1;">No bunnies in the burrow yet... 🥺</p>';
}