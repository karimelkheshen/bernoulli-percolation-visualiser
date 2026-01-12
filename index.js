function setPlayPauseButton(isPlaying) {
    const btn = document.getElementById("play-pause-btn");
    btn.textContent = isPlaying ? "Pause" : "Play";
}

function probabilityToKey(probStr) {
    return Math.round(parseFloat(probStr) * 100);
}

function keyToProbabilityStr(key) {
    return (key / 100).toFixed(2);
}

function nearestExtremeKey(key) {
    return key < 50 ? 0 : 100;
}

function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
        t += 0x6D2B79F5;
        let x = Math.imul(t ^ (t >>> 15), 1 | t);
        x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
}

function getOrCreateSessionSeed() {
    const key = "bp_seed";
    const existing = sessionStorage.getItem(key);
    if (existing !== null) return parseInt(existing, 10);

    const seed = (crypto && crypto.getRandomValues)
        ? crypto.getRandomValues(new Uint32Array(1))[0]
        : Math.floor(Math.random() * 0xFFFFFFFF);

    sessionStorage.setItem(key, String(seed));
    return seed;
}

function saveSessionState(probabilityStr) {
    sessionStorage.setItem("bp_prob", probabilityStr);
}

function loadSessionProbabilityOrDefault(defaultProbStr) {
    const saved = sessionStorage.getItem("bp_prob");
    return saved !== null ? saved : defaultProbStr;
}

function setupCanvas(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;

    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;

    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return { width: cssWidth, height: cssHeight };
}

function componentColorFromSeed(seedIndex) {
    let x = seedIndex | 0;
    x ^= x >>> 16;
    x = Math.imul(x, 0x7feb352d);
    x ^= x >>> 15;
    x = Math.imul(x, 0x846ca68b);
    x ^= x >>> 16;

    return (x & 1) === 0;
}

function setProbabilityLabel(probabilityValueElement, currentProbability) {
    probabilityValueElement.innerHTML = `P = ${parseInt(currentProbability * 100)} %`
}

function generateRandomGrid(canvasWidth, canvasHeight, seed) {
    const rng = mulberry32(seed);
    let grid = [];

    for (let i = 0; i < canvasHeight; i++) {
        let row = [];
        for (let j = 0; j < canvasWidth; j++) {
            row.push(Math.floor(rng() * 100) / 100);
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
            
            if (visited[i][j] === false && grid[i][j] < prob) {
                
                let currComponent = [[i, j]];
                visited[i][j] = true;
                currComponent = iterativeDFS(grid, visited, i, j, currComponent, prob);
                
                const currComponentIndexes = currComponent.map(coord => coordToIndex(coord[1], coord[0], canvasWidth));
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
    return (x >= 0 && x < grid.length && y >= 0 && y < grid[0].length && grid[x][y] < prob && !visited[x][y]);
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


function drawComponentsToCanvas(componentList, ctx, canvasHeight, canvasWidth) {
    const OPEN_COLOR_A = '#e0e1dd';
    const OPEN_COLOR_B = '#415a77';

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    componentList.forEach(component => {
        const seed = component[0];
        ctx.fillStyle = componentColorFromSeed(seed) ? OPEN_COLOR_A : OPEN_COLOR_B;

        for (let j = 0; j < component.length; j++) {
            const [x, y] = indexToCoord(component[j], canvasWidth);
            ctx.fillRect(x, y, 1, 1);
        }
    });
}

window.onload = function() {
    const probabilityValue = document.getElementById("probability-value");
    const probabilitySlider = document.getElementById("probability-slider");
    const playPauseBtn = document.getElementById("play-pause-btn");

    const canvas = document.getElementById("percolation-canvas");
    const ctx = canvas.getContext('2d');
    const size = setupCanvas(canvas, ctx);

    const seed = getOrCreateSessionSeed();

    const initialProbStr = loadSessionProbabilityOrDefault("0.00");
    probabilitySlider.value = initialProbStr;

    let currentProbability = parseFloat(probabilitySlider.value).toFixed(2);
    setProbabilityLabel(probabilityValue, currentProbability);

    const grid = generateRandomGrid(size.width, size.height, seed);

    let isPlaying = false;
    let direction = 1;
    let rafId = null;

    const DEBOUNCE_MS = 80;
    let debounceTimerId = null;

    const PLAY_FPS = 15;
    const PLAY_INTERVAL_MS = Math.floor(1000 / PLAY_FPS);
    let lastPlayComputeTs = 0;

    function computeAndDraw(probStr) {
        const prob = parseFloat(probStr).toFixed(2);
        setProbabilityLabel(probabilityValue, prob);

        const components = getConnectedComponents(grid, prob, size.width, size.height);
        drawComponentsToCanvas(components, ctx, size.height, size.width);

        saveSessionState(prob);
    }

    computeAndDraw(currentProbability);

    function stopPlaying() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        isPlaying = false;
        setPlayPauseButton(false);
    }

    function step(ts) {
        if (!isPlaying) return;

        const key = probabilityToKey(probabilitySlider.value);
        let nextKey = key + direction;

        if (nextKey >= 100) {
            nextKey = 100;
            direction = -1;
        } else if (nextKey <= 0) {
            nextKey = 0;
            direction = 1;
        }

        probabilitySlider.value = keyToProbabilityStr(nextKey);

        if (ts - lastPlayComputeTs >= PLAY_INTERVAL_MS) {
            lastPlayComputeTs = ts;
            computeAndDraw(probabilitySlider.value);
        } else {
            const p = parseFloat(probabilitySlider.value).toFixed(2);
            setProbabilityLabel(probabilityValue, p);
            saveSessionState(p);
        }

        rafId = requestAnimationFrame(step);
    }

    function startPlaying() {
        const key = probabilityToKey(probabilitySlider.value);
        const target = nearestExtremeKey(key);
        direction = target > key ? 1 : -1;

        isPlaying = true;
        setPlayPauseButton(true);

        lastPlayComputeTs = 0;
        rafId = requestAnimationFrame(step);
    }

    probabilitySlider.addEventListener("pointerdown", function () {
        if (isPlaying) stopPlaying();
        if (debounceTimerId !== null) {
            clearTimeout(debounceTimerId);
            debounceTimerId = null;
        }
    });

    probabilitySlider.addEventListener("input", function () {
        if (isPlaying) stopPlaying();

        const p = parseFloat(probabilitySlider.value).toFixed(2);
        setProbabilityLabel(probabilityValue, p);
        saveSessionState(p);

        if (debounceTimerId !== null) clearTimeout(debounceTimerId);
        debounceTimerId = setTimeout(function () {
            computeAndDraw(probabilitySlider.value);
            debounceTimerId = null;
        }, DEBOUNCE_MS);
    });

    playPauseBtn.addEventListener("click", function () {
        if (isPlaying) stopPlaying();
        else startPlaying();
    });

    window.addEventListener("pagehide", function () {
        const p = parseFloat(probabilitySlider.value).toFixed(2);
        saveSessionState(p);
    });

    setPlayPauseButton(false);
}

