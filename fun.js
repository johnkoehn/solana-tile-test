
const hexagons = (mapRadius) => {
    const coordinates = [];
    for (let q = -mapRadius; q <= mapRadius; q++) {
        const rMin = Math.max(-mapRadius, -q - mapRadius);
        const rMax = Math.min(mapRadius, -q + mapRadius);

        for (let r = rMin; r <= rMax; r++) {
            coordinates.push({ q, r });
        }
    }
    return coordinates;
}

console.log(hexagons(2));
