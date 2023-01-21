/*
const readlineSync = require('readline-sync');
let N = readlineSync.questionInt("Enter the value of N:");
let M = readlineSync.questionInt("Enter the value of M:");

let start = performance.now();
const grid = generate_random_grid(N, M);
let end = performance.now();
console.log(`Generated ${N}x${M} random grid in ${end - start}ms.`);
console.log(`Sample values: ${grid[0][0]} | ${grid[1][1]} | ${grid[2][2]}`);

start = performance.now();
const p = 0.5;
const sets = getConnectedSets(grid, p);
end = performance.now();
console.log(`Connected Sets found in: ${end - start}ms.`);
console.log(sets);
*/


const grid = generate_random_grid(50, 50);
console.log(grid);


function getConnectedSets(grid, p) {
    let visited = new Array(grid.length).fill().map(() => new Array(grid[0].length).fill(false));
    let sets = [];

    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
            if (visited[i][j] === false && grid[i][j] > p) {
                let set = [[i, j]];
                visited[i][j] = true;
                sets.push(iterativeDfs(grid, visited, i, j, set, p));
            }
        }
    }
    return sets;
}


function iterativeDfs(grid, visited, i, j, set, p) {
    let stack = [[i, j]];
    let row = [-1, -1, -1, 0, 0, 1, 1, 1];
    let col = [-1, 0, 1, -1, 1, -1, 0, 1];

    while (stack.length > 0) {
        let [x, y] = stack.pop();
        for (let k = 0; k < 8; k++) {
            let newX = x + row[k];
            let newY = y + col[k];
            if (isSafe(grid, visited, newX, newY, p)) {
                visited[newX][newY] = true;
                set.push([newX, newY]);
                stack.push([newX, newY]);
            }
        }
    }
    return set;
}


function isSafe(grid, visited, x, y, p) {
    return (x >= 0 && x < grid.length && y >= 0 && y < grid[0].length && grid[x][y] > p && !visited[x][y]);
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