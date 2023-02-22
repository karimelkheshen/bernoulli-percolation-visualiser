const COMPONENT_COLOR_PALETTE = ['#0d1b2a', '#1b263b', '#415a77', '#778da9', '#e0e1dd', '#020c15', '#193354', '#2d486a', '#5e748f', '#c9cac7', '#142833', '#1e2d43', '#4d6887', '#a0aec7', '#f2f2f1'];


window.onload = function() {
    const probabilityValue = document.getElementById("probability-value");
    const probabilitySlider = document.getElementById("probability-slider");

    let currentProbability = parseFloat(probabilitySlider.value).toFixed(2);
    probabilityValue.innerHTML = `Prob: ${currentProbability}`;

    const canvas = document.getElementById("percolation-canvas");
    const ctx = canvas.getContext('2d');

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const grid = generateRandomGrid(canvas.width, canvas.height);
    const colorIndex = generateColorIndex(canvas);
    let componentListCache = generateComponentListCache(grid, canvas);

    const firstFrame = getConnectedComponents(grid, currentProbability, canvas.width, canvas.height);
    drawComponentsToCanvas(firstFrame, colorIndex, ctx, canvas.height, canvas.width);

    probabilitySlider.oninput = function () {
        probabilityValue.innerHTML = `Prob: ${currentProbability}`;
        currentProbability = parseFloat(probabilitySlider.value).toFixed(2);
        drawComponentsToCanvas(componentListCache[currentProbability], colorIndex, ctx, canvas.height, canvas.width);
    }
}


function generateComponentListCache(grid, canvas) {
    const progressBox = document.getElementById("progress-box");
    progressBox.style.display = "block";

    let i = 0;
    let componentListCache = {};

    function updateProgress() {
        progressBox.innerHTML = `LOADING SIMULATION ${i}%`;
        const prob = (i / 100).toFixed(2);
        
        componentListCache[prob] = getConnectedComponents(grid, prob, canvas.width, canvas.height);

        if (i < 100) {
            i++;
            requestAnimationFrame(updateProgress);
        } else {
            progressBox.style.display = "none";
        }
    }

    requestAnimationFrame(updateProgress);
    return componentListCache;
}


function generateColorIndex(canvas) {
    let colorIndex = [];
    
    const maxIndex = coordToIndex(canvas.height - 1, canvas.width - 1, canvas.width);
    for (let i = 0; i < maxIndex; i++) {
        const randIndex = Math.floor(Math.random() * COMPONENT_COLOR_PALETTE.length);
        colorIndex.push(COMPONENT_COLOR_PALETTE[randIndex]);
    }
    
    return colorIndex;
}


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


function getConnectedComponents(grid, prob, canvasWidth, canvasHeight) {
    let visited = new Array(canvasHeight).fill().map(() => new Array(canvasWidth).fill(false));
    
    let sets = [];
    for (let i = 0; i < canvasHeight; i++) {
        for (let j = 0; j < canvasWidth; j++) {
            
            if (visited[i][j] === false && grid[i][j] <= prob) {
                
                let currComponent = [[i, j]];
                visited[i][j] = true;
                currComponent = iterativeDFS(grid, visited, i, j, currComponent, prob);
                
                currComponentIndexes = currComponent.map(coord => coordToIndex(coord[0], coord[1], canvasWidth));
                currComponentIndexes.sort((a, b) => a - b);
                
                sets.push(currComponentIndexes);
            }

        }
    }

    return sets;
}


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


function drawComponentsToCanvas(componentList, colorIndex, ctx, canvasHeight, canvasWidth) {

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    componentList.forEach(component => {
        ctx.fillStyle = colorIndex[component[0]];

        for (let j = 0; j < component.length; j++) {
            const currCoord = indexToCoord(component[j], canvasWidth);

            ctx.fillRect(currCoord[1], currCoord[0], 1, 1);
            
        }
    });
}
