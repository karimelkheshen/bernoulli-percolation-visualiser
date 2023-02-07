const COMPONENT_COLOR_PALETTE = ['#0d1b2a', '#1b263b', '#415a77', '#778da9', '#e0e1dd']

window.onload = function() {

    // gather prob control elements & current p value + update control ui
    const probabilityValue = document.getElementById("probability-value");
    const probabilitySlider = document.getElementById("probability-slider");
    let currentProbability = parseFloat(probabilitySlider.value).toFixed(2);
    probabilityValue.innerHTML = `<span class="letterP">Prob</span>: ${currentProbability}`;

    // Get canvas parameters
    const canvas = document.getElementById("percolation-canvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    //console.log(`Canvas dimensions: ${canvas.width} x ${canvas.height}`);

    // Get and set 2D context
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;

    // generate grid and get connected components for current p
    const grid = generateRandomGrid(canvas.width, canvas.height);
    const currentComponents = getConnectedComponents(grid, currentProbability, canvas.width, canvas.height);

    // generate list to be indexed when choosing color for component drawing
    const colorIndex = [];
    const maxIndex = coordToIndex(canvas.height - 1, canvas.width - 1, canvas.width);
    for (let i = 0; i < maxIndex; i++) {
        const randIndex = Math.floor(Math.random() * COMPONENT_COLOR_PALETTE.length);
        colorIndex.push(COMPONENT_COLOR_PALETTE[randIndex]);
    }


    // create cache and pre-store some frames
    cachedComponents = {};
    cachedComponents[currentProbability] = currentComponents;
    for (let i = 0; i <= 100; i++) {
        const prob = (i / 100).toFixed(2);
        cachedComponents[prob] = getConnectedComponents(grid, prob, canvas.width, canvas.height);
    }

    drawComponentsToCanvas(currentComponents, colorIndex, ctx, canvas.height, canvas.width);

    probabilitySlider.oninput = function () {

        // reset control ui and grab new value of p
        probabilityValue.innerHTML = `<span class="letterP">Prob</span>: ${currentProbability}`;
        currentProbability = parseFloat(probabilitySlider.value).toFixed(2);

        // draw current components and cache new component list
        if (currentProbability in cachedComponents) {
            drawComponentsToCanvas(cachedComponents[currentProbability], colorIndex, ctx, canvas.height, canvas.width);
        } else {
            const componentList = getConnectedComponents(grid, currentProbability, canvas.width, canvas.height);
            drawComponentsToCanvas(componentList, colorIndex, ctx, canvas.height, canvas.width);
            cachedComponents[currentProbability] = componentList;
        }

    }

}



/* Generates a 2D grid of random floating point values between 0.0 and 1.0 with 2 decimal precision. */
function generateRandomGrid(canvasWidth, canvasHeight) {
    let grid = [];
    for (let i = 0; i < canvasHeight; i++) {
        let row = [];
        for (let j = 0; j < canvasWidth; j++) {
            row.push(parseFloat((Math.random()).toFixed(2)));
        }
        grid.push(row);
    }
    return grid;
}


/*  Returns a list of connected components based on a threshold value p, where each component is a list of adjacent coordinates with values <= p. */
function getConnectedComponents(grid, prob, canvasWidth, canvasHeight) {
    let visited = new Array(canvasHeight).fill().map(() => new Array(canvasWidth).fill(false));
    let sets = [];

    for (let i = 0; i < canvasHeight; i++) {
        for (let j = 0; j < canvasWidth; j++) {
            if (visited[i][j] === false && grid[i][j] <= prob) {
                let currComponent = [[i, j]];
                visited[i][j] = true;
                currComponent = iterativeDFS(grid, visited, i, j, currComponent, prob);
                currComponentIndexed = currComponent.map(coord => coordToIndex(coord[0], coord[1], canvasWidth));
                currComponentIndexed.sort((a, b) => a - b);
                sets.push(currComponentIndexed);
            }
        }
    }
    return sets;
}


/*  getConnectedComponents() helper function / Returns all connected coordinates to the input coordinate [i, j] including itself. */
function iterativeDFS(grid, visited, i, j, currComponent, prob) {
    let stack = [[i, j]];
    let row = [-1, 0, 1, 0];
    let col = [0, 1, 0, -1];

    while (stack.length > 0) {
        let [x, y] = stack.pop();
        for (let k = 0; k < 4; k++) {
            let newX = x + row[k];
            let newY = y + col[k];
            if (isSafe(grid, visited, newX, newY, prob)) {
                visited[newX][newY] = true;
                currComponent.push([newX, newY]);
                stack.push([newX, newY]);
            }
        }
    }
    return currComponent;
}


/*  iterativeDFS() helper / "Checks if grid cell is within bounds and unvisited before DFS. */
function isSafe(grid, visited, x, y, prob) {
    return (x >= 0 && x < grid.length && y >= 0 && y < grid[0].length && grid[x][y] <= prob && !visited[x][y]);
}


function coordToIndex(x, y, width) {
    return y * width + x;
}


function indexToCoord(index, width) {
    return [
        index % width,
        Math.floor(index / width)
    ];
}


/* Sets up the frame of connected components with their assigned colors related to the current value of P, and draws it to the canvas. */
function drawComponentsToCanvas(componentList, colorIndex, ctx, canvasHeight, canvasWidth) {

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    for (let i = 0; i < componentList.length; i++) {
        const currComponent = componentList[i];
        const currMinIndex = currComponent[0];
        let currColor = colorIndex[currMinIndex];

        for (let j = 0; j < currComponent.length; j++) {
            const currCoord = indexToCoord(currComponent[j], canvasWidth);
            const x = currCoord[0];
            const y = currCoord[1];

            ctx.fillStyle = currColor;
            ctx.fillRect(x, y, 1, 1);
        }
    }

}
