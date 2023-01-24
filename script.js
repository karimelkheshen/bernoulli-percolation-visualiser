/*
    ! Instead of the current way of doing things:
        1- Given the data structure connected_sets_per_p
        2- Get all possible unique connected set sizes in a Set data structure.
        3- Convert (2) into a dictionary where the keys are the sizes and the values are the color assigned.
        4- During the drawing to the canvas, get the color of a connected set using the data structure of (3)
*/

/*
    ? Experiment with the dimensions of the canvas.
    As chatGPT said, regardless of the current canvas size on the page, create a grid of a large enough
    resolution such that the pixel size shrinks and the picture becomes a bit more sharp.
    Ask chatGPT again for suggestions on making the image sharper and start trying them all.
*/

const percolation_color_palette = [
    '#355070',
    '#6d597a',
    '#b56576',
    '#e56b6f',
    '#eaac8b'
]

window.onload = function() {

    const canvas = document.getElementById("percolation-canvas");
    const ctx = canvas.getContext('2d', { willReadFrequently : true});

    ctx.imageSmoothingEnabled = false;

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
    const connected_sets_per_p_uncolored = get_connected_sets_per_p(grid);
    const connected_sets_per_p = assign_colors_to_sets(connected_sets_per_p_uncolored);

    draw_connected_sets(connected_sets_per_p[current_probability], ctx, canvas_width, canvas_height);
}


function draw_connected_sets(connected_sets, ctx, canvas_width, canvas_height) {
    const imgData = ctx.getImageData(0, 0, canvas_width, canvas_height);
    for (let i = 0; i < connected_sets.length; i++) {
        for (let j = 0; j < connected_sets[i].set.length; j++) {
            const color = connected_sets[i].color;
            const index = (connected_sets[i].set[j][1] * canvas_width + connected_sets[i].set[j][0]) * 4;
            imgData.data[index + 0] = color.r;
            imgData.data[index + 1] = color.g;
            imgData.data[index + 2] = color.b;
            imgData.data[index + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}


function assign_colors_to_sets(connected_sets_per_p) {
    let res = {};

    const max_num_connected_sets = Math.max(...Object.values(connected_sets_per_p).map(list => list.length));
    const color_code_list = Array.from({ length: max_num_connected_sets }, get_random_color_from_pallette);
    
    Object.keys(connected_sets_per_p).forEach(prob => {
        new_value = [];
        let sets_to_sort = connected_sets_per_p[prob];
        sets_to_sort.sort(function (a, b) {
            return b.length - a.length;
        });
        for (let i=0 ; i<sets_to_sort.length ; i++) {
            new_value.push({
                color: color_code_list[i],
                set: sets_to_sort[i]
            })
        }
        res[prob] = new_value;
    });

    return res;
}


function get_random_color_from_pallette() {
    const randomIndex = Math.floor(Math.random() * percolation_color_palette.length)
    const randomColor = percolation_color_palette[randomIndex].slice(1)

    // To make the color darker or lighter
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