const PERCOLATION_COLOR_PALETTE = [
    '#10002b',
    '#240046',
    '#3c096c',
    '#5a189a',
    '#7b2cbf',
    '#9d4edd',
    '#c77dff',
    '#e0aaff'
]

window.onload = function() {
    
    // Get canvas parameters
    const canvas = document.getElementById("percolation-canvas");
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    // Get and set 2D context 
    const ctx = canvas.getContext('2d', { willReadFrequently : true });
    ctx.imageSmoothingEnabled = false;

    // gather prob control elements & current p value + update control ui
    const probabilityValue = document.getElementById("probability-value");
    const probabilitySlider = document.getElementById("probability-slider");
    let currentProbability = parseFloat(probabilitySlider.value).toFixed(2);
    probabilityValue.innerHTML = `<span class="letterP">P</span>: ${currentProbability}`;

    // generate grid and get connected components for current p
    const grid = generateRandomGrid(canvasHeight, canvasWidth);
    const currentComponents = getConnectedComponents(grid, currentProbability);

    // generate list to be indexed when choosing color for component drawing
    const colorIndex = [];
    const numIndexes = canvasHeight * canvasWidth;
    for (let i = 0; i < numIndexes; i++) {
        const randomColor = generateRandomColorFromPalette();
        colorIndex.push(randomColor);
    }

    // create cache and pre-store some frames
    cachedComponents = {};
    cachedComponents[currentProbability] = currentComponents;
    for (let i = 45; i <= 80; i++) {
        const prob = (i / 100).toFixed(2);
        cachedComponents[prob] = getConnectedComponents(grid, prob);
    }

    drawComponentsToCanvas(currentComponents, colorIndex, ctx, canvasHeight, canvasWidth);

    probabilitySlider.oninput = function () {
        
        // reset control ui and grab new value of p
        probabilityValue.innerHTML = `<span class="letterP">P</span>: ${currentProbability}`;
        currentProbability = parseFloat(probabilitySlider.value).toFixed(2);
        
        // draw current components and store component list if not already cached
        if (currentProbability in cachedComponents) {
            drawComponentsToCanvas(cachedComponents[currentProbability], colorIndex, ctx, canvasHeight, canvasWidth);
        } else {
            const componentList = getConnectedComponents(grid, currentProbability);
            drawComponentsToCanvas(componentList, colorIndex, ctx, canvasHeight, canvasWidth);
            cachedComponents[currentProbability] = componentList;
        }

    }

}


/* Generates a 2D grid of random floating point values between 0.0 and 1.0 with 2 decimal precision. */
function generateRandomGrid(n, m) {
    let grid = [];
    for (let i = 0; i < n; i++) {
        let row = [];
        for (let j = 0; j < m; j++) {
            row.push(parseFloat((Math.random()).toFixed(2)));
        }
        grid.push(row);
    }
    return grid;
}


/*  Returns a list of connected components based on a threshold value p, where each component is a list of adjacent coordinates with values <= p. */
function getConnectedComponents(grid, prob) {
    let visited = new Array(grid.length).fill().map(() => new Array(grid[0].length).fill(false));
    const gridWidth = grid[0].length;
    let sets = [];

    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
            if (visited[i][j] === false && grid[i][j] <= prob) {
                let currComponent = [[i, j]];
                visited[i][j] = true;
                currComponent = iterativeDFS(grid, visited, i, j, currComponent, prob);
                currComponentIndexed = currComponent.map(coord => coordToIndex(coord[0], coord[1], gridWidth));
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


/* Generates a random variation (lighter/darker version) of one of the colors in a set. (returns {r:,g:,b:}) */
function generateRandomColorFromPalette() {
    const randomIndex = Math.floor(Math.random() * PERCOLATION_COLOR_PALETTE.length)
    const randomColor = PERCOLATION_COLOR_PALETTE[randomIndex].slice(1)

    const luminance = (0.2126 * parseInt(randomColor.slice(0, 2), 16) + 0.7152 * parseInt(randomColor.slice(2, 4), 16) + 0.0722 * parseInt(randomColor.slice(4, 6), 16)) / 255
    let r, g, b;
    if (luminance > 0.5) {
        r = parseInt(randomColor.slice(0, 2), 16) * 0.4;
        g = parseInt(randomColor.slice(2, 4), 16) * 0.4;
        b = parseInt(randomColor.slice(4, 6), 16) * 0.4;
    } else {
        r = parseInt(randomColor.slice(0, 2), 16) * 1.6;
        g = parseInt(randomColor.slice(2, 4), 16) * 1.6;
        b = parseInt(randomColor.slice(4, 6), 16) * 1.6;
    }
    return {
        r: Math.floor(r),
        g: Math.floor(g),
        b: Math.floor(b)
    }
}


// (returns {r:,g:,b:})
function generateRandomColor() {
    return {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256), 
        b: Math.floor(Math.random() * 256)
    };
}


/* Sets up the frame of connected components with their assigned colors related to the current value of P, and draws it to the canvas. */
function drawComponentsToCanvas(componentList, colorIndex, ctx, canvasHeight, canvasWidth) {    
    
    const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

    for (let i = 0; i < componentList.length; i++) {
        const currComponent = componentList[i];
        const currMinIndex = currComponent[0];
        
        const currColor = colorIndex[currMinIndex];
        if (currColor === undefined) {
            continue;
        }
        
        for (let j = 0; j < currComponent.length; j++) {
            const currCoord = indexToCoord(currComponent[j], canvasWidth);
            const x = currCoord[0];
            const y = currCoord[1];
    
            const index = (y * canvasWidth + x) * 4;
            imgData.data[index + 0] = currColor.r;
            imgData.data[index + 1] = currColor.g;
            imgData.data[index + 2] = currColor.b;
            imgData.data[index + 3] = 255;
        }
    }
    
    ctx.putImageData(imgData, 0, 0);
}

