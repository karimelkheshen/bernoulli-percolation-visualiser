window.onload = function() {

    const canvas = document.getElementById("percolation-canvas");
    const ctx = canvas.getContext('2d', { willReadFrequently : true});

    const canvas_width = canvas.offsetWidth;
    const canvas_height = canvas.offsetHeight;

    const probability_value = document.getElementById("probability-value");
    const probability_slider = document.getElementById("probability-slider");

    let current_probability = probability_slider.value;

    probability_value.innerHTML = `p: ${current_probability}`
    probability_slider.oninput = function () {
        current_probability = probability_slider.value;
        probability_value.innerHTML = `p: ${current_probability}`;
        draw_connected_sets(connected_sets_per_p[current_probability], ctx, canvas_width, canvas_height);
    }

    const grid = generate_random_grid(canvas_height, canvas_width);
    const connected_sets_per_p = get_connected_sets_per_p(grid);

    draw_connected_sets(connected_sets_per_p[current_probability], ctx, canvas_width, canvas_height);
}


function draw_connected_sets(connected_sets, ctx, canvas_width, canvas_height) {
    const imgData = ctx.getImageData(0, 0, canvas_width, canvas_height);
    for (let i = 0; i < connected_sets.length; i++) {
        const color = get_random_color();
        for (let j = 0; j < connected_sets[i].length; j++) {
            const index = (connected_sets[i][j][1] * canvas_width + connected_sets[i][j][0]) * 4;
            imgData.data[index + 0] = color.r;
            imgData.data[index + 1] = color.g;
            imgData.data[index + 2] = color.b;
            imgData.data[index + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}


function get_random_color() {
    return {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256)
    }
}

function* range(start, end, step) {
    while (start < end) {
        yield start;
        start += step;
    }
}


function get_connected_sets_per_p(grid) {
    res = {}
    let probs = Array.from(range(0, 1.01, 0.01)).map(num => +num.toFixed(2));
    probs.forEach(prob => {
        res[prob] = get_connected_sets(grid, prob);
    })
    return res;
}


function get_connected_sets(grid, p) {
    let visited = new Array(grid.length).fill().map(() => new Array(grid[0].length).fill(false));
    let sets = [];

    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
            if (visited[i][j] === false && grid[i][j] <= p) {
                let set = [[i, j]];
                visited[i][j] = true;
                sets.push(iterative_dfs(grid, visited, i, j, set, p));
            }
        }
    }
    return sets;
}


function iterative_dfs(grid, visited, i, j, set, p) {
    let stack = [[i, j]];
    let row = [-1, 0, 1, 0];
    let col = [0, 1, 0, -1];

    while (stack.length > 0) {
        let [x, y] = stack.pop();
        for (let k = 0; k < 4; k++) {
            let newX = x + row[k];
            let newY = y + col[k];
            if (is_safe(grid, visited, newX, newY, p)) {
                visited[newX][newY] = true;
                set.push([newX, newY]);
                stack.push([newX, newY]);
            }
        }
    }
    return set;
}


function is_safe(grid, visited, x, y, p) {
    return (x >= 0 && x < grid.length && y >= 0 && y < grid[0].length && grid[x][y] <= p && !visited[x][y]);
}


function generate_random_grid(n, m) {
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